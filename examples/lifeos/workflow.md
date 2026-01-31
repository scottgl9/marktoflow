# LifeOS: Autonomous Knowledge Engine

A "headless" operating system for your life. Talk to it naturally - it handles everything else.

**Write:** "Remind me to check the server logs tomorrow" → Saved to tasks
**Read:** "What is the API key for Apollo?" → Returns the answer

---
workflow:
  id: lifeos
  name: 'LifeOS'
  version: '2.0.0'
  description: |
    A unified knowledge management system that handles both:
    - Writing: tasks, notes, events, journal entries, references
    - Reading: questions, searches, summaries

    Four AI Modules:
    - Module A: Ingestion (normalize input from any source)
    - Module B: Router (parse intent, route to location)
    - Module C: Reconciler (deduplicate, update existing)
    - Module D: Retrieval (search and answer questions)
  author: 'lifeos'
  tags:
    - knowledge-management
    - personal-assistant
    - ai-agent

tools:
  agent:
    sdk: 'claude-agent'
    options:
      model: 'sonnet'

  slack:
    sdk: '@slack/web-api'
    auth:
      token: '${SLACK_BOT_TOKEN}'

  telegram:
    sdk: 'telegram'
    auth:
      token: '${TELEGRAM_BOT_TOKEN}'

  core:
    sdk: 'core'

triggers:
  - type: manual
  - type: webhook
    path: /lifeos
    method: POST

inputs:
  message:
    type: string
    required: true
    description: 'Natural language input (question, task, note, etc.)'

  source:
    type: string
    required: false
    default: 'cli'
    description: 'Source: slack, telegram, cli'

  channel_id:
    type: string
    required: false
    description: 'Channel/chat ID for replies'

  knowledge_base:
    type: string
    required: false
    default: './LifeOS'
    description: 'Path to knowledge base'

outputs:
  response:
    type: string
    description: 'Response to user'

  action:
    type: string
    description: 'Action taken: saved, retrieved, clarified'

  files:
    type: array
    description: 'Files modified or searched'
---

## Step 1: Initialize Knowledge Base

```yaml
action: script.execute
inputs:
  code: |
    const fs = require('fs');
    const path = require('path');
    const basePath = context.inputs.knowledge_base || './LifeOS';

    const structure = {
      'Work/Projects': null,
      'Work/Areas': null,
      'Work/Archives': null,
      'Personal/Projects': null,
      'Personal/Areas': null,
      'Personal/Archives': null,
      'Calendar': null,
      'Journal': null
    };

    for (const dir of Object.keys(structure)) {
      fs.mkdirSync(path.join(basePath, dir), { recursive: true });
    }

    // Create default calendar file
    const calPath = path.join(basePath, 'Calendar/events.md');
    if (!fs.existsSync(calPath)) {
      fs.writeFileSync(calPath, '# Events\n\n');
    }

    return { base_path: basePath };
output_variable: init
```

## Step 2: Scan Knowledge Base Context

```yaml
action: script.execute
inputs:
  code: |
    const fs = require('fs');
    const path = require('path');
    const basePath = context.init.base_path;

    const projects = [];
    const areas = [];
    const files = [];

    function scan(dir, depth = 0) {
      if (depth > 4) return;
      try {
        for (const item of fs.readdirSync(dir)) {
          const full = path.join(dir, item);
          const rel = path.relative(basePath, full);
          const stat = fs.statSync(full);

          if (stat.isDirectory()) {
            if (rel.includes('/Projects/') && depth === 2) {
              projects.push({ name: item, path: rel });
            } else if (rel.includes('/Areas/') && depth === 2) {
              areas.push({ name: item, path: rel });
            }
            scan(full, depth + 1);
          } else if (item.endsWith('.md')) {
            files.push({ name: item, path: rel, modified: stat.mtime });
          }
        }
      } catch (e) {}
    }

    scan(basePath);
    files.sort((a, b) => new Date(b.modified) - new Date(a.modified));

    return {
      projects: projects.slice(0, 15),
      areas: areas.slice(0, 15),
      recent: files.slice(0, 10)
    };
output_variable: context_map
```

## Step 3: Parse Intent with AI

The Librarian determines what the user wants and where it should go.

