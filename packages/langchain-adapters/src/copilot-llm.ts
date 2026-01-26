/**
 * LangChain LLM wrapper for GitHub Copilot CLI
 *
 * Allows using GitHub Copilot subscription with LangChain.js
 * without requiring separate OpenAI API keys.
 *
 * @example
 * ```typescript
 * import { GitHubCopilotLLM } from '@marktoflow/langchain-adapters';
 *
 * const llm = new GitHubCopilotLLM({
 *   model: 'gpt-4.1',
 *   timeout: 120000,
 * });
 *
 * const response = await llm.invoke('What is the capital of France?');
 * console.log(response);
 * ```
 */

import { BaseLLM, type BaseLLMParams } from '@langchain/core/language_models/llms';
import { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager';
import type { LLMResult } from '@langchain/core/outputs';
import { spawn } from 'child_process';

export interface GitHubCopilotLLMParams extends BaseLLMParams {
  /**
   * Model to use (e.g., 'gpt-4.1', 'gpt-4o', 'gpt-4o-mini')
   * @default 'gpt-4.1'
   */
  model?: string;

  /**
   * Path to the copilot CLI executable
   * @default 'copilot'
   */
  cliPath?: string;

  /**
   * Timeout in milliseconds
   * @default 120000 (2 minutes)
   */
  timeout?: number;

  /**
   * Enable verbose logging
   * @default false
   */
  verbose?: boolean;
}

/**
 * LangChain LLM wrapper for GitHub Copilot CLI
 *
 * Uses your GitHub Copilot subscription instead of requiring OpenAI API keys.
 *
 * Requirements:
 * - GitHub Copilot subscription (~$10/month)
 * - Copilot CLI installed: npm install -g @github/copilot-cli
 * - Authenticated: copilot auth
 */
export class GitHubCopilotLLM extends BaseLLM {
  model: string;
  cliPath: string;
  timeout: number;
  verboseOutput: boolean;

  constructor(params: GitHubCopilotLLMParams = {}) {
    super(params);
    this.model = params.model ?? 'gpt-4.1';
    this.cliPath = params.cliPath ?? 'copilot';
    this.timeout = params.timeout ?? 120000;
    this.verboseOutput = params.verbose ?? false;
  }

  _llmType(): string {
    return 'github-copilot-cli';
  }

  /**
   * Call the GitHub Copilot CLI
   */
  async _call(
    prompt: string,
    _options?: this['ParsedCallOptions'],
    _runManager?: CallbackManagerForLLMRun,
  ): Promise<string> {
    const args = ['-p', prompt];

    if (this.model) {
      args.push('--model', this.model);
    }

    if (this.verboseOutput) {
      console.log(`[GitHubCopilotLLM] Calling CLI: ${this.cliPath} ${args.join(' ')}`);
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        process.kill();
        reject(new Error(`GitHub Copilot CLI timed out after ${this.timeout}ms`));
      }, this.timeout);

      const process = spawn(this.cliPath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to spawn GitHub Copilot CLI: ${error.message}`));
      });

      process.on('close', (code) => {
        clearTimeout(timeoutId);

        if (code !== 0) {
          reject(new Error(
            `GitHub Copilot CLI failed with code ${code}:\n${stderr || 'No error output'}`
          ));
          return;
        }

        const output = stdout.trim();

        if (this.verboseOutput) {
          console.log(`[GitHubCopilotLLM] Response: ${output.substring(0, 100)}...`);
        }

        resolve(output);
      });
    });
  }

  /**
   * Generate method for LangChain compatibility
   */
  async _generate(
    prompts: string[],
    _options?: this['ParsedCallOptions'],
    _runManager?: CallbackManagerForLLMRun,
  ): Promise<LLMResult> {
    const generations = await Promise.all(
      prompts.map(async (prompt) => {
        const text = await this._call(prompt, _options, _runManager);
        return [{ text }];
      })
    );

    return { generations };
  }

  /**
   * Check if Copilot CLI is installed
   */
  async checkInstallation(): Promise<boolean> {
    try {
      await new Promise<void>((resolve, reject) => {
        const process = spawn(this.cliPath, ['--version'], {
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        process.on('error', reject);
        process.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`CLI exited with code ${code}`));
          }
        });
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if Copilot CLI is authenticated
   */
  async checkAuth(): Promise<boolean> {
    try {
      const response = await this._call('test');
      return response.length > 0;
    } catch (error) {
      return false;
    }
  }
}
