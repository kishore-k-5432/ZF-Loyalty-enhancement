import { Button, Icon, Inline, InputField, Pill, Select, Stack, Surface, Text } from '@canon';
import { blankCriteriaRow } from './v3Shared';
import type { CriteriaRow } from './v3Shared';

/*  VERSION 3 — the conditions builder on New / Edit Campaign.

    Composed from canon parts only: numbered rows of
    [index | field | comparator | value | + | trash], an AND/OR join between
    rows, "+ Add More", and a CRITERIA PATTERN bar. The multiselect value is a
    row of toggle Pills — the canon has no multiselect-with-chips dropdown yet.
    The pencil on the pattern bar is decoration in this POC.  */

type FieldDef = {
  value: string;
  label: string;
  comparators: string[];
  /** Chip options for a multiselect; absent for a number. */
  chips?: string[];
  prefix?: string;
};

export const CRITERIA_FIELDS: FieldDef[] = [
  { value: 'group', label: 'Customer Group', comparators: ['in', 'not_in'], chips: ['Gold', 'Silver', 'Regular', 'Wholesale'] },
  { value: 'location', label: 'Location', comparators: ['in', 'not_in'], chips: ['Head Office', 'Anna Nagar', 'T. Nagar'] },
  { value: 'purchases', label: 'No. of purchases in last period', comparators: ['gt', 'lt', 'eq'] },
  { value: 'spend', label: 'Total spend in last period (INR)', comparators: ['gt', 'lt'], prefix: 'INR' },
  { value: 'days', label: 'Days since last purchase', comparators: ['gt', 'lt'] },
  { value: 'balance', label: 'Loyalty points balance', comparators: ['gt', 'lt'] },
];

const COMPARATOR_LABEL: Record<string, string> = {
  in: 'is in',
  not_in: 'is not in',
  gt: 'is greater than',
  lt: 'is less than',
  eq: 'is equal to',
};

const fieldDef = (v: string) => CRITERIA_FIELDS.find((f) => f.value === v);

export function rowHasValue(r: CriteriaRow): boolean {
  const f = fieldDef(r.field);
  if (!f || !r.comparator) return false;
  return f.chips ? r.values.length > 0 : r.value.trim() !== '';
}

/*  "( ( 1 AND 2 ) AND 3 )" — each row wraps everything before it.  */
export function criteriaPattern(rows: CriteriaRow[]): string {
  if (rows.length === 0) return '—';
  if (rows.length === 1) return '( 1 )';
  return rows.slice(1).reduce((acc, r, i) => `( ${acc} ${r.join} ${i + 2} )`, '1');
}

/*  One condition as words, for the campaign summary sentence.
    `period` is "last month", "last week", "yesterday" or "in the last 12 months".  */