```yaml
action: agent.run
inputs:
  prompt: |
    You are LifeOS - a personal knowledge assistant.

    ## Knowledge Base
    **Projects:** {% for p in context_map.projects %}{{ p.name }}{% if not loop.last %}, {% endif %}{% endfor %}
    **Areas:** {% for a in context_map.areas %}{{ a.name }}{% if not loop.last %}, {% endif %}{% endfor %}
    **Recent files:** {% for f in context_map.recent %}{{ f.path }}{% if not loop.last %}, {% endif %}{% endfor %}

    ## User Input
    "{{ inputs.message }}"

    ## Determine Intent

    **Intent types:**
    - `query` - A question to answer (starts with what/when/where/who/how/why, contains ?, or asks for information)
    - `task` - A to-do or reminder (remind, todo, need to, should, must, don't forget)
    - `note` - Information to store (note that, remember, learned, the X is Y)
    - `event` - Calendar entry (meeting, appointment, on [date], at [time])
    - `journal` - Personal reflection (I feel, today I, reflecting)
    - `reference` - Static data (API key, password, phone number, address)

    **Respond with JSON only:**
    ```json
    {
      "intent": "query|task|note|event|journal|reference",
      "confidence": 85,
      "target": {
        "domain": "Work|Personal|Calendar|Journal",
        "entity": "ProjectName or AreaName or null",
        "file": "tasks.md|notes.md|resources.md|events.md",
        "path": "Work/Projects/Apollo/tasks.md"
      },
      "extracted": {
        "title": "Brief title",
        "content": "Full content to save",
        "due_date": "YYYY-MM-DD or null",
        "tags": ["tag1"],
        "search_terms": ["term1", "term2"]
      },
      "clarification": {
        "needed": false,
        "question": null
      }
    }
    ```
output_variable: intent_raw
```

## Step 4: Parse Intent Response

```yaml
action: script.execute
inputs:
  code: |
    const raw = context.intent_raw;
    try {
      const match = raw.match(/```json\s*([\s\S]*?)\s*```/);
      return match ? JSON.parse(match[1]) : JSON.parse(raw);
    } catch (e) {
      return {
        intent: 'unknown',
        confidence: 0,
        clarification: { needed: true, question: "I didn't understand that. Could you rephrase?" }
      };
    }
output_variable: intent
```

## Step 5: Handle Clarification

```yaml
- type: if
  condition: '{{ intent.confidence < 70 && intent.clarification.needed }}'
  then:
    - action: script.execute
      inputs:
        code: |
          return {
            response: context.intent.clarification.question,
            action: 'clarified',
            files: [],
            done: true
          };
      output_variable: result
  else:
    - action: script.execute
      inputs:
        code: |
          return { done: false };
      output_variable: result
```

## Step 6: Handle Query (Read Mode)

Search the knowledge base and answer questions.

```yaml
- type: if
  condition: '{{ !result.done && intent.intent == "query" }}'
  then:
    # Search files
    - action: script.execute
      inputs:
        code: |
          const fs = require('fs');
          const path = require('path');
          const basePath = context.init.base_path;
          const terms = (context.intent.extracted.search_terms || []).map(t => t.toLowerCase());
          const query = context.inputs.message.toLowerCase();

          const results = [];

          function search(dir) {
            try {
              for (const item of fs.readdirSync(dir)) {
                const full = path.join(dir, item);
                const stat = fs.statSync(full);

                if (stat.isDirectory()) {
                  search(full);
                } else if (item.endsWith('.md')) {
                  const content = fs.readFileSync(full, 'utf8');
                  const lower = content.toLowerCase();
                  let score = 0;

                  // Score by search terms
                  for (const term of terms) {
                    if (lower.includes(term)) score += 10;
                  }

                  // Score by query words
                  for (const word of query.split(' ')) {
                    if (word.length > 3 && lower.includes(word)) score += 5;
                  }

                  if (score > 0) {
                    results.push({
                      path: path.relative(basePath, full),
                      score,
                      content: content.substring(0, 3000)
                    });
                  }
                }
              }
            } catch (e) {}
          }

          search(basePath);
          results.sort((a, b) => b.score - a.score);

          return { results: results.slice(0, 5) };
      output_variable: search

    # Generate answer
    - action: agent.run
      inputs:
        prompt: |
          Answer this question based on the knowledge base:

          **Question:** "{{ inputs.message }}"

          **Found in knowledge base:**
          {% for r in search.results %}
          --- {{ r.path }} ---
          {{ r.content }}
          {% endfor %}

          {% if search.results.length == 0 %}
          No relevant files found.
          {% endif %}

          **Instructions:**
          - Answer directly and concisely
          - Quote exact values when available (API keys, dates, names)
          - Say "I couldn't find that information" if not in the sources
          - Do NOT make up information
      output_variable: answer

    - action: script.execute
      inputs:
        code: |
          return {
            response: context.answer,
            action: 'retrieved',
            files: context.search.results.map(r => r.path),
            done: true
          };
      output_variable: result
```

