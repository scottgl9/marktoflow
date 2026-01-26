/**
 * Example: Using Stagehand with Claude Code
 *
 * This example shows how to use Stagehand with Claude Code
 * to perform AI-powered browser automation without Anthropic API keys.
 *
 * Requirements:
 *   - Claude subscription (Pro or Enterprise)
 *   - claude CLI installed: https://docs.anthropic.com/claude/docs/claude-code
 *   - Stagehand: pnpm add @browserbasehq/stagehand
 *   - Playwright: pnpm add playwright && npx playwright install
 */

import { createStagehandWithClaude } from '../src/index.js';

async function basicExample() {
  console.log('🚀 Creating Stagehand with Claude Code...');

  // Create Stagehand instance using Claude (no Anthropic API key needed!)
  const stagehand = createStagehandWithClaude({
    model: 'claude-sonnet-4',
    env: 'LOCAL',
  });

  await stagehand.init();
  console.log('✅ Stagehand initialized with Claude Code');

  // Navigate to a page
  await stagehand.page.goto('https://news.ycombinator.com');
  console.log('📄 Navigated to Hacker News');

  // Use AI to extract headlines
  console.log('\n🤖 Using Claude AI to extract headlines...');
  const result = await stagehand.extract({
    instruction: 'Extract the top 5 news headlines with their URLs and point counts',
    schema: {
      headlines: [
        {
          title: 'string',
          url: 'string',
          points: 'number',
        },
      ],
    },
  });

  console.log('\n📊 Results:');
  console.log(JSON.stringify(result, null, 2));

  await stagehand.close();
}

async function researchTask() {
  console.log('\n\n=== Research Task Example ===\n');

  const stagehand = createStagehandWithClaude({
    model: 'claude-sonnet-4',
  });

  await stagehand.init();

  // Research Python web frameworks
  await stagehand.page.goto('https://www.python.org/');

  // Claude is great at understanding complex instructions
  const result = await stagehand.extract({
    instruction: `Research Python web frameworks mentioned on this page.
For each framework, extract:
1. Framework name
2. Main use case
3. Key features (if mentioned)
4. Links to documentation`,
    schema: {
      frameworks: [
        {
          name: 'string',
          useCase: 'string',
          features: ['string'],
          docLink: 'string',
        },
      ],
    },
  });

  console.log('\n🔬 Research results:');
  console.log(JSON.stringify(result, null, 2));

  await stagehand.close();
}

async function eCommerceScraping() {
  console.log('\n\n=== E-Commerce Scraping Example ===\n');

  const stagehand = createStagehandWithClaude({
    model: 'claude-sonnet-4',
  });

  await stagehand.init();

  // Navigate to e-commerce site
  await stagehand.page.goto('https://example-shop.com/products');

  // Search for specific products
  await stagehand.act({ action: "Search for 'laptop' in the search bar" });
  await stagehand.act({ action: 'Wait for search results to load' });

  // Extract product information
  const products = await stagehand.extract({
    instruction: 'Extract all laptop products with their details',
    schema: {
      products: [
        {
          name: 'string',
          price: 'number',
          rating: 'number',
          inStock: 'boolean',
          features: ['string'],
        },
      ],
    },
  });

  console.log('\n🛒 Product information:');
  console.log(JSON.stringify(products, null, 2));

  // Filter and sort
  await stagehand.act({ action: "Click the 'Sort by: Price Low to High' option" });

  // Re-extract sorted data
  const sortedProducts = await stagehand.extract({
    instruction: 'Extract the sorted product list',
    schema: {
      products: [
        {
          name: 'string',
          price: 'number',
        },
      ],
    },
  });

  console.log('\n💰 Sorted by price:');
  console.log(JSON.stringify(sortedProducts, null, 2));

  await stagehand.close();
}

async function complexFormInteraction() {
  console.log('\n\n=== Complex Form Interaction Example ===\n');

  const stagehand = createStagehandWithClaude({
    model: 'claude-sonnet-4',
  });

  await stagehand.init();

  await stagehand.page.goto('https://example.com/multi-step-form');

  // Step 1: Personal information
  await stagehand.act({ action: "Fill 'First Name' with 'Jane'" });
  await stagehand.act({ action: "Fill 'Last Name' with 'Smith'" });
  await stagehand.act({ action: "Fill 'Email' with 'jane.smith@example.com'" });
  await stagehand.act({ action: "Click 'Next' button" });

  // Step 2: Address
  await stagehand.act({ action: "Fill 'Street Address' with '123 Main St'" });
  await stagehand.act({ action: "Fill 'City' with 'San Francisco'" });
  await stagehand.act({ action: "Select 'California' from State dropdown" });
  await stagehand.act({ action: "Fill 'ZIP Code' with '94102'" });
  await stagehand.act({ action: "Click 'Next' button" });

  // Step 3: Preferences
  await stagehand.act({ action: "Check the 'Newsletter' checkbox" });
  await stagehand.act({ action: "Select 'Monthly' from frequency dropdown" });
  await stagehand.act({ action: "Click 'Submit' button" });

  // Verify submission
  const confirmation = await stagehand.extract({
    instruction: 'Extract the confirmation message',
    schema: {
      message: 'string',
      confirmationNumber: 'string',
    },
  });

  console.log('\n✅ Form submitted successfully:');
  console.log(JSON.stringify(confirmation, null, 2));

  await stagehand.close();
}

async function main() {
  console.log('='.repeat(60));
  console.log('Stagehand + Claude Code Examples');
  console.log('='.repeat(60));
  console.log('\nNo Anthropic API key needed - uses your Claude subscription!\n');

  try {
    // Run basic example
    await basicExample();

    // Uncomment to run other examples:
    // await researchTask();
    // await eCommerceScraping();
    // await complexFormInteraction();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
