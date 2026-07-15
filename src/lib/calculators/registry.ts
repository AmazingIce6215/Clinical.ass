import type { CalculatorCategory, CalculatorDefinition } from "./types";

import { gcs } from "./definitions/gcs";
import { curb65 } from "./definitions/curb65";
import { wellsPE } from "./definitions/wells-pe";
import { wellsDVT } from "./definitions/wells-dvt";
import { heart } from "./definitions/heart";
import { cha2ds2Vasc } from "./definitions/cha2ds2-vasc";
import { hasBled } from "./definitions/has-bled";
import { sofa } from "./definitions/sofa";
import { childPugh } from "./definitions/child-pugh";
import { bishop } from "./definitions/bishop";
import { aaGradient } from "./definitions/aa-gradient";
import { abcd2 } from "./definitions/abcd2";
import { alvarado } from "./definitions/alvarado";
import { anc } from "./definitions/anc";
import { anionGap } from "./definitions/anion-gap";
import { apgar } from "./definitions/apgar";
import { apri } from "./definitions/apri";
import { asaStatus } from "./definitions/asa-status";
import { atriaBleed } from "./definitions/atria-bleed";
import { auditC } from "./definitions/audit-c";
import { bisap } from "./definitions/bisap";
import { blatchford } from "./definitions/blatchford";
import { bmiBsaDubois } from "./definitions/bmi-bsa-dubois";
import { bmiBsaMosteller } from "./definitions/bmi-bsa-mosteller";
import { bode } from "./definitions/bode";
import { cage } from "./definitions/cage";
import { canadianCspine } from "./definitions/canadian-cspine";
import { canadianCtHead } from "./definitions/canadian-ct-head";
import { centor } from "./definitions/centor";
import { chads2 } from "./definitions/chads2";
import { charlson } from "./definitions/charlson";
import { ciwaAr } from "./definitions/ciwa-ar";
import { ckdEpi2021 } from "./definitions/ckd-epi-2021";
import { cockcroftGault } from "./definitions/cockcroft-gault";
import { correctedCalcium } from "./definitions/corrected-calcium";
import { correctedSodium } from "./definitions/corrected-sodium";
import { cows } from "./definitions/cows";
import { cpp } from "./definitions/cpp";
import { crusade } from "./definitions/crusade";
import { ctSeverityPancreatitis } from "./definitions/ct-severity-pancreatitis";
import { dicScore } from "./definitions/dic-score";
import { discriminantFunction } from "./definitions/discriminant-function";
import { dukeEndocarditis } from "./definitions/duke-endocarditis";
import { epworth } from "./definitions/epworth";
import { fena } from "./definitions/fena";
import { feurea } from "./definitions/feurea";
import { fib4 } from "./definitions/fib4";
import { forrest } from "./definitions/forrest";
import { fourScore } from "./definitions/four-score";
import { framinghamChf } from "./definitions/framingham-chf";
import { gad2 } from "./definitions/gad2";
import { gad7 } from "./definitions/gad7";
import { grace } from "./definitions/grace";
import { hendersonHasselbalch } from "./definitions/henderson-hasselbalch";
import { hit4ts } from "./definitions/hit-4ts";
import { huntHess } from "./definitions/hunt-hess";
import { ichScore } from "./definitions/ich-score";
import { idealBodyWeight } from "./definitions/ideal-body-weight";
import { khorana } from "./definitions/khorana";
import { killip } from "./definitions/killip";
import { lightsCriteria } from "./definitions/lights-criteria";
import { lille } from "./definitions/lille";
import { maintenanceFluids } from "./definitions/maintenance-fluids";
import { map } from "./definitions/map";
import { mascc } from "./definitions/mascc";
import { mdrdEgfr } from "./definitions/mdrd-egfr";
import { meldNa } from "./definitions/meld-na";
import { mentzer } from "./definitions/mentzer";
import { mews } from "./definitions/mews";
import { nexusCspine } from "./definitions/nexus-cspine";
import { osmolalGap } from "./definitions/osmolal-gap";
import { ottawaAnkle } from "./definitions/ottawa-ankle";
import { ottawaKnee } from "./definitions/ottawa-knee";
import { padua } from "./definitions/padua";
import { parkland } from "./definitions/parkland";
import { pecarnHead } from "./definitions/pecarn-head";
import { perc } from "./definitions/perc";
import { pesi } from "./definitions/pesi";
import { phq2 } from "./definitions/phq2";
import { phq9 } from "./definitions/phq9";
import { plasmic } from "./definitions/plasmic";
import { psiPort } from "./definitions/psi-port";
import { qsofa } from "./definitions/qsofa";
import { qtcBazett } from "./definitions/qtc-bazett";
import { ranson } from "./definitions/ranson";
import { rass } from "./definitions/rass";
import { rcri } from "./definitions/rcri";
import { revisedGeneva } from "./definitions/revised-geneva";
import { rockall } from "./definitions/rockall";
import { roxIndex } from "./definitions/rox-index";
import { saag } from "./definitions/saag";
import { sanFranciscoSyncope } from "./definitions/san-francisco-syncope";
import { sgarbossa } from "./definitions/sgarbossa";
import { shockIndex } from "./definitions/shock-index";
import { sirs } from "./definitions/sirs";
import { sodiumDeficit } from "./definitions/sodium-deficit";
import { stopBang } from "./definitions/stop-bang";
import { surgicalApgar } from "./definitions/surgical-apgar";
import { timiNstemi } from "./definitions/timi-nstemi";
import { timiStemi } from "./definitions/timi-stemi";
import { waterDeficit } from "./definitions/water-deficit";
import { westleyCroup } from "./definitions/westley-croup";

