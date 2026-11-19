import { shiftPeriod, todayIso, v3Fmt as fmt } from './v3Shared';
import { dateBounds } from './v3ProgramModel';
import type { RateRange, RepeatEvery, ScheduledForm } from './v3ProgramModel';

/*  VERSION 3 — SCHEDULED POINTS only (`v3sp`). The copy, dates and checks
    behind V3ScheduledBody. Nothing in Points per sale reads this file.  */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STEP: Record<Exclude<RepeatEvery, 'none'>, number> = { month: 1, quarter: 3, year: 12 };
const EVERY: Record<Exclude<RepeatEvery, 'none'>, string> = { month: 'Every month', quarter: 'Every quarter', year: 'Every year' };


/*  Indian digit grouping — 1,80,000.  */
export function inr(n: number): string {
  return n.toLocaleString('en-IN');
}

function parts(iso: string): [number, number, number] | null {
  const r = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return r ? [Number(r[1]), Number(r[2]) - 1, Number(r[3])] : null;
}

/*  "1 Apr" — a date without its year.  */
export function dayMonth(iso: string): string {
  const p = parts(iso);
  return p ? `${p[2]} ${MONTHS[p[1]]}` : '—';
}

const n = (v: string) => Number(v) || 0;
const pointWord = (p: number) => (p === 1 ? 'point' : 'points');

/*  "INR 75,000–1,50,000" / "INR 3,00,000 and above".  */
export function rangeLabel(r: RateRange, sep = '–'): string {
  return r.to.trim() === '' ? `INR ${inr(n(r.from))} and above` : `INR ${inr(n(r.from))}${sep}${inr(n(r.to))}`;
}

/*  "INR 75,000–1,50,000 at 1 point per INR 1,000, INR 1,50,000–3,00,000 at 2, …"
    — later ranges drop "per INR X" while they share the first one's step.  */
/*  Single Criteria: "1 point per INR 1,000".  */
function singleRate(f: ScheduledForm): string {
  if (!(n(f.forEvery) > 0 && n(f.points) > 0)) return 'no rate set';
  return `${inr(n(f.points))} ${pointWord(n(f.points))} per INR ${inr(n(f.forEvery))}`;
}

function rateList(ranges: RateRange[]): string {
  const usable = ranges.filter((r) => n(r.from) > 0 && n(r.forEvery) > 0 && n(r.points) > 0);
  if (usable.length === 0) return 'no ranges set';
  const step = usable[0].forEvery;
  return usable.map((r, i) => {
    const rate = i === 0 ? `${inr(n(r.points))} ${pointWord(n(r.points))} per INR ${inr(n(r.forEvery))}`
      : r.forEvery === step ? inr(n(r.points)) : `${inr(n(r.points))} per INR ${inr(n(r.forEvery))}`;
    return `${rangeLabel(r)} at ${rate}`;
  }).join(', ');
}

/*  Which purchases an award counts. The first award counts from the program
    start date to the day before the award; each later one counts the repeat
    interval just ended (every quarter → the last quarter).  */
export type PurchaseWindow = { award: string; from: string; to: string };

export function purchaseWindows(f: ScheduledForm): { first: PurchaseWindow | null; next: PurchaseWindow | null } {
  if (!parts(f.awardDate)) return { first: null, next: null };
  const dayBefore = (iso: string) => shiftPeriod(iso, -1, 'days');
  const first = f.programStart && f.programStart < f.awardDate
    ? { award: f.awardDate, from: f.programStart, to: dayBefore(f.awardDate) } : null;
  if (f.repeat === 'none') return { first, next: null };
  const second = shiftPeriod(f.awardDate, STEP[f.repeat], 'months');
  return { first, next: { award: second, from: f.awardDate, to: dayBefore(second) } };
}

const LAST: Record<Exclude<RepeatEvery, 'none'>, string> = { month: 'month', quarter: 'quarter', year: 'year' };

/*  The explainer under When to award, with this program's own dates.  */
export function purchaseWindowNote(f: ScheduledForm): string[] {
  const { first, next } = purchaseWindows(f);
  if (!parts(f.awardDate)) return ['Set the award date to see which purchases each award counts.'];
  const firstLine = first
    ? `First award (${fmt(first.award)}) counts purchases from the program start date to the day before: ${fmt(first.from)} – ${fmt(first.to)}.`
    : `First award (${fmt(f.awardDate)}) counts purchases from the program start date to the day before.`;
  if (f.repeat === 'none' || !next) return [firstLine];
  return [
    firstLine,
    `After that, each award counts the last ${LAST[f.repeat]}. For example, ${fmt(next.award)} counts ${fmt(next.from)} – ${fmt(next.to)}.`,
  ];
}

export function summary(f: ScheduledForm): string {
  const lead = f.repeat === 'none' ? `On ${fmt(f.awardDate)}`
    : f.repeat === 'year' ? `Every year on ${dayMonth(f.awardDate)}` : `${EVERY[f.repeat]} from ${fmt(f.awardDate)}`;
  const rate = f.loyaltyType === 'single' ? ` at ${singleRate(f)}` : `: ${rateList(f.ranges)}`;
  return `${lead}, customers get points on their purchase value${rate}.`;
}

/*  The next award on or after today.  */
export function nextAward(f: ScheduledForm, today = todayIso()): string {
  if (!parts(f.awardDate)) return '—';

  let k = 0; let next = f.awardDate;
  if (f.repeat === 'none') return f.awardDate >= today ? fmt(f.awardDate) : `Awarded on ${fmt(f.awardDate)}`;
  const step = STEP[f.repeat];
  while (next < today && k < 1200) { k += step; next = shiftPeriod(f.awardDate, k, 'months'); }
  return fmt(next);
}

