import { shiftPeriod, todayIso, v3Fmt as fmt } from './v3Shared';
import { dateBounds } from './v3ProgramModel';
import type { RepeatEvery, ScheduledForm, Slab } from './v3ProgramModel';

/*  VERSION 3 — SCHEDULED POINTS only (`v3sp`). The copy, dates and checks
    behind V3ScheduledBody. Nothing in Points per sale reads this file.  */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STEP: Record<RepeatEvery, number> = { month: 1, quarter: 3, year: 12 };
const EVERY: Record<RepeatEvery, string> = { month: 'Every month', quarter: 'Every quarter', year: 'Every year' };

export const SLAB_ORDER_ERROR = 'Each slab must be higher than the one above it.';

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
  if (f.repeat === 'year') return `Awarded every year on ${dayMonth(f.awardDate)}.`;
  return `Awarded ${EVERY[f.repeat].toLowerCase()} from ${fmt(f.awardDate)}.`;
}

/*  "Purchases counted: <period>".  */
export function purchasePeriod(f: ScheduledForm): string {
  if (f.occasion === 'anniversary') return 'the customer\'s last membership year (12 months before their anniversary)';
  if (f.repeat === 'month') return 'the previous month';
  if (f.repeat === 'year') return 'the previous 12 months';
  const p = parts(f.awardDate);
  if (!p) return 'the previous quarter';
  const first = MONTHS[(p[1] + 9) % 12]; const last = MONTHS[(p[1] + 11) % 12];
  return `the previous quarter (${first}–${last} for the ${dayMonth(f.awardDate)} award)`;
}

/*  Slabs that have both numbers, as "INR 75,000+ → 100, …".  */
export function slabList(slabs: Slab[]): string {
  return slabs
    .filter((s) => Number(s.from) > 0 && Number(s.points) > 0)
    .map((s) => `INR ${inr(Number(s.from))}+ → ${inr(Number(s.points))}`)
    .join(', ');
}

export function summary(f: ScheduledForm): string {
  const list = slabList(f.slabs) || 'no slabs set';

  if (f.occasion === 'anniversary') {
    return `On each customer's membership anniversary, they get points based on their last membership year's purchases: ${list}.`;
  }

  const lead = f.repeat === 'year' ? `Every year on ${dayMonth(f.awardDate)}` : `${EVERY[f.repeat]} from ${fmt(f.awardDate)}`;
  const last = f.repeat === 'month' ? 'last month\'s' : f.repeat === 'quarter' ? 'last quarter\'s' : 'the last 12 months\'';
  return `${lead}, customers get points based on ${last} purchases: ${list}.`;
}

/*  The next award on or after today, within the program dates.  */
export function nextAward(f: ScheduledForm, today = todayIso()): string {
  if (f.occasion === 'anniversary') return 'Checked daily';
  if (!parts(f.awardDate)) return '—';
  const { end } = dateBounds(f);

  let k = 0; let next = f.awardDate;
  while (next < today && k < 1200) { k += STEP[f.repeat]; next = shiftPeriod(f.awardDate, k, 'months'); }
  if (end && next > end) return `No more awards — the program ends ${fmt(end)}`;
  return fmt(next);
}

/* ── Validation ────────────────────────────────────────────────────────────── */

export type SlabError = { from?: string; points?: string };

export type ScheduledErrors = {
  /** Award date missing (custom date). */
  date?: string;
  /** Award date outside the program dates. */
  dateRange?: string;
  amount?: string;
  slabs: SlabError[];
};

/*  `tried`: Save was attempted, so empty required fields are errors too. The
    rest — slab order, the date range — show as soon as they are true.  */
export function scheduledErrors(f: ScheduledForm, tried = true): ScheduledErrors {
  const e: ScheduledErrors = { slabs: [] };
  const custom = f.occasion === 'custom';

  if (custom && !f.awardDate && tried) e.date = 'Select the award date.';
  const { start, end } = dateBounds(f);
  if (custom && f.awardDate && start && end && (f.awardDate < start || f.awardDate > end)) {
    e.dateRange = `Award date must be within the program dates (${fmt(start)} – ${fmt(end)}).`;
  }

  {
    e.slabs = f.slabs.map((s, i) => {
      const se: SlabError = {};
      const prev = i > 0 ? Number(f.slabs[i - 1].from) : 0;
      if (s.from.trim() === '') { if (tried) se.from = 'Enter a purchase value.'; }
      else if (i > 0 && f.slabs[i - 1].from.trim() !== '' && Number(s.from) <= prev) se.from = SLAB_ORDER_ERROR;
      if (s.points.trim() !== '' || tried) { if (!(Number(s.points) > 0)) se.points = 'Points must be greater than 0.'; }
      return se;
    });
  }

  if (!(Number(f.amountPerPoint) > 0) && tried) e.amount = 'Enter the value of one point.';

  return e;
}

export function hasErrors(e: ScheduledErrors): boolean {
  return Boolean(e.date || e.dateRange || e.amount)
    || e.slabs.some((s) => s.from || s.points);
}

/*  The checkout-style "Try it": which slab a purchase reaches.  */
export function trySlab(slabs: Slab[], purchased: number, amountPerPoint: number): string {
  const valid = slabs
    .map((s) => ({ from: Number(s.from), points: Number(s.points) }))
    .filter((s) => s.from > 0 && s.points > 0);
  if (valid.length === 0) return 'Add a slab to see what a customer gets.';
  let hit = -1;
  valid.forEach((s, i) => { if (purchased >= s.from && (hit < 0 || s.from >= valid[hit].from)) hit = i; });
  if (hit < 0) {
    const first = Math.min(...valid.map((s) => s.from));
    return `Below the first slab, so no points. Needs INR ${inr(first - purchased)} more.`;
  }
  const s = valid[hit];
  const higher = valid.filter((x) => x.from > s.from).sort((a, b) => a.from - b.from)[0];
  const more = higher ? ` INR ${inr(higher.from - purchased)} more would have earned ${inr(higher.points)}.` : '';
  return `Reached the INR ${inr(s.from)}+ slab → ${inr(s.points)} points (INR ${inr(s.points * amountPerPoint)}).${more}`;
}
