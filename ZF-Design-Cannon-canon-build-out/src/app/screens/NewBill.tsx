import { useMemo, useState } from 'react';
import {
  Accordion, AccordionItem, Button, CreatePage, Field, Inline, PageHeader,
  ProductTable, Select, SplitButton, Stack, StatusBadge, Text, Textarea, Upload,
} from '@canon';
import type { ProductColumn, ProductRow, TotalRow, UploadFile } from '@canon';

/**
 * PURCHASES → BILLS → NEW.
 *
 * ── WHAT THIS IS A COPY OF, AND WHAT IT IS NOT ───────────────────────────────
 * The reference is a QuickBooks "Bill" screen. Its LAYOUT is reproduced —
 * attachment panel on the left, header fields over two collapsible line-item
 * sections, a memo, and a three-part footer. Its CHROME is not: the reference is
 * a full-screen modal with its own title bar and ✕, and every creation page here
 * is a MODE of its section inside `AppShell`. Consistency with `NewInvoice` and
 * `NewSalesContract` beats fidelity to another product's shell.
 *
 * ── THE LINE TABLE IS `ProductTable`, AND THAT IS NOT A CHOICE ───────────────
 * CLAUDE.md names this exact case: *"anywhere the user authors rows — an
 * invoice's items, a purchase agreement's products, a quote, a sales order, **a
 * bill**, a credit note — it is ProductTable."* `Table` reads; `ProductTable`
 * writes. So both sections get the same component with different columns, and
 * every one of its behaviours — reorder, resize, the lane controls, the
 * keyboard paths — comes along without being re-decided.
 *
 * ── TWO SECTIONS, ONE TOTAL ──────────────────────────────────────────────────
 * Category details books to an expense account; Item details books to a product.
 * They are two tables because they carry different columns, and one total
 * because they are one bill. The total therefore lives OUTSIDE both, next to the
 * balance — a per-table total would report half a bill twice.
 */

const VENDORS = [
  { value: 'sundar', label: 'Sundar Metalworks' },
  { value: 'kavery', label: 'Kavery Packaging' },
  { value: 'nilgiri', label: 'Nilgiri Components Pvt Ltd' },
  { value: 'anand', label: 'Anand Tooling' },
  { value: 'deccan', label: 'Deccan Logistics' },
];

const TERMS = [
  { value: 'receipt', label: 'Due on Receipt' },
  { value: 'net15', label: 'Net 15' },
  { value: 'net30', label: 'Net 30' },
  { value: 'net45', label: 'Net 45' },
  { value: 'net60', label: 'Net 60' },
];

const CATEGORIES = [
  { value: 'cogs', label: 'Cost of Goods Sold' },
  { value: 'freight', label: 'Freight & Delivery' },
  { value: 'office', label: 'Office Supplies' },
  { value: 'repairs', label: 'Repairs & Maintenance' },
  { value: 'utilities', label: 'Utilities' },
];

const ITEMS = [
  { value: 'sheet', label: 'Steel Sheet 2mm' },
  { value: 'carton', label: 'Corrugated Carton' },
  { value: 'bolt', label: 'Hex Bolt M8' },
  { value: 'service', label: 'Installation Service' },
];

const CUSTOMERS = [
  { value: 'none', label: '—' },
  { value: 'acme', label: 'Acme Industries' },
  { value: 'orbit', label: 'Orbit Retail' },
];

const YES_NO = [
  { value: 'no', label: 'No' },
  { value: 'yes', label: 'Yes' },
];

const TAXES = [
  { value: 'none', label: 'No tax' },
  { value: '5', label: 'GST 5%' },
  { value: '12', label: 'GST 12%' },
  { value: '18', label: 'GST 18%' },
];

