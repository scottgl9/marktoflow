"""
Stagehand Adapter for GitHub Copilot and Claude Code

Allows using GitHub Copilot or Claude Code SDKs with Stagehand browser automation
without separate API keys.
"""

from typing import Optional, Dict, Any, Literal
import asyncio


class CopilotStagehandProvider:
    """
    Stagehand model provider using GitHub Copilot SDK.

    Use your GitHub Copilot subscription with Stagehand - no OpenAI/Anthropic API keys needed.

    Example:
        ```python
        from stagehand import Stagehand
        from marktoflow_langchain.stagehand_adapter import CopilotStagehandProvider

        # Create custom provider
        provider = CopilotStagehandProvider(model="gpt-4.1")

        # Use with Stagehand
        stagehand = Stagehand(
            env="LOCAL",
            model_name="custom",
            model_client=provider  # Use Copilot instead of OpenAI
        )

        await stagehand.init()
        await stagehand.page.goto("https://example.com")

        # Use AI-powered actions
        result = await stagehand.act("click the login button")
        ```

    Requirements:
        - GitHub Copilot SDK installed: npm install @github/copilot-sdk
        - Or use CLI: npm install -g @github/copilot-cli
    """

    def __init__(
        self,
        model: str = "gpt-4.1",
        use_cli: bool = True,
        cli_path: str = "copilot",
        timeout: int = 120
    ):
        """
        Initialize Copilot provider for Stagehand.

        Args:
            model: Model to use (gpt-4.1, gpt-4o, etc.)
            use_cli: Use CLI instead of SDK (simpler, no Node.js required)
            cli_path: Path to copilot CLI
            timeout: Timeout in seconds
        """
        self.model = model
        self.use_cli = use_cli
        self.cli_path = cli_path
        self.timeout = timeout

        if use_cli:
            from .copilot_llm import GitHubCopilotLLM
            self.llm = GitHubCopilotLLM(
                model=model,
                cli_path=cli_path,
                timeout=timeout
            )
        else:
            # SDK-based implementation (requires Node.js)
            raise NotImplementedError(
                "SDK-based implementation coming soon. Use use_cli=True for now."
            )

    async def generate(self, prompt: str, **kwargs) -> str:
        """
        Generate text using GitHub Copilot.

        Args:
            prompt: Input prompt
            **kwargs: Additional arguments

        Returns:
            Generated text
        """
        if self.use_cli:
            # Run CLI in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(
                None,
                self.llm._call,
                prompt
            )
        else:
            raise NotImplementedError("SDK-based implementation coming soon")

    async def chat(self, messages: list, **kwargs) -> Dict[str, Any]:
        """
        Chat completion (for compatibility).

        Args:
            messages: List of message dicts
            **kwargs: Additional arguments

        Returns:
            Response dict
        """
        # Convert messages to single prompt
        prompt = "\n".join([
            f"{msg.get('role', 'user')}: {msg.get('content', '')}"
            for msg in messages
        ])

        response = await self.generate(prompt, **kwargs)

        return {
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": response
                }
            }]
        }


class ClaudeStagehandProvider:
    """
    Stagehand model provider using Claude Code SDK.

    Use your Claude subscription with Stagehand - no Anthropic API key needed.

    Example:
        ```python
        from stagehand import Stagehand
        from marktoflow_langchain.stagehand_adapter import ClaudeStagehandProvider

        # Create custom provider
        provider = ClaudeStagehandProvider(model="claude-sonnet-4")

        # Use with Stagehand
        stagehand = Stagehand(
            env="LOCAL",
            model_name="custom",
            model_client=provider  # Use Claude instead of Anthropic
        )

        await stagehand.init()
        await stagehand.page.goto("https://example.com")

        # Use AI-powered actions
        result = await stagehand.act("click the login button")
        ```

    Requirements:
        - Claude Code CLI installed: https://docs.anthropic.com/claude/docs/claude-code
    """

    def __init__(
        self,
        model: str = "claude-sonnet-4",
        cli_path: str = "claude",
        timeout: int = 120,
        cwd: Optional[str] = None
    ):
        """
        Initialize Claude provider for Stagehand.

        Args:
            model: Model to use (claude-sonnet-4, claude-opus-4, etc.)
            cli_path: Path to claude CLI
            timeout: Timeout in seconds
            cwd: Working directory
        """
        self.model = model
        self.cli_path = cli_path
        self.timeout = timeout
        self.cwd = cwd

        from .claude_code_llm import ClaudeCodeLLM
        self.llm = ClaudeCodeLLM(
            model=model,
            cli_path=cli_path,
            timeout=timeout,
            cwd=cwd
        )

    async def generate(self, prompt: str, **kwargs) -> str:
        """
        Generate text using Claude Code.

        Args:
            prompt: Input prompt
            **kwargs: Additional arguments

        Returns:
            Generated text
        """
        # Run CLI in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self.llm._call,
            prompt
        )

    async def chat(self, messages: list, **kwargs) -> Dict[str, Any]:
        """
        Chat completion (for compatibility).

        Args:
            messages: List of message dicts
            **kwargs: Additional arguments

        Returns:
            Response dict
        """
        # Convert messages to single prompt
        prompt = "\n".join([
            f"{msg.get('role', 'user')}: {msg.get('content', '')}"
            for msg in messages
        ])

        response = await self.generate(prompt, **kwargs)

        return {
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": response
                }
            }]
        }


def create_stagehand_with_copilot(
    model: str = "gpt-4.1",
    env: Literal["LOCAL", "BROWSERBASE"] = "LOCAL",
    **stagehand_kwargs
):
    """
    Helper function to create Stagehand instance with GitHub Copilot.

    Args:
        model: Copilot model to use
        env: Stagehand environment
        **stagehand_kwargs: Additional Stagehand arguments

    Returns:
        Stagehand instance configured with Copilot

    Example:
        ```python
        stagehand = create_stagehand_with_copilot(model="gpt-4.1")
        await stagehand.init()
        await stagehand.page.goto("https://example.com")
        result = await stagehand.act("extract the page title")
        ```
    """
    try:
        from stagehand import Stagehand
    except ImportError:
        raise ImportError(
            "Stagehand not installed. Install with: pip install stagehand"
        )

    provider = CopilotStagehandProvider(model=model)

    return Stagehand(
        env=env,
        model_name="custom",
        model_client=provider,
        **stagehand_kwargs
    )


def create_stagehand_with_claude(
    model: str = "claude-sonnet-4",
    env: Literal["LOCAL", "BROWSERBASE"] = "LOCAL",
    **stagehand_kwargs
):
    """
    Helper function to create Stagehand instance with Claude Code.

    Args:
        model: Claude model to use
        env: Stagehand environment
        **stagehand_kwargs: Additional Stagehand arguments

    Returns:
        Stagehand instance configured with Claude

    Example:
        ```python
        stagehand = create_stagehand_with_claude(model="claude-sonnet-4")
        await stagehand.init()
        await stagehand.page.goto("https://example.com")
        result = await stagehand.act("extract the page title")
        ```
    """
    try:
        from stagehand import Stagehand
    except ImportError:
        raise ImportError(
            "Stagehand not installed. Install with: pip install stagehand"
        )

    provider = ClaudeStagehandProvider(model=model)

    return Stagehand(
        env=env,
        model_name="custom",
        model_client=provider,
        **stagehand_kwargs
    )
