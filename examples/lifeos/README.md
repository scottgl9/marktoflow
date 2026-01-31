# LifeOS: Autonomous Knowledge Engine

A "headless" operating system for your life. It solves the fundamental friction of Knowledge Management: **Capturing is fast, but Organization is slow.**

Most people let their notes become a digital junkyard because they don't have the energy to file things correctly. LifeOS removes this burden. The user simply "talks" to the system via their favorite chat app. An AI Agent—acting as a Librarian, Secretary, and Analyst—autonomously handles the rest.

## Quick Start

```bash
# Run the main workflow
./marktoflow run examples/lifeos/workflow.md \
  --input message="Remind me to check the server logs tomorrow"

# Query mode
./marktoflow run examples/lifeos/retrieval.md \
  --input query="What is the API key for Apollo?"
```

## Architecture

LifeOS consists of four AI modules working in a pipeline:

### Module A: Unified Ingestion Layer (The Listener)
- Accepts webhooks from Slack, Telegram, WhatsApp
- Normalizes input to standard format: `{ message, source, channel_id }`
- **Workflow:** `webhook-ingestion.md`

### Module B: Context Router (The Librarian)
- Parses intent: task, note, event, query, journal, reference
- Routes to appropriate folder in the knowledge base
- Triggers clarification when confidence < 80%
- **Prompt:** `prompts/librarian.md`

### Module C: Semantic Reconciler (The Editor)
- Deduplicates before writing
- Updates existing entries instead of creating duplicates
- Implements "Read-Compare-Write" pattern
- **Prompt:** `prompts/reconciler.md`

### Module D: Retrieval Engine (The Memory)
- Indexes content for Q&A
- Searches relevant files for questions
- Grounds answers in factual stored data
- **Workflow:** `retrieval.md`
- **Prompt:** `prompts/retrieval.md`

## Directory Structure

```
lifeos/
├── workflow.md              # Main orchestrator workflow
├── webhook-ingestion.md     # Slack/Telegram webhook handler
├── retrieval.md             # Q&A retrieval workflow
├── README.md                # This file
└── prompts/
    ├── librarian.md         # Intent parsing prompt
    ├── reconciler.md        # Deduplication prompt
    └── retrieval.md         # Q&A prompt
```

## Knowledge Base Taxonomy

LifeOS enforces a strict 4-level hierarchy:

```
LifeOS/
├── Work/
│   ├── Projects/           # Active work projects
│   │   └── Apollo/
│   │       ├── tasks.md
│   │       ├── notes.md
│   │       ├── resources.md
│   │       ├── investigation.md
│   │       └── meeting_logs.md
│   ├── Areas/              # Ongoing responsibilities
│   └── Archives/           # Completed/inactive
├── Personal/
│   ├── Projects/
│   ├── Areas/
│   └── Archives/
├── Calendar/
│   ├── Future_Events.md
│   └── Recurring.md
└── Journal/
    └── YYYY/MM/DD.md
```

## User Experience Examples

### Capture Flow (Write)
```
User: "Remind me to check the server logs for Project Apollo tomorrow.
       Also, the client mentioned the API key is 12345."

LifeOS:
1. Parses intent → Task (check logs) + Reference (API key)
2. Extracts time → "Tomorrow" → 2024-01-16
3. Routes → Work/Projects/Apollo
4. Files:
   - Appends task to tasks.md with due date
   - Appends API key to resources.md

Response: "Saved to Project Apollo."
```

### Clarification Flow (Safety Valve)
```
User: "Don't forget the deadline."

LifeOS: (Confidence Low)
"Which deadline are you referring to? I see active deadlines for
**Project Apollo** and **House Hunting**."

User: "Apollo."

LifeOS: "Got it. Updating Project Apollo."
```

### Retrieval Flow (Read)
```
User: "What is the API key for Apollo?"

LifeOS: (Searches resources.md)
Response: "The API key is 12345."
```

## Setup

### Environment Variables

```bash
# AI Agent (required)
ANTHROPIC_API_KEY=sk-ant-...

# Slack integration (optional)
SLACK_BOT_TOKEN=xoxb-...

# Telegram integration (optional)
TELEGRAM_BOT_TOKEN=123456:ABC...

# Knowledge base location
LIFEOS_KNOWLEDGE_BASE=./LifeOS
```

### Slack Setup

1. Create a Slack App at https://api.slack.com/apps
2. Enable Event Subscriptions
3. Set Request URL: `https://your-server.com/lifeos/slack`
4. Subscribe to events:
   - `message.im` (Direct messages)
   - `app_mention` (Mentions in channels)
5. Install app to workspace

### Telegram Setup

1. Create bot via @BotFather
2. Get token
3. Set webhook:
   ```
   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-server.com/lifeos/telegram
   ```

## Comparison to Market Tools

| Feature | LifeOS | Obsidian + Plugins | Mem.ai / Fabric |
| :--- | :--- | :--- | :--- |
| **Data Ownership** | 100% Local Files | 100% Local Files | Proprietary Cloud |
| **Auto-Filing** | ✅ Smart Agent | ❌ Manual / Rigid Rules | ✅ AI Tagging |
| **Deduplication** | ✅ Smart Rewriting | ❌ Appends Only | ❌ Unclear |
| **Clarification** | ✅ Asks Questions | ❌ Silent | ❌ Silent |

## Technical Stack

- **Core:** marktoflow v2.0
- **AI:** Claude Sonnet/Haiku
- **Database:** Local Markdown files (Obsidian-compatible)
- **Messaging:** Slack, Telegram webhooks
- **Storage:** File system

## Future Enhancements

- Vector embeddings for semantic search (ChromaDB)
- Voice transcription input
- WhatsApp integration
- Daily/weekly summary generation
- Automatic tag suggestions
- Cross-reference linking
