/**
 * Playwright Adapter for LangChain.js
 *
 * Provides LangChain-compatible wrapper around marktoflow's Playwright integration.
 * Enables using GitHub Copilot or Claude Code for AI-powered browser automation.
 *
 * @example
 * ```typescript
 * import { createAIPlaywrightClient } from '@marktoflow/langchain-adapters';
 *
 * const client = createAIPlaywrightClient({
 *   aiBackend: 'copilot',
 *   model: 'gpt-4.1',
 *   headless: false,
 * });
 *
 * await client.launch();
 * await client.navigate({ url: 'https://example.com' });
 *
 * // AI-powered actions
 * await client.act({ instruction: 'Click the login button' });
 * const data = await client.extract({
 *   instruction: 'Extract all product names',
 *   schema: { products: [{ name: 'string', price: 'number' }] },
 * });
 *
 * await client.close();
 * ```
 */

import { GitHubCopilotLLM, type GitHubCopilotLLMParams } from './copilot-llm.js';
import { ClaudeCodeLLM, type ClaudeCodeLLMParams } from './claude-code-llm.js';

/**
 * AI-powered Playwright client configuration
 */
export interface AIPlaywrightConfig {
  /** AI backend to use */
  aiBackend: 'copilot' | 'claude-code';

  /** Model to use */
  model?: string;

  /** Browser type */
  browserType?: 'chromium' | 'firefox' | 'webkit';

  /** Run in headless mode */
  headless?: boolean;

  /** Slow down operations */
  slowMo?: number;

  /** Default timeout */
  timeout?: number;

  /** Enable verbose logging */
  verbose?: boolean;

  /** Session management */
  sessionId?: string;
  sessionsDir?: string;
  autoSaveSession?: boolean;
}

/**
 * Create AI-powered Playwright client with GitHub Copilot
 *
 * @param config - Configuration options
 * @returns Object with Playwright client and LLM instance
 *
 * @example
 * ```typescript
 * const { client, llm } = createAIPlaywrightWithCopilot({
 *   model: 'gpt-4.1',
 *   headless: false,
 * });
 *
 * await client.launch();
 * await client.navigate({ url: 'https://example.com' });
 *
 * // Use AI-powered actions
 * await client.act({ instruction: 'Fill out the contact form' });
 *
 * // Or use LLM directly
 * const analysis = await llm.invoke('Analyze the page structure');
 * ```
 */
export function createAIPlaywrightWithCopilot(
  config: Omit<AIPlaywrightConfig, 'aiBackend'> & GitHubCopilotLLMParams = {},
) {
  const llm = new GitHubCopilotLLM({
    model: config.model,
    timeout: config.timeout,
    verbose: config.verbose,
  });

  // Import Playwright integration from marktoflow
  let PlaywrightClient: any;
  let GitHubCopilotClient: any;

  try {
    const integration = require('@marktoflow/integrations');
    PlaywrightClient = integration.PlaywrightClient;
    GitHubCopilotClient = integration.GitHubCopilotClient;
  } catch (error) {
    throw new Error(
      '@marktoflow/integrations not found. Make sure the package is installed.',
    );
  }

  // Create Copilot client
  const copilotClient = new GitHubCopilotClient({
    model: config.model || 'gpt-4.1',
  });

  // Create Playwright client with Copilot backend
  const client = new PlaywrightClient({
    browserType: config.browserType,
    headless: config.headless,
    slowMo: config.slowMo,
    timeout: config.timeout,
    enableAI: true,
    aiBackend: 'copilot',
    aiClient: copilotClient,
    sessionId: config.sessionId,
    sessionsDir: config.sessionsDir,
    autoSaveSession: config.autoSaveSession,
  });

  return {
    client,
    llm,
    copilotClient,
  };
}

/**
 * Create AI-powered Playwright client with Claude Code
 *
 * @param config - Configuration options
 * @returns Object with Playwright client and LLM instance
 *
 * @example
 * ```typescript
 * const { client, llm } = createAIPlaywrightWithClaude({
 *   model: 'claude-sonnet-4',
 *   headless: false,
 * });
 *
 * await client.launch();
 * await client.navigate({ url: 'https://example.com' });
 *
 * // Use AI-powered actions
 * await client.observe({ instruction: 'Find all clickable buttons' });
 *
 * // Or use LLM directly
 * const summary = await llm.invoke('Summarize the main content');
 * ```
 */
export function createAIPlaywrightWithClaude(
  config: Omit<AIPlaywrightConfig, 'aiBackend'> & ClaudeCodeLLMParams = {},
) {
  const llm = new ClaudeCodeLLM({
    model: config.model,
    timeout: config.timeout,
    verbose: config.verbose,
  });

  // Import Playwright integration from marktoflow
  let PlaywrightClient: any;
  let ClaudeCodeClient: any;

  try {
    const integration = require('@marktoflow/integrations');
    PlaywrightClient = integration.PlaywrightClient;
    ClaudeCodeClient = integration.ClaudeCodeClient;
  } catch (error) {
    throw new Error(
      '@marktoflow/integrations not found. Make sure the package is installed.',
    );
  }

  // Create Claude client
  const claudeClient = new ClaudeCodeClient({
    model: config.model || 'claude-sonnet-4',
  });

  // Create Playwright client with Claude backend
  const client = new PlaywrightClient({
    browserType: config.browserType,
    headless: config.headless,
    slowMo: config.slowMo,
    timeout: config.timeout,
    enableAI: true,
    aiBackend: 'claude-code',
    aiClient: claudeClient,
    sessionId: config.sessionId,
    sessionsDir: config.sessionsDir,
    autoSaveSession: config.autoSaveSession,
  });

  return {
    client,
    llm,
    claudeClient,
  };
}

/**
 * Create AI-powered Playwright client (auto-detect backend)
 *
 * @param config - Configuration options
 * @returns Object with Playwright client and LLM instance
 *
 * @example
 * ```typescript
 * const { client, llm } = createAIPlaywrightClient({
 *   aiBackend: 'copilot',
 *   model: 'gpt-4.1',
 * });
 *
 * await client.launch();
 * await client.navigate({ url: 'https://example.com' });
 * await client.act({ instruction: 'Search for "playwright"' });
 * ```
 */
export function createAIPlaywrightClient(config: AIPlaywrightConfig) {
  if (config.aiBackend === 'copilot') {
    return createAIPlaywrightWithCopilot(config);
  } else if (config.aiBackend === 'claude-code') {
    return createAIPlaywrightWithClaude(config);
  } else {
    throw new Error(`Unsupported AI backend: ${config.aiBackend}`);
  }
}
