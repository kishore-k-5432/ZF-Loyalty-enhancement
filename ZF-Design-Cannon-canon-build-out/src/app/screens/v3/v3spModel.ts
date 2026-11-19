import { shiftPeriod, toIso, todayIso, v3Fmt as fmt } from './v3Shared';
import { dateBounds } from './v3ProgramModel';
import type { RateRange, Recurrence, ScheduledForm, WeekOrdinal } from './v3ProgramModel';

/*  What the award dates depend on.  */
export type AwardSchedule = Recurrence & { awardDate: string; programStart: string };

/*  Where the schedule starts: the program start date (it always repeats;
    there is no award date or Starts on).  */
export function anchor(f: AwardSchedule): string {
  return f.programStart;
}

/*  VERSION 3 — SCHEDULED POINTS only (`v3sp`). The copy, dates and checks
    behind V3ScheduledBody. Nothing in Points per sale reads this file.  */

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const WEEK_ORDINALS: WeekOrdinal[] = ['first', 'second', 'third', 'fourth', 'last'];

/*  Indian digit grouping — 1,80,000.  */
export function inr(n: number): string {
  return n.toLocaleString('en-IN');
}

function parts(iso: string): [number, number, number] | null {
  const r = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return r ? [Number(r[1]), Number(r[2]) - 1, Number(r[3])] : null;
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

/* ── Recurrence (`v3spRecurrence`) ──────────────────────────────────────────── */

/*  The interval, clamped to its range: 1–12 months, 1–5 years.  */
export function intervalOf(r: Recurrence): { count: number; unit: Recurrence['intervalUnit'] } {
  const max = r.intervalUnit === 'years' ? 5 : 12;
  return { count: Math.min(max, Math.max(1, Math.round(n(r.intervalCount)) || 1)), unit: r.intervalUnit };
}

/*  The interval in months — quarter 3, year 12.  */
export function intervalMonths(r: Recurrence): number {
  const { count, unit } = intervalOf(r);
  return unit === 'years' ? count * 12 : count;
}

/*  The Repeat dropdown's value: the three presets, or 'custom' for any other
    interval set through Change.  */
export type RepeatPreset = 'none' | 'month' | 'quarter' | 'year' | 'custom';
export function repeatPreset(r: Recurrence): RepeatPreset {
  if (!r.repeats) return 'none';
  const { count, unit } = intervalOf(r);
  if (unit === 'months' && count === 1) return 'month';
  if (unit === 'months' && count === 3) return 'quarter';
  if (unit === 'years' && count === 1) return 'year';
  return 'custom';
}

/*  Every quarter — set from the dropdown or as 3 months through Change.
    Its awards fall in one month of each calendar quarter.  */
export function isQuarterly(r: Recurrence): boolean {
  const { count, unit } = intervalOf(r);
  return r.repeats && unit === 'months' && count === 3;
}
export const QUARTER_MONTH_WORDS = ['first', 'second', 'third'];

/*  "every month" / "every 3 months" / "every year" / "every 2 years".  */
export function everyPhrase(r: Recurrence): string {
  const { count, unit } = intervalOf(r);
  const one = unit === 'years' ? 'year' : 'month';
  return count === 1 ? `every ${one}` : `every ${count} ${one}s`;
}

const clampDay = (v: string) => Math.min(28, Math.max(1, Math.round(n(v)) || 1));

/*  "on day 1" / "on day 25 of October" / "on the first Sunday" /
    "on the last Friday of March".  */
export function awardOnPhrase(r: Recurrence): string {
  const yearly = r.intervalUnit === 'years';
  const ofMonth = yearly ? ` of ${MONTH_NAMES[r.awardMonth]}`
    : isQuarterly(r) ? ` of the ${QUARTER_MONTH_WORDS[r.quarterMonth] ?? 'first'} month of each quarter` : '';
  return r.awardOn === 'date'
    ? `on day ${clampDay(r.awardDay)}${ofMonth}`
    : `on the ${r.awardWeek} ${WEEKDAY_NAMES[r.awardWeekday]}${ofMonth}`;
}

/*  The award day inside one calendar month.  */
function dayIn(r: Recurrence, y: number, m: number): Date {
  if (r.awardOn === 'date') return new Date(y, m, clampDay(r.awardDay));
  if (r.awardWeek === 'last') {
    const last = new Date(y, m + 1, 0);
    return new Date(y, m, last.getDate() - ((last.getDay() - r.awardWeekday + 7) % 7));
  }
  const first = new Date(y, m, 1);
  const offset = (r.awardWeekday - first.getDay() + 7) % 7;
  return new Date(y, m, 1 + offset + 7 * WEEK_ORDINALS.indexOf(r.awardWeek));
}

/*  The first `count` award dates. Not repeating: the one date. Repeating:
    the first matching day AFTER the program start date (an award on the
    start day would count no purchases; for yearly intervals, in the chosen
    month), then one per interval from that month.  */
export function occurrences(f: AwardSchedule, count: number): string[] {
  const p = parts(anchor(f));
  if (!p) return [];
  if (!f.repeats) return [anchor(f)];
  const yearly = f.intervalUnit === 'years';
  const quarterly = isQuarterly(f);
  //  Find the first period whose award day is after the program start. Yearly
  //  awards sit in the chosen month, quarterly ones in the chosen month of
  //  each calendar quarter; others in any month.
  let y = p[0];
  let m = yearly ? f.awardMonth : quarterly ? Math.floor(p[1] / 3) * 3 + (f.quarterMonth || 0) : p[1];
  const hop = yearly ? 12 : quarterly ? 3 : 1;
  for (let guard = 0; guard < 24 && toIso(dayIn(f, y, m)) <= anchor(f); guard += 1) {
    m += hop; if (m > 11) { m -= 12; y += 1; }
  }
  const step = intervalMonths(f);
  const out: string[] = [];
  for (let k = 0; k < count; k += 1) {
    const t = m + k * step;
    out.push(toIso(dayIn(f, y + Math.floor(t / 12), ((t % 12) + 12) % 12)));
  }
  return out;
}

/*  The first award date (the one validated against the program start).  */
export function firstAward(f: AwardSchedule): string | null {
  return occurrences(f, 1)[0] ?? null;
}

/*  "First award: 1 Jan 2027 · Next: 1 Apr 2027".  */
export function firstNextLine(f: AwardSchedule): string | null {
  if (!f.repeats) return null;
  const [a, b] = occurrences(f, 2);
  return a && b ? `First award: ${fmt(a)} · Next: ${fmt(b)}` : null;
}

/*  "Awarded every 3 months on day 1, from 1 Jan 2027."  */
export function whenHelper(f: ScheduledForm): string {
  if (!parts(anchor(f))) return f.repeats ? 'Set the program start date to see when points are awarded.' : 'Set the date to see when points are awarded.';
  if (!f.repeats) return `Awarded once, on ${fmt(anchor(f))}.`;
  return `Awarded ${everyPhrase(f)} ${awardOnPhrase(f)}, from ${fmt(firstAward(f) ?? anchor(f))}.`;
}

const dayBefore = (iso: string) => shiftPeriod(iso, -1, 'days');

/*  Which purchases the award at `index` counts. The first counts from the
    program start date to the day before it; each later one counts from the
    previous award date — the real one, so nth-weekday gaps are exact — to
    the day before.  */
function windowFor(f: ScheduledForm, dates: string[], index: number): { from: string; to: string } | null {
  const award = dates[index];
  if (!award) return null;
  const from = index === 0 ? f.programStart : dates[index - 1];
  return from && from < award ? { from, to: dayBefore(award) } : null;
}

/*  The ⓘ by Repeat: when, then which purchases each award counts.  */
export function purchaseWindowNote(f: ScheduledForm): string[] {
  if (!parts(anchor(f))) return [f.repeats ? 'Set the program start date to see which purchases each award counts.' : 'Set the date to see which purchases each award counts.'];
  const dates = occurrences(f, 2);
  const first = windowFor(f, dates, 0);
  const lines = [whenHelper(f)];
  lines.push(first
    ? `For the ${fmt(dates[0])} award: ${fmt(first.from)} – ${fmt(first.to)} (from the program start date).`
    : `The ${fmt(dates[0])} award counts purchases from the program start date to the day before.`);
  const second = windowFor(f, dates, 1);
  if (f.repeats && second) lines.push(`After that, each award counts purchases since the previous award. For the ${fmt(dates[1])} award: ${fmt(second.from)} – ${fmt(second.to)}.`);
  return lines;
}

export function summary(f: ScheduledForm): string {
  const lead = !f.repeats ? `On ${fmt(anchor(f))}`
    : `${everyPhrase(f).replace(/^e/, 'E')} ${awardOnPhrase(f)}, from ${fmt(firstAward(f) ?? anchor(f))}`;
  const rate = f.loyaltyType === 'single' ? ` at ${singleRate(f)}` : `: ${rateList(f.ranges)}`;
  return `${lead}, customers get points on their purchase value${rate}.`;
}

/*  The index of the next award on or after today, with the dates up to it.  */
function upcoming(f: ScheduledForm, today: string): { dates: string[]; index: number } {
  if (!f.repeats) return { dates: [anchor(f)], index: 0 };
  for (let k = 2; k <= 1200; k *= 2) {
    const dates = occurrences(f, k);
    const index = dates.findIndex((d) => d >= today);
    if (index >= 0) return { dates, index };
  }
  return { dates: [], index: -1 };
}

/*  The next award on or after today.  */
export function nextAward(f: ScheduledForm, today = todayIso()): string {
  if (!parts(anchor(f))) return '—';
  if (!f.repeats) return anchor(f) >= today ? fmt(anchor(f)) : `Awarded on ${fmt(anchor(f))}`;
  const { dates, index } = upcoming(f, today);
  const { end } = dateBounds(f);
  if (index >= 0 && end && dates[index] > end) return `None — the program ends on ${fmt(end)}`;
  return index >= 0 ? fmt(dates[index]) : '—';
}

/*  Under Award on: the next `count` awards from today, each with the
    purchases it counts. Stops at the program end date.  */
export type AwardWindow = { award: string; from: string; to: string };
export function upcomingWindows(f: ScheduledForm, count = 3, today = todayIso()): AwardWindow[] {
  if (!parts(anchor(f))) return [];
  const { index } = upcoming(f, today);
  if (index < 0) return [];
  const dates = f.repeats ? occurrences(f, index + count) : [anchor(f)];
  const { end } = dateBounds(f);
  const out: AwardWindow[] = [];
  for (let i = index; i < dates.length && out.length < count; i += 1) {
    if (end && dates[i] > end) break;
    const w = windowFor(f, dates, i);
    if (w) out.push({ award: dates[i], ...w });
  }
  return out;
}

/*  The purchases the next award (on or after today) counts.  */
export function nextAwardCounts(f: ScheduledForm, today = todayIso()): string {
  if (!parts(anchor(f))) return '—';
  const { dates, index } = upcoming(f, today);
  const w = index >= 0 ? windowFor(f, dates, f.repeats ? index : 0) : null;
  return w ? `${fmt(w.from)} – ${fmt(w.to)}` : 'From the program start date';
}

/* ── Validation ────────────────────────────────────────────────────────────── */

export type RangeError = { from?: string; to?: string; forEvery?: string; points?: string };

export type ScheduledErrors = {
  /** Award date missing. */
  date?: string;
  /** First award before the program start date. */
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

  const { start, end } = dateBounds(f);
  const first = firstAward(f);
  if (first && start && first < start) {
    e.dateRange = `First award can't be before the program start date (${fmt(start)}).`;
  } else if (first && end && first > end) {
    e.dateRange = `First award can't be after the program end date (${fmt(end)}).`;
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
