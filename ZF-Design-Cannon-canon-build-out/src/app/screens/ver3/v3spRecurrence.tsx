import { useState } from 'react';
import {
  Button, Field, Icon, Inline, InputField, Select, Stack, Text, Tooltip,
} from '@canon';
import type { AwardOnMode, IntervalUnit, WeekOrdinal } from './v3ProgramModel';
import {
  MONTH_NAMES, WEEKDAY_NAMES, WEEK_ORDINALS, intervalOf, isQuarterly, repeatPreset,
} from './v3spModel';
import type { AwardSchedule, RepeatPreset } from './v3spModel';

/*  VERSION 2 (V3 files) — SCHEDULED POINTS only (`v3sp`). When to award:
    a recurrence (always on) trimmed from the Inventory stock-count
    scheduler — Repeat (with an interval set through Change), Award on (a
    day of the month, or the nth weekday; for yearly intervals, in a chosen
    month). No daily or weekly repeat, time of day, expiry or reminder: the
    program start date is the only start control.  */

type Value = AwardSchedule;

export interface V3spRecurrenceProps {
  form: Value;
  onChange: (patch: Partial<Value>) => void;
  /** Date missing, and the first award before the program start date. */
  errors: { date?: string; dateRange?: string };
  /** The ⓘ by Repeat: when, and which purchases each award counts. */
  tip: string;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const PRESETS: { value: RepeatPreset; label: string }[] = [
  { value: 'month', label: 'Every month' },
  { value: 'quarter', label: 'Every quarter' },
  { value: 'year', label: 'Every year' },
];
const PRESET_INTERVAL: Record<Exclude<RepeatPreset, 'none' | 'custom'>, [string, IntervalUnit]> = {
  month: ['1', 'months'], quarter: ['3', 'months'], year: ['1', 'years'],
};

const AWARD_ON_OPTIONS = [
  { value: 'date', label: 'A Specific Date' },
  { value: 'day', label: 'A Specific Day' },
];
const ORDINAL_OPTIONS = WEEK_ORDINALS.map((w) => ({ value: w, label: cap(w) }));
const WEEKDAY_OPTIONS = WEEKDAY_NAMES.map((d, i) => ({ value: String(i), label: d }));
const MONTH_OPTIONS = MONTH_NAMES.map((m, i) => ({ value: String(i), label: m }));
const QUARTER_MONTH_OPTIONS = [
  { value: '0', label: 'First month' },
  { value: '1', label: 'Second month' },
  { value: '2', label: 'Third month' },
];
const UNIT_OPTIONS = [
  { value: 'months', label: 'Month(s)' },
  { value: 'years', label: 'Year(s)' },
];

/*  Words between the selects, on the controls' line.  */
function Words({ children }: { children: string }) {
  return (
    <Inline gap={0} align="center" className="h-control shrink-0">
      <Text size="body" tone="secondary">{children}</Text>
    </Inline>
  );
}

export function V3spRecurrence({ form: f, onChange: set, errors: e, tip }: V3spRecurrenceProps) {
  //  Change: the interval being edited, or null when it is shown as text.
  const [editing, setEditing] = useState<{ count: string; unit: IntervalUnit } | null>(null);

  const preset = repeatPreset(f);
  const { count, unit } = intervalOf(f);
  const unitWord = unit === 'years' ? 'Year(s)' : 'Month(s)';
  const yearly = unit === 'years';
  const repeatOptions = preset === 'custom'
    ? [...PRESETS, { value: 'custom' as const, label: `Every ${count} ${unit}` }]
    : PRESETS;

  const choose = (v: string) => {
    setEditing(null);
    if (v === 'custom') return;
    const [c, u] = PRESET_INTERVAL[v as keyof typeof PRESET_INTERVAL];
    set({ repeats: true, intervalCount: c, intervalUnit: u });
  };

  const confirm = () => {
    if (!editing) return;
    const max = editing.unit === 'years' ? 5 : 12;
    const c = Math.min(max, Math.max(1, Math.round(Number(editing.count)) || 1));
    set({ intervalCount: String(c), intervalUnit: editing.unit });
    setEditing(null);
  };

  return (
    <Stack gap={6}>
      <Stack gap={2}>
        <Inline gap={8} align="end" className="flex-nowrap">
          <Stack gap={0} className="w-field-sm shrink-0">
            <Field label="Repeat" required>
              {({ id, required, describedBy }) => (
                <Select id={id} required={required} ariaDescribedBy={describedBy} value={preset} onChange={choose} options={repeatOptions} />
              )}
            </Field>
          </Stack>
          <Inline gap={0} align="center" className="h-control shrink-0">
            <Tooltip content={tip}>
              <Icon name="info" size="md" tone="subtle" label={tip} />
            </Tooltip>
          </Inline>
        </Inline>

        {/*  "ⓘ Points will be awarded every 3 Month(s)  Change" — the stock-count line.  */}
        {f.repeats ? (
          editing ? (
            //  The number and unit exactly under Repeat, the tick under its ⓘ.
            <Inline gap={8} align="center" className="flex-nowrap">
              <Inline gap={0} className="w-field-sm shrink-0 flex-nowrap">
                <Stack gap={0} className="w-1/3 min-w-0">
                  <InputField
                    aria-label="Repeat every"
                    format="numeric"
                    align="end"
                    value={editing.count}
                    onChange={(ev) => setEditing({ ...editing, count: ev.target.value })}
                    className="rounded-e-none"
                  />
                </Stack>
                <Stack gap={0} className="w-2/3 min-w-0">
                  <Select
                    className="w-full rounded-s-none border-s-0"
                    ariaLabel="Repeat unit"
                    value={editing.unit}
                    onChange={(v) => setEditing({ ...editing, unit: v as IntervalUnit })}
                    options={UNIT_OPTIONS}
                  />
                </Stack>
              </Inline>
              <Button type="button" emphasis="tertiary" size="sm" icon="check-circle" label="Confirm interval" onClick={confirm} />
            </Inline>
          ) : (
            <Inline gap={2} align="center" className="flex-nowrap">
              <Icon name="info" size="sm" tone="subtle" />
              <Text size="body-sm" tone="secondary">
                Points will be awarded every <Text as="span" size="body-sm" weight="semibold">{`${count} ${unitWord}`}</Text>
              </Text>
              <Button type="button" emphasis="tertiary" size="sm" onClick={() => setEditing({ count: String(count), unit })}>Change</Button>
            </Inline>
          )
        ) : null}
      </Stack>

      {/*  Award on — a day of the month, or the nth weekday.  */}
      {f.repeats ? (
        <Inline gap={4} align="end" className="flex-nowrap">
          <Stack gap={0} className="w-field-sm shrink-0">
            <Field label="Award on" required>
              {({ id, required, describedBy }) => (
                <Select id={id} required={required} ariaDescribedBy={describedBy} value={f.awardOn} onChange={(v) => set({ awardOn: v as AwardOnMode })} options={AWARD_ON_OPTIONS} />
              )}
            </Field>
          </Stack>

          {f.awardOn === 'date' ? (
            <>
              {/*  "On [January] [1]" — or, monthly, "On day [1]". Day 1–28.  */}
              <Words>{yearly ? 'On' : 'On day'}</Words>
              {yearly ? <Stack gap={0} className="w-field-unit shrink-0"><Select className="w-full" ariaLabel="Month" value={String(f.awardMonth)} onChange={(v) => set({ awardMonth: Number(v) })} options={MONTH_OPTIONS} /></Stack> : null}
              <Stack gap={0} className="w-field-num shrink-0">
                <InputField
                  aria-label="Day of the month, 1 to 28"
                  format="numeric"
                  align="end"
                  value={f.awardDay}
                  onChange={(ev) => set({ awardDay: ev.target.value })}
                  onBlur={() => set({ awardDay: String(Math.min(28, Math.max(1, Math.round(Number(f.awardDay)) || 1))) })}
                />
              </Stack>
            </>
          ) : (
            <>
              <Stack gap={0} className="w-field-unit shrink-0"><Select className="w-full" ariaLabel="Which week" value={f.awardWeek} onChange={(v) => set({ awardWeek: v as WeekOrdinal })} options={ORDINAL_OPTIONS} /></Stack>
              <Stack gap={0} className="w-field-unit shrink-0"><Select className="w-full" ariaLabel="Weekday" value={String(f.awardWeekday)} onChange={(v) => set({ awardWeekday: Number(v) })} options={WEEKDAY_OPTIONS} /></Stack>
              {yearly ? <Words>of</Words> : null}
              {yearly ? <Stack gap={0} className="w-field-unit shrink-0"><Select className="w-full" ariaLabel="Month" value={String(f.awardMonth)} onChange={(v) => set({ awardMonth: Number(v) })} options={MONTH_OPTIONS} /></Stack> : null}
            </>
          )}

          {/*  Every quarter: which month of each quarter, the row's last field.  */}
          {isQuarterly(f) ? (
            <>
              <Words>of</Words>
              <Stack gap={0} className="w-field-sm shrink-0">
                <Select className="w-full" ariaLabel="Month of each quarter" value={String(f.quarterMonth ?? 0)} onChange={(v) => set({ quarterMonth: Number(v) })} options={QUARTER_MONTH_OPTIONS} />
              </Stack>
            </>
          ) : null}
        </Inline>
      ) : null}

      {e.dateRange ? <Text size="body-sm" tone="danger">{e.dateRange}</Text> : null}
    </Stack>
  );
}
