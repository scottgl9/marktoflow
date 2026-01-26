"""
Example: Using Claude Code with browser-use

This example shows how to use the ClaudeCodeLLM wrapper with browser-use
to perform browser automation without separate API keys.

Requirements:
    - Claude subscription (Pro or Enterprise)
    - claude CLI installed: https://docs.anthropic.com/claude/docs/claude-code
    - browser-use: pip install browser-use
    - playwright: pip install playwright && playwright install
"""

import asyncio
from marktoflow_langchain import ClaudeCodeLLM
from browser_use import Agent


async def scrape_hackernews():
    """
    Example: Scrape top headlines from Hacker News
    """
    # Initialize Claude Code LLM (no API key needed!)
    llm = ClaudeCodeLLM(
        model="claude-sonnet-4",
        verbose_output=True
    )

    # Check if Claude is installed and authenticated
    if not llm.check_installation():
        print("❌ Claude Code CLI not found!")
        print("Install it from: https://docs.anthropic.com/claude/docs/claude-code")
        return

    if not llm.check_auth():
        print("❌ Claude Code not authenticated!")
        print("Follow setup instructions at: https://docs.anthropic.com/claude/docs/claude-code")
        return

    print("✅ Claude Code CLI ready")

    # Create browser-use agent
    agent = Agent(
        task="Go to https://news.ycombinator.com and extract the top 10 headlines with their URLs",
        llm=llm
    )

    # Run the agent
    print("\n🤖 Running browser automation with Claude Code...")
    result = await agent.run()

    print("\n📊 Results:")
    print(result)


async def research_example():
    """
    Example: Research a topic across multiple pages
    """
    llm = ClaudeCodeLLM(
        model="claude-sonnet-4",
        timeout=300  # Longer timeout for research tasks
    )

    agent = Agent(
        task=(
            "Research Python web frameworks:\n"
            "1. Go to https://www.python.org/\n"
            "2. Navigate to the frameworks section\n"
            "3. Extract information about Django, Flask, and FastAPI\n"
            "4. Compare their features and use cases"
        ),
        llm=llm
    )

    result = await agent.run()
    print("\n🔬 Research results:")
    print(result)


async def e_commerce_example():
    """
    Example: Extract product information from an e-commerce site
    """
    llm = ClaudeCodeLLM(model="claude-sonnet-4")

    agent = Agent(
        task=(
            "Go to https://example-store.com and:\n"
            "1. Search for 'laptops'\n"
            "2. Extract the top 5 products with:\n"
            "   - Product name\n"
            "   - Price\n"
            "   - Rating\n"
            "   - In stock status\n"
            "3. Sort by price (low to high)"
        ),
        llm=llm
    )

    result = await agent.run()
    print("\n🛒 Product information:")
    print(result)


async def main():
    """
    Run examples
    """
    print("=" * 60)
    print("Claude Code + browser-use Examples")
    print("=" * 60)

    # Run Hacker News scraper
    await scrape_hackernews()

    # Uncomment to run other examples:
    # await research_example()
    # await e_commerce_example()


if __name__ == "__main__":
    asyncio.run(main())
