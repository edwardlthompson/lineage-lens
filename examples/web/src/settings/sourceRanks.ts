/** Spec-source rank. `sole` means one page from this tier can fill a field. */

export type SourceRank = {
  rank: number;
  sole: boolean;
  labelKey: string;
  ruleKey: string;
};

export const SOURCE_RANKS: readonly SourceRank[] = [
  {
    rank: 1,
    sole: true,
    labelKey: "settings.sources.maker",
    ruleKey: "settings.sources.maker.rule",
  },
  {
    rank: 2,
    sole: true,
    labelKey: "settings.sources.regulatory",
    ruleKey: "settings.sources.regulatory.rule",
  },
  {
    rank: 3,
    sole: true,
    labelKey: "settings.sources.teardown",
    ruleKey: "settings.sources.teardown.rule",
  },
  {
    rank: 4,
    sole: true,
    labelKey: "settings.sources.gsmarena",
    ruleKey: "settings.sources.gsmarena.rule",
  },
  {
    rank: 5,
    sole: false,
    labelKey: "settings.sources.press",
    ruleKey: "settings.sources.press.rule",
  },
  {
    rank: 6,
    sole: false,
    labelKey: "settings.sources.wiki",
    ruleKey: "settings.sources.wiki.rule",
  },
];
