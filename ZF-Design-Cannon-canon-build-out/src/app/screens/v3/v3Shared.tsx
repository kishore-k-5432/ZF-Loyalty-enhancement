import type { ReactNode } from 'react';
import type { IconName } from '@canon';
import { Divider, Icon, Inline, Stack, StatusBadge, Surface, Text } from '@canon';

/*  VERSION 3 — shared helpers for the V3 screens.

    These are V3-ONLY copies of the private helpers in LoyaltyV2.tsx (InfoTip,
    OptionCard, RuleRow, CheckRow, fmt, period, minusPeriod), extended where V3
    needs it (weeks as a unit). V1 and V2 are never imported from or changed —
    a later V2 fix reaches V3 only when it is copied across on purpose.  */

export const AMOUNT_PER_POINT = 10;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* ── Dates — ISO `YYYY-MM-DD` strings, shown as "16 Nov 2024" ─────────────── */

function parse(iso: string): Date | null {
  const r = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return r ? new Date(Number(r[1]), Number(r[2]) - 1, Number(r[3])) : null;
}

export function toIso(dt: Date): string {
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export function todayIso(): string {
  return toIso(new Date());
}

export function v3Fmt(iso: string): string {
  const d = parse(iso);
  return d ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : '—';
}

/*  "1 months" reads wrong to a cashier, so a single unit drops the plural.  */
export function v3Period(n: string, unit: string): string {
  const count = n.trim() || '—';
  return `${count} ${count === '1' ? unit.replace(/s$/, '') : unit}`;
}

/*  Shift a date by ±k units. Weeks are 7 days.  */
export function shiftPeriod(iso: string, k: number, unit: string): string {
  const d = parse(iso);
  if (!d || !Number.isFinite(k)) return '';
  const y = d.getFullYear(); const m = d.getMonth(); const day = d.getDate();
  const dt = unit === 'days' ? new Date(y, m, day + k)
    : unit === 'weeks' ? new Date(y, m, day + k * 7)
      : unit === 'months' ? new Date(y, m + k, day) : new Date(y + k, m, day);
  return toIso(dt);
}

/*  The checkout date minus the expiry period: points earned before it are gone.  */
export function v3MinusPeriod(iso: string, n: string, unit: string): string {
  const k = Number(n);
  return k ? shiftPeriod(iso, -k, unit) : '';
}

/*  Rough length in days, only for comparing two durations (weeks = 7,
    months = 30, years = 365).  */
export function toDays(n: string, unit: string): number {
  const k = Number(n) || 0;
  return unit === 'weeks' ? k * 7 : unit === 'months' ? k * 30 : unit === 'years' ? k * 365 : k;
}

/*  Day 1–28, clamped. An empty or invalid entry falls back to 1.  */
export function clampDay(v: string): number {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 28) : 1;
}

/*  "On a fixed date each period": the batch earned on `earned` unlocks on
    day `day` of the month after its month (Monthly), or of the first month of
    the next quarter (Quarterly).  */
export function fixedReleaseDate(earned: string, frequency: string, day: number): string {
  const d = parse(earned);
  if (!d) return '';
  const m = d.getMonth();
  const next = frequency === 'quarterly' ? (Math.floor(m / 3) + 1) * 3 : m + 1;
  return toIso(new Date(d.getFullYear(), next, day));
}

/* ── Shared look — V3 copies of V2's private components ───────────────────── */

/*  The ⓘ beside a field. A native `title` gives the hover tooltip; the icon's
    `label` is what a screen reader announces.  */
export function V3InfoTip({ tip }: { tip: string }) {
  return (
    <Inline gap={0} align="center" className="h-control">
      <Text as="span" title={tip} className="cursor-help">
        <Icon name="info" size="md" tone="subtle" label={tip} />
      </Text>
    </Inline>
  );
}

export function V3OptionCard({ title, icon, children }: { title: string; icon: IconName; children: ReactNode }) {
  return (
    <Surface radius="card" border="default" pad={12}>
      <Stack gap={0}>
        <Inline gap={5} align="center" className="flex-nowrap">
          <Icon name={icon} size="lg" tone="primary" />
          <Text as="h3" size="subheading" weight="regular">{title}</Text>
        </Inline>
        <Divider gap="none" className="my-10" />
        <Stack gap={10}>{children}</Stack>
      </Stack>
    </Surface>
  );
}

