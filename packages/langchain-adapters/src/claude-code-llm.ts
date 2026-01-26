/**
 * LangChain LLM wrapper for Claude Code CLI
 *
 * Allows using Claude subscription with LangChain.js
 * without requiring separate Anthropic API keys.
 *
 * @example
 * ```typescript
 * import { ClaudeCodeLLM } from '@marktoflow/langchain-adapters';
 *
 * const llm = new ClaudeCodeLLM({
 *   model: 'claude-sonnet-4',
 *   timeout: 120000,
 * });
 *
 * const response = await llm.invoke('Explain quantum computing');
 * console.log(response);
 * ```
 */

import { BaseLLM, type BaseLLMParams } from '@langchain/core/language_models/llms';
import { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager';
import type { LLMResult } from '@langchain/core/outputs';
import { spawn } from 'child_process';

export interface ClaudeCodeLLMParams extends BaseLLMParams {
  /**
   * Model to use (e.g., 'claude-sonnet-4', 'claude-opus-4')
   * @default 'claude-sonnet-4'
   */
  model?: string;

  /**
   * Path to the claude CLI executable
   * @default 'claude'
   */
  cliPath?: string;

  /**
   * Timeout in milliseconds
   * @default 120000 (2 minutes)
   */
  timeout?: number;

  /**
   * Working directory for CLI execution
   */
  cwd?: string;

  /**
   * Enable verbose logging
   * @default false
   */
  verbose?: boolean;
}

/**
 * LangChain LLM wrapper for Claude Code CLI
 *
 * Uses your Claude subscription instead of requiring Anthropic API keys.
 *
 * Requirements:
 * - Claude subscription (Pro or Enterprise)
 * - Claude CLI installed: https://docs.anthropic.com/claude/docs/claude-code
 * - Authenticated following setup instructions
 */
export class ClaudeCodeLLM extends BaseLLM {
  model: string;
  cliPath: string;
  timeout: number;
  cwd?: string;
  verboseOutput: boolean;

  constructor(params: ClaudeCodeLLMParams = {}) {
    super(params);
    this.model = params.model ?? 'claude-sonnet-4';
    this.cliPath = params.cliPath ?? 'claude';
    this.timeout = params.timeout ?? 120000;
    this.cwd = params.cwd;
    this.verboseOutput = params.verbose ?? false;
  }

  _llmType(): string {
    return 'claude-code-cli';
  }

  /**
   * Call the Claude Code CLI
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
      console.log(`[ClaudeCodeLLM] Calling CLI: ${this.cliPath} ${args.join(' ')}`);
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        process.kill();
        reject(new Error(`Claude Code CLI timed out after ${this.timeout}ms`));
      }, this.timeout);

      const process = spawn(this.cliPath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: this.cwd,
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
        reject(new Error(`Failed to spawn Claude Code CLI: ${error.message}`));
      });

      process.on('close', (code) => {
        clearTimeout(timeoutId);

        if (code !== 0) {
          reject(new Error(
            `Claude Code CLI failed with code ${code}:\n${stderr || 'No error output'}`
          ));
          return;
        }

        const output = stdout.trim();

        if (this.verboseOutput) {
          console.log(`[ClaudeCodeLLM] Response: ${output.substring(0, 100)}...`);
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
   * Check if Claude CLI is installed
   */
  async checkInstallation(): Promise<boolean> {
    try {
      await new Promise<void>((resolve, reject) => {
        const process = spawn(this.cliPath, ['--version'], {
          stdio: ['pipe', 'pipe', 'pipe'],
          cwd: this.cwd,
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
   * Check if Claude CLI is authenticated
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
