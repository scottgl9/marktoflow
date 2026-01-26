/**
 * Example: Using marktoflow Playwright with Claude Code
 *
 * This example shows how to use marktoflow's Playwright integration with Claude Code
 * for AI-powered browser automation without Anthropic API keys.
 *
 * Requirements:
 *   - Claude subscription (Pro or Enterprise)
 *   - claude CLI installed: https://docs.anthropic.com/claude/docs/claude-code
 *   - @marktoflow/integrations package
 */

import { createAIPlaywrightWithClaude } from '../src/index.js';

async function basicExample() {
  console.log('🚀 Creating AI Playwright client with Claude Code...');

  const { client, llm } = createAIPlaywrightWithClaude({
    model: 'claude-sonnet-4',
    headless: false,
    slowMo: 100,
  });

  await client.launch();
  console.log('✅ Browser launched with Claude AI');

  // Navigate to a page
  await client.navigate({ url: 'https://news.ycombinator.com' });
  console.log('📄 Navigated to Hacker News');

  // Use AI-powered actions
  console.log('\n🤖 Using Claude AI to interact with the page...');

  // Extract data with AI
  const headlines = await client.extract({
    instruction: 'Extract the top 5 headlines with URLs, points, and comment counts',
    schema: {
      headlines: [
        {
          title: 'string',
          url: 'string',
          points: 'number',
          comments: 'number',
        },
      ],
    },
  });

  console.log('\n📊 Extracted headlines:');
  console.log(JSON.stringify(headlines, null, 2));

  // Use LLM directly for deeper analysis
  console.log('\n🧠 Analyzing trends with Claude...');
  const content = await client.content();
  const analysis = await llm.invoke(
    `Based on this page content, what are the trending topics? Summarize in 3 bullet points.\n\n${content.substring(0, 2000)}`,
  );
  console.log('Analysis:', analysis);

  await client.close();
}

async function complexDataExtraction() {
  console.log('\n\n=== Complex Data Extraction Example ===\n');

  const { client } = createAIPlaywrightWithClaude({
    model: 'claude-sonnet-4',
  });

  await client.launch();
  await client.navigate({ url: 'https://github.com/trending' });

  console.log('📊 Extracting trending repositories with Claude...');

  // Claude excels at complex structured extraction
  const repos = await client.extract({
    instruction: `Extract all trending repositories with complete details:
- Repository name and owner
- Description
- Star count (parse number from text)
- Language
- Stars today (parse number from text)
- URL`,
    schema: {
      repositories: [
        {
          fullName: 'string',
          owner: 'string',
          name: 'string',
          description: 'string',
          stars: 'number',
          language: 'string',
          starsToday: 'number',
          url: 'string',
        },
      ],
    },
  });

  console.log(`\n✅ Extracted ${repos.repositories?.length || 0} repositories`);
  console.log(JSON.stringify(repos, null, 2));

  await client.close();
}

async function intelligentNavigation() {
  console.log('\n\n=== Intelligent Navigation Example ===\n');

  const { client, llm } = createAIPlaywrightWithClaude({
    model: 'claude-sonnet-4',
    headless: false,
  });

  await client.launch();
  await client.navigate({ url: 'https://example.com' });

  // Use Claude to understand page structure
  console.log('🧠 Understanding page structure...');
  const pageContent = await client.content();
  const instruction = await llm.invoke(`
Given this page content, provide a JSON list of the most important actions a user might want to take.
Format: { "actions": ["action1", "action2", ...] }

Page content:
${pageContent.substring(0, 1000)}
`);

  console.log('Suggested actions:', instruction);

  // Use AI to observe interactive elements
  console.log('\n🔍 Finding interactive elements...');
  const elements = await client.observe({
    instruction: 'Find all buttons, links, and form inputs',
  });

  console.log(`Found ${elements?.length || 0} interactive elements`);

  await client.close();
}

async function formFillingWithValidation() {
  console.log('\n\n=== Form Filling with Validation Example ===\n');

  const { client } = createAIPlaywrightWithClaude({
    model: 'claude-sonnet-4',
  });

  await client.launch();
  await client.navigate({ url: 'https://example.com/contact' });

  console.log('📝 Filling contact form with AI...');

  // Fill form fields intelligently
  await client.act({
    instruction: 'Fill the contact form with: name="Jane Doe", email="jane@example.com", subject="Product Inquiry", message="I am interested in learning more about your products"',
  });

  // Validate before submission
  await client.act({
    instruction: 'Check if all required fields are filled correctly',
  });

  // Take screenshot for verification
  await client.screenshot({
    path: './form-filled.png',
  });

  console.log('✅ Form filled and validated');
  await client.close();
}

async function sessionPersistence() {
  console.log('\n\n=== Session Persistence Example ===\n');

  // Session 1: Login
  console.log('🔐 Session 1: Logging in with AI...');

  const { client: client1 } = createAIPlaywrightWithClaude({
    model: 'claude-sonnet-4',
    sessionId: 'claude-session',
    autoSaveSession: true,
  });

  await client1.launch();
  await client1.navigate({ url: 'https://example.com/login' });

  // AI-powered intelligent login
  await client1.act({
    instruction: 'Find and fill the login form with username "demo@example.com" and password "password123", then submit',
  });

  console.log('✅ Logged in and session saved');
  await client1.close();

  // Session 2: Restore
  console.log('\n🔄 Session 2: Restoring session...');

  const { client: client2 } = createAIPlaywrightWithClaude({
    model: 'claude-sonnet-4',
    sessionId: 'claude-session',
  });

  await client2.launch();
  await client2.navigate({ url: 'https://example.com/dashboard' });

  // Verify we're logged in
  const isLoggedIn = await client2.extract({
    instruction: 'Check if user is logged in by looking for user profile or logout button',
    schema: {
      loggedIn: 'boolean',
      username: 'string',
    },
  });

  console.log('Login status:', isLoggedIn);
  await client2.close();
}

async function main() {
  console.log('='.repeat(60));
  console.log('Playwright + Claude Code Examples');
  console.log('='.repeat(60));
  console.log('\nNo Anthropic API key needed - uses your Claude subscription!\n');

  try {
    // Run basic example
    await basicExample();

    // Uncomment to run other examples:
    // await complexDataExtraction();
    // await intelligentNavigation();
    // await formFillingWithValidation();
    // await sessionPersistence();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
