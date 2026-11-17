import { shiftPeriod, todayIso, v3Fmt as fmt } from './v3Shared';
import { dateBounds } from './v3ProgramModel';
import type { PurchasePeriod, RateRange, RepeatEvery, ScheduledForm } from './v3ProgramModel';

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

/*  The helper line under "When to award".  */
export function whenHelper(f: ScheduledForm): string {
  if (f.occasion === 'anniversary') return 'Awarded once a year on each customer\'s loyalty join date.';
  if (f.repeat === 'none') return `Awarded once on ${fmt(f.awardDate)}.`;
  if (f.repeat === 'year') return `Awarded every year on ${dayMonth(f.awardDate)}.`;
  return `Awarded ${EVERY[f.repeat].toLowerCase()} from ${fmt(f.awardDate)}.`;
}

const n = (v: string) => Number(v) || 0;
const pointWord = (p: number) => (p === 1 ? 'point' : 'points');

/*  "INR 75,000–1,50,000" / "INR 3,00,000 and above".  */
export function rangeLabel(r: RateRange, sep = '–'): string {
  return r.to.trim() === '' ? `INR ${inr(n(r.from))} and above` : `INR ${inr(n(r.from))}${sep}${inr(n(r.to))}`;
}

/*  "INR 75,000–1,50,000 at 1 point per INR 1,000, INR 1,50,000–3,00,000 at 2, …"
    — later ranges drop "per INR X" while they share the first one's step.  */
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

/*  "since the last award" / "in the last 3 months".  */
const PERIOD_PHRASE: Record<PurchasePeriod, string> = {
  '1m': 'in the last month',
  '3m': 'in the last 3 months',
  '6m': 'in the last 6 months',
  '12m': 'in the last 12 months',
};

/*  How many months apart the awards are — anniversary is yearly; a one-off
    (Repeat: None) has no next award, so any period is fine.  */
const PERIOD_MONTHS: Record<PurchasePeriod, number> = { '1m': 1, '3m': 3, '6m': 6, '12m': 12 };
const PERIOD_WORDS: Record<PurchasePeriod, string> = { '1m': 'last 1 month\'s', '3m': 'last 3 months\'', '6m': 'last 6 months\'', '12m': 'last 12 months\'' };

/*  The warning when the purchase period does not match the gap between
    awards: longer, and the same purchases count in more than one award;
    shorter, and purchases in between earn nothing. Null when they match.  */
export function periodMismatch(f: ScheduledForm): string | null {
  const gap = f.occasion === 'anniversary' ? 12 : f.repeat === 'none' ? null : STEP[f.repeat];
  const months = PERIOD_MONTHS[f.purchasePeriod];
  if (gap === null || months === gap) return null;
  const every = f.occasion === 'anniversary' ? 'once a year' : `every ${f.repeat}`;
  return months > gap
    ? `Points are awarded ${every}, but the ${PERIOD_WORDS[f.purchasePeriod]} purchases are counted, so the same purchases will count in more than one award.`
    : `Points are awarded ${every}, but only the ${PERIOD_WORDS[f.purchasePeriod]} purchases are counted, so purchases in between will earn nothing.`;
}

export function summary(f: ScheduledForm): string {
  const on = `purchases ${PERIOD_PHRASE[f.purchasePeriod]}: ${rateList(f.ranges)}`;
  if (f.occasion === 'anniversary') return `On each customer's membership anniversary, they get points on their ${on}.`;

  const lead = f.repeat === 'none' ? `On ${fmt(f.awardDate)}`
    : f.repeat === 'year' ? `Every year on ${dayMonth(f.awardDate)}` : `${EVERY[f.repeat]} from ${fmt(f.awardDate)}`;
  return `${lead}, customers get points on their ${on}.`;
}

/*  The next award on or after today, within the program dates.  */
export function nextAward(f: ScheduledForm, today = todayIso()): string {
  if (f.occasion === 'anniversary') return 'Checked daily';
  if (!parts(f.awardDate)) return '—';
  const { end } = dateBounds(f);

  let k = 0; let next = f.awardDate;
  if (f.repeat === 'none') return f.awardDate >= today ? fmt(f.awardDate) : `Awarded on ${fmt(f.awardDate)}`;
  const step = STEP[f.repeat];
  while (next < today && k < 1200) { k += step; next = shiftPeriod(f.awardDate, k, 'months'); }
  if (end && next > end) return `No more awards — the program ends ${fmt(end)}`;
  return fmt(next);
}

/* ── Validation ────────────────────────────────────────────────────────────── */

export type RangeError = { from?: string; to?: string; forEvery?: string; points?: string };

export type ScheduledErrors = {
  /** Award date missing (custom date). */
  date?: string;
  /** Award date outside the program dates. */
  dateRange?: string;
  amount?: string;
  /** One per range row. */
  ranges: RangeError[];
};

/*  `tried`: Save was attempted, so empty required fields are errors too. The
    rest — From < To, overlaps, an open To above the last row, the date
    range — show as soon as they are true.  */
export function scheduledErrors(f: ScheduledForm, tried = true): ScheduledErrors {
  const e: ScheduledErrors = { ranges: [] };
  const custom = f.occasion === 'custom';
  const positive = (v: string, msg: string) => ((v.trim() !== '' || tried) && !(n(v) > 0) ? msg : undefined);

  if (custom && !f.awardDate && tried) e.date = 'Select the award date.';
  const { start, end } = dateBounds(f);
  if (custom && f.awardDate && start && end && (f.awardDate < start || f.awardDate > end)) {
    e.dateRange = `Award date must be within the program dates (${fmt(start)} – ${fmt(end)}).`;
  }

  {
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
    || e.ranges.some((r) => r.from || r.to || r.forEvery || r.points);
}

/*  The "Try it": points = floor(total ÷ For Every) × points, at the rate of
    the one range the total falls in (From inclusive, To exclusive).  */
export function tryRate(f: ScheduledForm, purchased: number): string {
  const apv = n(f.amountPerPoint);
  const earn = (forEvery: number, pts: number) => Math.floor(purchased / forEvery) * pts;

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