//  §2.24.2's rule, applied to a table that is TYPED rather than read: numeric
//  columns stay LEFT-aligned in the grid because a caret enters at the start,
//  and only the totals card right-aligns, because those are read.
const CATEGORY_COLUMNS: ProductColumn[] = [
  { id: 'category', label: 'Category', kind: 'select', options: CATEGORIES, width: 260, min: 160, required: true },
  { id: 'description', label: 'Description', kind: 'input', width: 320, min: 200, flex: true },
  { id: 'amount', label: 'Amount', kind: 'input', format: 'decimal', width: 140, min: 100, required: true },
  { id: 'billable', label: 'Billable', kind: 'select', options: YES_NO, width: 110, min: 90 },
  { id: 'tax', label: 'Tax', kind: 'select', options: TAXES, width: 140, min: 110 },
  { id: 'customer', label: 'Customer', kind: 'select', options: CUSTOMERS, width: 180, min: 120 },
];

const ITEM_COLUMNS: ProductColumn[] = [
  { id: 'item', label: 'Product / Service', kind: 'select', options: ITEMS, width: 240, min: 160, required: true },
  { id: 'description', label: 'Description', kind: 'input', width: 300, min: 200, flex: true },
  { id: 'qty', label: 'Qty', kind: 'input', format: 'numeric', width: 90, min: 70, required: true },
  { id: 'rate', label: 'Rate', kind: 'input', format: 'decimal', width: 120, min: 90, required: true },
  //  READ-ONLY and `muted`: it is qty x rate, and a cell the user can type into
  //  but which is recomputed on the next keystroke is a control that fights back.
  { id: 'amount', label: 'Amount', kind: 'read-only', width: 140, min: 100, muted: true },
  { id: 'customer', label: 'Customer', kind: 'select', options: CUSTOMERS, width: 180, min: 120 },
];

const blank = (id: string): ProductRow => ({ id, kind: 'item', values: {} });

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', minimumFractionDigits: 2,
});

