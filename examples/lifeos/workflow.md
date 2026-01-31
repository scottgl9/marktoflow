# LifeOS: Autonomous Knowledge Engine

A "headless" operating system for your life. It solves the fundamental friction of Knowledge Management: **Capturing is fast, but Organization is slow.**

The user simply "talks" to the system via their favorite chat app. An AI Agent—acting as a Librarian, Secretary, and Analyst—autonomously handles the rest.

---
workflow:
  id: lifeos-master
  name: 'LifeOS Master Plan'
  version: '2.0.0'
  description: |
    LifeOS transforms a folder of static Markdown files into a Conversation Partner
    that remembers everything, asks clarifying questions, and organizes your life
    in the background.

    Four Modules:
    - Module A: Unified Ingestion Layer (The Listener)
    - Module B: Context Router (The Librarian)
    - Module C: Semantic Reconciler (The Editor)
    - Module D: Retrieval Engine (The Memory)
  author: 'lifeos'
  tags:
    - knowledge-management
    - personal-assistant
    - automation
    - ai-agent

tools:
  # AI Agent for parsing, routing, and deduplication
  agent:
    sdk: 'claude-agent'
    options:
      model: 'sonnet'

  # Communication channels
  slack:
    sdk: '@slack/web-api'
    auth:
      token: '${SLACK_BOT_TOKEN}'

  telegram:
    sdk: 'telegram'
    auth:
      token: '${TELEGRAM_BOT_TOKEN}'

  # File operations for knowledge base
  core:
    sdk: 'core'

triggers:
  # Manual trigger for direct input
  - type: manual

  # Webhook for incoming messages
  - type: webhook
    path: /lifeos/ingest
    method: POST

inputs:
  # The raw user input text
  message:
    type: string
    required: true
    description: 'Raw unstructured text from user (task, note, question, etc.)'

  # Source channel for reply routing
  source:
    type: string
    required: false
    default: 'cli'
    description: 'Source channel: slack, telegram, cli'

  # Channel/chat ID for replies
  channel_id:
    type: string
    required: false
    description: 'Channel or chat ID for sending replies'

  # Knowledge base root path
  knowledge_base:
    type: string
    required: false
    default: './LifeOS'
    description: 'Root path to the LifeOS knowledge base'

  # Mode: ingest (write) or query (read)
  mode:
    type: string
    required: false
    default: 'auto'
    description: 'Mode: ingest, query, or auto (AI determines)'

outputs:
  response:
    type: string
    description: 'Response message to send back to user'

  action_taken:
    type: string
    description: 'Description of what LifeOS did'

  files_modified:
    type: array
    description: 'List of files created or modified'
---

## Step 1: Initialize Knowledge Base Structure

Ensure the directory structure exists with the 4-level taxonomy.

```yaml
action: script.execute
inputs:
  code: |
    const fs = require('fs');
    const path = require('path');

    const basePath = context.inputs.knowledge_base || './LifeOS';

    // 4-level taxonomy structure
    const structure = {
      'Work': {
        'Projects': {},
        'Areas': {},
        'Archives': {}
      },
      'Personal': {
        'Projects': {},
        'Areas': {},
        'Archives': {}
      },
      'Calendar': {
        'Future_Events.md': '# Future Events\n\n',
        'Recurring.md': '# Recurring Events\n\n'
      },
      'Journal': {}
    };

    function ensureStructure(basePath, struct) {
      for (const [name, content] of Object.entries(struct)) {
        const fullPath = path.join(basePath, name);
        if (name.endsWith('.md')) {
          // It's a file
          if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            fs.writeFileSync(fullPath, content);
          }
        } else {
          // It's a directory
          fs.mkdirSync(fullPath, { recursive: true });
          if (typeof content === 'object') {
            ensureStructure(fullPath, content);
          }
        }
      }
    }

    try {
      ensureStructure(basePath, structure);
      return {
        success: true,
        base_path: basePath,
        message: 'Knowledge base initialized'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
output_variable: init_result
```

## Step 2: Scan Existing Knowledge Base

