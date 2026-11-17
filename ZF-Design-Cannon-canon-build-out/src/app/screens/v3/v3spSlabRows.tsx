import { Button, Icon, Inline, InputField, Stack, Text } from '@canon';
import { newId } from './v3Shared';
import type { Slab } from './v3ProgramModel';
import type { SlabError } from './v3spModel';

/*  VERSION 3 — SCHEDULED POINTS only (`v3sp`). Purchase-value slabs.

    A variant of Points per sale's Order Value Range row, drawn the same way —
    INR-prefixed input, the blue double chevron, Points-prefixed input, and a
    tertiary "+" link — but one value per row ("and above") and removable
    rows. Points per sale's row is left exactly as it is.  */

export interface V3spSlabRowsProps {
  slabs: Slab[];
  onChange: (slabs: Slab[]) => void;
  errors: SlabError[];
}

/*  Shown with Indian grouping; the numeric filter strips the commas again on
    the way in, so the stored value stays plain digits.  */
const grouped = (v: string) => (v.trim() === '' ? '' : Number(v).toLocaleString('en-IN'));

function ColumnLabel({ children }: { children: string }) {
  return (
    <Inline gap={1} align="baseline">
      <Text as="span" size="body" weight="medium">{children}</Text>
      <Text as="span" size="body" tone="danger" aria-hidden>*</Text>
    </Inline>
  );
}

export function V3spSlabRows({ slabs, onChange, errors }: V3spSlabRowsProps) {
  const patch = (id: string, p: Partial<Slab>) => onChange(slabs.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const remove = (id: string) => onChange(slabs.filter((s) => s.id !== id));
  //  A new slab is double the last one — a reasonable next step up.
  const add = () => {
    const last = slabs[slabs.length - 1];
    const dbl = (v: string | undefined) => (Number(v) > 0 ? String(Number(v) * 2) : '');
    onChange([...slabs, { id: newId('slab'), from: dbl(last?.from), points: dbl(last?.points) }]);
  };

  return (
    <Stack gap={6}>
      <Stack gap={2}>
        <Inline gap={6} className="flex-nowrap">
          <Stack gap={0} className="w-field-md shrink-0"><ColumnLabel>Purchase value from</ColumnLabel></Stack>
          {/*  The chevron column's width, so the second label sits over its field.  */}
          <Stack gap={0} className="w-control shrink-0" />
          <Stack gap={0} className="w-field-xs shrink-0"><ColumnLabel>Points awarded</ColumnLabel></Stack>
        </Inline>

        <Stack gap={6}>
          {slabs.map((s, i) => {
            const e = errors[i] ?? {};
            return (
              <Stack key={s.id} gap={2}>
                <Inline gap={6} align="center" className="flex-nowrap">
                  <Stack gap={0} className="w-field-md shrink-0">
                    <InputField
                      aria-label={`Slab ${i + 1}, purchase value from, INR, and above`}
                      aria-required
                      error={Boolean(e.from)}
                      format="numeric"
                      prefix="INR"
                      suffix="and above"
                      align="end"
                      value={grouped(s.from)}
                      onChange={(ev) => patch(s.id, { from: ev.target.value })}
                    />
                  </Stack>

                  <Inline gap={0} align="center" justify="center" className="h-control w-control shrink-0">
                    <Icon name="chevron-right" size="md" tone="primary" />
                    <Icon name="chevron-right" size="md" tone="primary" />
                  </Inline>

                  <Stack gap={0} className="w-field-xs shrink-0">
                    <InputField
                      aria-label={`Slab ${i + 1}, points awarded`}
                      aria-required
                      error={Boolean(e.points)}
                      format="numeric"
                      prefix="Points"
                      align="end"
                      value={grouped(s.points)}
                      onChange={(ev) => patch(s.id, { points: ev.target.value })}
                    />
                  </Stack>

                  <Button
                    type="button"
                    emphasis="tertiary"
                    size="md"
                    icon="delete"
                    label={`Remove slab ${i + 1}`}
                    disabled={slabs.length === 1}
                    onClick={() => remove(s.id)}
                  />
                </Inline>
                {e.from || e.points ? (
                  <Text size="body-sm" tone="danger">{e.from ?? e.points}</Text>
                ) : null}
              </Stack>
            );
          })}
        </Stack>
      </Stack>

      <Button type="button" emphasis="tertiary" size="sm" icon="plus-circle" className="self-start -ms-3" onClick={add}>
        Add New Range
      </Button>
    </Stack>
  );
}
