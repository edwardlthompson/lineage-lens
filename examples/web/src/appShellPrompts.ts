import type { AppShellCallbacks, AppShellState } from "./AppShell";
import { createLaunchPromptDialog } from "./about/launchPrompt";
import { createSwUpdatePrompt } from "./about/swUpdatePrompt";

/** Mount launch / SW update prompts; returns true if shell should stop (launch prompt). */
export function mountAppShellPrompts(
  mount: Element,
  state: AppShellState,
  callbacks: AppShellCallbacks,
  atHome: boolean,
): boolean {
  if (state.nav.promptOpen && state.launchPrompt) {
    const promptDialog = createLaunchPromptDialog(state.launchPrompt, (accepted) => {
      callbacks.onLaunchPrompt?.(accepted);
    });
    mount.appendChild(promptDialog);
    return true;
  }

  if (atHome && state.showSwUpdatePrompt) {
    mount.appendChild(
      createSwUpdatePrompt(
        () => {
          callbacks.onApplyUpdate?.();
          callbacks.onState({ showSwUpdatePrompt: false, canApplyUpdate: true });
        },
        () => callbacks.onState({ showSwUpdatePrompt: false }),
      ),
    );
  }

  return false;
}
