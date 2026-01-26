# @marktoflow/langchain-adapters

> **LangChain adapters for GitHub Copilot and Claude Code**
> Use browser automation with your existing AI subscriptions - no separate API keys needed!

## Overview

This package provides TypeScript/JavaScript LangChain adapters that use CLI-based AI backends instead of requiring separate API keys. Perfect for:

- **Cost savings** - Use your existing GitHub Copilot or Claude subscriptions
- **Privacy** - No need to share API keys with additional services
- **Simplicity** - Works with Stagehand, Playwright, and all LangChain-compatible tools
- **Native TypeScript** - Fully typed with modern ESM modules

## Features

- ✅ **GitHub Copilot CLI Wrapper** - Use your GitHub Copilot subscription
- ✅ **Claude Code CLI Wrapper** - Use your Claude subscription
- ✅ **LangChain.js Compatible** - Works with all LangChain.js tools
- ✅ **Stagehand Support** - Use Stagehand with Copilot/Claude instead of OpenAI/Anthropic APIs
- ✅ **Enhanced Playwright Integration** - AI-powered browser automation with marktoflow
- ✅ **Session Persistence** - Save and restore browser sessions
- ✅ **No API Keys Required** - Leverage existing subscriptions
- ✅ **Type Safe** - Full TypeScript support
- ✅ **Easy Installation** - Simple pnpm/npm install

## Installation

```bash
# Install the package
pnpm add @marktoflow/langchain-adapters

# Install peer dependencies (as needed)
pnpm add @langchain/core                    # For LangChain LLM usage
pnpm add @browserbasehq/stagehand playwright # For Stagehand
pnpm add @marktoflow/integrations           # For enhanced Playwright
```

## Quick Start

### With Stagehand + GitHub Copilot

```typescript
import { createStagehandWithCopilot } from '@marktoflow/langchain-adapters';

// No API key needed - uses your GitHub Copilot subscription!
const stagehand = createStagehandWithCopilot({
  model: 'gpt-4.1',
  env: 'LOCAL',
});

await stagehand.init();
await stagehand.page.goto('https://news.ycombinator.com');

// Extract data with AI
const result = await stagehand.extract({
  instruction: 'Extract the top 10 headlines',
  schema: {
    headlines: [{ title: 'string', url: 'string', points: 'number' }],
  },
});

console.log(result);
await stagehand.close();
```

### With Stagehand + Claude Code

```typescript
import { createStagehandWithClaude } from '@marktoflow/langchain-adapters';

// No API key needed - uses your Claude subscription!
const stagehand = createStagehandWithClaude({
  model: 'claude-sonnet-4',
  env: 'LOCAL',
});

await stagehand.init();
await stagehand.page.goto('https://example.com');

// AI-powered actions
await stagehand.act({ action: 'click the login button' });

const data = await stagehand.extract({
  instruction: 'Extract all product names',
  schema: {
    products: [{ name: 'string', price: 'number' }],
  },
});

await stagehand.close();
```

### With Enhanced Playwright + Copilot

```typescript
import { createAIPlaywrightWithCopilot } from '@marktoflow/langchain-adapters';

const { client, llm } = createAIPlaywrightWithCopilot({
  model: 'gpt-4.1',
  headless: false,
});

await client.launch();
await client.navigate({ url: 'https://github.com/trending' });

// Use AI-powered actions
await client.act({ instruction: 'Click on the first repository' });

// Extract structured data
const repos = await client.extract({
  instruction: 'Extract top 5 trending repositories',
  schema: {
    repositories: [{ name: 'string', stars: 'string', language: 'string' }],
  },
});

// Use LLM directly
const analysis = await llm.invoke('Analyze the trending topics');

await client.close();
```

### With Enhanced Playwright + Claude

```typescript
import { createAIPlaywrightWithClaude } from '@marktoflow/langchain-adapters';

const { client, llm } = createAIPlaywrightWithClaude({
  model: 'claude-sonnet-4',
  sessionId: 'my-session',      // Session persistence
  autoSaveSession: true,
});

await client.launch();
await client.navigate({ url: 'https://example.com' });

// Complex AI-powered extraction
const data = await client.extract({
  instruction: 'Extract all interactive elements with their descriptions',
  schema: {
    elements: [{ type: 'string', text: 'string', action: 'string' }],
  },
});

await client.close();
```

## Requirements

### For GitHub Copilot

1. **GitHub Copilot subscription** (~$10/month)
2. **Copilot CLI installed**:
   ```bash
   npm install -g @github/copilot-cli
   ```
3. **Authenticate**:
   ```bash
   copilot auth
   ```

