/**
 * Stagehand Adapters for GitHub Copilot and Claude Code
 *
 * Allows using GitHub Copilot or Claude Code with Stagehand browser automation
 * without requiring OpenAI/Anthropic API keys.
 *
 * @example
 * ```typescript
 * import { createStagehandWithCopilot } from '@marktoflow/langchain-adapters';
 *
 * const stagehand = createStagehandWithCopilot({
 *   model: 'gpt-4.1',
 *   env: 'LOCAL',
 * });
 *
 * await stagehand.init();
 * await stagehand.page.goto('https://example.com');
 *
 * const result = await stagehand.extract({
 *   instruction: 'Extract all headlines',
 *   schema: {
 *     headlines: [{ title: 'string', url: 'string' }],
 *   },
 * });
 * ```
 */

import type { Stagehand } from '@browserbasehq/stagehand';
import { GitHubCopilotLLM, type GitHubCopilotLLMParams } from './copilot-llm.js';
import { ClaudeCodeLLM, type ClaudeCodeLLMParams } from './claude-code-llm.js';

/**
 * Stagehand configuration options
 */
export interface StagehandConfig {
  env?: 'LOCAL' | 'BROWSERBASE';
  modelName?: string;
  modelClient?: unknown;
  [key: string]: unknown;
}

/**
 * Message format for chat completions
 */
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Model provider interface for Stagehand
 */
export interface StagehandModelProvider {
  /**
   * Generate text from a prompt
   */
  generate(prompt: string, options?: Record<string, unknown>): Promise<string>;

  /**
   * Chat completion with message history
   */
  chat(messages: ChatMessage[], options?: Record<string, unknown>): Promise<{
    choices: Array<{
      message: {
        role: string;
        content: string;
      };
    }>;
  }>;
}

/**
 * Stagehand provider using GitHub Copilot CLI
 *
 * @example
 * ```typescript
 * const provider = new CopilotStagehandProvider({ model: 'gpt-4.1' });
 * const stagehand = new Stagehand({
 *   env: 'LOCAL',
 *   modelName: 'custom',
 *   modelClient: provider,
 * });
 * ```
 */
export class CopilotStagehandProvider implements StagehandModelProvider {
  private llm: GitHubCopilotLLM;

  constructor(params: GitHubCopilotLLMParams = {}) {
    this.llm = new GitHubCopilotLLM(params);
  }

  async generate(prompt: string, _options?: Record<string, unknown>): Promise<string> {
    return this.llm.invoke(prompt);
  }

  async chat(
    messages: ChatMessage[],
    _options?: Record<string, unknown>,
  ): Promise<{
    choices: Array<{
      message: {
        role: string;
        content: string;
      };
    }>;
  }> {
    // Convert messages to a single prompt
    const prompt = messages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const response = await this.generate(prompt, _options);

    return {
      choices: [
        {
          message: {
            role: 'assistant',
            content: response,
          },
        },
      ],
    };
  }
}

/**
 * Stagehand provider using Claude Code CLI
 *
 * @example
 * ```typescript
 * const provider = new ClaudeStagehandProvider({ model: 'claude-sonnet-4' });
 * const stagehand = new Stagehand({
 *   env: 'LOCAL',
 *   modelName: 'custom',
 *   modelClient: provider,
 * });
 * ```
 */
export class ClaudeStagehandProvider implements StagehandModelProvider {
  private llm: ClaudeCodeLLM;

  constructor(params: ClaudeCodeLLMParams = {}) {
    this.llm = new ClaudeCodeLLM(params);
  }

  async generate(prompt: string, _options?: Record<string, unknown>): Promise<string> {
    return this.llm.invoke(prompt);
  }

  async chat(
    messages: ChatMessage[],
    _options?: Record<string, unknown>,
  ): Promise<{
    choices: Array<{
      message: {
        role: string;
        content: string;
      };
    }>;
  }> {
    // Convert messages to a single prompt
    const prompt = messages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const response = await this.generate(prompt, _options);

    return {
      choices: [
        {
          message: {
            role: 'assistant',
            content: response,
          },
        },
      ],
    };
  }
}

/**
 * Helper function to create Stagehand instance with GitHub Copilot
 *
 * @param params - Copilot LLM parameters
 * @param stagehandConfig - Stagehand configuration (optional)
 * @returns Stagehand instance configured with Copilot
 *
 * @example
 * ```typescript
 * const stagehand = createStagehandWithCopilot({
 *   model: 'gpt-4.1',
 *   env: 'LOCAL',
 * });
 *
 * await stagehand.init();
 * await stagehand.page.goto('https://news.ycombinator.com');
 *
 * const headlines = await stagehand.extract({
 *   instruction: 'Extract top 5 headlines',
 *   schema: {
 *     headlines: [{ title: 'string', url: 'string' }],
 *   },
 * });
 * ```
 */
export function createStagehandWithCopilot(
  params: GitHubCopilotLLMParams & Partial<StagehandConfig> = {},
): Stagehand {
  let Stagehand: typeof import('@browserbasehq/stagehand').Stagehand;

  try {
    Stagehand = require('@browserbasehq/stagehand').Stagehand;
  } catch (error) {
    throw new Error(
      'Stagehand not installed. Install with: pnpm add @browserbasehq/stagehand',
    );
  }

  const { model, cliPath, timeout, verbose, ...stagehandConfig } = params;

  const provider = new CopilotStagehandProvider({
    model,
    cliPath,
    timeout,
    verbose,
  });

  return new Stagehand({
    env: 'LOCAL',
    ...stagehandConfig,
    modelName: 'custom',
    modelClient: provider,
  } as any);
}

/**
 * Helper function to create Stagehand instance with Claude Code
 *
 * @param params - Claude LLM parameters
 * @param stagehandConfig - Stagehand configuration (optional)
 * @returns Stagehand instance configured with Claude
 *
 * @example
 * ```typescript
 * const stagehand = createStagehandWithClaude({
 *   model: 'claude-sonnet-4',
 *   env: 'LOCAL',
 * });
 *
 * await stagehand.init();
 * await stagehand.page.goto('https://example.com');
 *
 * const data = await stagehand.extract({
 *   instruction: 'Extract all product info',
 *   schema: {
 *     products: [{ name: 'string', price: 'number' }],
 *   },
 * });
 * ```
 */
export function createStagehandWithClaude(
  params: ClaudeCodeLLMParams & Partial<StagehandConfig> = {},
): Stagehand {
  let Stagehand: typeof import('@browserbasehq/stagehand').Stagehand;

  try {
    Stagehand = require('@browserbasehq/stagehand').Stagehand;
  } catch (error) {
    throw new Error(
      'Stagehand not installed. Install with: pnpm add @browserbasehq/stagehand',
    );
  }

  const { model, cliPath, timeout, cwd, verbose, ...stagehandConfig } = params;

  const provider = new ClaudeStagehandProvider({
    model,
    cliPath,
    timeout,
    cwd,
    verbose,
  });

  return new Stagehand({
    env: 'LOCAL',
    ...stagehandConfig,
    modelName: 'custom',
    modelClient: provider,
  } as any);
}