## Step 7: Handle Task

```yaml
- type: if
  condition: '{{ !result.done && intent.intent == "task" }}'
  then:
    - action: script.execute
      inputs:
        code: |
          const fs = require('fs');
          const path = require('path');
          const basePath = context.init.base_path;
          const intent = context.intent;

          // Determine path
          let filePath = intent.target.path;
          if (!filePath) {
            filePath = 'Personal/tasks.md';
          }
          const fullPath = path.join(basePath, filePath);
          fs.mkdirSync(path.dirname(fullPath), { recursive: true });

          // Read existing
          let content = '';
          try { content = fs.readFileSync(fullPath, 'utf8'); }
          catch (e) { content = '# Tasks\n\n'; }

          // Check duplicate
          const title = intent.extracted.title || intent.extracted.content;
          if (content.toLowerCase().includes(title.toLowerCase())) {
            return {
              response: `Task already exists: "${title}"`,
              action: 'skipped',
              files: [],
              done: true
            };
          }

          // Add task
          const due = intent.extracted.due_date ? ` 📅 ${intent.extracted.due_date}` : '';
          const tags = (intent.extracted.tags || []).map(t => `#${t}`).join(' ');
          const entry = `- [ ] ${title}${due}${tags ? ' ' + tags : ''}\n`;

          fs.writeFileSync(fullPath, content + entry);

          return {
            response: `Saved: "${title}"`,
            action: 'saved',
            files: [filePath],
            done: true
          };
      output_variable: result
```

## Step 8: Handle Note

```yaml
- type: if
  condition: '{{ !result.done && intent.intent == "note" }}'
  then:
    - action: script.execute
      inputs:
        code: |
          const fs = require('fs');
          const path = require('path');
          const basePath = context.init.base_path;
          const intent = context.intent;

          let filePath = intent.target.path || 'Personal/notes.md';
          const fullPath = path.join(basePath, filePath);
          fs.mkdirSync(path.dirname(fullPath), { recursive: true });

          let content = '';
          try { content = fs.readFileSync(fullPath, 'utf8'); }
          catch (e) { content = '# Notes\n\n'; }

          const date = new Date().toISOString().split('T')[0];
          const title = intent.extracted.title || 'Note';
          const body = intent.extracted.content || context.inputs.message;
          const entry = `\n## ${date} - ${title}\n\n${body}\n`;

          fs.writeFileSync(fullPath, content + entry);

          return {
            response: `Saved note: "${title}"`,
            action: 'saved',
            files: [filePath],
            done: true
          };
      output_variable: result
```

## Step 9: Handle Event

```yaml
- type: if
  condition: '{{ !result.done && intent.intent == "event" }}'
  then:
    - action: script.execute
      inputs:
        code: |
          const fs = require('fs');
          const path = require('path');
          const basePath = context.init.base_path;
          const intent = context.intent;

          const filePath = 'Calendar/events.md';
          const fullPath = path.join(basePath, filePath);
          fs.mkdirSync(path.dirname(fullPath), { recursive: true });

          let content = '';
          try { content = fs.readFileSync(fullPath, 'utf8'); }
          catch (e) { content = '# Events\n\n'; }

          const date = intent.extracted.due_date || 'TBD';
          const title = intent.extracted.title || intent.extracted.content;
          const entry = `- **${date}**: ${title}\n`;

          fs.writeFileSync(fullPath, content + entry);

          return {
            response: `Event added: "${title}" on ${date}`,
            action: 'saved',
            files: [filePath],
            done: true
          };
      output_variable: result
