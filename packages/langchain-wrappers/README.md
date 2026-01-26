# marktoflow LangChain Wrappers

> **LangChain wrappers for GitHub Copilot and Claude Code CLIs**
> Use browser automation with your existing AI subscriptions - no separate API keys needed!

## Overview

This package provides LangChain LLM wrappers that use CLI-based AI backends instead of requiring separate API keys. Perfect for:

- **Cost savings** - Use your existing GitHub Copilot or Claude subscriptions
- **Privacy** - No need to share API keys with additional services
- **Simplicity** - Works with any LangChain-compatible tool (like browser-use)

## Features

- ✅ **GitHub Copilot CLI Wrapper** - Use your GitHub Copilot subscription
- ✅ **Claude Code CLI Wrapper** - Use your Claude subscription
- ✅ **LangChain Compatible** - Works with browser-use, LangGraph, and all LangChain tools
- ✅ **Stagehand Support** - Use Stagehand with Copilot/Claude instead of OpenAI/Anthropic APIs
- ✅ **No API Keys Required** - Leverage existing subscriptions
- ✅ **Type Safe** - Full Python type hints
- ✅ **Easy Installation** - Simple pip install

## Installation

```bash
# Install the package
pip install marktoflow-langchain

# Install browser-use (optional, for browser automation)
pip install browser-use playwright
playwright install
```

## Quick Start

### With GitHub Copilot

```python
from marktoflow_langchain import GitHubCopilotLLM
from browser_use import Agent

# No API key needed - uses your GitHub Copilot subscription!
llm = GitHubCopilotLLM(model="gpt-4.1")

agent = Agent(
    task="Go to news.ycombinator.com and extract the top 10 headlines",
    llm=llm
)

result = await agent.run()
print(result)
```

### With Claude Code

```python
from marktoflow_langchain import ClaudeCodeLLM
from browser_use import Agent

# No API key needed - uses your Claude subscription!
llm = ClaudeCodeLLM(model="claude-sonnet-4")

agent = Agent(
    task="Go to example.com and extract all product names",
    llm=llm
)

result = await agent.run()
print(result)
```

### With Stagehand

```python
from marktoflow_langchain import create_stagehand_with_copilot

# Create Stagehand with GitHub Copilot (no OpenAI API key!)
stagehand = create_stagehand_with_copilot(model="gpt-4.1")

await stagehand.init()
await stagehand.page.goto("https://news.ycombinator.com")

# Use AI-powered extraction
result = await stagehand.extract({
    "instruction": "Extract the top 5 headlines",
    "schema": {
        "headlines": [{"title": "string", "url": "string"}]
    }
})

await stagehand.close()
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

## Usage

### Basic Usage

```python
from marktoflow_langchain import GitHubCopilotLLM

# Initialize
llm = GitHubCopilotLLM(
    model="gpt-4.1",           # Model to use
    verbose_output=True,       # Enable logging
    timeout=120                # Timeout in seconds
)

# Check installation
if llm.check_installation():
    print("✅ Copilot CLI is installed")

# Check authentication
if llm.check_auth():
    print("✅ Copilot is authenticated")

# Use with LangChain
response = llm.invoke("What is the capital of France?")
print(response)
```

### Browser Automation with browser-use

```python
import asyncio
from marktoflow_langchain import GitHubCopilotLLM
from browser_use import Agent

async def scrape_data():
    llm = GitHubCopilotLLM(model="gpt-4.1")

    agent = Agent(
        task=(
            "Go to https://github.com/trending and extract:\n"
            "1. Repository names\n"
            "2. Stars count\n"
            "3. Main programming language\n"
            "For the top 5 trending repositories"
        ),
        llm=llm
    )

    result = await agent.run()
    return result

# Run
result = asyncio.run(scrape_data())
print(result)
```

### Form Filling

```python
async def fill_form():
    llm = ClaudeCodeLLM(model="claude-sonnet-4")

    agent = Agent(
        task=(
            "Go to https://example.com/contact and fill:\n"
            "- Name: John Doe\n"
            "- Email: john@example.com\n"
            "- Message: Interested in your services\n"
            "Then submit the form"
        ),
        llm=llm
    )

    result = await agent.run()
    return result
```

### Stagehand with GitHub Copilot

```python
from marktoflow_langchain import create_stagehand_with_copilot

