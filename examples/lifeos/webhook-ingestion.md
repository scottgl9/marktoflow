# LifeOS Webhook Ingestion

Dedicated webhook handler for Slack and Telegram messages. This workflow normalizes incoming webhooks and triggers the main LifeOS workflow.

---
workflow:
  id: lifeos-webhook-ingestion
  name: 'LifeOS Webhook Ingestion'
  version: '2.0.0'
  description: |
    Module A: The Unified Ingestion Layer

    Accepts webhooks from Slack, Telegram, and other messaging platforms.
    Normalizes the input and triggers the main LifeOS workflow.
  author: 'lifeos'
  tags:
    - webhook
    - ingestion
    - slack
    - telegram

tools:
  slack:
    sdk: '@slack/web-api'
    auth:
      token: '${SLACK_BOT_TOKEN}'

  telegram:
    sdk: 'telegram'
    auth:
      token: '${TELEGRAM_BOT_TOKEN}'

  http:
    sdk: 'http'

triggers:
  # Slack Events API webhook
  - type: webhook
    path: /lifeos/slack
    method: POST

  # Telegram Bot webhook
  - type: webhook
    path: /lifeos/telegram
    method: POST

  # Generic webhook (for other integrations)
  - type: webhook
    path: /lifeos/ingest
    method: POST

inputs:
  # Raw webhook payload
  payload:
    type: object
    required: true
    description: 'Raw webhook payload from messaging platform'

  # Webhook source hint
  webhook_source:
    type: string
    required: false
    description: 'Source platform hint: slack, telegram, generic'

outputs:
  normalized:
    type: object
    description: 'Normalized message object'

  processed:
    type: boolean
    description: 'Whether the message was processed'
---

## Step 1: Detect Webhook Source

Identify the source platform from the webhook payload structure.

```yaml
action: script.execute
inputs:
  code: |
    const payload = context.inputs.payload;
    const sourceHint = context.inputs.webhook_source;

    // Detect source from payload structure
    let source = 'unknown';

    if (sourceHint) {
      source = sourceHint;
    } else if (payload.type === 'url_verification') {
      // Slack URL verification challenge
      return {
        source: 'slack_verification',
        challenge: payload.challenge
      };
    } else if (payload.event && payload.event.type) {
      // Slack Events API
      source = 'slack';
    } else if (payload.message && payload.update_id !== undefined) {
      // Telegram Bot API
      source = 'telegram';
    } else if (payload.text || payload.message) {
      // Generic format
      source = 'generic';
    }

    return { source, payload };
output_variable: source_detection
```

## Step 2: Handle Slack URL Verification

Respond to Slack's URL verification challenge.

```yaml
- type: if
  id: slack_verification
  condition: '{{ source_detection.source == "slack_verification" }}'
  then:
    - action: script.execute
      inputs:
        code: |
          return {
            response: { challenge: context.source_detection.challenge },
            processed: true,
            exit_early: true
          };
      output_variable: verification_response
```

## Step 3: Normalize Slack Messages

Extract and normalize Slack event data.

```yaml
- type: if
  id: normalize_slack
  condition: '{{ source_detection.source == "slack" }}'
  then:
    - action: script.execute
      inputs:
        code: |
          const payload = context.source_detection.payload;
          const event = payload.event;

          // Skip bot messages to avoid loops
          if (event.bot_id || event.subtype === 'bot_message') {
            return { skip: true, reason: 'Bot message' };
          }

          // Skip message edits and deletions
          if (event.subtype === 'message_changed' || event.subtype === 'message_deleted') {
            return { skip: true, reason: 'Message edit/delete' };
          }

          // Only process direct messages or mentions
          const isMention = event.text && event.text.includes('<@');
          const isDM = event.channel_type === 'im';

          if (!isDM && !isMention) {
            return { skip: true, reason: 'Not a DM or mention' };
          }

          // Clean up Slack formatting
          let text = event.text || '';
          text = text.replace(/<@[A-Z0-9]+>/g, '').trim(); // Remove mentions
          text = text.replace(/<#[A-Z0-9]+\|([^>]+)>/g, '#$1'); // Clean channel refs
          text = text.replace(/<([^|>]+)\|([^>]+)>/g, '$2'); // Clean links

          return {
            skip: false,
            normalized: {
              message: text,
              source: 'slack',
              channel_id: event.channel,
              user_id: event.user,
              timestamp: event.ts,
              thread_ts: event.thread_ts || event.ts,
              team_id: payload.team_id
            }
          };
      output_variable: slack_normalized
```

## Step 4: Normalize Telegram Messages

Extract and normalize Telegram message data.