```

## Step 10: Handle Journal

```yaml
- type: if
  condition: '{{ !result.done && intent.intent == "journal" }}'
  then:
    - action: script.execute
      inputs:
        code: |
          const fs = require('fs');
          const path = require('path');
          const basePath = context.init.base_path;
          const intent = context.intent;

          const now = new Date();
          const y = now.getFullYear();
          const m = String(now.getMonth() + 1).padStart(2, '0');
          const d = String(now.getDate()).padStart(2, '0');
          const time = now.toTimeString().slice(0, 5);

          const filePath = `Journal/${y}-${m}-${d}.md`;
          const fullPath = path.join(basePath, filePath);
          fs.mkdirSync(path.dirname(fullPath), { recursive: true });

          let content = '';
          try { content = fs.readFileSync(fullPath, 'utf8'); }
          catch (e) { content = `# Journal - ${y}-${m}-${d}\n\n`; }

          const body = intent.extracted.content || context.inputs.message;
          const entry = `\n## ${time}\n\n${body}\n`;

          fs.writeFileSync(fullPath, content + entry);

          return {
            response: 'Journal entry saved.',
            action: 'saved',
            files: [filePath],
            done: true
          };
      output_variable: result
```

## Step 11: Handle Reference

```yaml
- type: if
  condition: '{{ !result.done && intent.intent == "reference" }}'
  then:
    - action: script.execute
      inputs:
        code: |
          const fs = require('fs');
          const path = require('path');
          const basePath = context.init.base_path;
          const intent = context.intent;

          let filePath = intent.target.path || 'Personal/resources.md';
          const fullPath = path.join(basePath, filePath);
          fs.mkdirSync(path.dirname(fullPath), { recursive: true });

          let content = '';
          try { content = fs.readFileSync(fullPath, 'utf8'); }
          catch (e) { content = '# Resources\n\n'; }

          const title = intent.extracted.title || 'Reference';
          const body = intent.extracted.content || context.inputs.message;
          const entry = `\n## ${title}\n\n${body}\n`;

          fs.writeFileSync(fullPath, content + entry);

          return {
            response: `Saved: "${title}"`,
            action: 'saved',
            files: [filePath],
            done: true
          };
      output_variable: result
```

## Step 12: Fallback

```yaml
- type: if
  condition: '{{ !result.done }}'
  then:
    - action: script.execute
      inputs:
        code: |
          return {
            response: "I'm not sure how to handle that. Try rephrasing?",
            action: 'unknown',
            files: [],
            done: true
          };
      output_variable: result
```

## Step 13: Send Response

```yaml
- type: switch
  expression: '{{ inputs.source }}'
  cases:
    slack:
      - action: slack.chat.postMessage
        inputs:
          channel: '{{ inputs.channel_id }}'
          text: '{{ result.response }}'
    telegram:
      - action: telegram.sendMessage
        inputs:
          chat_id: '{{ inputs.channel_id }}'
          text: '{{ result.response }}'
  default:
    - action: script.execute
      inputs:
        code: |
          console.log(context.result.response);
          return {};
```

## Step 14: Set Outputs

```yaml
action: script.execute
inputs:
  code: |
    const r = context.result;
    return {
      response: r.response,
      action: r.action,
      files: r.files || []
    };
output_variable: output
```

---

## Usage

```bash
# Write a task
./marktoflow run examples/lifeos/workflow.md \
  --input message="Remind me to check the server logs tomorrow"

# Ask a question
./marktoflow run examples/lifeos/workflow.md \
  --input message="What is the API key for Apollo?"

# Save a note
./marktoflow run examples/lifeos/workflow.md \
  --input message="The client prefers email over phone calls"

# Add an event
./marktoflow run examples/lifeos/workflow.md \
  --input message="Meeting with John on Friday at 2pm"

# Journal entry
./marktoflow run examples/lifeos/workflow.md \
  --input message="I felt great today, finished the MVP"

# Save reference data
./marktoflow run examples/lifeos/workflow.md \
  --input message="The API key for Apollo is 12345"
```

## Knowledge Base Structure

```
LifeOS/
├── Work/
│   ├── Projects/Apollo/
│   │   ├── tasks.md
│   │   ├── notes.md
│   │   └── resources.md
│   └── Areas/
├── Personal/
│   ├── tasks.md
│   ├── notes.md
│   └── resources.md
├── Calendar/
│   └── events.md
└── Journal/
    └── 2024-01-15.md
```
