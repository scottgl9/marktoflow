# LifeOS Retrieval Engine

Module D: The Memory - RAG-powered Q&A system for the knowledge base.

---
workflow:
  id: lifeos-retrieval
  name: 'LifeOS Retrieval Engine'
  version: '2.0.0'
  description: |
    Module D: The Retrieval Engine (The Memory)

    Indexes content for Q&A, searches relevant files for every user question,
    and grounds AI answers in factual stored data.

    Supports:
    - Full-text search across markdown files
    - Semantic search with embeddings (optional)
    - Context-aware question answering
  author: 'lifeos'
  tags:
    - retrieval
    - search
    - rag
    - qa

tools:
  agent:
    sdk: 'claude-agent'
    options:
      model: 'sonnet'

  core:
    sdk: 'core'

triggers:
  - type: manual
  - type: webhook
    path: /lifeos/query
    method: POST

inputs:
  query:
    type: string
    required: true
    description: 'The question to answer'

  knowledge_base:
    type: string
    required: false
    default: './LifeOS'
    description: 'Root path to the LifeOS knowledge base'

  search_scope:
    type: string
    required: false
    default: 'all'
    description: 'Scope: all, work, personal, or specific path'

  max_results:
    type: number
    required: false
    default: 5
    description: 'Maximum number of relevant files to search'

outputs:
  answer:
    type: string
    description: 'The answer to the query'

  sources:
    type: array
    description: 'Files used to answer the query'

  confidence:
    type: number
    description: 'Confidence score 0-100'
---

## Step 1: Analyze Query Intent

Understand what the user is asking for.

```yaml
action: agent.run
model: haiku
inputs:
  prompt: |
    Analyze this query and extract search parameters:

    Query: "{{ inputs.query }}"

    Extract:
    1. Key search terms
    2. Entity references (projects, people, topics)
    3. Time references (dates, relative time)
    4. Query type: factual, list, summary, or exploratory

    Return JSON:
    ```json
    {
      "search_terms": ["term1", "term2"],
      "entities": ["Project Apollo", "John"],
      "time_context": null,
      "query_type": "factual",
      "expected_location": "Work/Projects/Apollo or null"
    }
    ```
output_variable: query_analysis_raw
```

## Step 2: Parse Query Analysis

```yaml
action: script.execute
inputs:
  code: |
    const response = context.query_analysis_raw;
    let analysis;

    try {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1]);
      } else {
        analysis = JSON.parse(response);
      }
    } catch (e) {
      analysis = {
        search_terms: context.inputs.query.split(' ').filter(t => t.length > 2),
        entities: [],
        query_type: 'factual'
      };
    }

    return analysis;
output_variable: query_analysis
```

## Step 3: Search Knowledge Base

Perform full-text search across markdown files.

```yaml
action: script.execute
inputs:
  code: |
    const fs = require('fs');
    const path = require('path');

    const basePath = context.inputs.knowledge_base;
    const scope = context.inputs.search_scope;
    const maxResults = context.inputs.max_results;
    const analysis = context.query_analysis;

    // Build search paths based on scope
    let searchPaths = [basePath];
    if (scope === 'work') {
      searchPaths = [path.join(basePath, 'Work')];
    } else if (scope === 'personal') {
      searchPaths = [path.join(basePath, 'Personal')];
    } else if (scope !== 'all' && scope) {
      searchPaths = [path.join(basePath, scope)];
    }

    // If expected location is known, prioritize it
    if (analysis.expected_location) {
      searchPaths.unshift(path.join(basePath, analysis.expected_location));
    }

    const results = [];
    const searchTerms = analysis.search_terms.map(t => t.toLowerCase());
    const entities = analysis.entities.map(e => e.toLowerCase());

    function searchFile(filePath) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const contentLower = content.toLowerCase();

        // Calculate relevance score
        let score = 0;

        // Check for search terms
        for (const term of searchTerms) {
          if (contentLower.includes(term)) {
            score += 10;
            // Bonus for title match
            const lines = content.split('\n');
            const firstLine = lines[0].toLowerCase();
            if (firstLine.includes(term)) {
              score += 20;
            }
          }
        }

        // Check for entity matches
        for (const entity of entities) {
          if (contentLower.includes(entity)) {
            score += 15;
          }
        }

        // Path relevance for expected location
        if (analysis.expected_location) {
          const relativePath = path.relative(basePath, filePath);
          if (relativePath.startsWith(analysis.expected_location)) {
            score += 25;
          }
        }

        if (score > 0) {
          return {
            path: path.relative(basePath, filePath),
            score,
            content: content.substring(0, 2000), // Limit content size
            preview: content.substring(0, 200).replace(/\n/g, ' ')
          };
        }
      } catch (e) {
        // Skip unreadable files
      }
      return null;
    }

    function searchDirectory(dirPath) {
      if (results.length >= maxResults * 2) return;

      try {
        const items = fs.readdirSync(dirPath);
        for (const item of items) {
          const fullPath = path.join(dirPath, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            searchDirectory(fullPath);
          } else if (item.endsWith('.md')) {
            const result = searchFile(fullPath);
            if (result) {
              results.push(result);
            }
          }
        }
      } catch (e) {
        // Skip inaccessible directories
      }
    }

    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        searchDirectory(searchPath);
      }
    }

    // Sort by score and take top results
    results.sort((a, b) => b.score - a.score);
    const topResults = results.slice(0, maxResults);

    return {
      found: topResults.length > 0,
      count: topResults.length,
      results: topResults
    };
output_variable: search_results
```

