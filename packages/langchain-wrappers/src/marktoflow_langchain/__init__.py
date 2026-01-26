"""
marktoflow LangChain Wrappers

LangChain LLM wrappers for GitHub Copilot CLI and Claude Code CLI.
Use your existing subscriptions without separate API keys.
"""

from .copilot_llm import GitHubCopilotLLM
from .claude_code_llm import ClaudeCodeLLM
from .stagehand_adapter import (
    CopilotStagehandProvider,
    ClaudeStagehandProvider,
    create_stagehand_with_copilot,
    create_stagehand_with_claude,
)

__version__ = "0.1.0"

__all__ = [
    "GitHubCopilotLLM",
    "ClaudeCodeLLM",
    "CopilotStagehandProvider",
    "ClaudeStagehandProvider",
    "create_stagehand_with_copilot",
    "create_stagehand_with_claude",
]
