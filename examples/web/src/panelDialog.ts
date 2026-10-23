const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function bindPanelDialog(panel: HTMLElement, onClose: () => void): () => void {
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");

  const title = panel.querySelector("h2");
  if (title && !title.id) {
    title.id = `gp-panel-title-${Math.random().toString(36).slice(2, 9)}`;
    panel.setAttribute("aria-labelledby", title.id);
  }

  const previousFocus = document.activeElement as HTMLElement | null;

  const focusable = (): HTMLElement[] =>
    [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1,
    );

  const first = focusable()[0];
  first?.focus();

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    // Only trap Tab while focus is inside this dialog.
    if (!panel.contains(document.activeElement)) return;

    const elements = focusable();
    if (!elements.length) return;

    const firstEl = elements[0];
    const lastEl = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === firstEl) {
      event.preventDefault();
      lastEl.focus();
    } else if (!event.shiftKey && document.activeElement === lastEl) {
      event.preventDefault();
      firstEl.focus();
    }
  };

  // Panel + document: Escape works with focus inside the dialog or elsewhere on the page.
  panel.addEventListener("keydown", onKeyDown);
  document.addEventListener("keydown", onDocumentKeyDown);

  function onDocumentKeyDown(event: KeyboardEvent): void {
    if (event.key !== "Escape") return;
    // Avoid double-firing when Escape originates inside the panel (bubbles to document).
    if (panel.contains(event.target as Node | null)) return;
    onKeyDown(event);
  }

  return () => {
    panel.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("keydown", onDocumentKeyDown);
    previousFocus?.focus();
  };
}
