# Claude Skill: Building Marktoflow Workflows

This skill enables you to create marktoflow workflows - markdown-based automation files that orchestrate services, APIs, and AI agents.

## Quick Start

When asked to create a workflow, generate a `.md` file with this structure:

```markdown
---
workflow:
  id: unique-workflow-id
  name: 'Human Readable Name'

tools:
  service_name:
    sdk: 'npm-package-or-sdk'
    auth:
      token: '${ENV_VAR}'

triggers:
  - type: manual

inputs:
  param_name:
    type: string
    required: true
---

# Workflow Title

## Step 1: Description

```yaml
action: service.method
inputs:
  key: '{{ inputs.param_name }}'
output_variable: result
```

## Step 2: Set Outputs

```yaml
action: workflow.set_outputs
inputs:
  output_key: '{{ result }}'
```
```

---

## Workflow Structure Reference

### YAML Frontmatter

```yaml
---
workflow:
  id: kebab-case-identifier        # Required: unique identifier
  name: 'Display Name'             # Required: human-readable name
  version: '1.0.0'                 # Optional: semantic version
  description: 'What it does'      # Optional: description
  author: 'Your Name'              # Optional: author
  tags: [automation, slack]        # Optional: categorization

tools:                             # Define external services
  tool_name:
    sdk: 'package-name'            # NPM package or SDK identifier
    auth:                          # Authentication config
      token: '${ENV_VAR}'          # Environment variables with ${...}
    options:                       # SDK-specific options
      base_url: 'https://api.example.com'

triggers:                          # When/how workflow executes
  - type: schedule
    cron: '0 9 * * 1-5'           # Cron expression
    timezone: 'America/New_York'
  - type: webhook
    config:
      path: '/webhooks/name'
      method: POST
  - type: manual                   # API/CLI trigger
  - type: event                    # Custom events

inputs:                            # Workflow parameters
  param_name:
    type: string                   # string|integer|number|boolean|array|object
    required: true
    default: 'value'
    description: 'Parameter description'

outputs:                           # Output schema
  result_name:
    type: object
    description: 'Output description'
---
```

### Step Definitions

Steps are YAML code blocks under markdown headings:

```yaml
action: service.method             # Action to execute
inputs:                            # Method parameters
  key: 'value'
  template: '{{ variable }}'       # Variable interpolation
output_variable: result_name       # Store result for later use
timeout: 30000                     # Timeout in milliseconds
```

---

## Available Integrations

### Communication Services

| Service | SDK | Key Actions |
|---------|-----|-------------|
| **Slack** | `@slack/web-api` | `chat.postMessage`, `conversations.list`, `users.list`, `reactions.add` |
| **Discord** | `discord.js` | `sendMessage`, `editMessage`, `deleteMessage`, `addReaction` |
| **Telegram** | `node-telegram-bot-api` | `sendMessage`, `sendPhoto`, `sendDocument` |
| **WhatsApp** | `whatsapp-business` | `sendMessage`, `sendTemplate`, `sendMedia` |

### Project Management

| Service | SDK | Key Actions |
|---------|-----|-------------|
| **GitHub** | `@octokit/rest` | `pulls.create`, `issues.create`, `repos.get`, `pulls.list` |
| **Jira** | `jira.js` | `issueSearch.searchForIssuesUsingJql`, `issues.createIssue`, `sprints.moveIssuesToSprintAndRank` |
| **Linear** | `@linear/sdk` | `createIssue`, `updateIssue`, `listIssues`, `createProject` |
| **Notion** | `@notionhq/client` | `databases.query`, `pages.create`, `blocks.children.append` |
| **Confluence** | `confluence-api` | `getPage`, `createPage`, `updatePage`, `deletePage` |
| **Airtable** | `airtable` | `select`, `create`, `update`, `delete` |

### Email & Calendar

| Service | SDK | Key Actions |
|---------|-----|-------------|
| **Gmail** | `googleapis` | `users.messages.send`, `users.messages.list`, `users.labels.list` |
| **Outlook** | `@microsoft/microsoft-graph-client` | `sendMail`, `listMessages`, `listCalendarEvents` |
| **Google Calendar** | `googleapis` | `listEvents`, `createEvent`, `updateEvent`, `deleteEvent` |