const num = (v: string | undefined) => {
  const n = Number.parseFloat((v ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};

export interface NewBillProps {
  onCancel: () => void;
  onSave: () => void;
}

export function NewBill({ onCancel, onSave }: NewBillProps) {
  const [vendor, setVendor] = useState('');
  const [terms, setTerms] = useState('net30');
  const [address, setAddress] = useState('');
  const [billDate, setBillDate] = useState('02/09/2026');
  const [dueDate, setDueDate] = useState('02/10/2026');
  const [billNo, setBillNo] = useState('');
  const [memo, setMemo] = useState('');

  const [categoryRows, setCategoryRows] = useState<ProductRow[]>([blank('c1'), blank('c2')]);
  const [itemRows, setItemRowsRaw] = useState<ProductRow[]>([blank('i1')]);

  //  `amount` is READ-ONLY in the grid, so something has to write it. Derived on
  //  every change rather than in a `useEffect`: an effect would render the row
  //  once with the stale figure and again with the new one, and the user would
  //  watch the old total for a frame after every keystroke.
  //
  //  An empty string, not "0.00", while the row is blank — a column of zeroes on
  //  rows nobody has filled in reads as data.
  const setItemRows = (next: ProductRow[]) => setItemRowsRaw(next.map((r) => {
    if (r.kind !== 'item') return r;
    const derived = num(r.values?.qty) * num(r.values?.rate);
    const amount = derived ? derived.toFixed(2) : '';
    return r.values?.amount === amount ? r : { ...r, values: { ...r.values, amount } };
  }));
  const [files, setFiles] = useState<UploadFile[]>([]);

  //  ONE total across BOTH tables — see the header. A category line carries its
  //  own amount; an item line is quantity x rate, and falls back to a typed
  //  amount so a user can override the arithmetic rather than fight it.
  const total = useMemo(() => {
    const cat = categoryRows.reduce((sum, r) => sum + num(r.values?.amount), 0);
    const item = itemRows.reduce((sum, r) => {
      const derived = num(r.values?.qty) * num(r.values?.rate);
      return sum + (derived || num(r.values?.amount));
    }, 0);
    return cat + item;
  }, [categoryRows, itemRows]);

  const totals: TotalRow[] = [{ id: 'total', label: 'Total', kind: 'emphasis', amount: money.format(total) }];

  /**
   * The three utilities on a section header. Icon-only, so each carries a
   * `label` — the union on `Button` makes that a compile error rather than
   * something a review has to catch, and an icon-only control with no
   * accessible name announces as "button" and nothing else.
   */
  const sectionTools = (what: string) => (
    <>
      <Button emphasis="tertiary" size="sm" icon="export" label={`Export ${what}`} onSelect={() => {}} />
      <Button emphasis="tertiary" size="sm" icon="clone" label={`Copy ${what}`} onSelect={() => {}} />
      <Button emphasis="tertiary" size="sm" icon="settings" label={`${what} settings`} onSelect={() => {}} />
    </>
  );

  return (
    <>
      <PageHeader type="create" title="New Bill" />

      <CreatePage
        //  `reserveEndLane` — `padding-inline: 20px 30px`, not 20/20. At 20/20 a
        //  ProductTable's delete control is clipped by 10 and 62% of its target
        //  is unhittable. Two tables here, so it matters twice.
        reserveEndLane
        aside={(
          <Stack gap={8} className="p-10">
            <Inline gap={4} align="center">
              <Text size="subheading">Add bills</Text>
              {/*  No pink in the badge's fourteen statuses, and inventing one for
                   a marketing flag is not what that vocabulary is for.
                   `submitted` is the blue in-flight tone and reads as a notice
                   rather than a state of the bill. */}
              <StatusBadge status="submitted">NEW</StatusBadge>
            </Inline>

            <Upload
              title="Autofill multiple bills"
              hint="Drag and drop PDFs, PNGs or JPEGs anywhere here, or choose a source — up to 50 files"
              accept=".pdf,.png,.jpg,.jpeg"
              maxSize={20 * 1024 * 1024}
              files={files}
              sources={[
                { id: 'snap', label: 'Snap photos', icon: 'documents', onSelect: () => {} },
                { separator: true },
                { id: 'docs', label: 'From Books Documents', icon: 'documents', onSelect: () => {} },
              ]}
              onAdd={(added) => setFiles((l) => [
                ...l,
                ...added.map((f, i) => ({
                  id: `${f.name}-${l.length + i}`,
                  name: f.name,
                  size: f.size,
                  state: 'complete' as const,
                  kind: f.name.split('.').pop()?.toUpperCase(),
                })),
              ])}
              onRemove={(id) => setFiles((l) => l.filter((f) => f.id !== id))}
              onRetry={() => {}}
              onCancel={(id) => setFiles((l) => l.filter((f) => f.id !== id))}
            />

            <Button emphasis="tertiary" size="sm" onSelect={() => {}} className="me-auto">
              How we use AI
            </Button>
          </Stack>
        )}
        footer={(
          <>
            <Button emphasis="secondary" onSelect={onCancel}>Cancel</Button>
            <Button emphasis="tertiary" onSelect={() => {}}>Print</Button>
            <Button emphasis="tertiary" onSelect={() => {}}>Make recurring</Button>
            <Button emphasis="secondary" onSelect={onSave} className="ms-auto">Save</Button>
            <SplitButton
              emphasis="primary"
              onSelect={onSave}
              entries={[
                { id: 'new', label: 'Save and new', onSelect: onSave },
                { id: 'close', label: 'Save and close', onSelect: onSave },
              ]}
            >
              Save and schedule payment
            </SplitButton>
          </>
        )}
      >
        <Stack gap={10}>
          {/* ── HEADER FIELDS ─────────────────────────────────────────────── */}
          <Inline gap={10} align="start">
            <Field label="Vendor" required className="w-field-md">
              {({ id, required, describedBy }) => (
                <Select
                  id={id} required={required} ariaDescribedBy={describedBy}
                  options={VENDORS} value={vendor} onChange={setVendor}
                  placeholder="Choose a vendor"
                />
              )}
            </Field>

            {/*  The balance is READ, so it right-aligns — the opposite of every
                 typed number on this page, and the same distinction the product
                 table draws between its grid and its totals card. */}
            <Stack gap={1} align="end" className="ms-auto text-end">
              <Text size="body-sm" tone="secondary">BALANCE DUE</Text>
              <Text size="title" weight="semibold">{money.format(total)}</Text>
            </Stack>
          </Inline>

          <Inline gap={10} align="start">
            <Field label="Mailing address" className="w-field-md">
              {({ id, describedBy }) => (
                <Textarea
                  id={id} aria-describedby={describedBy} rows={4}
                  value={address} onChange={(e) => setAddress(e.target.value)}
                />
              )}
            </Field>

            <Field label="Terms" className="w-field-sm">
              {({ id, describedBy }) => (
                <Select
                  id={id} ariaDescribedBy={describedBy}
                  options={TERMS} value={terms} onChange={setTerms} placeholder="Select"
                />
              )}
            </Field>

            {/*  `format="date"` masks as it is typed — the slashes arrive on
                 their own, and the caret is preserved by counting DIGITS rather
                 than characters, so inserting a separator does not throw it. */}
            <Field
              label="Bill date" required format="date" className="w-field-sm"
              value={billDate} onChange={(e) => setBillDate(e.target.value)}
              placeholder="DD/MM/YYYY"
            />
            <Field
              label="Due date" required format="date" className="w-field-sm"
              value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              placeholder="DD/MM/YYYY"
            />
          </Inline>

          <Field
            label="Bill no." className="w-field-sm"
            value={billNo} onChange={(e) => setBillNo(e.target.value)}
          />

          {/* ── THE TWO LINE SECTIONS ─────────────────────────────────────── */}
          {/*  `group` makes them independent rather than exclusive: a bill can
               carry expense lines AND product lines, and closing one to read the
               other would hide half the document. */}
          <Accordion>
            <AccordionItem
              title="Category details"
              chevron="leading"
              defaultOpen
              trailing={sectionTools('category details')}
            >
              <ProductTable
                columns={CATEGORY_COLUMNS}
                rows={categoryRows}
                onRowsChange={setCategoryRows}
                onAddRow={() => setCategoryRows((r) => [...r, blank(`c${Date.now()}`)])}
                onAddRows={(n) => setCategoryRows((r) => [
                  ...r, ...Array.from({ length: n }, (_, i) => blank(`c${Date.now()}-${i}`)),
                ])}
                onConfigureColumns={() => {}}
              />
              <Inline gap={4} className="p-6">
                <Button
                  emphasis="secondary" size="sm"
                  onSelect={() => setCategoryRows((r) => [...r, blank(`c${Date.now()}`)])}
                >
                  Add lines
                </Button>
                <Button emphasis="secondary" size="sm" onSelect={() => setCategoryRows([])}>
                  Clear all lines
                </Button>
              </Inline>
            </AccordionItem>

            <AccordionItem
              title="Item details"
              chevron="leading"
              trailing={sectionTools('item details')}
            >
              <ProductTable
                columns={ITEM_COLUMNS}
                rows={itemRows}
                onRowsChange={setItemRows}
                onAddRow={() => setItemRows([...itemRows, blank(`i${Date.now()}`)])}
                onAddRows={(n) => setItemRows([
                  ...itemRows, ...Array.from({ length: n }, (_, i) => blank(`i${Date.now()}-${i}`)),
                ])}
                onConfigureColumns={() => {}}
                totals={totals}
              />
              <Inline gap={4} className="p-6">
                <Button
                  emphasis="secondary" size="sm"
                  onSelect={() => setItemRows([...itemRows, blank(`i${Date.now()}`)])}
                >
                  Add lines
                </Button>
                <Button emphasis="secondary" size="sm" onSelect={() => setItemRows([])}>
                  Clear all lines
                </Button>
              </Inline>
            </AccordionItem>
          </Accordion>

          <Field label="Memo" className="w-field-md">
            {({ id, describedBy }) => (
              <Textarea
                id={id} aria-describedby={describedBy} rows={3}
                value={memo} onChange={(e) => setMemo(e.target.value)}
              />
            )}
          </Field>
        </Stack>
      </CreatePage>
    </>
  );
}
