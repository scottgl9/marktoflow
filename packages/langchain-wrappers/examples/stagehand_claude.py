"""
Example: Using Claude Code with Stagehand

This example shows how to use Stagehand with Claude Code SDK
to perform AI-powered browser automation without Anthropic API keys.

Requirements:
    - Claude subscription (Pro or Enterprise)
    - claude CLI installed: https://docs.anthropic.com/claude/docs/claude-code
    - stagehand: pip install stagehand
    - playwright: pip install playwright && playwright install
"""

import asyncio
from marktoflow_langchain import create_stagehand_with_claude


async def basic_example():
    """
    Basic Stagehand usage with Claude Code
    """
    print("🚀 Creating Stagehand with Claude Code...")

    # Create Stagehand instance using Claude (no Anthropic API key needed!)
    stagehand = create_stagehand_with_claude(
        model="claude-sonnet-4",
        env="LOCAL"
    )

    await stagehand.init()
    print("✅ Stagehand initialized with Claude Code")

    # Navigate to a page
    await stagehand.page.goto("https://news.ycombinator.com")
    print("📄 Navigated to Hacker News")

    # Use AI to interact with the page
    print("\n🤖 Using Claude AI to extract headlines...")
    result = await stagehand.extract({
        "instruction": "Extract the top 5 news headlines with their URLs and point counts",
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


async def research_task():
    """
    Example: Use Claude for complex research tasks
    """
    stagehand = create_stagehand_with_claude(model="claude-sonnet-4")
    await stagehand.init()

    # Research Python web frameworks
    await stagehand.page.goto("https://www.python.org/")

    # Claude is great at understanding complex instructions
    result = await stagehand.extract({
        "instruction": (
            "Research Python web frameworks mentioned on this page. "
            "For each framework, extract:\n"
            "1. Framework name\n"
            "2. Main use case\n"
            "3. Key features (if mentioned)\n"
            "4. Links to documentation"
        ),
        "schema": {
            "frameworks": [{
                "name": "string",
                "useCase": "string",
                "features": ["string"],
                "docLink": "string"
            }]
        }
    })

    print("\n🔬 Research results:")
    print(result)

    await stagehand.close()


async def e_commerce_scraping():
    """
    Example: E-commerce data extraction
    """
    stagehand = create_stagehand_with_claude(model="claude-sonnet-4")
    await stagehand.init()

    # Navigate to e-commerce site
    await stagehand.page.goto("https://example-shop.com/products")

    # Search for specific products
    await stagehand.act("Search for 'laptop' in the search bar")
    await stagehand.act("Wait for search results to load")

    # Extract product information
    products = await stagehand.extract({
        "instruction": "Extract all laptop products with their details",
        "schema": {
            "products": [{
                "name": "string",
                "price": "number",
                "rating": "number",
                "inStock": "boolean",
                "features": ["string"]
            }]
        }
    })

    print("\n🛒 Product information:")
    print(products)

    # Filter and sort
    await stagehand.act("Click the 'Sort by: Price Low to High' option")

    # Re-extract sorted data
    sorted_products = await stagehand.extract({
        "instruction": "Extract the sorted product list",
        "schema": {
            "products": [{
                "name": "string",
                "price": "number"
            }]
        }
    })

    print("\n💰 Sorted by price:")
    print(sorted_products)

    await stagehand.close()


async def complex_form_interaction():
    """
    Example: Complex form with multiple steps
    """
    stagehand = create_stagehand_with_claude(model="claude-sonnet-4")
    await stagehand.init()

    await stagehand.page.goto("https://example.com/multi-step-form")

    # Step 1: Personal information
    await stagehand.act("Fill 'First Name' with 'Jane'")
    await stagehand.act("Fill 'Last Name' with 'Smith'")
    await stagehand.act("Fill 'Email' with 'jane.smith@example.com'")
    await stagehand.act("Click 'Next' button")

    # Step 2: Address
    await stagehand.act("Fill 'Street Address' with '123 Main St'")
    await stagehand.act("Fill 'City' with 'San Francisco'")
    await stagehand.act("Select 'California' from State dropdown")
    await stagehand.act("Fill 'ZIP Code' with '94102'")
    await stagehand.act("Click 'Next' button")

    # Step 3: Preferences
    await stagehand.act("Check the 'Newsletter' checkbox")
    await stagehand.act("Select 'Monthly' from frequency dropdown")
    await stagehand.act("Click 'Submit' button")

    # Verify submission
    confirmation = await stagehand.extract({
        "instruction": "Extract the confirmation message",
        "schema": {
            "message": "string",
            "confirmationNumber": "string"
        }
    })

    print("\n✅ Form submitted successfully:")
    print(confirmation)

    await stagehand.close()


async def main():
    """
    Run examples
    """
    print("=" * 60)
    print("Stagehand + Claude Code Examples")
    print("=" * 60)
    print("\nNo Anthropic API key needed - uses your Claude subscription!")
    print()

    # Run basic example
    await basic_example()

    # Uncomment to run other examples:
    # await research_task()
    # await e_commerce_scraping()
    # await complex_form_interaction()


if __name__ == "__main__":
    asyncio.run(main())