### Data & Storage

| Service | SDK | Key Actions |
|---------|-----|-------------|
| **Google Sheets** | `googleapis` | `getSpreadsheet`, `getValues`, `updateValues`, `appendValues` |
| **Google Drive** | `googleapis` | `listFiles`, `uploadFile`, `downloadFile` |
| **Google Docs** | `googleapis` | `getDocument`, `createDocument`, `updateDocument` |
| **Supabase** | `@supabase/supabase-js` | `select`, `insert`, `update`, `delete`, `rpc` |
| **PostgreSQL** | `pg` | `query`, `insert`, `update`, `delete` |
| **MySQL** | `mysql2` | `query`, `insert`, `update`, `delete` |

### HTTP & APIs

| Service | SDK | Key Actions |
|---------|-----|-------------|
| **HTTP** | `http` (built-in) | `get`, `post`, `put`, `patch`, `delete` |

### AI Agents

| Agent | SDK | Description |
|-------|-----|-------------|
| **Claude Code** | `claude-code` | File-aware AI with coding capabilities |
| **Claude Agent SDK** | `claude-agent` | Multi-turn conversations with tools |
| **GitHub Copilot** | `github-copilot` | OAuth-based, no API key needed |
| **OpenCode** | `opencode` | 75+ backend support |
| **Ollama** | `ollama` | Local LLM integration |

### Browser Automation

| Service | SDK | Key Actions |
|---------|-----|-------------|
| **Playwright** | `playwright` | `navigate`, `click`, `fillForm`, `screenshot`, `evaluate` |

---

## Variable & Template Syntax

### Variable Interpolation

```yaml
# Basic interpolation
message: '{{ inputs.name }}'

# Object property access
email: '{{ user.contact.email }}'

# Array access
first: '{{ items[0] }}'

# JavaScript expressions
timestamp: '{{ Date.now() }}'
iso_date: '{{ new Date().toISOString() }}'

# Conditional expressions
status: "{{ active ? 'Active' : 'Inactive' }}"

# Math operations
total: '{{ price * quantity }}'

# Array methods
count: '{{ items.length }}'
list: '{{ items.join(", ") }}'

# JSON filter
json_str: '{{ data | json }}'
```

### Environment Variables

Used in `auth` sections:

```yaml
auth:
  token: '${SLACK_BOT_TOKEN}'
  api_key: '${ANTHROPIC_API_KEY}'
```

### Built-in Variables

- `inputs.*` - Workflow input parameters
- `loop.index` - Current iteration (0-based)
- `loop.first` - True on first iteration
- `loop.last` - True on last iteration
- `loop.length` - Total iterations
- `error.message` - Error message in catch blocks
- `error.step` - Failed step info in catch blocks

---

## Control Flow Patterns

### If/Else Conditional

```yaml
- type: if
  condition: '{{ count > 0 }}'
  then:
    - action: slack.chat.postMessage
      inputs:
        text: 'Items found: {{ count }}'
  else:
    - action: slack.chat.postMessage
      inputs:
        text: 'No items found'
```

### Switch/Case Routing

```yaml
- type: switch
  expression: '{{ severity }}'
  cases:
    critical:
      - action: pagerduty.incidents.create
    high:
      - action: jira.issues.createIssue
    low:
      - action: slack.chat.postMessage
  default:
    - action: console.log
```

### For-Each Loop

```yaml
- type: for_each
  items: '{{ orders }}'
  item_variable: order
  steps:
    - action: process.order
      inputs:
        id: '{{ order.id }}'
        index: '{{ loop.index }}'
```

### While Loop

```yaml
- type: while
  condition: '{{ retries < 3 }}'
  max_iterations: 10
  steps:
    - action: api.call
      output_variable: result
```

### Parallel Execution

```yaml
- type: parallel
  max_concurrent: 3
  on_error: continue
  branches:
    - id: fetch_jira
      steps:
        - action: jira.issueSearch.searchForIssuesUsingJql
          output_variable: jira_data
    - id: fetch_github
      steps:
        - action: github.pulls.list
          output_variable: github_data
```

