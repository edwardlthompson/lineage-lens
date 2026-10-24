import { useEffect, useId, useRef } from "react";
import { t } from "../../i18n";
import type { Device } from "../../types/device";
import { buildDetailFields, detailHeadline } from "./deviceDetailSummary";

export function DeviceDetailPanel({ device, onClose }: { device: Device; onClose: () => void }) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const fields = buildDetailFields(device);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="ll-detail-backdrop" data-testid="device-detail" role="presentation">
      <section
        className="ll-detail-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="ll-detail-header">
          <h2 id={titleId}>{detailHeadline(device)}</h2>
          <button
            ref={closeRef}
            type="button"
            className="ll-detail-close"
            aria-label={t("detail.close")}
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <p className="ll-detail-lead gp-body">{t("detail.lead")}</p>
        <dl className="ll-detail-fields">
          {fields.map((f) => (
            <div key={f.labelKey} className="ll-detail-row">
              <dt>{t(f.labelKey)}</dt>
              <dd>{f.valueKey ? t(f.valueKey) : f.value}</dd>
            </div>
          ))}
        </dl>
        <p className="ll-muted ll-detail-provenance">
          {t("detail.sources")}: {device.provenance.data_sources.join(", ")}
        </p>
        <div className="ll-detail-links">
          {device.wiki_url ? (
            <a href={device.wiki_url} target="_blank" rel="noopener noreferrer">
              {t("detail.wiki")}
            </a>
          ) : null}
          {device.download_url ? (
            <a href={device.download_url} target="_blank" rel="noopener noreferrer">
              {t("detail.download")}
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
}