## Step 4: Generate Answer

Use AI to synthesize an answer from the search results.

```yaml
- type: if
  id: has_results
  condition: '{{ search_results.found }}'
  then:
    - action: agent.run
      inputs:
        prompt: |
          You are the LifeOS Memory - a retrieval system that answers questions from a personal knowledge base.

          ## User Query
          "{{ inputs.query }}"

          ## Search Results

          {% for result in search_results.results %}
          ### {{ result.path }} (relevance: {{ result.score }})
          ```
          {{ result.content }}
          ```
          {% endfor %}

          ## Instructions

          1. Answer the question based ONLY on the information found in the search results
          2. If the exact answer is found, provide it directly and cite the source
          3. If only partial information is found, explain what you found
          4. If the information isn't found, say so clearly
          5. Do NOT make up information not in the sources

          Respond with:
          - A direct answer to the question
          - The source file(s) where you found the information
          - Confidence level (high, medium, low)

          Format:
          Answer: [Your answer here]
          Sources: [file1.md, file2.md]
          Confidence: [high/medium/low]
      output_variable: ai_answer

    - action: script.execute
      inputs:
        code: |
          const answer = context.ai_answer;
          const sources = context.search_results.results.map(r => r.path);

          // Parse confidence
          let confidence = 70;
          if (answer.includes('Confidence: high')) {
            confidence = 90;
          } else if (answer.includes('Confidence: low')) {
            confidence = 40;
          }

          // Clean up answer format
          let cleanAnswer = answer;
          if (answer.includes('Answer:')) {
            cleanAnswer = answer.split('Sources:')[0].replace('Answer:', '').trim();
          }

          return {
            answer: cleanAnswer,
            sources: sources,
            confidence: confidence,
            raw_response: answer
          };
      output_variable: final_answer

  else:
    - action: script.execute
      inputs:
        code: |
          return {
            answer: "I couldn't find any information about that in your knowledge base. Try rephrasing your question or adding more context.",
            sources: [],
            confidence: 0
          };
      output_variable: final_answer
```

## Step 5: Set Outputs

```yaml
action: script.execute
inputs:
  code: |
    return {
      answer: context.final_answer.answer,
      sources: context.final_answer.sources,
      confidence: context.final_answer.confidence
    };
output_variable: workflow_output
```

---

## Usage Examples

### CLI Usage

```bash
# Simple query
./marktoflow run examples/lifeos/retrieval.md --input query="What is the API key for Apollo?"

# Scoped query
./marktoflow run examples/lifeos/retrieval.md \
  --input query="List all my work tasks" \
  --input search_scope="work"

# Custom knowledge base
./marktoflow run examples/lifeos/retrieval.md \
  --input query="When is the deadline?" \
  --input knowledge_base="/path/to/my/lifeos"
```

### Query Types Supported

1. **Factual Queries**: "What is the API key for Apollo?"
2. **List Queries**: "What are my pending tasks?"
3. **Summary Queries**: "Summarize the Apollo project"
4. **Time Queries**: "What meetings do I have this week?"
5. **Exploratory Queries**: "What do I know about John?"

### Advanced Search Operators

Future enhancements could include:
- `in:work` - Search only in Work domain
- `type:task` - Search only task files
- `date:today` - Filter by date
- `tag:urgent` - Filter by tag