### For Claude Code

1. **Claude subscription** (Pro or Enterprise)
2. **Claude CLI installed**: Follow [official guide](https://docs.anthropic.com/claude/docs/claude-code)
3. **Authenticate**: Follow setup instructions

## API Reference

### LangChain LLM Wrappers

#### GitHubCopilotLLM

```typescript
import { GitHubCopilotLLM } from '@marktoflow/langchain-adapters';

const llm = new GitHubCopilotLLM({
  model: 'gpt-4.1',           // Model to use
  cliPath: 'copilot',         // Path to CLI
  timeout: 120000,            // Timeout in ms
  verbose: false,             // Enable logging
});

// Check installation
const isInstalled = await llm.checkInstallation();
const isAuthenticated = await llm.checkAuth();

// Use with LangChain
const response = await llm.invoke('What is TypeScript?');
```

**Parameters:**
- `model` - Model to use (default: `'gpt-4.1'`)
- `cliPath` - Path to copilot CLI (default: `'copilot'`)
- `timeout` - Timeout in milliseconds (default: `120000`)
- `verbose` - Enable debug logging (default: `false`)

#### ClaudeCodeLLM

```typescript
import { ClaudeCodeLLM } from '@marktoflow/langchain-adapters';

const llm = new ClaudeCodeLLM({
  model: 'claude-sonnet-4',   // Model to use
  cliPath: 'claude',          // Path to CLI
  timeout: 120000,            // Timeout in ms
  cwd: process.cwd(),         // Working directory
  verbose: false,             // Enable logging
});

// Use with LangChain
const response = await llm.invoke('Explain async/await');
```

**Parameters:**
- `model` - Model to use (default: `'claude-sonnet-4'`)
- `cliPath` - Path to claude CLI (default: `'claude'`)
- `timeout` - Timeout in milliseconds (default: `120000`)
- `cwd` - Working directory (optional)
- `verbose` - Enable debug logging (default: `false`)

### Stagehand Adapters

#### createStagehandWithCopilot

```typescript
import { createStagehandWithCopilot } from '@marktoflow/langchain-adapters';

const stagehand = createStagehandWithCopilot({
  model: 'gpt-4.1',
  env: 'LOCAL',
  verbose: true,
  // ...other Stagehand config options
});
```

#### createStagehandWithClaude

```typescript
import { createStagehandWithClaude } from '@marktoflow/langchain-adapters';

const stagehand = createStagehandWithClaude({
  model: 'claude-sonnet-4',
  env: 'LOCAL',
  verbose: true,
  // ...other Stagehand config options
});
```

### Playwright Adapters

#### createAIPlaywrightWithCopilot

```typescript
import { createAIPlaywrightWithCopilot } from '@marktoflow/langchain-adapters';

const { client, llm, copilotClient } = createAIPlaywrightWithCopilot({
  model: 'gpt-4.1',
  browserType: 'chromium',
  headless: false,
  sessionId: 'my-session',
  autoSaveSession: true,
});
```

**Returns:**
- `client` - Enhanced Playwright client with AI capabilities
- `llm` - GitHubCopilotLLM instance
- `copilotClient` - GitHub Copilot client instance

#### createAIPlaywrightWithClaude

```typescript
import { createAIPlaywrightWithClaude } from '@marktoflow/langchain-adapters';

const { client, llm, claudeClient } = createAIPlaywrightWithClaude({
  model: 'claude-sonnet-4',
  browserType: 'chromium',
  headless: false,
  sessionId: 'my-session',
  autoSaveSession: true,
});
```

**Returns:**
- `client` - Enhanced Playwright client with AI capabilities
- `llm` - ClaudeCodeLLM instance
- `claudeClient` - Claude Code client instance

## Examples

See the `examples/` directory for complete working examples:

### Stagehand Examples
- `stagehand-copilot.ts` - Stagehand with GitHub Copilot
- `stagehand-claude.ts` - Stagehand with Claude Code

### Playwright Examples
- `playwright-copilot.ts` - Enhanced Playwright with GitHub Copilot
- `playwright-claude.ts` - Enhanced Playwright with Claude Code

## Use Cases

### Web Scraping

```typescript
const { client } = createAIPlaywrightWithCopilot({ model: 'gpt-4.1' });

await client.launch();
await client.navigate({ url: 'https://news.ycombinator.com' });

const headlines = await client.extract({
  instruction: 'Extract all headlines with URLs',
  schema: {
    headlines: [{ title: 'string', url: 'string' }],
  },
});
```

### Form Automation

```typescript
const stagehand = createStagehandWithClaude({ model: 'claude-sonnet-4' });

await stagehand.init();
await stagehand.page.goto('https://example.com/contact');

await stagehand.act({ action: 'Fill name with "John Doe"' });
await stagehand.act({ action: 'Fill email with "john@example.com"' });
await stagehand.act({ action: 'Click submit button' });
```

### Session Persistence

```typescript
// Login once
const { client: client1 } = createAIPlaywrightWithCopilot({
  sessionId: 'user-session',
  autoSaveSession: true,
});

await client1.launch();
await client1.navigate({ url: 'https://app.example.com/login' });
await client1.act({ instruction: 'Login with credentials' });
await client1.close(); // Session saved automatically

// Reuse session
const { client: client2 } = createAIPlaywrightWithCopilot({
  sessionId: 'user-session',
});

await client2.launch(); // Session restored - already logged in!
```

## Choosing the Right Tool

### Stagehand vs Playwright

| Feature | Stagehand | marktoflow Playwright |
|---------|-----------|----------------------|
| **AI Backend** | OpenAI/Anthropic (or our wrappers!) | Copilot/Claude/Stagehand |
| **Vision Support** | ✅ Yes | ✅ Yes (via Stagehand) |
| **Structured Extraction** | ✅ Advanced (with schemas) | ✅ Advanced |
| **Session Persistence** | ⚠️ Limited | ✅ Built-in |
| **Multi-Browser** | ❌ Chromium only | ✅ Chromium/Firefox/WebKit |
| **Best For** | Production AI workflows | Flexible automation |

### When to Use Each

**Use Stagehand when:**
- You need robust structured data extraction with schemas
- You want production-tested AI browser automation
- You're building complex multi-step workflows
- OpenAI/Anthropic-style API is preferred

**Use Enhanced Playwright when:**
- You need session persistence across runs
- You want multi-browser support (Firefox, WebKit)
- You prefer marktoflow's workflow integration
- You need both AI and traditional automation

**Good news:** Both work great with our Copilot/Claude wrappers - no API keys needed! 🎉

## Cost Comparison

| Backend | Monthly Cost | Usage Limits | API Key Needed |
|---------|--------------|--------------|----------------|
| **GitHub Copilot** | $10 | Unlimited* | ❌ No |
| **Claude Subscription** | $20 | Fair use policy | ❌ No |
| **OpenAI API** | Pay-per-use | None | ✅ Yes |
| **Anthropic API** | Pay-per-use | None | ✅ Yes |

*Subject to GitHub's fair use policy

## Limitations

### Current Limitations

1. **No Streaming** - CLI responses are not streamed (return all at once)
2. **Latency** - Slightly higher latency than direct API calls due to CLI overhead
3. **CLI Dependency** - Requires copilot/claude CLI tools to be installed

### When to Use Direct APIs Instead

Use direct API access (OpenAI, Anthropic) when you need:
- Streaming responses
- Absolute minimum latency
- Fine-grained usage control
- Advanced API features (function calling, vision with custom models)

## Troubleshooting

### "CLI not found" error

**GitHub Copilot:**
```bash
npm install -g @github/copilot-cli
copilot auth
```

**Claude Code:**
Follow the [official installation guide](https://docs.anthropic.com/claude/docs/claude-code)

### "Not authenticated" error

**GitHub Copilot:**
```bash
copilot auth
```

**Claude Code:**
Follow authentication steps in the official documentation

### Timeout errors

Increase the timeout parameter:
```typescript
const llm = new GitHubCopilotLLM({ timeout: 300000 }); // 5 minutes
```

### TypeScript errors

Make sure you have `@langchain/core` installed:
```bash
pnpm add @langchain/core
```

## Development

```bash
# Clone the repository
git clone https://github.com/scottgl9/marktoflow.git
cd marktoflow/packages/langchain-adapters

# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Run examples
node examples/stagehand-copilot.js
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

Apache-2.0 - See [LICENSE](../../LICENSE) for details

## Related Projects

- [marktoflow](https://github.com/scottgl9/marktoflow) - Universal automation framework
- [Stagehand](https://github.com/browserbase/stagehand) - AI-powered browser automation
- [LangChain.js](https://github.com/langchain-ai/langchainjs) - LLM application framework

## Support

- 📖 [Documentation](https://github.com/scottgl9/marktoflow)
- 🐛 [Issue Tracker](https://github.com/scottgl9/marktoflow/issues)
- 💬 [Discussions](https://github.com/scottgl9/marktoflow/discussions)

## Author

**Scott Glover** - [scottgl@gmail.com](mailto:scottgl@gmail.com)
