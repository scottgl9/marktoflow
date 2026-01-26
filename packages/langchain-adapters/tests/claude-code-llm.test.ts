/**
 * Tests for ClaudeCodeLLM
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ClaudeCodeLLM } from '../src/claude-code-llm.js';

describe('ClaudeCodeLLM', () => {
  let llm: ClaudeCodeLLM;

  beforeEach(() => {
    llm = new ClaudeCodeLLM({
      model: 'claude-sonnet-4',
      timeout: 5000,
    });
  });

  it('should create an instance with default parameters', () => {
    const defaultLlm = new ClaudeCodeLLM();

    expect(defaultLlm).toBeInstanceOf(ClaudeCodeLLM);
    expect(defaultLlm.model).toBe('claude-sonnet-4');
    expect(defaultLlm.cliPath).toBe('claude');
    expect(defaultLlm.timeout).toBe(120000);
  });

  it('should create an instance with custom parameters', () => {
    expect(llm.model).toBe('claude-sonnet-4');
    expect(llm.timeout).toBe(5000);
  });

  it('should return correct _llmType', () => {
    expect(llm._llmType()).toBe('claude-code-cli');
  });

  it('should have checkInstallation method', () => {
    expect(typeof llm.checkInstallation).toBe('function');
  });

  it('should have checkAuth method', () => {
    expect(typeof llm.checkAuth).toBe('function');
  });

  it('should support custom working directory', () => {
    const llmWithCwd = new ClaudeCodeLLM({
      cwd: '/custom/path',
    });

    expect(llmWithCwd.cwd).toBe('/custom/path');
  });

  // Note: Actual CLI calls are skipped in tests since they require
  // the claude CLI to be installed and authenticated
});
