import { createContext, useContext, type ReactNode } from "react";
import type { CategoryKey, CompareWins, LensMetricKey } from "./compareWins";

export type CompareContextValue = {
  comparing: boolean;
  deviceId: string | null;
  wins: CompareWins | null;
};

const CompareContext = createContext<CompareContextValue>({
  comparing: false,
  deviceId: null,
  wins: null,
});

export function CompareProvider({
  value,
  children,
}: {
  value: CompareContextValue;
  children: ReactNode;
}) {
  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompareHighlight(): CompareContextValue {
  return useContext(CompareContext);
}

export function categoryWin(
  ctx: CompareContextValue,
  key: CategoryKey,
): boolean {
  if (!ctx.comparing || !ctx.wins || !ctx.deviceId) return false;
  return ctx.wins.category[key]?.has(ctx.deviceId) ?? false;
}

export function lensWin(
  ctx: CompareContextValue,
  type: string,
  metric: LensMetricKey,
): boolean {
  if (!ctx.comparing || !ctx.wins || !ctx.deviceId) return false;
  return ctx.wins.lens[type]?.[metric]?.has(ctx.deviceId) ?? false;
}
