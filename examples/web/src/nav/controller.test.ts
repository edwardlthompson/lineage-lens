import { describe, expect, it, vi } from "vitest";
import { createHistoryNav, feedbackPrefillOf } from "./controller";
import { current, homeNav, push } from "./nav";

describe("history nav controller", () => {
  it("Close pops nav immediately and ignores the matching popstate", () => {
    const back = vi.fn();
    const pushState = vi.fn();
    const hist = { back, pushState, state: { gp: true, depth: 2 } as unknown };
    const ctl = createHistoryNav(hist, homeNav());
    expect(current(ctl.pushRoute("about")!)).toBe("about");
    expect(pushState).toHaveBeenCalledWith({ gp: true, depth: 1 }, "");
    ctl.pushRoute("feedback", "bug");
    expect(current(ctl.get())).toBe("feedback");
    hist.state = { gp: true, depth: 2 };
    const forced = ctl.popFromUi();
    expect(forced).not.toBeNull();
    expect(current(forced!)).toBe("about");
    expect(back).toHaveBeenCalledTimes(1);
    // Matching popstate must not pop a second time.
    const popped = ctl.onPopState(document);
    expect(current(popped.nav)).toBe("about");
    expect(popped.trapHome).toBe(false);
  });

  it("pops feedback to home when history state is missing", () => {
    const back = vi.fn();
    const hist = { back, pushState: vi.fn(), state: null as unknown };
    const ctl = createHistoryNav(hist, push(homeNav(), "feedback", "bug"));
    const forced = ctl.popFromUi();
    expect(forced).not.toBeNull();
    expect(current(forced!)).toBe("home");
    expect(back).toHaveBeenCalledTimes(1);
  });

  it("popstate at home re-pushState the sentinel", () => {
    const pushState = vi.fn();
    const ctl = createHistoryNav(
      { back: vi.fn(), pushState, state: { gp: true, depth: 0 } },
      homeNav(),
    );
    const result = ctl.onPopState(document);
    expect(result.trapHome).toBe(true);
    expect(pushState).toHaveBeenCalledWith({ gp: true, depth: 0 }, "");
  });

  it("same-route push calls history.back instead of stacking", () => {
    const back = vi.fn();
    const ctl = createHistoryNav(
      { back, pushState: vi.fn(), state: { gp: true, depth: 1 } },
      push(homeNav(), "about"),
    );
    expect(ctl.pushRoute("about")).toBeNull();
    expect(back).toHaveBeenCalledTimes(1);
    expect(current(ctl.get())).toBe("about");
  });

  it("openPrompt pushState a history layer", () => {
    const pushState = vi.fn();
    const ctl = createHistoryNav({ back: vi.fn(), pushState, state: null }, homeNav());
    expect(ctl.openPrompt().promptOpen).toBe(true);
    expect(pushState).toHaveBeenCalledWith({ gp: true, depth: 1 }, "");
  });

  it("feedbackPrefillOf drops prefill off the feedback route", () => {
    expect(feedbackPrefillOf(push(homeNav(), "feedback", "bug"), "clip")).toBe("clip");
    expect(feedbackPrefillOf(homeNav(), "clip")).toBeUndefined();
  });
});
