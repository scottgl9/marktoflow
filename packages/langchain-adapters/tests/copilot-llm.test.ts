/**
 * Tests for GitHubCopilotLLM
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubCopilotLLM } from '../src/copilot-llm.js';

describe('GitHubCopilotLLM', () => {
  let llm: GitHubCopilotLLM;

  beforeEach(() => {
    llm = new GitHubCopilotLLM({
      model: 'gpt-4.1',
      timeout: 5000,
    });
  });

  it('should create an instance with default parameters', () => {
    const defaultLlm = new GitHubCopilotLLM();

    expect(defaultLlm).toBeInstanceOf(GitHubCopilotLLM);
    expect(defaultLlm.model).toBe('gpt-4.1');
    expect(defaultLlm.cliPath).toBe('copilot');
    expect(defaultLlm.timeout).toBe(120000);
  });

  it('should create an instance with custom parameters', () => {
    expect(llm.model).toBe('gpt-4.1');
    expect(llm.timeout).toBe(5000);
  });

  it('should return correct _llmType', () => {
    expect(llm._llmType()).toBe('github-copilot-cli');
  });

  it('should have checkInstallation method', () => {
    expect(typeof llm.checkInstallation).toBe('function');
  });

  it('should have checkAuth method', () => {
    expect(typeof llm.checkAuth).toBe('function');
  });

  // Note: Actual CLI calls are skipped in tests since they require
  // the copilot CLI to be installed and authenticated
});
