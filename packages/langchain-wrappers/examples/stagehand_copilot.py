"""
Example: Using GitHub Copilot with Stagehand

This example shows how to use Stagehand with GitHub Copilot SDK
to perform AI-powered browser automation without OpenAI API keys.

Requirements:
    - GitHub Copilot subscription
    - copilot CLI installed: npm install -g @github/copilot-cli
    - stagehand: pip install stagehand
    - playwright: pip install playwright && playwright install
"""

import asyncio
from marktoflow_langchain import create_stagehand_with_copilot


async def basic_example():
    """
    Basic Stagehand usage with GitHub Copilot
    """
    print("🚀 Creating Stagehand with GitHub Copilot...")

    # Create Stagehand instance using Copilot (no OpenAI API key needed!)
    stagehand = create_stagehand_with_copilot(
        model="gpt-4.1",
        env="LOCAL"
    )

    await stagehand.init()
    print("✅ Stagehand initialized with GitHub Copilot")

    # Navigate to a page
    await stagehand.page.goto("https://news.ycombinator.com")
    print("📄 Navigated to Hacker News")

    # Use AI to interact with the page
    print("\n🤖 Using AI to extract headlines...")
    result = await stagehand.extract({
        "instruction": "Extract the top 5 news headlines with their URLs",
        "schema": {
            "headlines": [{
                "title": "string",
                "url": "string",
                "points": "number"
            }]
        }
    })

    print("\n📊 Results:")
    print(result)

    await stagehand.close()


async def advanced_form_filling():
    """
    Advanced example: AI-powered form filling
    """
    stagehand = create_stagehand_with_copilot(model="gpt-4.1")
    await stagehand.init()

    # Navigate to a form
    await stagehand.page.goto("https://example.com/contact")

    # Use AI to understand and fill the form
    await stagehand.act("Fill the name field with 'John Doe'")
    await stagehand.act("Fill the email field with 'john@example.com'")
    await stagehand.act("Select 'Technical Support' from the dropdown")
    await stagehand.act("Type 'I need help with my account' in the message box")
    await stagehand.act("Click the Submit button")

    print("✅ Form submitted successfully")

    await stagehand.close()


async def multi_page_navigation():
    """
    Example: Navigate multiple pages and extract data
    """
    stagehand = create_stagehand_with_copilot(
        model="gpt-4.1",
        env="LOCAL"
    )
    await stagehand.init()

    # Navigate and extract from multiple pages
    pages = [
        "https://github.com/trending",
        "https://github.com/trending?spoken_language_code=python",
        "https://github.com/trending?spoken_language_code=typescript",
    ]

    results = []

    for page_url in pages:
        print(f"\n📄 Processing: {page_url}")
        await stagehand.page.goto(page_url)

        # Extract trending repositories
        data = await stagehand.extract({
            "instruction": "Extract the top 3 trending repositories",
            "schema": {
                "repositories": [{
                    "name": "string",
                    "description": "string",
                    "stars": "string",
                    "language": "string"
                }]
            }
        })

        results.append(data)

    print("\n🎯 All results collected:")
    for i, result in enumerate(results):
        print(f"\nPage {i + 1}:")
        print(result)

    await stagehand.close()


async def observe_example():
    """
    Example: Use observe to discover page elements
    """
    stagehand = create_stagehand_with_copilot(model="gpt-4.1")
    await stagehand.init()

    await stagehand.page.goto("https://github.com")

    # Observe available actions on the page
    print("\n🔍 Observing page elements...")
    observations = await stagehand.observe()

    print("\n📋 Available actions on the page:")
    for obs in observations:
        print(f"  - {obs.get('description', 'Unknown')}")

    await stagehand.close()


async def main():
    """
    Run examples
    """
    print("=" * 60)
    print("Stagehand + GitHub Copilot Examples")
    print("=" * 60)
    print("\nNo OpenAI API key needed - uses your GitHub Copilot subscription!")
    print()

    # Run basic example
    await basic_example()

    # Uncomment to run other examples:
    # await advanced_form_filling()
    # await multi_page_navigation()
    # await observe_example()


if __name__ == "__main__":
    asyncio.run(main())