Map the current directory tree to understand the user's life context.

```yaml
action: script.execute
inputs:
  code: |
    const fs = require('fs');
    const path = require('path');

    const basePath = context.init_result.base_path;
    const projects = [];
    const areas = [];
    const recentFiles = [];

    function scanDirectory(dirPath, depth = 0) {
      if (depth > 4) return;

      try {
        const items = fs.readdirSync(dirPath);

        for (const item of items) {
          const fullPath = path.join(dirPath, item);
          const stat = fs.statSync(fullPath);
          const relativePath = path.relative(basePath, fullPath);

          if (stat.isDirectory()) {
            // Track projects and areas
            if (relativePath.includes('/Projects/') && depth === 2) {
              projects.push({
                name: item,
                path: relativePath,
                domain: relativePath.split('/')[0]
              });
            } else if (relativePath.includes('/Areas/') && depth === 2) {
              areas.push({
                name: item,
                path: relativePath,
                domain: relativePath.split('/')[0]
              });
            }
            scanDirectory(fullPath, depth + 1);
          } else if (item.endsWith('.md')) {
            recentFiles.push({
              name: item,
              path: relativePath,
              modified: stat.mtime
            });
          }
        }
      } catch (e) {
        // Skip inaccessible directories
      }
    }

    scanDirectory(basePath);

    // Sort recent files by modification time
    recentFiles.sort((a, b) => new Date(b.modified) - new Date(a.modified));

    return {
      projects: projects.slice(0, 20),
      areas: areas.slice(0, 20),
      recent_files: recentFiles.slice(0, 10),
      summary: `Found ${projects.length} projects, ${areas.length} areas`
    };
output_variable: knowledge_map
```

## Step 3: Module A - Parse Intent and Classify

The AI Librarian analyzes the input to determine intent, extract entities, and identify the target location.

```yaml
action: agent.run
inputs:
  prompt: |
    You are the LifeOS Librarian - an AI that organizes a personal knowledge base.

    ## Current Knowledge Base Context

    **Active Projects:**
    {% for project in knowledge_map.projects %}
    - {{ project.domain }}/Projects/{{ project.name }}
    {% endfor %}

    **Active Areas:**
    {% for area in knowledge_map.areas %}
    - {{ area.domain }}/Areas/{{ area.name }}
    {% endfor %}

    **Recently Modified Files:**
    {% for file in knowledge_map.recent_files %}
    - {{ file.path }}
    {% endfor %}

    ## User Input

    "{{ inputs.message }}"

    ## Your Task

    Analyze this input and determine:

    1. **Intent Type**:
       - `task` - A to-do item or reminder
       - `note` - Information to store
       - `event` - Calendar/time-based entry
       - `query` - A question to answer (retrieval mode)
       - `journal` - Personal reflection/diary entry
       - `reference` - Static data like API keys, passwords, contact info

    2. **Confidence Score**: 0-100 (how certain you are about routing)

    3. **Target Location**: Where should this go?
       - Match to existing project/area if relevant
       - Suggest new entity if clearly new topic
       - For queries: identify which files to search

    4. **Extracted Entities**:
       - Time references (convert relative to absolute dates)
       - People mentioned
       - Project/topic references
       - Tags/categories

    5. **Clarification Needed**: If confidence < 80, what question would help?

    ## Response Format (JSON only)

    ```json
    {
      "intent_type": "task|note|event|query|journal|reference",
      "confidence": 85,
      "target": {
        "domain": "Work|Personal",
        "category": "Projects|Areas|Archives|Calendar|Journal",
        "entity": "EntityName",
        "artifact": "tasks.md|notes.md|resources.md|investigation.md|meeting_logs.md",
        "path": "Work/Projects/Apollo/tasks.md",
        "action": "append|update|create|search"
      },
      "extracted": {
        "title": "Short title for the entry",
        "content": "Formatted content to save",
        "due_date": "YYYY-MM-DD or null",
        "tags": ["tag1", "tag2"],
        "people": ["John", "Sarah"],
        "references": {"api_key": "12345"}
      },
      "clarification": {
        "needed": false,
        "question": null,
        "options": []
      },
      "reasoning": "Brief explanation of routing decision"
    }
    ```
output_variable: intent_analysis
```