### Try/Catch/Finally

```yaml
- type: try
  try:
    - action: primary_api.call
      output_variable: result
  catch:
    - action: fallback_api.call
      output_variable: result
  finally:
    - action: cleanup.resources
```

### Map/Filter/Reduce

```yaml
# Map: Transform items
- type: map
  items: '{{ orders }}'
  item_variable: order
  expression: '{{ order.amount * 1.1 }}'
  output_variable: with_tax

# Filter: Select matching items
- type: filter
  items: '{{ orders }}'
  item_variable: order
  condition: '{{ order.amount >= 1000 }}'
  output_variable: high_value

# Reduce: Aggregate to single value
- type: reduce
  items: '{{ orders }}'
  item_variable: order
  accumulator_variable: sum
  initial_value: 0
  expression: '{{ sum + order.amount }}'
  output_variable: total
```

### Sub-Workflows

```yaml
- workflow: ./common/validate-input.md
  inputs:
    data: '{{ inputs.username }}'
  output_variable: validation_result
```

---

## Complete Example Workflows

### 1. Slack Notification

```markdown
---
workflow:
  id: slack-notify
  name: 'Slack Notification'

tools:
  slack:
    sdk: '@slack/web-api'
    auth:
      token: '${SLACK_BOT_TOKEN}'

triggers:
  - type: manual

inputs:
  channel:
    type: string
    required: true
    default: '#general'
  message:
    type: string
    required: true
---

# Slack Notification

## Step 1: Post Message

```yaml
action: slack.chat.postMessage
inputs:
  channel: '{{ inputs.channel }}'
  text: '{{ inputs.message }}'
output_variable: post_result
```

## Step 2: Set Outputs

```yaml
action: workflow.set_outputs
inputs:
  message_ts: '{{ post_result.ts }}'
  channel: '{{ post_result.channel }}'
```
```

### 2. GitHub PR Review Notifier

```markdown
---
workflow:
  id: pr-review-notifier
  name: 'PR Review Notifier'

tools:
  github:
    sdk: '@octokit/rest'
    auth:
      token: '${GITHUB_TOKEN}'
  slack:
    sdk: '@slack/web-api'
    auth:
      token: '${SLACK_BOT_TOKEN}'

triggers:
  - type: schedule
    cron: '0 9 * * 1-5'

inputs:
  repo_owner:
    type: string
    required: true
  repo_name:
    type: string
    required: true
---

# PR Review Notifier

## Step 1: Fetch Open PRs

```yaml
action: github.pulls.list
inputs:
  owner: '{{ inputs.repo_owner }}'
  repo: '{{ inputs.repo_name }}'
  state: open
output_variable: open_prs
```

## Step 2: Filter PRs Needing Review

```yaml
- type: filter
  items: '{{ open_prs.data }}'
  item_variable: pr
  condition: '{{ pr.requested_reviewers.length > 0 }}'
  output_variable: prs_needing_review
```

## Step 3: Notify for Each PR

```yaml
- type: for_each
  items: '{{ prs_needing_review }}'
  item_variable: pr
  steps:
    - action: slack.chat.postMessage
      inputs:
        channel: '#code-review'
        text: 'PR needs review: {{ pr.title }}'
        blocks:
          - type: section
            text:
              type: mrkdwn
              text: '*<{{ pr.html_url }}|{{ pr.title }}>*\nBy: {{ pr.user.login }}'
```

## Step 4: Set Outputs

```yaml
action: workflow.set_outputs
inputs:
  prs_notified: '{{ prs_needing_review.length }}'
```
```

### 3. Daily Standup Summary with AI