export function V3RuleRow({ icon, label, value, on }: { icon: IconName; label: string; value: string; on: boolean }) {
  return (
    <Inline gap={6} align="center" className="flex-nowrap px-6 py-5">
      <Surface tone={on ? 'default' : 'sunken'} radius="full" border="divider" pad={4} className="shrink-0">
        <Icon name={icon} size="sm" tone={on ? 'primary' : 'disabled'} />
      </Surface>
      <Stack gap={0} className="min-w-0 flex-1">
        <Text size="overline" tone="tertiary">{label}</Text>
        <Text size="body" weight="medium" tone={on ? 'default' : 'secondary'}>{value}</Text>
      </Stack>
      <StatusBadge status={on ? 'success' : 'inactive'}>{on ? 'On' : 'Off'}</StatusBadge>
    </Inline>
  );
}

export type V3Check = { state: 'pass' | 'fail' | 'info'; title: string; detail: string };

const CHECK_ICON: Record<V3Check['state'], { name: IconName; tone: 'success' | 'danger' | 'primary' }> = {
  pass: { name: 'check-circle', tone: 'success' },
  fail: { name: 'x-circle', tone: 'danger' },
  info: { name: 'info', tone: 'primary' },
};

export function V3CheckRow({ check, children }: { check: V3Check; children?: ReactNode }) {
  const icon = CHECK_ICON[check.state];
  return (
    <Inline gap={4} align="start" className="flex-nowrap">
      <Inline gap={0} align="center" className="h-10 shrink-0">
        <Icon name={icon.name} size="md" tone={icon.tone} />
      </Inline>
      <Stack gap={1} className="min-w-0 flex-1">
        <Text size="body" weight="medium">{check.title}</Text>
        <Text size="body-sm" tone="secondary">{check.detail}</Text>
        {children}
      </Stack>
    </Inline>
  );
}

/*  A label over a value — the scheduled-points preview's rows, without the
    On/Off badge that V3RuleRow carries.  */
export function V3PreviewRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <Inline gap={6} align="center" className="flex-nowrap px-6 py-5">
      <Surface tone="default" radius="full" border="divider" pad={4} className="shrink-0">
        <Icon name={icon} size="sm" tone="primary" />
      </Surface>
      <Stack gap={0} className="min-w-0 flex-1">
        <Text size="overline" tone="tertiary">{label}</Text>
        <Text size="body" weight="medium">{value}</Text>
      </Stack>
    </Inline>
  );
}

/* ── Criteria rows (used by v3CriteriaBuilder) ─────────────────────────────── */

export type CriteriaRow = {
  id: string;
  /** How this row joins the one before it. Ignored on the first row. */
  join: 'AND' | 'OR';
  field: string;
  comparator: string;
  /** A number as text, or the chosen chips. */
  value: string;
  values: string[];
};

let seq = 0;
export function newId(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

export function blankCriteriaRow(): CriteriaRow {
  return { id: newId('c'), join: 'AND', field: '', comparator: '', value: '', values: [] };
}

/* ── Schedules ────────────────────────────────────────────────────────────── */

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function orderedDays(days: string[]): string[] {
  return WEEKDAYS.filter((d) => days.includes(d));
}

export type TriggerValue = {
  trigger: 'recurring' | 'birthday' | 'anniversary';
  frequency: 'daily' | 'weekly' | 'monthly';
  weekdays: string[];
  monthDay: string;
};

/*  The next date a recurring trigger fires: the first matching day after
    today, never before `start`, and "Ended" past `end`. Birthday and
    anniversary triggers are checked every day, so they have no single date.  */
export function nextRun(t: TriggerValue, start: string, end: string, today = todayIso()): string {
  if (t.trigger !== 'recurring') return 'Checked daily';
  const tomorrow = shiftPeriod(today, 1, 'days');
  let from = start && start > tomorrow ? start : tomorrow;
  let date = '';
  for (let i = 0; i < 400 && !date; i += 1) {
    const d = parse(from);
    if (!d) return '—';
    const weekday = WEEKDAYS[(d.getDay() + 6) % 7];
    const hit = t.frequency === 'daily'
      || (t.frequency === 'weekly' && t.weekdays.includes(weekday))
      || (t.frequency === 'monthly' && d.getDate() === clampDay(t.monthDay));
    if (hit) date = from;
    else from = shiftPeriod(from, 1, 'days');
  }
  if (!date) return '—';
  if (end && date > end) return 'Ended';
  return v3Fmt(date);
}
