/**
 * @marktoflow/langchain-adapters
 *
 * LangChain adapters for GitHub Copilot and Claude Code with Stagehand and Playwright integration.
 * Use your existing AI subscriptions without separate API keys.
 *
 * @packageDocumentation
 */

// LangChain LLM wrappers
export {
  GitHubCopilotLLM,
  type GitHubCopilotLLMParams,
} from './copilot-llm.js';

export {
  ClaudeCodeLLM,
  type ClaudeCodeLLMParams,
} from './claude-code-llm.js';

// Stagehand adapters
export {
  CopilotStagehandProvider,
  ClaudeStagehandProvider,
  createStagehandWithCopilot,
  createStagehandWithClaude,
  type StagehandModelProvider,
} from './stagehand-adapter.js';

// Playwright adapters
export {
  createAIPlaywrightClient,
  createAIPlaywrightWithCopilot,
  createAIPlaywrightWithClaude,
  type AIPlaywrightConfig,
} from './playwright-adapter.js';