## Step 4: Parse AI Response

Extract the structured analysis from the AI response.

```yaml
action: script.execute
inputs:
  code: |
    const response = context.intent_analysis;

    // Extract JSON from the response
    let analysis;
    try {
      // Try to find JSON in the response
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1]);
      } else {
        // Try parsing the whole response as JSON
        analysis = JSON.parse(response);
      }
    } catch (e) {
      // Fallback to a clarification request
      analysis = {
        intent_type: 'unknown',
        confidence: 0,
        clarification: {
          needed: true,
          question: "I couldn't understand that input. Could you rephrase it?",
          options: []
        }
      };
    }

    return analysis;
output_variable: parsed_intent
```

## Step 5: Handle Low Confidence - Clarification Flow

If confidence is low, ask the user for clarification instead of guessing.

```yaml
- type: if
  id: check_confidence
  condition: '{{ parsed_intent.confidence < 80 && parsed_intent.clarification.needed }}'
  then:
    - action: script.execute
      inputs:
        code: |
          const intent = context.parsed_intent;
          const question = intent.clarification.question;
          const options = intent.clarification.options || [];

          let message = question;
          if (options.length > 0) {
            message += '\n\nOptions:\n' + options.map((o, i) => `${i + 1}. ${o}`).join('\n');
          }

          return {
            needs_clarification: true,
            response: message,
            action_taken: 'Requested clarification from user',
            files_modified: []
          };
      output_variable: clarification_response
  else:
    - action: script.execute
      inputs:
        code: |
          return { needs_clarification: false };
      output_variable: clarification_response
```

## Step 6: Route to Appropriate Handler

Based on intent type, route to the appropriate processing logic.