```markdown
---
workflow:
  id: daily-standup-ai
  name: 'AI-Powered Daily Standup'

tools:
  jira:
    sdk: 'jira.js'
    auth:
      host: '${JIRA_HOST}'
      email: '${JIRA_EMAIL}'
      apiToken: '${JIRA_API_TOKEN}'
  claude:
    sdk: 'claude-code'
    auth:
      api_key: '${ANTHROPIC_API_KEY}'
  slack:
    sdk: '@slack/web-api'
    auth:
      token: '${SLACK_BOT_TOKEN}'

triggers:
  - type: schedule
    cron: '0 9 * * 1-5'
    timezone: 'America/New_York'

inputs:
  project_key:
    type: string
    required: true
  slack_channel:
    type: string
    default: '#standup'
---

# AI-Powered Daily Standup

## Step 1: Fetch In-Progress Issues

```yaml
action: jira.issueSearch.searchForIssuesUsingJql
inputs:
  jql: 'project = {{ inputs.project_key }} AND status = "In Progress" ORDER BY updated DESC'
  maxResults: 50
output_variable: in_progress
```

## Step 2: Fetch Recently Completed

```yaml
action: jira.issueSearch.searchForIssuesUsingJql
inputs:
  jql: 'project = {{ inputs.project_key }} AND status = Done AND resolved >= -1d ORDER BY resolved DESC'
  maxResults: 20
output_variable: completed
```

## Step 3: Generate AI Summary

```yaml
action: claude.generate
inputs:
  prompt: |
    Generate a concise daily standup summary based on this data:

    **In Progress ({{ in_progress.issues.length }} items):**
    {% for issue in in_progress.issues %}
    - {{ issue.key }}: {{ issue.fields.summary }} (Assignee: {{ issue.fields.assignee.displayName }})
    {% endfor %}

    **Completed Yesterday ({{ completed.issues.length }} items):**
    {% for issue in completed.issues %}
    - {{ issue.key }}: {{ issue.fields.summary }}
    {% endfor %}

    Format as a Slack-friendly message with emojis and clear sections.
  max_tokens: 1000
output_variable: ai_summary
```

## Step 4: Post to Slack

```yaml
action: slack.chat.postMessage
inputs:
  channel: '{{ inputs.slack_channel }}'
  text: '{{ ai_summary.content }}'
output_variable: slack_result
```

## Step 5: Set Outputs

```yaml
action: workflow.set_outputs
inputs:
  summary: '{{ ai_summary.content }}'
  message_ts: '{{ slack_result.ts }}'
```
```

### 4. API Data Pipeline

```markdown
---
workflow:
  id: data-pipeline
  name: 'API Data Pipeline'

tools:
  api:
    sdk: 'http'
    options:
      base_url: 'https://api.example.com'
    auth:
      type: bearer
      token: '${API_TOKEN}'
  sheets:
    sdk: 'googleapis'
    auth:
      credentials: '${GOOGLE_CREDENTIALS}'

triggers:
  - type: schedule
    cron: '0 */6 * * *'

inputs:
  spreadsheet_id:
    type: string
    required: true
---

# API Data Pipeline

## Step 1: Fetch Data with Error Handling

```yaml
- type: try
  try:
    - action: api.get
      inputs:
        path: '/data/export'
        query:
          format: json
          limit: 1000
      output_variable: api_data
  catch:
    - action: api.get
      inputs:
        path: '/data/export-fallback'
      output_variable: api_data
```

## Step 2: Transform Data

```yaml
- type: map
  items: '{{ api_data.records }}'
  item_variable: record
  expression: |
    {
      "id": "{{ record.id }}",
      "name": "{{ record.name }}",
      "value": {{ record.amount * 100 }},
      "date": "{{ new Date(record.timestamp).toISOString().split('T')[0] }}"
    }
  output_variable: transformed_data
```

## Step 3: Filter Valid Records

```yaml
- type: filter
  items: '{{ transformed_data }}'
  item_variable: item
  condition: '{{ item.value > 0 }}'
  output_variable: valid_records
```

## Step 4: Calculate Summary

```yaml
- type: reduce
  items: '{{ valid_records }}'
  item_variable: record
  accumulator_variable: sum
  initial_value: 0
  expression: '{{ sum + record.value }}'
  output_variable: total_value
```

## Step 5: Update Spreadsheet

```yaml
action: sheets.appendValues
inputs:
  spreadsheetId: '{{ inputs.spreadsheet_id }}'
  range: 'Data!A:D'
  values: '{{ valid_records }}'
