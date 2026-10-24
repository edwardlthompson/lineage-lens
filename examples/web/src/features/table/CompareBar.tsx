import { t } from "../../i18n";
import type { Device } from "../../types/device";
import type { CompareWins } from "./compareWins";

type Props = {
  comparing: boolean;
  selected: Device[];
  wins: CompareWins | null;
  similarHints: { id: string; name: string; score: number }[];
  onFindSimilar: () => void;
  onAddSimilar: (id: string) => void;
  onClearSelection: () => void;
};

function winCount(wins: CompareWins | null, deviceId: string): number {
  if (!wins) return 0;
  let n = 0;
  for (const set of Object.values(wins.category)) {
    if (set.has(deviceId)) n += 1;
  }
  for (const byMetric of Object.values(wins.lens)) {
    for (const set of Object.values(byMetric)) {
      if (set?.has(deviceId)) n += 1;
    }
  }
  return n;
}

export function CompareBar({
  comparing,
  selected,
  wins,
  similarHints,
  onFindSimilar,
  onAddSimilar,
  onClearSelection,
}: Props) {
  if (selected.length === 0 && similarHints.length === 0) return null;

  return (
    <div className="ll-compare-bar" data-testid="compare-bar">
      {selected.length > 0 ? (
        <div className="ll-compare-selected">
          <span className="ll-compare-bar-label">
            {t("table.comparePicked").replace("{count}", String(selected.length))}
          </span>
          <ul className="ll-compare-chips">
            {selected.map((d) => (
              <li key={d.id} className="ll-compare-chip">
                {d.name}
                {comparing && wins ? (
                  <span className="ll-compare-chip-wins">
                    {" "}
                    · {t("table.compareWins").replace("{n}", String(winCount(wins, d.id)))}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          <button type="button" className="ll-clear-filters" onClick={onClearSelection}>
            {t("table.clearSelection")}
          </button>
        </div>
      ) : null}

      {selected.length === 1 ? (
        <button
          type="button"
          className="ll-clear-filters"
          data-testid="find-similar"
          onClick={onFindSimilar}
        >
          {t("table.findSimilar")}
        </button>
      ) : null}

      {similarHints.length > 0 ? (
        <div className="ll-similar-hints">
          <span className="ll-compare-bar-label">{t("table.similarLabel")}</span>
          <ul className="ll-compare-chips">
            {similarHints.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  className="ll-compare-chip ll-compare-chip-btn"
                  data-testid={`similar-${h.id}`}
                  onClick={() => onAddSimilar(h.id)}
                >
                  {h.name} · {h.score}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