```yaml
- type: if
  id: skip_if_clarification
  condition: '{{ !clarification_response.needs_clarification }}'
  then:
    - type: switch
      expression: '{{ parsed_intent.intent_type }}'
      cases:
        query:
          # Module D: Retrieval Engine
          - action: agent.run
            inputs:
              prompt: |
                You are the LifeOS Memory - a retrieval system for a personal knowledge base.

                ## Query
                "{{ inputs.message }}"

                ## Target Files to Search
                Path: {{ parsed_intent.target.path }}

                ## Instructions
                Search the knowledge base for relevant information to answer this query.
                Provide a concise, factual answer based on stored data.
                If the information isn't found, say so clearly.

                Format your response as a direct answer, not as JSON.
            output_variable: query_result

          - action: script.execute
            inputs:
              code: |
                return {
                  response: context.query_result,
                  action_taken: 'Retrieved information from knowledge base',
                  files_modified: []
                };
            output_variable: final_result

        task:
          # Module C: Write task to appropriate file
          - action: script.execute
            inputs:
              code: |
                const fs = require('fs');
                const path = require('path');

                const intent = context.parsed_intent;
                const basePath = context.init_result.base_path;
                const targetPath = path.join(basePath, intent.target.path);

                // Ensure parent directory exists
                fs.mkdirSync(path.dirname(targetPath), { recursive: true });

                // Read existing content
                let existingContent = '';
                try {
                  existingContent = fs.readFileSync(targetPath, 'utf8');
                } catch (e) {
                  // File doesn't exist, create with header
                  existingContent = `# Tasks - ${intent.target.entity}\n\n`;
                }

                // Check for duplicates (Semantic Reconciler logic)
                const newTitle = intent.extracted.title.toLowerCase();
                const isDuplicate = existingContent.toLowerCase().includes(newTitle);

                if (isDuplicate) {
                  return {
                    response: `This task already exists in ${intent.target.entity}.`,
                    action_taken: 'Duplicate detected, no changes made',
                    files_modified: []
                  };
                }

                // Format new task entry
                const dueDate = intent.extracted.due_date
                  ? ` 📅 ${intent.extracted.due_date}`
                  : '';
                const tags = intent.extracted.tags.length > 0
                  ? ` #${intent.extracted.tags.join(' #')}`
                  : '';
                const taskEntry = `- [ ] ${intent.extracted.title}${dueDate}${tags}\n`;

                // Append to file
                const updatedContent = existingContent + taskEntry;
                fs.writeFileSync(targetPath, updatedContent);

                return {
                  response: `Saved task to ${intent.target.entity}.`,
                  action_taken: `Added task: "${intent.extracted.title}"`,
                  files_modified: [intent.target.path]
                };
            output_variable: final_result

        note:
          # Module C: Write note to appropriate file
          - action: script.execute
            inputs:
              code: |
                const fs = require('fs');
                const path = require('path');

                const intent = context.parsed_intent;
                const basePath = context.init_result.base_path;
                const targetPath = path.join(basePath, intent.target.path);

                fs.mkdirSync(path.dirname(targetPath), { recursive: true });

                let existingContent = '';
                try {
                  existingContent = fs.readFileSync(targetPath, 'utf8');
                } catch (e) {
                  existingContent = `# Notes - ${intent.target.entity}\n\n`;
                }

                // Format note entry with timestamp
                const timestamp = new Date().toISOString().split('T')[0];
                const tags = intent.extracted.tags.length > 0
                  ? `\nTags: #${intent.extracted.tags.join(' #')}`
                  : '';
                const noteEntry = `\n## ${timestamp} - ${intent.extracted.title}\n\n${intent.extracted.content}${tags}\n`;

                const updatedContent = existingContent + noteEntry;
                fs.writeFileSync(targetPath, updatedContent);

                return {
                  response: `Saved note to ${intent.target.entity}.`,
                  action_taken: `Added note: "${intent.extracted.title}"`,
                  files_modified: [intent.target.path]
                };
            output_variable: final_result

        event:
          # Calendar entry
          - action: script.execute
            inputs:
              code: |
                const fs = require('fs');
                const path = require('path');

                const intent = context.parsed_intent;
                const basePath = context.init_result.base_path;
                const calendarPath = path.join(basePath, 'Calendar/Future_Events.md');

                fs.mkdirSync(path.dirname(calendarPath), { recursive: true });

                let existingContent = '';
                try {
                  existingContent = fs.readFileSync(calendarPath, 'utf8');
                } catch (e) {
                  existingContent = '# Future Events\n\n';
                }

                const eventDate = intent.extracted.due_date || 'TBD';
                const eventEntry = `- **${eventDate}**: ${intent.extracted.title}\n`;

                const updatedContent = existingContent + eventEntry;
                fs.writeFileSync(calendarPath, updatedContent);

                return {
                  response: `Added event to calendar: ${intent.extracted.title} on ${eventDate}.`,
                  action_taken: `Added calendar event`,
                  files_modified: ['Calendar/Future_Events.md']
                };
            output_variable: final_result

        journal:
          # Daily journal entry
          - action: script.execute
            inputs:
              code: |
                const fs = require('fs');
                const path = require('path');

                const intent = context.parsed_intent;
                const basePath = context.init_result.base_path;

                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');

                const journalPath = path.join(
                  basePath,
                  `Journal/${year}/${month}/${day}.md`
                );

                fs.mkdirSync(path.dirname(journalPath), { recursive: true });

                let existingContent = '';
                try {
                  existingContent = fs.readFileSync(journalPath, 'utf8');
                } catch (e) {
                  existingContent = `# Journal - ${year}-${month}-${day}\n\n`;
                }

                const time = now.toTimeString().split(' ')[0].slice(0, 5);
                const entryContent = `\n## ${time}\n\n${intent.extracted.content}\n`;

                const updatedContent = existingContent + entryContent;
                fs.writeFileSync(journalPath, updatedContent);

                return {
                  response: `Journal entry saved.`,
                  action_taken: `Added journal entry for ${year}-${month}-${day}`,
                  files_modified: [`Journal/${year}/${month}/${day}.md`]
                };
            output_variable: final_result

        reference:
          # Static reference data (API keys, contacts, etc.)
          - action: script.execute
            inputs:
              code: |
                const fs = require('fs');
                const path = require('path');

                const intent = context.parsed_intent;
                const basePath = context.init_result.base_path;
                const targetPath = path.join(basePath, intent.target.path);

                fs.mkdirSync(path.dirname(targetPath), { recursive: true });

                let existingContent = '';
                try {
                  existingContent = fs.readFileSync(targetPath, 'utf8');
                } catch (e) {
                  existingContent = `# Resources - ${intent.target.entity}\n\n`;
                }

                // Format reference entry
                let refContent = `\n## ${intent.extracted.title}\n\n`;
                if (intent.extracted.references) {
                  for (const [key, value] of Object.entries(intent.extracted.references)) {
                    refContent += `- **${key}**: \`${value}\`\n`;
                  }
                } else {
                  refContent += `${intent.extracted.content}\n`;
                }

                const updatedContent = existingContent + refContent;
                fs.writeFileSync(targetPath, updatedContent);

                return {
                  response: `Saved reference data to ${intent.target.entity}.`,
                  action_taken: `Added reference: "${intent.extracted.title}"`,
                  files_modified: [intent.target.path]
                };
            output_variable: final_result

      default:
        # Fallback for unknown intent types
        - action: script.execute
          inputs:
            code: |
              return {
                response: "I'm not sure how to process that. Could you rephrase?",
                action_taken: 'Unknown intent type',
                files_modified: []
              };
          output_variable: final_result