/*  The purchases the next award (on or after today) counts.  */
export function nextAwardCounts(f: ScheduledForm, today = todayIso()): string {
  if (!parts(f.awardDate)) return '—';
  const dayBefore = (iso: string) => shiftPeriod(iso, -1, 'days');
  const fromStart = (award: string) => (f.programStart && f.programStart < award ? `${fmt(f.programStart)} – ${fmt(dayBefore(award))}` : 'From the program start date');
  if (f.repeat === 'none' || f.awardDate >= today) return fromStart(f.awardDate);
  const step = STEP[f.repeat];
  let k = 0; let next = f.awardDate;
  while (next < today && k < 1200) { k += step; next = shiftPeriod(f.awardDate, k, 'months'); }
  const prev = shiftPeriod(f.awardDate, k - step, 'months');
  return `${fmt(prev)} – ${fmt(dayBefore(next))}`;
}

/* ── Validation ────────────────────────────────────────────────────────────── */

export type RangeError = { from?: string; to?: string; forEvery?: string; points?: string };

export type ScheduledErrors = {
  /** Award date missing. */
  date?: string;
  /** Award date before the program start date. */
  dateRange?: string;
  amount?: string;
  /** Single Criteria's one rate. */
  single: { forEvery?: string; points?: string };
  /** One per range row. */
  ranges: RangeError[];
};

/*  `tried`: Save was attempted, so empty required fields are errors too. The
    rest — From < To, overlaps, an open To above the last row, the date
    range — show as soon as they are true.  */
export function scheduledErrors(f: ScheduledForm, tried = true): ScheduledErrors {
  const e: ScheduledErrors = { ranges: [], single: {} };
  const positive = (v: string, msg: string) => ((v.trim() !== '' || tried) && !(n(v) > 0) ? msg : undefined);

  if (!f.awardDate && tried) e.date = 'Select the award date.';
  const { start } = dateBounds(f);
  if (f.awardDate && start && f.awardDate < start) {
    e.dateRange = `Award date can't be before the program start date (${fmt(start)}).`;
  }

  if (f.loyaltyType === 'single') {
    e.single = {
      forEvery: positive(f.forEvery, 'Enter the purchase value per rate step.'),
      points: positive(f.points, 'Points must be greater than 0.'),
    };
  } else {
    const last = f.ranges.length - 1;
    e.ranges = f.ranges.map((r, i) => {
      const re: RangeError = {};
      const prev = i > 0 ? f.ranges[i - 1] : null;
      if (r.from.trim() === '') { if (tried) re.from = 'Enter where this range starts.'; }
      else if (prev && prev.to.trim() !== '' && n(r.from) < n(prev.to)) re.from = `Ranges can't overlap. Start this range at INR ${inr(n(prev.to))} or above.`;
      if (r.to.trim() === '') { if (i !== last) re.to = 'Only the last range can be left open ("and above").'; }
      else if (r.from.trim() !== '' && n(r.to) <= n(r.from)) re.to = 'The To value must be more than the From value.';
      re.forEvery = positive(r.forEvery, 'Enter the purchase value per rate step.');
      re.points = positive(r.points, 'Points must be greater than 0.');
      return re;
    });
  }

  if (!(n(f.amountPerPoint) > 0) && tried) e.amount = 'Enter the value of one point.';
  return e;
}

export function hasErrors(e: ScheduledErrors): boolean {
  return Boolean(e.date || e.dateRange || e.amount)
    || Boolean(e.single.forEvery || e.single.points)
    || e.ranges.some((r) => r.from || r.to || r.forEvery || r.points);
}

/*  The "Try it": points = floor(total ÷ For Every) × points — Single
    Criteria's one rate, or the rate of the one range the total falls in
    (From inclusive, To exclusive).  */
export function tryRate(f: ScheduledForm, purchased: number): string {
  const apv = n(f.amountPerPoint);
  const earn = (forEvery: number, pts: number) => Math.floor(purchased / forEvery) * pts;

  if (f.loyaltyType === 'single') {
    if (!(n(f.forEvery) > 0 && n(f.points) > 0)) return 'Set the rate to see what a customer gets.';
    const got = earn(n(f.forEvery), n(f.points));
    return `At ${singleRate(f)} → ${inr(got)} ${pointWord(got)} (INR ${inr(got * apv)}).`;
  }

  const usable = f.ranges
    .filter((r) => n(r.from) > 0 && n(r.forEvery) > 0 && n(r.points) > 0)
    .sort((a, b) => n(a.from) - n(b.from));
  if (usable.length === 0) return 'Add a range to see what a customer gets.';

  const hit = usable.find((r) => purchased >= n(r.from) && (r.to.trim() === '' || purchased < n(r.to)));
  const higher = usable.find((r) => n(r.from) > purchased);
  const moveTo = higher
    ? ` INR ${inr(n(higher.from) - purchased)} more would move to ${inr(n(higher.points))} ${pointWord(n(higher.points))} per INR ${inr(n(higher.forEvery))}.`
    : '';

  if (!hit) {
    if (purchased < n(usable[0].from)) return `Below the first range, so no points. Needs INR ${inr(n(usable[0].from) - purchased)} more.`;
    return `Between ranges, so no points.${moveTo}`;
  }
  const got = earn(n(hit.forEvery), n(hit.points));
  return `Falls in the ${rangeLabel(hit, ' – ')} range → ${inr(got)} ${pointWord(got)} (INR ${inr(got * apv)}).${moveTo}`;
}