```yaml
- type: if
  id: normalize_telegram
  condition: '{{ source_detection.source == "telegram" }}'
  then:
    - action: script.execute
      inputs:
        code: |
          const payload = context.source_detection.payload;
          const message = payload.message || payload.edited_message;

          if (!message) {
            return { skip: true, reason: 'No message content' };
          }

          // Skip if no text
          if (!message.text) {
            return { skip: true, reason: 'No text content' };
          }

          // Check for bot commands
          let text = message.text;
          if (text.startsWith('/')) {
            // Handle commands
            const [command, ...args] = text.slice(1).split(' ');
            text = args.join(' ');

            if (command === 'start') {
              return {
                skip: false,
                is_command: true,
                command: 'welcome',
                normalized: {
                  message: 'Hello! I am LifeOS.',
                  source: 'telegram',
                  channel_id: message.chat.id.toString(),
                  user_id: message.from.id.toString(),
                  timestamp: message.date
                }
              };
            }
          }

          return {
            skip: false,
            normalized: {
              message: text,
              source: 'telegram',
              channel_id: message.chat.id.toString(),
              user_id: message.from.id.toString(),
              timestamp: message.date,
              username: message.from.username
            }
          };
      output_variable: telegram_normalized
```

## Step 5: Normalize Generic Messages

Handle generic webhook format.

```yaml
- type: if
  id: normalize_generic
  condition: '{{ source_detection.source == "generic" }}'
  then:
    - action: script.execute
      inputs:
        code: |
          const payload = context.source_detection.payload;

          return {
            skip: false,
            normalized: {
              message: payload.text || payload.message || '',
              source: payload.source || 'generic',
              channel_id: payload.channel_id || payload.chat_id || 'cli',
              user_id: payload.user_id || 'unknown',
              timestamp: payload.timestamp || Date.now()
            }
          };
      output_variable: generic_normalized
```

## Step 6: Combine Normalized Results

Merge all normalization results.

```yaml
action: script.execute
inputs:
  code: |
    // Check for early exit (verification)
    if (context.verification_response && context.verification_response.exit_early) {
      return context.verification_response;
    }

    // Get the appropriate normalized result
    const slack = context.slack_normalized;
    const telegram = context.telegram_normalized;
    const generic = context.generic_normalized;

    let result = null;

    if (slack && !slack.skip) {
      result = slack;
    } else if (telegram && !telegram.skip) {
      result = telegram;
    } else if (generic && !generic.skip) {
      result = generic;
    } else {
      // Determine skip reason
      const reason = (slack && slack.reason) ||
                     (telegram && telegram.reason) ||
                     (generic && generic.reason) ||
                     'Unknown source';
      return {
        skip: true,
        reason: reason,
        processed: false
      };
    }

    return {
      skip: false,
      normalized: result.normalized,
      is_command: result.is_command || false,
      command: result.command
    };
output_variable: final_normalized
```

## Step 7: Handle Welcome Command

Send welcome message for /start command.

```yaml
- type: if
  id: handle_welcome
  condition: '{{ final_normalized.is_command && final_normalized.command == "welcome" }}'
  then:
    - action: telegram.sendMessage
      inputs:
        chat_id: '{{ final_normalized.normalized.channel_id }}'
        text: |
          Welcome to LifeOS - Your Autonomous Knowledge Engine

          I can help you:
          - Save tasks and reminders
          - Store notes and ideas
          - Track calendar events
          - Answer questions about your knowledge base

          Just send me any message and I'll organize it for you.

          Examples:
          - "Remind me to check the server logs tomorrow"
          - "Meeting with John on Friday at 2pm"
          - "The API key for Project Apollo is 12345"
          - "What's the deadline for the Apollo project?"
      output_variable: welcome_sent
```

## Step 8: Trigger Main LifeOS Workflow

Call the main workflow with normalized input.

```yaml
- type: if
  id: process_message
  condition: '{{ !final_normalized.skip && !final_normalized.is_command }}'
  then:
    - action: http.request
      inputs:
        method: POST
        url: '${MARKTOFLOW_BASE_URL}/run/lifeos-master'
        headers:
          Content-Type: 'application/json'
        body:
          message: '{{ final_normalized.normalized.message }}'
          source: '{{ final_normalized.normalized.source }}'
          channel_id: '{{ final_normalized.normalized.channel_id }}'
          knowledge_base: '${LIFEOS_KNOWLEDGE_BASE}'
          mode: 'auto'
      output_variable: workflow_result
      retry:
        max_attempts: 2
        delay: 1000
```

## Step 9: Set Outputs

```yaml
action: script.execute
inputs:
  code: |
    const normalized = context.final_normalized;

    if (normalized.skip) {
      return {
        normalized: null,
        processed: false,
        reason: normalized.reason
      };
    }

    return {
      normalized: normalized.normalized,
      processed: true,
      workflow_triggered: !!context.workflow_result
    };
output_variable: final_output
```

---

## Webhook Setup Instructions

### Slack Setup

1. Create a Slack App at https://api.slack.com/apps
2. Enable Event Subscriptions
3. Set Request URL to: `https://your-server.com/lifeos/slack`
4. Subscribe to events:
   - `message.im` (Direct messages)
   - `app_mention` (Mentions in channels)
5. Install app to workspace
6. Set `SLACK_BOT_TOKEN` environment variable

### Telegram Setup

1. Create a bot via @BotFather
2. Get the bot token
3. Set webhook: `https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-server.com/lifeos/telegram`
4. Set `TELEGRAM_BOT_TOKEN` environment variable

### Environment Variables

```bash
# Required
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

# Optional
MARKTOFLOW_BASE_URL=http://localhost:3000
LIFEOS_KNOWLEDGE_BASE=./LifeOS
```