export function describeRow(r: CriteriaRow, period: string): string {
  if (!rowHasValue(r)) return '';
  const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} or ${xs[xs.length - 1]}` : xs[0]);
  const cmp = r.comparator === 'gt' ? 'more than' : r.comparator === 'lt' ? 'less than' : 'exactly';
  const n = Number(r.value).toLocaleString('en-IN');
  switch (r.field) {
    case 'group': return r.comparator === 'in' ? `in ${list(r.values)}` : `not in ${list(r.values)}`;
    case 'location': return r.comparator === 'in' ? `at ${list(r.values)}` : `not at ${list(r.values)}`;
    case 'purchases': return `with ${cmp} ${n} ${n === '1' ? 'purchase' : 'purchases'} ${period}`;
    case 'spend': return `who spent ${cmp} INR ${n} ${period}`;
    case 'days': return `whose last purchase was ${cmp} ${n} days ago`;
    case 'balance': return `with ${cmp} ${n} points in their balance`;
    default: return '';
  }
}

export interface V3CriteriaBuilderProps {
  rows: CriteriaRow[];
  onChange: (next: CriteriaRow[]) => void;
}

export function V3CriteriaBuilder({ rows, onChange }: V3CriteriaBuilderProps) {
  const update = (id: string, patch: Partial<CriteriaRow>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const insertAfter = (index: number) => {
    const next = [...rows];
    next.splice(index + 1, 0, blankCriteriaRow());
    onChange(next);
  };
  const remove = (id: string) => {
    const next = rows.filter((r) => r.id !== id);
    onChange(next.length ? next : [blankCriteriaRow()]);
  };

  return (
    <Stack gap={6}>
      {rows.map((r, i) => {
        const f = fieldDef(r.field);
        return (
          <Stack key={r.id} gap={6}>
            {i > 0 ? (
              <Inline gap={0} className="ps-16">
                <Stack gap={0} className="w-field-num shrink-0">
                <Select
                  value={r.join}
                  onChange={(v) => update(r.id, { join: v as CriteriaRow['join'] })}
                  options={[{ value: 'AND', label: 'AND' }, { value: 'OR', label: 'OR' }]}
                  ariaLabel={`Join condition ${i + 1} with the ones before it`}
                />
                </Stack>
              </Inline>
            ) : null}

            <Inline gap={4} align="start" className="flex-nowrap">
              <Surface tone="sunken" border="divider" radius="md" pad={0} className="shrink-0">
                <Inline gap={0} align="center" justify="center" className="h-control w-control">
                  <Text size="body" weight="medium" tone="secondary">{i + 1}</Text>
                </Inline>
              </Surface>

              <Stack gap={0} className="w-field-xs shrink-0">
              <Select
                value={r.field}
                placeholder="Select a field"
                onChange={(v) => {
                  const nf = fieldDef(v);
                  update(r.id, { field: v, comparator: nf?.comparators[0] ?? '', value: '', values: [] });
                }}
                options={CRITERIA_FIELDS.map((x) => ({ value: x.value, label: x.label }))}
                ariaLabel={`Condition ${i + 1} field`}
              />
              </Stack>

              <Stack gap={0} className="w-field-sm shrink-0">
              <Select
                value={r.comparator}
                placeholder="Comparator"
                disabled={!f}
                onChange={(v) => update(r.id, { comparator: v })}
                options={(f?.comparators ?? []).map((c) => ({ value: c, label: COMPARATOR_LABEL[c] }))}
                ariaLabel={`Condition ${i + 1} comparator`}
              />
              </Stack>

              <Stack gap={0} className="min-w-0 flex-1">
                {f?.chips ? (
                  <Inline gap={2} wrap align="center" className="min-h-control">
                    {f.chips.map((chip) => (
                      <Pill
                        key={chip}
                        label={chip}
                        selected={r.values.includes(chip)}
                        onSelectedChange={(on) => update(r.id, {
                          values: on ? [...r.values, chip] : r.values.filter((x) => x !== chip),
                        })}
                      />
                    ))}
                  </Inline>
                ) : (
                  <InputField
                    aria-label={`Condition ${i + 1} value`}
                    format="numeric"
                    align="end"
                    prefix={f?.prefix}
                    placeholder={f ? 'Value' : ''}
                    disabled={!f}
                    value={r.value}
                    onChange={(e) => update(r.id, { value: e.target.value })}
                  />
                )}
              </Stack>

              <Inline gap={0} className="shrink-0 flex-nowrap">
                <Button type="button" emphasis="tertiary" size="md" icon="plus" label={`Add a condition after ${i + 1}`} onClick={() => insertAfter(i)} />
                <Button type="button" emphasis="tertiary" size="md" icon="delete" label={`Remove condition ${i + 1}`} onClick={() => remove(r.id)} />
              </Inline>
            </Inline>
          </Stack>
        );
      })}

      <Button type="button" emphasis="tertiary" size="sm" icon="plus-circle" className="self-start -ms-3" onClick={() => insertAfter(rows.length - 1)}>
        Add More
      </Button>

      <Surface tone="sunken" radius="md" pad={5}>
        <Inline gap={4} align="center" className="flex-nowrap">
          <Text size="overline" tone="tertiary">Criteria pattern:</Text>
          <Text size="body" weight="medium" className="min-w-0 flex-1">{criteriaPattern(rows)}</Text>
          <Icon name="edit" size="sm" tone="muted" label="Edit criteria pattern (not available in this POC)" />
        </Inline>
      </Surface>
    </Stack>
  );
}
