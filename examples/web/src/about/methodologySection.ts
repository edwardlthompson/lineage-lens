import { t } from "../i18n";

/** Product methodology block for About (Lineage Lens data + scoring). */
export function createMethodologySection(): HTMLElement {
  const group = document.createElement("section");
  group.className = "gp-about-group";
  group.dataset.testid = "about-methodology";
  const heading = document.createElement("h3");
  heading.textContent = t("about.section.methodology");
  const purpose = document.createElement("p");
  purpose.className = "gp-body";
  purpose.textContent = t("about.methodology.purpose");
  const sources = document.createElement("p");
  sources.className = "gp-body";
  sources.textContent = t("about.methodology.sources");
  const scores = document.createElement("p");
  scores.className = "gp-body";
  scores.textContent = t("about.methodology.scores");
  const compare = document.createElement("p");
  compare.className = "gp-body";
  compare.textContent = t("about.methodology.compare");
  group.append(heading, purpose, sources, scores, compare);
  return group;
}
