export type TaxSummary = {
  grossYtd: number;
  seTax: number;
  federalTaxBeforeCredits: number;
  federalTaxAfterCredits: number;
  stateTaxBeforeCredits: number;
  stateTaxAfterCredits: number;
  totalTaxAfterCredits: number;
  taxableIncomeFederal: number;
  taxableIncomeState: number;
  federalMarginalRate: number;
};

type Bracket = { cap: number | null; rate: number };

type IncrementalEstimate = {
  grossPayment: number;
  incrementalSeTax: number;
  incrementalFederalTax: number;
  incrementalStateTax: number;
  incrementalTotalTax: number;
  netAfterTaxes: number;
  federalCreditApplied: number;
  stateCreditApplied: number;
};

const FEDERAL_STANDARD_DEDUCTION = 16100;
const WISCONSIN_STANDARD_DEDUCTION = 14320;
const AOTC_CREDIT = 2500;
const WI_RENT_CREDIT = 300;

const SE_TAX_ADJUSTMENT = 0.9235;
const SE_TAX_RATE = 0.153;
const SE_SOCIAL_SECURITY_RATE = 0.124;
const SE_MEDICARE_RATE = 0.029;
const SE_WAGE_BASE = 184500;

const FEDERAL_BRACKETS: Bracket[] = [
  { cap: 12400, rate: 0.1 },
  { cap: 50400, rate: 0.12 },
  { cap: 105700, rate: 0.22 },
  { cap: 201700, rate: 0.24 },
  { cap: null, rate: 0.24 },
];

const WISCONSIN_BRACKETS: Bracket[] = [
  { cap: 14300, rate: 0.035 },
  { cap: 28600, rate: 0.044 },
  { cap: 315300, rate: 0.053 },
  { cap: null, rate: 0.053 },
];

const applyBrackets = (income: number, brackets: Bracket[]) => {
  let remaining = Math.max(0, income);
  let tax = 0;
  let lastCap = 0;

  for (const bracket of brackets) {
    if (remaining <= 0) {
      break;
    }

    const cap = bracket.cap ?? Number.POSITIVE_INFINITY;
    const span = Math.min(remaining, cap - lastCap);
    if (span <= 0) {
      lastCap = cap;
      continue;
    }

    tax += span * bracket.rate;
    remaining -= span;
    lastCap = cap;
  }

  return Number(tax.toFixed(2));
};

const computeSeTax = (grossYtd: number) => {
  const seIncome = Math.max(0, grossYtd) * SE_TAX_ADJUSTMENT;
  const ssTaxable = Math.min(seIncome, SE_WAGE_BASE);
  const ssTax = ssTaxable * SE_SOCIAL_SECURITY_RATE;
  const medicareTax = seIncome * SE_MEDICARE_RATE;
  return Number((ssTax + medicareTax).toFixed(2));
};

const computeFederalTaxBeforeCredits = (grossYtd: number) => {
  const seTax = computeSeTax(grossYtd);
  const taxableIncome = Math.max(0, grossYtd - FEDERAL_STANDARD_DEDUCTION - 0.5 * seTax);
  const tax = applyBrackets(taxableIncome, FEDERAL_BRACKETS);
  return {
    tax,
    taxableIncome: Number(taxableIncome.toFixed(2)),
  };
};

const computeStateTaxBeforeCredits = (grossYtd: number) => {
  const taxableIncome = Math.max(0, grossYtd - WISCONSIN_STANDARD_DEDUCTION);
  const tax = applyBrackets(taxableIncome, WISCONSIN_BRACKETS);
  return {
    tax,
    taxableIncome: Number(taxableIncome.toFixed(2)),
  };
};

const computeFederalMarginalRate = (grossYtd: number) => {
  const { taxableIncome } = computeFederalTaxBeforeCredits(grossYtd);
  if (taxableIncome <= 12400) return 0.1;
  if (taxableIncome <= 50400) return 0.12;
  if (taxableIncome <= 105700) return 0.22;
  if (taxableIncome <= 201700) return 0.24;
  return 0.24;
};

export const calculateYtdTaxSummary = (grossYtd: number): TaxSummary => {
  const seTax = computeSeTax(grossYtd);
  const federal = computeFederalTaxBeforeCredits(grossYtd);
  const state = computeStateTaxBeforeCredits(grossYtd);

  const federalAfterCredits = Math.max(0, federal.tax - AOTC_CREDIT);
  const stateAfterCredits = Math.max(0, state.tax - WI_RENT_CREDIT);

  const totalTax = Number((seTax + federalAfterCredits + stateAfterCredits).toFixed(2));

  return {
    grossYtd: Number(grossYtd.toFixed(2)),
    seTax,
    federalTaxBeforeCredits: federal.tax,
    federalTaxAfterCredits: Number(federalAfterCredits.toFixed(2)),
    stateTaxBeforeCredits: state.tax,
    stateTaxAfterCredits: Number(stateAfterCredits.toFixed(2)),
    totalTaxAfterCredits: totalTax,
    taxableIncomeFederal: federal.taxableIncome,
    taxableIncomeState: state.taxableIncome,
    federalMarginalRate: computeFederalMarginalRate(grossYtd),
  };
};

export const calculateIncrementalEstimate = (
  previousGross: number,
  paymentGross: number
): IncrementalEstimate => {
  const grossAfter = previousGross + paymentGross;

  const seTaxPrev = computeSeTax(previousGross);
  const seTaxAfter = computeSeTax(grossAfter);
  const incrementalSeTax = Number((seTaxAfter - seTaxPrev).toFixed(2));

  const federalPrev = computeFederalTaxBeforeCredits(previousGross).tax;
  const federalAfter = computeFederalTaxBeforeCredits(grossAfter).tax;
  const statePrev = computeStateTaxBeforeCredits(previousGross).tax;
  const stateAfter = computeStateTaxBeforeCredits(grossAfter).tax;

  const creditShare = grossAfter > 0 ? paymentGross / grossAfter : 0;
  const federalCreditApplied = Number((AOTC_CREDIT * creditShare).toFixed(2));
  const stateCreditApplied = Number((WI_RENT_CREDIT * creditShare).toFixed(2));

  const incrementalFederalTax = Math.max(
    0,
    Number((federalAfter - federalPrev - federalCreditApplied).toFixed(2))
  );
  const incrementalStateTax = Math.max(
    0,
    Number((stateAfter - statePrev - stateCreditApplied).toFixed(2))
  );

  const incrementalTotalTax = Number(
    (incrementalSeTax + incrementalFederalTax + incrementalStateTax).toFixed(2)
  );
  const netAfterTaxes = Number((paymentGross - incrementalTotalTax).toFixed(2));

  return {
    grossPayment: Number(paymentGross.toFixed(2)),
    incrementalSeTax,
    incrementalFederalTax,
    incrementalStateTax,
    incrementalTotalTax,
    netAfterTaxes,
    federalCreditApplied,
    stateCreditApplied,
  };
};

export const formatCurrency = (value: number) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD" });

export const taxConstants = {
  FEDERAL_STANDARD_DEDUCTION,
  WISCONSIN_STANDARD_DEDUCTION,
  AOTC_CREDIT,
  WI_RENT_CREDIT,
};
