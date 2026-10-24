import { pushPanelHistory, trapHomeHistory } from "./history";
import { canPop, current, push, setPrompt } from "./nav";
import { applyPop, historyDepth, readPanelScroll, saveNav } from "./session";
import type { FeedbackKind, GpRoute, NavState } from "./types";

export type HistoryNav = {
  get: () => NavState;
  pushRoute: (route: GpRoute, kind?: FeedbackKind) => NavState | null;
  /**
   * Pop immediately (embedded Cursor/Simple Browser often swallows `history.back`
   * / popstate). Still calls `back()` to keep the session stack aligned; the next
   * popstate is ignored so we do not double-pop.
   */
  popFromUi: () => NavState | null;
  openPrompt: () => NavState;
  onPopState: (root: ParentNode) => { nav: NavState; trapHome: boolean };
};

export function createHistoryNav(
  historyRef: Pick<History, "back" | "pushState" | "state">,
  initial: NavState,
): HistoryNav {
  let nav = initial;
  let ignoreNextPopState = false;
  return {
    get: () => nav,
    pushRoute(route, kind) {
      if (current(nav) === route) {
        historyRef.back();
        return null;
      }
      nav = push(nav, route, kind);
      saveNav(nav);
      pushPanelHistory(historyRef, historyDepth(nav));
      return nav;
    },
    popFromUi() {
      if (!canPop(nav) && !nav.promptOpen) {
        historyRef.back();
        return null;
      }
      const result = applyPop(nav, 0);
      nav = result.nav;
      saveNav(nav);
      ignoreNextPopState = true;
      historyRef.back();
      return nav;
    },
    openPrompt() {
      nav = setPrompt(nav, true);
      saveNav(nav);
      pushPanelHistory(historyRef, historyDepth(nav));
      return nav;
    },
    onPopState(root) {
      if (ignoreNextPopState) {
        ignoreNextPopState = false;
        if (!canPop(nav) && !nav.promptOpen) trapHomeHistory(historyRef);
        return { nav, trapHome: !canPop(nav) && !nav.promptOpen };
      }
      const result = applyPop(nav, readPanelScroll(root));
      nav = result.nav;
      saveNav(nav);
      if (result.trapHome) trapHomeHistory(historyRef);
      return result;
    },
  };
}

export function feedbackPrefillOf(nav: NavState, prefill: string | undefined): string | undefined {
  return current(nav) === "feedback" ? prefill : undefined;
}
