"""
GitHub Copilot CLI LangChain Wrapper

Uses GitHub Copilot CLI to provide LLM capabilities without separate API keys.
Requires GitHub Copilot subscription and `copilot` CLI installed.
"""

import subprocess
import logging
from typing import Any, List, Optional, Dict
from langchain_core.callbacks import CallbackManagerForLLMRun
from langchain_core.language_models.llms import LLM
from langchain_core.outputs import Generation, LLMResult

logger = logging.getLogger(__name__)


class GitHubCopilotLLM(LLM):
    """
    LangChain LLM wrapper for GitHub Copilot CLI.

    Uses your GitHub Copilot subscription - no separate API key needed.

    Example:
        ```python
        from marktoflow_langchain import GitHubCopilotLLM
        from browser_use import Agent

        llm = GitHubCopilotLLM(model="gpt-4.1")
        agent = Agent(
            task="Navigate to example.com and extract the title",
            llm=llm
        )
        result = agent.run()
        ```

    Requirements:
        - GitHub Copilot subscription
        - `copilot` CLI installed and authenticated
        - Install: npm install -g @github/copilot-cli
        - Authenticate: copilot auth
    """

    model: str = "gpt-4.1"
    """Model to use (gpt-4.1, gpt-4o, etc.)"""

    cli_path: str = "copilot"
    """Path to copilot CLI executable"""

    timeout: int = 120
    """Timeout for CLI calls in seconds"""

    verbose_output: bool = False
    """Enable verbose logging"""

    @property
    def _llm_type(self) -> str:
        """Return identifier for this LLM type."""
        return "github-copilot-cli"

    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        """
        Call GitHub Copilot CLI with the given prompt.

        Args:
            prompt: The prompt to send to Copilot
            stop: Stop sequences (not used by CLI)
            run_manager: Callback manager for streaming
            **kwargs: Additional arguments

        Returns:
            Response from Copilot CLI

        Raises:
            RuntimeError: If CLI call fails
        """
        if self.verbose_output:
            logger.info(f"Calling GitHub Copilot CLI with prompt: {prompt[:100]}...")

        # Build CLI command
        cmd = [self.cli_path, "-p", prompt]

        if self.model:
            cmd.extend(["--model", self.model])

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=self.timeout,
                check=False
            )

            if result.returncode != 0:
                error_msg = f"GitHub Copilot CLI failed with code {result.returncode}"
                if result.stderr:
                    error_msg += f"\nSTDERR: {result.stderr}"
                if result.stdout:
                    error_msg += f"\nSTDOUT: {result.stdout}"
                raise RuntimeError(error_msg)

            response = result.stdout.strip()

            if self.verbose_output:
                logger.info(f"GitHub Copilot response: {response[:100]}...")

            return response

        except subprocess.TimeoutExpired as e:
            raise RuntimeError(
                f"GitHub Copilot CLI timed out after {self.timeout}s"
            ) from e
        except FileNotFoundError as e:
            raise RuntimeError(
                f"GitHub Copilot CLI not found at '{self.cli_path}'. "
                "Install it with: npm install -g @github/copilot-cli"
            ) from e
        except Exception as e:
            raise RuntimeError(f"GitHub Copilot CLI error: {e}") from e

    def _generate(
        self,
        prompts: List[str],
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> LLMResult:
        """
        Generate responses for multiple prompts.

        Args:
            prompts: List of prompts
            stop: Stop sequences
            run_manager: Callback manager
            **kwargs: Additional arguments

        Returns:
            LLMResult with generations
        """
        generations = []
        for prompt in prompts:
            text = self._call(prompt, stop=stop, run_manager=run_manager, **kwargs)
            generations.append([Generation(text=text)])

        return LLMResult(generations=generations)

    @property
    def _identifying_params(self) -> Dict[str, Any]:
        """Return identifying parameters."""
        return {
            "model": self.model,
            "cli_path": self.cli_path,
            "timeout": self.timeout,
        }

    def check_installation(self) -> bool:
        """
        Check if GitHub Copilot CLI is installed and accessible.

        Returns:
            True if CLI is accessible, False otherwise
        """
        try:
            result = subprocess.run(
                [self.cli_path, "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return False

    def check_auth(self) -> bool:
        """
        Check if GitHub Copilot CLI is authenticated.

        Returns:
            True if authenticated, False otherwise
        """
        try:
            # Try a simple test prompt
            result = subprocess.run(
                [self.cli_path, "-p", "test"],
                capture_output=True,
                text=True,
                timeout=10
            )
            # If it returns without auth errors, we're authenticated
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return False
