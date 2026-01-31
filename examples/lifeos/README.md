# LifeOS: Autonomous Knowledge Engine

A "headless" operating system for your life. Talk to it naturally - it handles everything else.

**The Problem:** Capturing is fast, but organization is slow. Most notes become a digital junkyard.

**The Solution:** Just talk. LifeOS automatically routes, organizes, and retrieves your knowledge.

## Quick Start

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
```

## What It Does

### Write Mode
Send unstructured text → LifeOS structures and files it.

```
You: "Remind me to check the server logs for Project Apollo tomorrow.
      Also, the client mentioned the API key is 12345."

LifeOS:
  1. Parses intent → Task (check logs) + Reference (API key)
  2. Extracts time → "Tomorrow" → 2026-02-01
  3. Routes → Work/Projects/Apollo
  4. Files:
     - Appends task to tasks.md with due date
     - Appends API key to resources.md

Response: Saved to Project Apollo.
```

### Read Mode
Ask questions → LifeOS searches and answers.

```
You: "What is the API key for Apollo?"

LifeOS:
  1. Searches knowledge base
  2. Finds match in Work/Projects/Apollo/resources.md

Response: The API key is 12345.
```

### Clarification Mode
When uncertain, LifeOS asks instead of guessing.

```
You: "Don't forget the deadline."

LifeOS: "Which deadline? I see active deadlines for
        Project Apollo and House Hunting."

You: "Apollo."

LifeOS: "Got it. Updating Project Apollo."
```

## Supported Intents

| Intent | Triggers | Example |
|--------|----------|---------|
| **query** | what, when, where, who, how, why, ? | "What's the API key?" |
| **task** | remind, todo, need to, should, must | "Remind me to call John" |
| **note** | note that, remember, learned | "The client prefers email" |
| **event** | meeting, appointment, on [date] | "Meeting Friday at 2pm" |
| **journal** | I feel, today I, reflecting | "I felt great today" |
| **reference** | API key, password, phone, address | "The API key is 12345" |

## Knowledge Base Structure

```
LifeOS/
├── Work/
│   ├── Projects/
│   │   └── Apollo/
│   │       ├── tasks.md      # To-dos with checkboxes
│   │       ├── notes.md      # General notes
│   │       └── resources.md  # API keys, contacts, etc.
│   ├── Areas/                # Ongoing responsibilities
│   └── Archives/             # Completed projects
├── Personal/
│   ├── tasks.md
│   ├── notes.md
│   └── resources.md
├── Calendar/
│   └── events.md             # Upcoming events
└── Journal/
    └── 2026-01-31.md         # Daily entries
```

## Architecture

Four AI modules working in a pipeline:

1. **Ingestion** - Normalizes input from CLI, Slack, or Telegram
2. **Router** - Parses intent, determines target location
3. **Reconciler** - Checks for duplicates, updates existing entries
4. **Retrieval** - Searches and answers questions

## Setup

### Environment Variables

```bash
# Required for AI
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Slack integration
SLACK_BOT_TOKEN=xoxb-...

# Optional: Telegram integration
TELEGRAM_BOT_TOKEN=123456:ABC...
```

### Custom Knowledge Base Location

```bash
./marktoflow run examples/lifeos/workflow.md \
  --input message="Your message" \
  --input knowledge_base="/path/to/your/lifeos"
```

## Files

```
examples/lifeos/
├── workflow.md           # Main unified workflow
├── README.md             # This file
└── prompts/
    ├── librarian.md      # Intent parsing guidance
    ├── reconciler.md     # Deduplication logic
    └── retrieval.md      # Q&A guidance
```

## Comparison to Alternatives

| Feature | LifeOS | Obsidian + Plugins | Mem.ai |
|---------|--------|-------------------|--------|
| Data Ownership | 100% Local | 100% Local | Cloud |
| Auto-Filing | AI Agent | Manual/Rules | AI Tagging |
| Deduplication | Smart | Appends Only | Unclear |
| Clarification | Asks Questions | Silent | Silent |
| Q&A | Built-in RAG | Plugin Required | Built-in |