export const CALCULATOR_FAVORITES_STORAGE_KEY = "calc_favorites";

const calculators: readonly CalculatorDefinition[] = [
  gcs,
  curb65,
  wellsPE,
  wellsDVT,
  heart,
  cha2ds2Vasc,
  hasBled,
  sofa,
  childPugh,
  bishop,
  aaGradient,
  abcd2,
  alvarado,
  anc,
  anionGap,
  apgar,
  apri,
  asaStatus,
  atriaBleed,
  auditC,
  bisap,
  blatchford,
  bmiBsaDubois,
  bmiBsaMosteller,
  bode,
  cage,
  canadianCspine,
  canadianCtHead,
  centor,
  chads2,
  charlson,
  ciwaAr,
  ckdEpi2021,
  cockcroftGault,
  correctedCalcium,
  correctedSodium,
  cows,
  cpp,
  crusade,
  ctSeverityPancreatitis,
  dicScore,
  discriminantFunction,
  dukeEndocarditis,
  epworth,
  fena,
  feurea,
  fib4,
  forrest,
  fourScore,
  framinghamChf,
  gad2,
  gad7,
  grace,
  hendersonHasselbalch,
  hit4ts,
  huntHess,
  ichScore,
  idealBodyWeight,
  khorana,
  killip,
  lightsCriteria,
  lille,
  maintenanceFluids,
  map,
  mascc,
  mdrdEgfr,
  meldNa,
  mentzer,
  mews,
  nexusCspine,
  osmolalGap,
  ottawaAnkle,
  ottawaKnee,
  padua,
  parkland,
  pecarnHead,
  perc,
  pesi,
  phq2,
  phq9,
  plasmic,
  psiPort,
  qsofa,
  qtcBazett,
  ranson,
  rass,
  rcri,
  revisedGeneva,
  rockall,
  roxIndex,
  saag,
  sanFranciscoSyncope,
  sgarbossa,
  shockIndex,
  sirs,
  sodiumDeficit,
  stopBang,
  surgicalApgar,
  timiNstemi,
  timiStemi,
  waterDeficit,
  westleyCroup,
];

const calculatorMap = new Map(calculators.map((c) => [c.slug, c]));

export function getAllCalculators(): readonly CalculatorDefinition[] {
  return calculators;
}

export function getCalculator(slug: string): CalculatorDefinition | undefined {
  return calculatorMap.get(slug);
}

export function searchCalculators(query: string): readonly CalculatorDefinition[] {
  const q = query.toLowerCase().trim();
  if (!q) return calculators;
  return calculators.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.shortName.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.evidence.intendedPopulation.toLowerCase().includes(q),
  );
}

export function getCalculatorsByCategory(categoryId: string): readonly CalculatorDefinition[] {
  if (!categoryId || categoryId === "all") return calculators;
  return calculators.filter((c) => c.category === categoryId);
}

export function getCategories() {
  const seen = new Set<string>();
  return calculators
    .filter((c) => {
      if (seen.has(c.category)) return false;
      seen.add(c.category);
      return true;
    })
    .map((c) => ({
      id: c.category,
      label: formatCalculatorCategory(c.category),
      icon: c.icon,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function formatCalculatorCategory(category: CalculatorCategory): string {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
