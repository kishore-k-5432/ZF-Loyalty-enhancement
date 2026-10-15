import { useState } from 'react';
import {
  Banner, Field, Inline, ProductTable, RadioGroup, Select, Stack, Surface, Text,
  Textarea,
} from '@canon';
import type { ProductColumn, ProductRow } from '@canon';

/**
 * SALES CONTRACT · STEP 3 — Payments and Delivery.
 *
 * Four sections, and the shape of each follows what it holds rather than what
 * the reference happens to draw:
 *
 * **Payment Terms** — five short fields across one row, so the labels go ABOVE
 * the controls (`Field`) rather than beside them (`FormRow`). A 2-column label
 * track at a fifth of the body is about 60px; it fits "Currency" and nothing
 * else on that row.
 *
 * **Payment Schedule** — authored rows, so `ProductTable`. CLAUDE.md's rule:
 * *`Table` reads, `ProductTable` writes.* Milestones are written.
 *
 * **Delivery** and **Additional Information** — two cards side by side, each a
 * plain stack of `Field`s. Deliberately NOT `FormSection`: that is the
 * 12-column page grid, and inside a half-width card its `2 + 3 + 1` would
 * resolve against the card instead of the page and put every control somewhere
 * no other control on the page is.
 */
export interface PaymentsAndDeliveryProps {
  /** Step 2's order total, so the schedule can be checked against it. */
  contractValue: number;
  money: Intl.NumberFormat;
}

const TERMS = [
  { value: 'net15', label: 'Net 15' }, { value: 'net30', label: 'Net 30' },
  { value: 'net45', label: 'Net 45' }, { value: 'net60', label: 'Net 60' },
  { value: 'receipt', label: 'Due on Receipt' },
];
const METHODS = [
  { value: 'bank', label: 'Bank Transfer' }, { value: 'card', label: 'Credit Card' },
  { value: 'cheque', label: 'Cheque' }, { value: 'upi', label: 'UPI' },
];
const CURRENCIES = [
  { value: 'inr', label: 'INR — Indian Rupee' }, { value: 'usd', label: 'USD — US Dollar' },
  { value: 'eur', label: 'EUR — Euro' },
];
const LATE_TERMS = [
  { value: 'none', label: 'None' }, { value: '1', label: '1% per month' },
  { value: '2', label: '2% per month' }, { value: '5', label: '5% per month' },
];
const EVENTS = [
  { value: 'signing', label: 'On Contract Signing' },
  { value: 'delivery', label: 'On Delivery' },
  { value: 'net30', label: '30 days after delivery' },
  { value: 'net60', label: '60 days after delivery' },
];
const DELIVERY_METHODS = [
  { value: 'standard', label: 'Standard Delivery' },
  { value: 'express', label: 'Express Delivery' },
  { value: 'pickup', label: 'Customer Pickup' },
];
const SHIPPING_TERMS = [
  { value: 'ddp', label: 'DDP (Delivered Duty Paid)' },
  { value: 'dap', label: 'DAP (Delivered at Place)' },
  { value: 'exw', label: 'EXW (Ex Works)' },
];

const MILESTONE_COLUMNS: ProductColumn[] = [
  { id: 'milestone', label: 'Milestone', kind: 'input', width: 110, min: 90, format: 'numeric', placeholder: '1', required: true },
  { id: 'description', label: 'Description', kind: 'input', width: 300, min: 160, placeholder: 'What this payment is for', required: true },
  { id: 'event', label: 'Due Date / Event', kind: 'select', width: 240, min: 160, options: EVENTS, placeholder: 'Select an event', required: true },
  //  READ-ONLY, and that is the point — see `rows` below.
  { id: 'amount', label: 'Amount', kind: 'read-only', width: 150, min: 110, align: 'end' },
  //  The flexible column, and it still needs a real min — §4.2's trap.
  { id: 'percent', label: '% of Total', kind: 'input', width: 120, min: 90, format: 'numeric', placeholder: '0', align: 'end', flex: true, resizable: false, required: true },
];

/** Each field on the five-across row takes an equal share and truncates in it. */
const FIFTH = 'flex-1 min-w-0';