output_variable: sheets_result
```

## Step 6: Set Outputs

```yaml
action: workflow.set_outputs
inputs:
  records_processed: '{{ valid_records.length }}'
  total_value: '{{ total_value }}'
```
```

### 5. Incident Response Router

```markdown
---
workflow:
  id: incident-router
  name: 'Incident Response Router'

tools:
  pagerduty:
    sdk: '@pagerduty/pdjs'
    auth:
      token: '${PAGERDUTY_TOKEN}'
  slack:
    sdk: '@slack/web-api'
    auth:
      token: '${SLACK_BOT_TOKEN}'
  jira:
    sdk: 'jira.js'
    auth:
      host: '${JIRA_HOST}'
      email: '${JIRA_EMAIL}'
      apiToken: '${JIRA_API_TOKEN}'

triggers:
  - type: webhook
    config:
      path: '/webhooks/incident'
      method: POST

inputs:
  title:
    type: string
    required: true
  severity:
    type: string
    required: true
  description:
    type: string
    required: true
  service:
    type: string
    required: true
---

# Incident Response Router

## Step 1: Route by Severity

```yaml
- type: switch
  expression: '{{ inputs.severity }}'
  cases:
    critical:
      - action: pagerduty.incidents.create
        inputs:
          title: '[CRITICAL] {{ inputs.title }}'
          service_id: '{{ inputs.service }}'
          urgency: high
        output_variable: incident
      - action: slack.chat.postMessage
        inputs:
          channel: '#incidents-critical'
          text: ':rotating_light: CRITICAL: {{ inputs.title }}'

    high:
      - action: jira.issues.createIssue
        inputs:
          fields:
            project:
              key: 'OPS'
            summary: '[HIGH] {{ inputs.title }}'
            description: '{{ inputs.description }}'
            issuetype:
              name: Bug
            priority:
              name: High
        output_variable: jira_issue
      - action: slack.chat.postMessage
        inputs:
          channel: '#incidents'
          text: ':warning: High Priority: {{ inputs.title }}'

    medium:
      - action: jira.issues.createIssue
        inputs:
          fields:
            project:
              key: 'OPS'
            summary: '{{ inputs.title }}'
            description: '{{ inputs.description }}'
            issuetype:
              name: Bug
            priority:
              name: Medium
        output_variable: jira_issue

    low:
      - action: slack.chat.postMessage
        inputs:
          channel: '#alerts-low'
          text: ':information_source: {{ inputs.title }}'

  default:
    - action: slack.chat.postMessage
      inputs:
        channel: '#alerts'
        text: 'Unknown severity: {{ inputs.title }}'
```

## Step 2: Set Outputs

```yaml
action: workflow.set_outputs
inputs:
  severity: '{{ inputs.severity }}'
  routed: true
```
```

---

## Best Practices

1. **Always end with `workflow.set_outputs`** - Define what the workflow returns
2. **Use descriptive variable names** - `customer_orders` not `data`
3. **Wrap external calls in try/catch** - Handle API failures gracefully
4. **Set `max_iterations` on while loops** - Prevent infinite loops
5. **Use `max_concurrent` for parallel** - Respect API rate limits
6. **Leverage environment variables** - Never hardcode secrets
7. **Break complex workflows into sub-workflows** - Improve maintainability
8. **Use meaningful step headings** - Document what each step does

---

## CLI Commands

```bash
# Run a workflow
./marktoflow run workflow.md

# Run with inputs
./marktoflow run workflow.md --input channel=#general --input message="Hello"

# Validate a workflow
./marktoflow workflow validate workflow.md

# Connect a service (OAuth)
npx marktoflow connect slack

# List available integrations
./marktoflow integrations list
```

---

## When Creating Workflows

1. **Identify the trigger** - How will this workflow be started?
2. **List required services** - What APIs/tools are needed?
3. **Define inputs** - What parameters does the user provide?
4. **Design the flow** - Sequential steps, conditionals, loops?
5. **Handle errors** - What could fail and how to recover?
6. **Define outputs** - What should the workflow return?

Always ask clarifying questions if the requirements are unclear.
