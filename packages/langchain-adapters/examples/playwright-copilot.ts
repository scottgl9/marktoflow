/**
 * Example: Using marktoflow Playwright with GitHub Copilot
 *
 * This example shows how to use marktoflow's Playwright integration with GitHub Copilot
 * for AI-powered browser automation without OpenAI API keys.
 *
 * Requirements:
 *   - GitHub Copilot subscription
 *   - copilot CLI installed: npm install -g @github/copilot-cli
 *   - @marktoflow/integrations package
 */

import { createAIPlaywrightWithCopilot } from '../src/index.js';

async function basicExample() {
  console.log('🚀 Creating AI Playwright client with GitHub Copilot...');

  const { client, llm } = createAIPlaywrightWithCopilot({
    model: 'gpt-4.1',
    headless: false,
    slowMo: 100,
  });

  await client.launch();
  console.log('✅ Browser launched with Copilot AI');

  // Navigate to a page
  await client.navigate({ url: 'https://news.ycombinator.com' });
  console.log('📄 Navigated to Hacker News');

  // Use AI-powered actions
  console.log('\n🤖 Using AI to interact with the page...');

  // Extract data with AI
  const headlines = await client.extract({
    instruction: 'Extract the top 5 headlines with URLs and points',
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

  console.log('\n📊 Extracted headlines:');
  console.log(JSON.stringify(headlines, null, 2));

  // Use LLM directly for analysis
  console.log('\n🧠 Analyzing page with LLM...');
  const pageTitle = await client.title();
  const analysis = await llm.invoke(`Analyze this page title: "${pageTitle}"`);
  console.log('Analysis:', analysis);

  await client.close();
}

async function sessionPersistence() {
  console.log('\n\n=== Session Persistence Example ===\n');

  // First session - login and save
  console.log('🔐 First session - logging in...');

  const { client: client1 } = createAIPlaywrightWithCopilot({
    model: 'gpt-4.1',
    sessionId: 'my-session',
    autoSaveSession: true,
  });

  await client1.launch();
  await client1.navigate({ url: 'https://example.com/login' });

  // AI-powered login
  await client1.act({ instruction: "Fill username with 'demo@example.com'" });
  await client1.act({ instruction: "Fill password with 'password123'" });
  await client1.act({ instruction: 'Click the login button' });

  console.log('✅ Logged in and session saved');
  await client1.close();

  // Second session - restore saved session
  console.log('\n🔄 Second session - restoring saved session...');

  const { client: client2 } = createAIPlaywrightWithCopilot({
    model: 'gpt-4.1',
    sessionId: 'my-session', // Same session ID
  });

  await client2.launch();
  await client2.navigate({ url: 'https://example.com/dashboard' });

  console.log('✅ Session restored - already logged in!');
  await client2.close();
}

async function multiStepAutomation() {
  console.log('\n\n=== Multi-Step Automation Example ===\n');

  const { client } = createAIPlaywrightWithCopilot({
    model: 'gpt-4.1',
    headless: false,
  });

  await client.launch();

  // Step 1: Search on Google
  console.log('🔍 Step 1: Searching on Google...');
  await client.navigate({ url: 'https://www.google.com' });
  await client.act({ instruction: 'Search for "TypeScript tutorials"' });
  await client.waitForLoadState({ state: 'networkidle' });

  // Step 2: Extract search results
  console.log('📊 Step 2: Extracting search results...');
  const results = await client.extract({
    instruction: 'Extract the top 5 search results',
    schema: {
      results: [
        {
          title: 'string',
          url: 'string',
          description: 'string',
        },
      ],
    },
  });

  console.log('Results:');
  console.log(JSON.stringify(results, null, 2));

  // Step 3: Click first result
  console.log('🖱️  Step 3: Clicking first result...');
  await client.act({ instruction: 'Click on the first search result' });

  // Step 4: Take screenshot
  console.log('📸 Step 4: Taking screenshot...');
  await client.screenshot({
    path: './tutorial-page.png',
    fullPage: true,
  });

  console.log('✅ Multi-step automation complete!');
  await client.close();
}

async function observeElements() {
  console.log('\n\n=== Observe Elements Example ===\n');

  const { client } = createAIPlaywrightWithCopilot({
    model: 'gpt-4.1',
  });

  await client.launch();
  await client.navigate({ url: 'https://github.com' });

  // Observe available actions on the page
  console.log('🔍 Observing page elements...');
  const observations = await client.observe({
    instruction: 'Find all interactive elements',
  });

  console.log('\n📋 Available actions on the page:');
  observations?.forEach((obs: any) => {
    console.log(`  - ${obs.description || 'Unknown'}`);
  });

  await client.close();
}

async function main() {
  console.log('='.repeat(60));
  console.log('Playwright + GitHub Copilot Examples');
  console.log('='.repeat(60));
  console.log('\nNo OpenAI API key needed - uses your GitHub Copilot subscription!\n');

  try {
    // Run basic example
    await basicExample();

    // Uncomment to run other examples:
    // await sessionPersistence();
    // await multiStepAutomation();
    // await observeElements();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
