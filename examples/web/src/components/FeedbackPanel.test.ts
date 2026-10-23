import { describe, expect, it, vi } from "vitest";
import { LOCAL_KEY, SESSION_KEY } from "../crash-capture/pendingCrash";
import { createFeedbackPanel } from "./FeedbackPanel";

vi.mock("../i18n", () => ({
  t: (key: string) => key,
}));

describe("createFeedbackPanel", () => {
  it("clears pending crash when closing with ×", () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ message: "boom", stack: "s" }));
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ message: "boom", stack: "s" }));
    const onClose = vi.fn();
    const panel = createFeedbackPanel("bug", { onClose, releaseRepo: "acme/app" });
    panel.querySelector<HTMLButtonElement>("[data-testid=feedback-close]")!.click();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    expect(localStorage.getItem(LOCAL_KEY)).toBeNull();
  });

  it("puts reporter text in textContent, not innerHTML", () => {
    const panel = createFeedbackPanel("bug", { onClose: () => {}, releaseRepo: "acme/app" });
    const area = panel.querySelector<HTMLTextAreaElement>("[data-testid=feedback-description]");
    const preview = panel.querySelector<HTMLPreElement>("[data-testid=feedback-preview]");
    expect(area && preview).toBeTruthy();
    area!.value = "<script>alert(1)</script> hello";
    area!.dispatchEvent(new Event("input"));
    expect(preview!.innerHTML.includes("<script>")).toBe(false);
    expect(preview!.textContent || "").toContain("hello");
  });

  it("prefills description from share target", () => {
    const panel = createFeedbackPanel("feature", {
      onClose: () => {},
      releaseRepo: "acme/app",
      description: "shared text",
    });
    const area = panel.querySelector<HTMLTextAreaElement>("[data-testid=feedback-description]");
    expect(area?.value).toBe("shared text");
  });

  it("exposes a close control that returns via onClose", () => {
    const onClose = vi.fn();
    const panel = createFeedbackPanel("bug", { onClose, releaseRepo: "acme/app" });
    const close = panel.querySelector<HTMLButtonElement>("[data-testid=feedback-close]");
    expect(close).toBeTruthy();
    close!.click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
