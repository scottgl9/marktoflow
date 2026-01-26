"""
Example: Using GitHub Copilot with browser-use

This example shows how to use the GitHubCopilotLLM wrapper with browser-use
to perform browser automation without separate API keys.

Requirements:
    - GitHub Copilot subscription
    - copilot CLI installed: npm install -g @github/copilot-cli
    - browser-use: pip install browser-use
    - playwright: pip install playwright && playwright install
"""

import asyncio
from marktoflow_langchain import GitHubCopilotLLM
from browser_use import Agent


async def scrape_hackernews():
    """
    Example: Scrape top headlines from Hacker News
    """
    # Initialize GitHub Copilot LLM (no API key needed!)
    llm = GitHubCopilotLLM(
        model="gpt-4.1",
        verbose_output=True
    )

    # Check if Copilot is installed and authenticated
    if not llm.check_installation():
        print("❌ GitHub Copilot CLI not found!")
        print("Install it with: npm install -g @github/copilot-cli")
        return

    if not llm.check_auth():
        print("❌ GitHub Copilot not authenticated!")
        print("Authenticate with: copilot auth")
        return

    print("✅ GitHub Copilot CLI ready")

    # Create browser-use agent
    agent = Agent(
        task="Go to https://news.ycombinator.com and extract the top 10 headlines with their URLs",
        llm=llm
    )

    # Run the agent
    print("\n🤖 Running browser automation with GitHub Copilot...")
    result = await agent.run()

    print("\n📊 Results:")
    print(result)


async def fill_form_example():
    """
    Example: Fill a form using natural language
    """
    llm = GitHubCopilotLLM(model="gpt-4.1")

    agent = Agent(
        task=(
            "Go to https://example.com/contact-form and fill it with:\n"
            "- Name: John Doe\n"
            "- Email: john@example.com\n"
            "- Message: I'm interested in your services\n"
            "Then click submit"
        ),
        llm=llm
    )

    result = await agent.run()
    print("Form submitted:", result)


async def extract_data_example():
    """
    Example: Extract structured data from a webpage
    """
    llm = GitHubCopilotLLM(
        model="gpt-4.1",
        timeout=180  # Increase timeout for complex tasks
    )

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
    print("\n📈 Trending repositories:")
    print(result)


async def main():
    """
    Run examples
    """
    print("=" * 60)
    print("GitHub Copilot + browser-use Examples")
    print("=" * 60)

    # Run Hacker News scraper
    await scrape_hackernews()

    # Uncomment to run other examples:
    # await fill_form_example()
    # await extract_data_example()


if __name__ == "__main__":
    asyncio.run(main())
