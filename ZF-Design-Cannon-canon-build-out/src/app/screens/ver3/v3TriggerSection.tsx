import { Field, Inline, InputField, Pill, RadioGroup, Segmented, Stack } from '@canon';
import { WEEKDAYS, clampDay } from './v3Shared';
import type { TriggerValue } from './v3Shared';

/*  VERSION 3 — the trigger ("When should points be awarded?") of a Scheduled
    points program. It is the first part of that program's Points Rewarding
    Rules card — the date-based counterpart of a sale's order value ranges.
    It draws no card of its own.

    PROVISIONAL: the trigger design is expected to change, so it is isolated
    here — it takes a TriggerValue and reports patches, and nothing else in V3
    depends on how it is drawn.  */

export interface V3TriggerSectionProps {
  value: TriggerValue;
  onChange: (patch: Partial<TriggerValue>) => void;
}

export function V3TriggerSection({ value: t, onChange }: V3TriggerSectionProps) {
  return (
    <Stack gap={0} className="max-w-settings-option-panel">
        <RadioGroup
          label="When should points be awarded?"
          required
          variant="tile"
          layout="stacked"
          value={t.trigger}
          onChange={(v) => onChange({ trigger: v as TriggerValue['trigger'] })}
          options={[
            {
              value: 'recurring',
              label: 'Recurring',
              description: 'Award points on a repeating schedule.',
              detail: t.trigger === 'recurring' ? (
                <Stack gap={6}>
                  <Segmented
                    size="sm"
                    label="Repeat"
                    className="self-start"
                    value={t.frequency}
                    onChange={(v) => onChange({ frequency: v as TriggerValue['frequency'] })}
                    options={[
                      { value: 'daily', label: 'Daily' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'monthly', label: 'Monthly' },
                    ]}
                  />
                  {t.frequency === 'weekly' ? (
                    <Inline gap={2} wrap>
                      {WEEKDAYS.map((d) => (
                        <Pill
                          key={d}
                          label={d}
                          selected={t.weekdays.includes(d)}
                          onSelectedChange={(on) => onChange({ weekdays: on ? [...t.weekdays, d] : t.weekdays.filter((x) => x !== d) })}
                        />
                      ))}
                    </Inline>
                  ) : null}
                  {t.frequency === 'monthly' ? (
                    <Stack gap={0} className="w-field-xs">
                      <Field label="On day" message="1–28" showMessage>
                        {({ id, describedBy }) => (
                          <InputField
                            id={id}
                            aria-describedby={describedBy}
                            format="numeric"
                            align="end"
                            value={t.monthDay}
                            onChange={(e) => onChange({ monthDay: e.target.value })}
                            onBlur={() => onChange({ monthDay: String(clampDay(t.monthDay)) })}
                          />
                        )}
                      </Field>
                    </Stack>
                  ) : null}
                </Stack>
              ) : undefined,
            },
            {
              value: 'birthday',
              label: 'Customer\'s birthday',
              description: 'Award points once a year on the customer\'s date of birth. Customers without a date of birth are skipped.',
            },
            {
              value: 'anniversary',
              label: 'Membership anniversary',
              description: 'Award points once a year on the date the customer joined the loyalty program.',
            },
          ]}
        />
    </Stack>
  );
}
