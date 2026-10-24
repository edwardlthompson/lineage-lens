import { APP_VERSION } from "./about/aboutSession";
import type { LaunchPrompt } from "./about/runAppUpdates";
import type { DonationConfig } from "./about/types";
import { mountAppShellPrompts } from "./appShellPrompts";
import { createAboutPanel } from "./components/AboutPanel";
import { createFeedbackPanel } from "./components/FeedbackPanel";
import { createSettingsPanel } from "./components/SettingsPanel";
import { clearPendingCrash } from "./crash-capture/pendingCrash";
import { t } from "./i18n";
import { applyPanelScroll, current, type FeedbackKind, type GpRoute, type NavState } from "./nav";
import { bindPanelDialog } from "./panelDialog";

let dialogCleanup: (() => void) | undefined;

export type AppShellState = {
  nav: NavState;
  feedbackPrefill?: string;
  updateStatus: string;
  donations: DonationConfig;
  launchPrompt: LaunchPrompt | null;
  releaseRepo?: string;
  canApplyUpdate?: boolean;
  showSwUpdatePrompt?: boolean;
};

export type AppShellCallbacks = {
  onState: (next: Partial<AppShellState>) => void;
  onPushRoute: (route: GpRoute, kind?: FeedbackKind) => void;
  onPop: () => void;
  onApplyUpdate?: () => void;
  onDonate?: () => void;
  onLaunchPrompt?: (accepted: boolean) => void;
  canApplyUpdate?: boolean;
};

export function createAppShell(
  root: HTMLElement,
  state: AppShellState,
  callbacks: AppShellCallbacks,
): void {
  const route = current(state.nav);
  const atHome = route === "home";

  const existingReact = root.querySelector("#ll-react-root");
  if (existingReact) existingReact.remove();

  root.innerHTML = `
    <main class="ll-main">
      <div class="gp-header">
        <h1 class="gp-title">${t("app.title")}</h1>
        <div class="gp-header-actions">
          ${
            atHome
              ? `<div id="ll-home-toolbar-slot" class="ll-home-toolbar-slot" data-testid="home-toolbar"></div>
          <button type="button" class="gp-settings-btn" data-settings-open aria-label="${t("settings.open")}">${t("settings.open")}</button>`
              : `<button type="button" class="gp-settings-btn" data-nav-back aria-label="${t("nav.back")}">${t("nav.back")}</button>`
          }
        </div>
      </div>
      <div id="ll-react-root" class="ll-react-root"></div>
      <div data-panel-mount></div>
    </main>
  `;

  const reactSlot = root.querySelector("#ll-react-root");
  if (existingReact && reactSlot) {
    reactSlot.replaceWith(existingReact);
  }
  const reactHost = root.querySelector<HTMLElement>("#ll-react-root");
  if (reactHost) {
    reactHost.hidden = !atHome;
  }

  root.querySelector("[data-settings-open]")?.addEventListener("click", () => {
    toggleOrPush(route, "settings", callbacks);
  });
  root.querySelector("[data-nav-back]")?.addEventListener("click", () => {
    callbacks.onPop();
  });

  const mount = root.querySelector("[data-panel-mount]");
  if (!mount) return;

  dialogCleanup?.();
  dialogCleanup = undefined;
  mount.innerHTML = "";

  if (mountAppShellPrompts(mount, state, callbacks, atHome)) {
    return;
  }

  if (route === "feedback") {
    const leaveFeedback = (): void => {
      clearPendingCrash();
      callbacks.onPop();
    };
    const panel = createFeedbackPanel(state.nav.feedbackKind ?? "bug", {
      onClose: leaveFeedback,
      releaseRepo: state.releaseRepo ?? "",
      description: state.feedbackPrefill,
    });
    mount.appendChild(panel);
    dialogCleanup = bindPanelDialog(panel, leaveFeedback);
    applyPanelScroll(root, state.nav);
    return;
  }

  if (route === "settings") {
    const panel = createSettingsPanel({
      onClose: callbacks.onPop,
      onOpenAbout: () => callbacks.onPushRoute("about"),
    });
    mount.appendChild(panel);
    dialogCleanup = bindPanelDialog(panel, callbacks.onPop);
    applyPanelScroll(root, state.nav);
    return;
  }

  if (route !== "about") return;

  mount.appendChild(
    createAboutPanel(
      {
        version: APP_VERSION,
        updateStatus: state.updateStatus,
        donations: state.donations,
        canApplyUpdate: state.canApplyUpdate ?? callbacks.canApplyUpdate,
      },
      callbacks.onPop,
      callbacks.onApplyUpdate,
      () => callbacks.onPushRoute("feedback", "bug"),
      () => callbacks.onPushRoute("feedback", "feature"),
    ),
  );
  const aboutPanel = mount.lastElementChild as HTMLElement;
  dialogCleanup = bindPanelDialog(aboutPanel, callbacks.onPop);
  applyPanelScroll(root, state.nav);
}

function toggleOrPush(route: GpRoute, target: GpRoute, callbacks: AppShellCallbacks): void {
  if (route === target) callbacks.onPop();
  else callbacks.onPushRoute(target);
}