export function PaymentsAndDelivery({ contractValue, money }: PaymentsAndDeliveryProps) {
  const [v, setV] = useState<Record<string, string>>({
    terms: 'net30', method: 'bank', currency: 'inr', late: '2', advance: '20',
    deliveryMethod: 'standard', shipping: 'ddp', install: 'yes',
  });
  const set = (k: string) => (next: string) => setV((p) => ({ ...p, [k]: next }));

  const [milestones, setMilestones] = useState<ProductRow[]>([
    { id: 'm1', kind: 'item', values: { milestone: '1', description: 'Upon signing the contract', event: 'signing', percent: '20' } },
    { id: 'm2', kind: 'item', values: { milestone: '2', description: 'Upon delivery / implementation', event: 'delivery', percent: '40' } },
    { id: 'm3', kind: 'item', values: { milestone: '3', description: 'Net 30 days from delivery', event: 'net30', percent: '40' } },
  ]);

  const num = (s: string | undefined) => {
    const n = Number.parseFloat((s ?? '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  };

  /*  THE AMOUNT IS DERIVED FROM THE PERCENTAGE, not typed alongside it.
      The reference shows both columns filled, and two editable copies of one
      number is a schedule that adds up to 101% with nobody able to say which
      column was right. Percent is what the user sets; amount is what it comes
      to against step 2's total.  */
  const rows = milestones.map((r) => (r.kind !== 'item' ? r : {
    ...r,
    values: {
      ...r.values,
      amount: (r.values?.percent ?? '') === ''
        ? ''
        : money.format(contractValue * num(r.values?.percent) / 100),
    },
  }));

  const pctTotal = milestones.reduce((a, r) => a + num(r.values?.percent), 0);
  //  Checked on the PERCENTAGE, not the money: the amounts are rounded for
  //  display, and three lines each rounding down would report a shortfall that
  //  does not exist.
  const balances = Math.abs(pctTotal - 100) < 0.005;

  return (
    <Stack gap={12}>
      {/* ── PAYMENT TERMS ───────────────────────────────────────────────── */}
      <Surface pad={10} radius="card" border="default">
        <Stack gap={10}>
          <Stack gap={2}>
            <Text size="subheading">Payment Terms</Text>
            <Text size="body-sm" tone="secondary">
              Define how and when the customer will make payments.
            </Text>
          </Stack>

          <Inline gap={8} align="start">
            <Field label="Payment Terms" required className={FIFTH}>
              {({ id, required, describedBy }) => (
                <Select id={id} required={required} ariaDescribedBy={describedBy}
                  options={TERMS} value={v.terms} onChange={set('terms')} placeholder="Select" />
              )}
            </Field>
            <Field label="Payment Method" required className={FIFTH}>
              {({ id, required, describedBy }) => (
                <Select id={id} required={required} ariaDescribedBy={describedBy}
                  options={METHODS} value={v.method} onChange={set('method')} placeholder="Select" />
              )}
            </Field>
            <Field label="Currency" className={FIFTH}>
              {({ id }) => (
                <Select id={id} options={CURRENCIES} value={v.currency}
                  onChange={set('currency')} placeholder="Select" />
              )}
            </Field>
            <Field label="Late Payment Terms" className={FIFTH}>
              {({ id }) => (
                <Select id={id} options={LATE_TERMS} value={v.late}
                  onChange={set('late')} placeholder="Select" />
              )}
            </Field>
            {/* The unit lives INSIDE the field — `InputField.suffix`. It is
                `aria-hidden`, so the accessible name has to carry it. */}
            <Field
              label="Advance Payment"
              className={FIFTH}
              format="numeric"
              suffix="%"
              aria-label="Advance payment, percent"
              value={v.advance}
              onChange={(e) => set('advance')(e.target.value)}
            />
          </Inline>
        </Stack>
      </Surface>

      {/* ── PAYMENT SCHEDULE ────────────────────────────────────────────── */}
      <Surface pad={10} radius="card" border="default">
        <Stack gap={10}>
          <Stack gap={2}>
            <Text size="subheading">Payment Schedule</Text>
            <Text size="body-sm" tone="secondary">Define payment milestones and due dates.</Text>
          </Stack>

          <ProductTable
            columns={MILESTONE_COLUMNS}
            rows={rows}
            onRowsChange={(next) => setMilestones(next.map((r) => {
              if (r.kind !== 'item') return r;
              //  Drop the derived amount before storing — a stale copy is how
              //  the column and the total start disagreeing.
              const { amount: _drop, ...rest } = r.values ?? {};
              return { ...r, values: rest };
            }))}
            onAddRow={() => setMilestones((r) => [
              ...r,
              { id: `m${r.length + 1}-${Date.now()}`, kind: 'item', values: { milestone: String(r.length + 1) } },
            ])}
            onAddRows={(n) => setMilestones((r) => [
              ...r,
              ...Array.from({ length: n }, (_, k) => ({
                id: `m${r.length + k + 1}-${Date.now()}-${k}`,
                kind: 'item' as const,
                values: { milestone: String(r.length + k + 1) },
              })),
            ])}
            totals={[
              { id: 'scheduled', label: 'Scheduled', kind: 'static', amount: money.format(contractValue * pctTotal / 100) },
              { id: 'pct', label: '% of Total', kind: 'static', amount: `${pctTotal}%` },
              { id: 'contract', label: 'Contract Value', kind: 'emphasis', amount: money.format(contractValue) },
            ]}
          />

          {/* The note becomes an ERROR the moment it is actually broken. A
              permanent info line stating a rule is a line nobody reads; the same
              sentence in `danger`, with the number, is the one thing the user
              needs at the moment they need it. */}
          <Banner tone={balances ? 'info' : 'danger'}>
            {balances
              ? 'The total milestone amount must equal the Total Contract Value.'
              : `Milestones come to ${pctTotal}% of the contract value. They must total 100%.`}
          </Banner>
        </Stack>
      </Surface>

      {/* ── DELIVERY · ADDITIONAL INFORMATION ───────────────────────────── */}
      <Inline gap={12} align="start">
        <Surface pad={10} radius="card" border="default" className="flex-1 min-w-0">
          <Stack gap={10}>
            <Stack gap={2}>
              <Text size="subheading">Delivery / Fulfillment</Text>
              <Text size="body-sm" tone="secondary">
                Define how and when the products or services will be delivered.
              </Text>
            </Stack>

            <Inline gap={8} align="start">
              <Field label="Delivery Date" className={FIFTH} format="date" placeholder="DD/MM/YYYY"
                value={v.deliveryDate ?? ''} onChange={(e) => set('deliveryDate')(e.target.value)} />
              <Field label="Expected Fulfillment Date" className={FIFTH} format="date" placeholder="DD/MM/YYYY"
                value={v.fulfilDate ?? ''} onChange={(e) => set('fulfilDate')(e.target.value)} />
            </Inline>

            <Inline gap={8} align="start">
              <Field label="Delivery Method" className={FIFTH}>
                {({ id }) => (
                  <Select id={id} options={DELIVERY_METHODS} value={v.deliveryMethod}
                    onChange={set('deliveryMethod')} placeholder="Select" />
                )}
              </Field>
              <Field label="Shipping Terms" className={FIFTH}>
                {({ id }) => (
                  <Select id={id} options={SHIPPING_TERMS} value={v.shipping}
                    onChange={set('shipping')} placeholder="Select" />
                )}
              </Field>
            </Inline>

            <Stack gap={4}>
              <Inline gap={5} align="center">
                <Text weight="medium" className="flex-1 min-w-0">Shipping Address</Text>
                {/* The address is the CUSTOMER's, edited where customers are.
                    A link, not a button: it goes somewhere. */}
                <Text as="a" href="#" tone="link" size="body-sm" className="flex-none">
                  Edit Address
                </Text>
              </Inline>
              <Surface tone="sunken" pad={8} radius="md">
                <Stack gap={1}>
                  {['Kaveri Logistics', 'Plot 14, Ambattur Industrial Estate',
                    'Chennai, Tamil Nadu 600058', 'India'].map((l) => (
                      <Text key={l} size="body-sm" tone="secondary">{l}</Text>
                  ))}
                </Stack>
              </Surface>
            </Stack>

            <RadioGroup
              label="Installation Required"
              options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
              value={v.install}
              onChange={set('install')}
            />
          </Stack>
        </Surface>

        <Surface pad={10} radius="card" border="default" className="flex-1 min-w-0">
          <Stack gap={10}>
            <Stack gap={2}>
              <Text size="subheading">Additional Information</Text>
              <Text size="body-sm" tone="secondary">
                Add any additional references or instructions.
              </Text>
            </Stack>

            <Inline gap={8} align="start">
              <Field label="Customer PO / Reference" className={FIFTH} placeholder="PO-"
                value={v.po ?? ''} onChange={(e) => set('po')(e.target.value)} />
              <Field label="Contact Person" className={FIFTH} placeholder="Full name"
                value={v.person ?? ''} onChange={(e) => set('person')(e.target.value)} />
            </Inline>

            <Inline gap={8} align="start">
              <Field label="Contact Email" className={FIFTH} type="email" placeholder="name@example.com"
                value={v.email ?? ''} onChange={(e) => set('email')(e.target.value)} />
              <Field label="Contact Phone" className={FIFTH} format="tel" placeholder="+91"
                value={v.phone ?? ''} onChange={(e) => set('phone')(e.target.value)} />
            </Inline>

            <Field label="Special Instructions (Optional)">
              {({ id }) => (
                <Textarea id={id} rows={4} maxLength={500} counter
                  placeholder="Anything the delivery team should know"
                  value={v.instructions ?? ''}
                  onChange={(e) => set('instructions')(e.target.value)} />
              )}
            </Field>
          </Stack>
        </Surface>
      </Inline>
    </Stack>
  );
}