async def stagehand_example():
    # No OpenAI API key needed!
    stagehand = create_stagehand_with_copilot(model="gpt-4.1")

    await stagehand.init()
    await stagehand.page.goto("https://github.com/trending")

    # Use AI-powered actions
    await stagehand.act("click on the first repository")

    # Extract structured data
    data = await stagehand.extract({
        "instruction": "Extract repository info",
        "schema": {
            "name": "string",
            "description": "string",
            "stars": "number"
        }
    })

    # Observe available actions
    actions = await stagehand.observe()

    await stagehand.close()
    return data
```

### Stagehand with Claude Code

```python
from marktoflow_langchain import create_stagehand_with_claude

async def stagehand_claude_example():
    # No Anthropic API key needed!
    stagehand = create_stagehand_with_claude(model="claude-sonnet-4")

    await stagehand.init()
    await stagehand.page.goto("https://news.ycombinator.com")

    # Claude is great at complex extraction tasks
    headlines = await stagehand.extract({
        "instruction": "Extract all headlines with URLs and points",
        "schema": {
            "headlines": [{
                "title": "string",
                "url": "string",
                "points": "number"
            }]
        }
    })

    await stagehand.close()
    return headlines
```

## Configuration

### GitHubCopilotLLM Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `model` | str | `"gpt-4.1"` | Model to use (gpt-4.1, gpt-4o, etc.) |
| `cli_path` | str | `"copilot"` | Path to copilot CLI |
| `timeout` | int | `120` | CLI call timeout in seconds |
| `verbose_output` | bool | `False` | Enable debug logging |

### ClaudeCodeLLM Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `model` | str | `"claude-sonnet-4"` | Model to use |
| `cli_path` | str | `"claude"` | Path to claude CLI |
| `timeout` | int | `120` | CLI call timeout in seconds |
| `verbose_output` | bool | `False` | Enable debug logging |
| `cwd` | str | `None` | Working directory for CLI |

## Choosing the Right Tool

### browser-use vs Stagehand

| Feature | browser-use | Stagehand |
|---------|-------------|-----------|
| **AI Backend** | Any LangChain LLM | OpenAI/Anthropic (or our wrappers!) |
| **Vision Support** | ✅ Yes | ✅ Yes |
| **Structured Extraction** | ⚠️ Basic | ✅ Advanced (with schemas) |
| **Natural Language Actions** | ✅ Yes | ✅ Yes |
| **Observe Elements** | ⚠️ Limited | ✅ Advanced |
| **Best For** | General automation | Production AI workflows |

### When to Use Each

**Use browser-use when:**
- You need simple, straightforward automation
- You want maximum flexibility with LLM choices
- You prefer a LangChain-native approach

**Use Stagehand when:**
- You need robust structured data extraction with schemas
- You want production-tested AI browser automation
- You need advanced element observation
- You're building complex multi-step workflows

**Good news:** Both work great with our Copilot/Claude wrappers - no API keys needed! 🎉

## Examples

See the `examples/` directory for complete working examples:

### browser-use Examples
- `browser_use_copilot.py` - GitHub Copilot examples
- `browser_use_claude.py` - Claude Code examples

### Stagehand Examples
- `stagehand_copilot.py` - Stagehand with GitHub Copilot
- `stagehand_claude.py` - Stagehand with Claude Code

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
3. **No Vision** - Currently text-only (no image analysis)

### When to Use Direct APIs Instead

Use direct API access (OpenAI, Anthropic) when you need:
- Streaming responses
- Vision capabilities (image analysis)
- Absolute minimum latency
- Fine-grained usage control

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
```python
llm = GitHubCopilotLLM(timeout=300)  # 5 minutes
```

## Development

```bash
# Clone the repository
git clone https://github.com/scottgl9/marktoflow.git
cd marktoflow/packages/langchain-wrappers

# Install in development mode
pip install -e ".[dev]"

# Run tests
pytest

# Format code
black src/
ruff check src/
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
- [browser-use](https://github.com/browser-use/browser-use) - AI-powered browser automation
- [LangChain](https://github.com/langchain-ai/langchain) - LLM application framework

## Support

- 📖 [Documentation](https://github.com/scottgl9/marktoflow)
- 🐛 [Issue Tracker](https://github.com/scottgl9/marktoflow/issues)
- 💬 [Discussions](https://github.com/scottgl9/marktoflow/discussions)

## Author

**Scott Glover** - [scottgl@gmail.com](mailto:scottgl@gmail.com)
