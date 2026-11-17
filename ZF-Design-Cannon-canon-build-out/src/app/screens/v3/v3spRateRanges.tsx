import type { ReactNode } from 'react';
import { Button, Field, Icon, Inline, InputField, RadioGroup, Stack, Text } from '@canon';
import { newId } from './v3Shared';
import type { RateRange, RateType } from './v3ProgramModel';
import type { RangeError } from './v3spModel';

/*  VERSION 3 — SCHEDULED POINTS only (`v3sp`). Points on purchase value.

    A copy of Points per sale's rewarding-rules block (Loyalty Type, Order
    Value Range, For Every → Points Earned, Add New Range), drawn the same way
    but relabelled, and with what that block does not have: several working
    ranges, removable rows, an open-ended last range and validation. The
    Points per sale block is left exactly as it is.  */

export interface V3spRateRangesProps {
  rateType: RateType;
  singleForEvery: string;
  singlePoints: string;
  ranges: RateRange[];
  onChange: (patch: {
    rateType?: RateType; singleForEvery?: string; singlePoints?: string; ranges?: RateRange[];
  }) => void;
  errors: { singleForEvery?: string; singlePoints?: string; ranges: RangeError[] };
}

/*  Shown with Indian grouping; the numeric filter strips the commas again on
    the way in, so the stored value stays plain digits.  */
const grouped = (v: string) => (v.trim() === '' ? '' : Number(v).toLocaleString('en-IN'));

/*  A labelled field on the first row; a bare one, same width, below it.  */
function Cell({ label, show, error, children }: {
  label: string; show: boolean; error?: boolean;
  children: (p: { id?: string; describedBy?: string; required?: boolean }) => ReactNode;
}) {
  if (!show) return <>{children({})}</>;
  return (
    <Field label={label} required error={error}>
      {({ id, required, describedBy }) => children({ id, required, describedBy })}
    </Field>
  );
}

function Chevrons() {
  return (
    <Inline gap={0} align="center" className="h-control">
      <Icon name="chevron-right" size="md" tone="primary" />
      <Icon name="chevron-right" size="md" tone="primary" />
    </Inline>
  );
}

