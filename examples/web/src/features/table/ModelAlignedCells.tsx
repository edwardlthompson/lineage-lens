import type { Device } from "../../types/device";
import { sortModelsForNaEbay } from "./modelNumbers";

/** Codename with NA-first retail model numbers for eBay part-number search. */
export function CodenameModelsCell({ device }: { device: Device }) {
  const models = sortModelsForNaEbay(device.models);
  return (
    <div className="ll-codename-cell">
      <div className="ll-codename-main">{device.codename}</div>
      {models.length > 0 ? (
        <ul className="ll-stack ll-model-stack" aria-label="Model numbers">
          {models.map((m) => (
            <li key={m} className="ll-stack-item ll-model-num">
              {m}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Align a single value (or multi-line capacity stack) with model-number rows. */
export function ModelAlignedCell({
  device,
  lines,
  ariaLabel,
}: {
  device: Device;
  lines: string[];
  ariaLabel: string;
}) {
  const models = sortModelsForNaEbay(device.models);
  const display = lines.length ? lines : ["—"];
  if (models.length === 0) {
    return (
      <ul className="ll-stack ll-model-stack" aria-label={ariaLabel}>
        {display.map((line, i) => (
          <li key={`${line}-${i}`} className="ll-stack-item ll-spec-line">
            {line}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="ll-codename-cell">
      <div className="ll-codename-main ll-spec-spacer" aria-hidden="true">
        {"\u00a0"}
      </div>
      <ul className="ll-stack ll-model-stack" aria-label={ariaLabel}>
        {models.map((m) => (
          <li key={m} className="ll-stack-item ll-spec-line">
            {display.join(" / ")}
          </li>
        ))}
      </ul>
    </div>
  );
}
