/**
 * Example: Using Stagehand with GitHub Copilot
 *
 * This example shows how to use Stagehand with GitHub Copilot
 * to perform AI-powered browser automation without OpenAI API keys.
 *
 * Requirements:
 *   - GitHub Copilot subscription
 *   - copilot CLI installed: npm install -g @github/copilot-cli
 *   - Stagehand: pnpm add @browserbasehq/stagehand
 *   - Playwright: pnpm add playwright && npx playwright install
 */

import { createStagehandWithCopilot } from '../src/index.js';

async function basicExample() {
  console.log('🚀 Creating Stagehand with GitHub Copilot...');

  // Create Stagehand instance using Copilot (no OpenAI API key needed!)
  const stagehand = createStagehandWithCopilot({
    model: 'gpt-4.1',
    env: 'LOCAL',
  });

  await stagehand.init();
  console.log('✅ Stagehand initialized with GitHub Copilot');

  // Navigate to a page
  await stagehand.page.goto('https://news.ycombinator.com');
  console.log('📄 Navigated to Hacker News');

  // Use AI to extract headlines
  console.log('\n🤖 Using Copilot AI to extract headlines...');
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

async function multiPageNavigation() {
  console.log('\n\n=== Multi-Page Navigation Example ===\n');

  const stagehand = createStagehandWithCopilot({
    model: 'gpt-4.1',
    env: 'LOCAL',
  });

  await stagehand.init();

  const pages = [
    'https://github.com/trending',
    'https://github.com/trending?spoken_language_code=typescript',
  ];

  const results = [];

  for (const pageUrl of pages) {
    console.log(`\n📄 Processing: ${pageUrl}`);
    await stagehand.page.goto(pageUrl);

    const data = await stagehand.extract({
      instruction: 'Extract the top 3 trending repositories',
      schema: {
        repositories: [
          {
            name: 'string',
            description: 'string',
            stars: 'string',
            language: 'string',
          },
        ],
      },
    });

    results.push(data);
  }

  console.log('\n🎯 All results collected:');
  results.forEach((result, i) => {
    console.log(`\nPage ${i + 1}:`);
    console.log(JSON.stringify(result, null, 2));
  });

  await stagehand.close();
}

async function formFilling() {
  console.log('\n\n=== Form Filling Example ===\n');

  const stagehand = createStagehandWithCopilot({
    model: 'gpt-4.1',
  });

  await stagehand.init();

  await stagehand.page.goto('https://example.com/contact');

  // Use AI to understand and fill the form
  await stagehand.act({ action: "Fill the name field with 'John Doe'" });
  await stagehand.act({ action: "Fill the email field with 'john@example.com'" });
  await stagehand.act({ action: "Select 'Technical Support' from the dropdown" });
  await stagehand.act({ action: "Type 'I need help with my account' in the message box" });
  await stagehand.act({ action: 'Click the Submit button' });

  console.log('✅ Form submitted successfully');

  await stagehand.close();
}

async function main() {
  console.log('=' .repeat(60));
  console.log('Stagehand + GitHub Copilot Examples');
  console.log('=' .repeat(60));
  console.log('\nNo OpenAI API key needed - uses your GitHub Copilot subscription!\n');

  try {
    // Run basic example
    await basicExample();

    // Uncomment to run other examples:
    // await multiPageNavigation();
    // await formFilling();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