export function V3spRateRanges({ rateType, singleForEvery, singlePoints, ranges, onChange, errors }: V3spRateRangesProps) {
  const multiple = rateType === 'multiple';
  const patch = (id: string, p: Partial<RateRange>) => onChange({ ranges: ranges.map((r) => (r.id === id ? { ...r, ...p } : r)) });
  const remove = (id: string) => onChange({ ranges: ranges.filter((r) => r.id !== id) });
  //  A new range starts where the last one ends, at the same rate step. An
  //  open last range ("and above") is closed first, at double its start, so
  //  only the new row is left open.
  const add = () => {
    const prev = ranges[ranges.length - 1];
    const close = prev && prev.to.trim() === '' && Number(prev.from) > 0 ? String(Number(prev.from) * 2) : null;
    const last = close ? { ...prev, to: close } : prev;
    onChange({
      ranges: [...(close ? [...ranges.slice(0, -1), last] : ranges), {
        id: newId('range'),
        from: last?.to ?? '',
        to: '',
        forEvery: last?.forEvery ?? '',
        points: last && Number(last.points) > 0 ? String(Number(last.points) + 1) : '',
      }],
    });
  };

  return (
    <Stack gap={12}>
      <RadioGroup
        label="Loyalty Type"
        required
        layout="inline"
        value={rateType}
        onChange={(v) => onChange({ rateType: v as RateType })}
        options={[
          { value: 'single', label: 'Single Criteria' },
          { value: 'multiple', label: 'Multiple Criteria' },
        ]}
      />

      {!multiple ? (
        /*  Single Criteria: one rate on any purchase total.  */
        <Stack gap={2}>
          <Inline gap={6} align="end" className="flex-nowrap">
            <Stack gap={0} className="w-field-sm shrink-0">
              <Field label="For Every" required error={Boolean(errors.singleForEvery)}>
                {({ id, required, error, describedBy }) => (
                  <InputField id={id} required={required} error={error} aria-describedby={describedBy} format="numeric" prefix="INR" align="end" value={grouped(singleForEvery)} onChange={(e) => onChange({ singleForEvery: e.target.value })} />
                )}
              </Field>
            </Stack>
            <Chevrons />
            <Stack gap={0} className="w-field-sm shrink-0">
              <Field label="Points awarded" required error={Boolean(errors.singlePoints)}>
                {({ id, required, error, describedBy }) => (
                  <InputField id={id} required={required} error={error} aria-describedby={describedBy} format="numeric" prefix="Points" align="end" value={grouped(singlePoints)} onChange={(e) => onChange({ singlePoints: e.target.value })} />
                )}
              </Field>
            </Stack>
          </Inline>
          {errors.singleForEvery || errors.singlePoints ? (
            <Text size="body-sm" tone="danger">{errors.singleForEvery ?? errors.singlePoints}</Text>
          ) : null}
        </Stack>
      ) : (
        /*  Multiple Criteria: the range rows.  */
        <Stack gap={6}>
          {ranges.map((r, i) => {
            const e = errors.ranges[i] ?? {};
            const first = i === 0;
            const isLast = i === ranges.length - 1;
            const message = e.from ?? e.to ?? e.forEvery ?? e.points;
            return (
              <Stack key={r.id} gap={2}>
                <Inline gap={16} align="end" className="flex-nowrap">
                  <Stack gap={0} className="w-field-md shrink-0">
                    <Cell label="Purchase value range" show={first} error={Boolean(e.from || e.to)}>
                      {({ id, required, describedBy }) => (
                        <Inline gap={0} className="flex-nowrap">
                          <InputField
                            id={id}
                            required={required}
                            aria-describedby={describedBy}
                            aria-label={first ? undefined : `Range ${i + 1}, from, INR`}
                            error={Boolean(e.from)}
                            format="numeric"
                            prefix="INR"
                            align="end"
                            value={grouped(r.from)}
                            onChange={(ev) => patch(r.id, { from: ev.target.value })}
                            className="min-w-0 rounded-e-none border-e-0"
                          />
                          <InputField
                            aria-label={`Range ${i + 1}, to, INR${isLast ? ', leave empty for and above' : ''}`}
                            error={Boolean(e.to)}
                            format="numeric"
                            prefix="To"
                            affix="plain"
                            align="end"
                            placeholder={isLast ? 'and above' : undefined}
                            value={grouped(r.to)}
                            onChange={(ev) => patch(r.id, { to: ev.target.value })}
                            className="min-w-0 rounded-s-none border-s-0"
                          />
                        </Inline>
                      )}
                    </Cell>
                  </Stack>

                  <Inline gap={6} align="end" className="flex-nowrap">
                    {/*  Narrower than Points per sale's 200: with the remove
                         control a row at 200 runs past the card at 1440.  */}
                    <Stack gap={0} className="w-field-unit shrink-0">
                      <Cell label="For Every" show={first} error={Boolean(e.forEvery)}>
                        {({ id, required, describedBy }) => (
                          <InputField id={id} required={required} aria-describedby={describedBy} aria-label={first ? undefined : `Range ${i + 1}, for every, INR`} error={Boolean(e.forEvery)} format="numeric" prefix="INR" align="end" value={grouped(r.forEvery)} onChange={(ev) => patch(r.id, { forEvery: ev.target.value })} />
                        )}
                      </Cell>
                    </Stack>

                    <Chevrons />

                    <Stack gap={0} className="w-field-unit shrink-0">
                      <Cell label="Points awarded" show={first} error={Boolean(e.points)}>
                        {({ id, required, describedBy }) => (
                          <InputField id={id} required={required} aria-describedby={describedBy} aria-label={first ? undefined : `Range ${i + 1}, points awarded`} error={Boolean(e.points)} format="numeric" prefix="Points" align="end" value={grouped(r.points)} onChange={(ev) => patch(r.id, { points: ev.target.value })} />
                        )}
                      </Cell>
                    </Stack>

                    <Button
                      type="button"
                      emphasis="tertiary"
                      size="md"
                      icon="delete"
                      label={`Remove range ${i + 1}`}
                      disabled={ranges.length === 1}
                      onClick={() => remove(r.id)}
                    />
                  </Inline>
                </Inline>
                {message ? <Text size="body-sm" tone="danger">{message}</Text> : null}
              </Stack>
            );
          })}

          <Button type="button" emphasis="tertiary" size="sm" icon="plus-circle" className="self-start -ms-3" onClick={add}>
            Add New Range
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