```

## Step 7: Send Response to User

Route the response back to the appropriate channel.

```yaml
- type: if
  id: has_clarification
  condition: '{{ clarification_response.needs_clarification }}'
  then:
    - action: script.execute
      inputs:
        code: |
          return context.clarification_response;
      output_variable: output_result
  else:
    - action: script.execute
      inputs:
        code: |
          return context.final_result;
      output_variable: output_result
```

```yaml
- type: switch
  expression: '{{ inputs.source }}'
  cases:
    slack:
      - action: slack.chat.postMessage
        inputs:
          channel: '{{ inputs.channel_id }}'
          text: '{{ output_result.response }}'
        output_variable: slack_reply

    telegram:
      - action: telegram.sendMessage
        inputs:
          chat_id: '{{ inputs.channel_id }}'
          text: '{{ output_result.response }}'
        output_variable: telegram_reply

  default:
    # CLI output - just log
    - action: script.execute
      inputs:
        code: |
          console.log('LifeOS Response:', context.output_result.response);
          return { logged: true };
      output_variable: cli_output
```

## Step 8: Set Workflow Outputs

```yaml
action: script.execute
inputs:
  code: |
    const result = context.output_result;
    return {
      response: result.response,
      action_taken: result.action_taken,
      files_modified: result.files_modified || []
    };
output_variable: workflow_output
```

---

## Architecture Notes

### Module A: Unified Ingestion Layer
- Accepts input from Slack, Telegram, or CLI via triggers
- Normalizes all inputs to standard format: `{ message, source, channel_id }`

### Module B: Context Router (The Librarian)
- Scans directory tree to understand current life context
- Uses AI to parse intent and route to appropriate location
- Triggers clarification when confidence < 80%

### Module C: Semantic Reconciler (The Editor)
- Checks for duplicates before writing
- Updates existing entries instead of creating duplicates
- Maintains clean, organized files

### Module D: Retrieval Engine (The Memory)
- Handles query intent type
- Searches relevant files for information
- Returns factual answers grounded in stored data

### Taxonomy (4-Level Hierarchy)
```
LifeOS/
├── Work/
│   ├── Projects/        # Active work projects
│   ├── Areas/           # Ongoing responsibilities
│   └── Archives/        # Completed/inactive
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

### Artifact Types
- `tasks.md` - To-do items with checkboxes
- `notes.md` - General notes and thoughts
- `resources.md` - Static reference data
- `investigation.md` - Deep dives and research
- `meeting_logs.md` - Meeting notes and conversations
