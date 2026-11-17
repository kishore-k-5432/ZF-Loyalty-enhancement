import { Checkbox, DatePicker, Field, Inline, Stack, Surface, Text, Toggle } from '@canon';
import type { ScheduleDates } from './v3ProgramModel';

/*  VERSION 3 — the right rail's Schedule Program card, as in V2, shared by
    both program types. `error` is an extra message under the dates (the
    scheduled-points "within the target program" check).  */

export interface V3SchedulePanelProps {
  value: ScheduleDates;
  onChange: (patch: Partial<ScheduleDates>) => void;
  error?: string;
}

export function V3SchedulePanel({ value: d, onChange, error }: V3SchedulePanelProps) {
  return (
    <Surface tone="sunken" radius="xl" pad={12}>
      <Stack gap={10}>
        <Text as="h2" size="subheading" weight="regular">Schedule Program</Text>

        <Stack gap={8}>
          <Inline gap={6} justify="between" align="start" className="flex-nowrap">
            <Stack gap={2} className="min-w-0">
              <Text size="body" weight="semibold">Program Dates</Text>
              <Text size="body" tone="secondary">Set when the loyalty program should start and end.</Text>
            </Stack>
            <Toggle label="Enabled" labelPlacement="top" size="sm" checked={d.programDates} onCheckedChange={(v) => onChange({ programDates: v })} />
          </Inline>

          {d.programDates ? (
            <>
              <Field label="Program Start Date" required disabled={d.neverExpire}>
                {({ id, required, describedBy }) => (
                  <DatePicker id={id} required={required} ariaDescribedBy={describedBy} disabled={d.neverExpire} error={Boolean(error)} value={d.programStart} onChange={(v) => onChange({ programStart: v })} />
                )}
              </Field>

              <Field label="Program End Date" required disabled={d.neverExpire}>
                {({ id, required, describedBy }) => (
                  <DatePicker id={id} required={required} ariaDescribedBy={describedBy} disabled={d.neverExpire} error={Boolean(error)} min={d.programStart} value={d.programEnd} onChange={(v) => onChange({ programEnd: v })} />
                )}
              </Field>

              <Checkbox
                label="Never Expire"
                description="The program will remain active indefinitely."
                selection={d.neverExpire ? 'checked' : 'unchecked'}
                onSelectionChange={(next) => onChange({ neverExpire: next === 'checked' })}
              />
            </>
          ) : null}

          {error ? <Text size="body-sm" tone="danger">{error}</Text> : null}
        </Stack>
      </Stack>
    </Surface>
  );
}
