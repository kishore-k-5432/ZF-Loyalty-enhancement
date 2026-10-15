import { useMemo, useRef, useState } from 'react';
import {
  ActionBar, Avatar, ColumnConfig, Icon, Inline, Menu, PageChrome, PageHeader, StatusBadge,
  Surface, Table, Text,
} from '@canon';
import type {
  ColumnConfigItem, MenuEntry, StatusBadgeStatus, TableColumn, TableSort,
} from '@canon';
import { SALES_CONTRACTS } from '../data/sales-contracts';
import type { SalesContract } from '../data/sales-contracts';

/**
 * SALES → SALES CONTRACTS. The list view.
 *
 * The second list view in the product, and deliberately not a second design:
 * `Purchases → Purchase Orders` is the reference implementation and this
 * composes the same parts in the same order. Only the columns, the data and the
 * labels change. Everything structural — the fixed header cell, the bounded
 * white surface, the sticky table chrome, controlled sort, the two overlays —
 * carries over unexamined, because each of those was found by measuring and
 * re-deciding them here would only find them again.
 */

/**
 * Six record states onto the badge's fourteen, and the ramp is the point: grey
 * draft → blue in-flight → green live → orange warning → grey expired → red
 * terminated. A reader can follow a contract's life along it without reading a
 * word.
 *
 * `Expiring Soon` takes `overdue`, which is the ORANGE one. The name is the
 * badge family's, not the record's — orange is what the system has for "needs
 * attention on a clock", and a contract 30 days from lapsing is exactly that.
 * `Expired` then takes the neutral grey, because once it has lapsed there is
 * nothing left to act on and red would claim otherwise.
 *
 * `Active` takes `success` and not `in-progress`: a purchase order that is
 * Issued is mid-flight toward a destination, and an active contract has already
 * arrived — it is in force, which is the good terminal state for this record.
 */
const STATUS_TONE: Record<SalesContract['status'], StatusBadgeStatus> = {
  Draft: 'draft',
  'Sent for Signature': 'submitted',
  Active: 'success',
  'Expiring Soon': 'overdue',
  Expired: 'expired',
  Terminated: 'cancelled',
};

const SIGNATURE_TONE: Record<SalesContract['signature'], StatusBadgeStatus> = {
  Signed: 'success',
  Awaiting: 'pending',
  Declined: 'failed',
};

/**
 * The ⋯ menu — `zf-menu.md` §9.1's own shape: Sort by · Import · Export ·
 * Preferences · Manage Custom Fields · Refresh List, in four groups, with the
 * destructive row last.
 *
 * The five glyphs §3.7 authored — sort, import, export, refresh, check — are
 * roster names with no export yet, so they draw placeholders.
 */
const MORE_ACTIONS: MenuEntry[] = [
  {
    id: 'sort', label: 'Sort by', icon: 'sort',
    children: [
      { id: 'sort-date', label: 'Date', checked: true, onSelect: () => {} },
      { id: 'sort-number', label: 'Contract#', checked: false, onSelect: () => {} },
      { id: 'sort-customer', label: 'Customer Name', checked: false, onSelect: () => {} },
      { id: 'sort-end', label: 'End Date', checked: false, onSelect: () => {} },
      { id: 'sort-value', label: 'Contract Value', checked: false, onSelect: () => {} },
    ],
  },
  { separator: true },
  {
    id: 'import', label: 'Import', icon: 'import',
    children: [
      { id: 'imp-sc', label: 'Import Sales Contracts', onSelect: () => {} },
      { id: 'imp-cust', label: 'Import Customers', onSelect: () => {} },
    ],
  },
  { separator: true },
  {
    id: 'export', label: 'Export', icon: 'export',
    children: [
      { id: 'exp-sc', label: 'Export Sales Contracts', onSelect: () => {} },
      { id: 'exp-view', label: 'Export Current View', onSelect: () => {} },
    ],
  },
  { separator: true },
  { id: 'prefs', label: 'Preferences', icon: 'settings', onSelect: () => {} },
  { id: 'fields', label: 'Manage Custom Fields', icon: 'table-config', onSelect: () => {} },
  { separator: true },
  { id: 'refresh', label: 'Refresh List', icon: 'refresh', onSelect: () => {} },
  { id: 'delete', label: 'Delete this view', icon: 'close', tone: 'danger', onSelect: () => {} },
];

//  Built once, not per render and not per cell: 35 rows call each formatter 35
//  times, and constructing `Intl.NumberFormat` is the expensive half.
const money = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
});
const day = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric',
});

export interface SalesContractsProps {
  /** The New CTA and the nav leaf's `+` both land on the creation page. */
  onCreate: () => void;
}

export function SalesContracts({ onCreate }: SalesContractsProps) {
  const [sort, setSort] = useState<TableSort>({ columnId: 'date', direction: 'desc' });
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const moreRef = useRef<HTMLButtonElement>(null);
  const [configOpen, setConfigOpen] = useState(false);
  //  Which columns, in what order. The screen owns it because it is the screen's
  //  preference, not the table's — a table renders what it is handed.
  //
  //  `owner` ships HIDDEN. Nine columns is more than the width can carry without
  //  every one of them truncating, and the owner is the column a user looking at
  //  their own list needs least. It is one tick away in the config, which is the
  //  difference between a default and an omission.
  const [layout, setLayout] = useState<ColumnConfigItem[]>([
    { id: 'date', label: 'Date', visible: true },
    { id: 'number', label: 'Contract#', visible: true, locked: true },
    { id: 'name', label: 'Contract Name', visible: true },
    { id: 'customer', label: 'Customer Name', visible: true },
    { id: 'owner', label: 'Owner', visible: false },
    { id: 'status', label: 'Status', visible: true },
    { id: 'signature', label: 'Signature', visible: true },
    { id: 'endDate', label: 'End Date', visible: true },
    { id: 'value', label: 'Contract Value', visible: true },
  ]);
  const [viewId, setViewId] = useState('all');
  const [viewMenuOpen, setViewMenuOpen] = useState(false);

  const views = [
    { id: 'all', label: 'All Sales Contracts' },
    { id: 'active', label: 'Active Contracts' },
    { id: 'expiring', label: 'Expiring Soon' },
    { id: 'awaiting', label: 'Awaiting Signature' },
  ];
  const view = views.find((v) => v.id === viewId) ?? views[0];

  const rows = useMemo(() => {
    const filtered = viewId === 'active'
      ? SALES_CONTRACTS.filter((c) => c.status === 'Active')
      : viewId === 'expiring'
        ? SALES_CONTRACTS.filter((c) => c.status === 'Expiring Soon')
        : viewId === 'awaiting'
          ? SALES_CONTRACTS.filter((c) => c.signature === 'Awaiting')
          : SALES_CONTRACTS;

    //  Sort on the VALUE, not on what the cell renders. A value sorted as a
    //  string puts ₹93,750 above ₹9,21,340, and a date sorted as "24 Aug 2026"
    //  sorts by day-of-month — the same mistake twice, and both look right until
    //  the tenth row.
    const key = (c: SalesContract): string | number => ({
      date: c.date, number: c.number, name: c.name, customer: c.customer,
      owner: c.owner, status: c.status, signature: c.signature,
      endDate: c.endDate, value: c.value,
    }[sort.columnId] ?? c.date);

    return [...filtered].sort((a, b) => {
      const [x, y] = [key(a), key(b)];
      const d = typeof x === 'number' && typeof y === 'number'
        ? x - y : String(x).localeCompare(String(y));
      return sort.direction === 'asc' ? d : -d;
    });
  }, [viewId, sort]);

  const allColumns: TableColumn<SalesContract>[] = [
    {
      id: 'date', header: 'Date', sortable: true,
      cell: (c) => <Text as="span">{day.format(new Date(c.date))}</Text>,
    },
    {
      id: 'number', header: 'Contract#', sortable: true,
      //  The identifying column is `primary/text` at 5.92:1, which is the role
      //  `Text tone="link"` binds. `primary/default` is 4.32 and fails at 13px.
      cell: (c) => <Text as="a" href="#" tone="link" weight="medium">{c.number}</Text>,
    },
    {
      id: 'name', header: 'Contract Name', sortable: true,
      cell: (c) => <Text as="span" truncate>{c.name}</Text>,
    },
    {
      id: 'customer', header: 'Customer Name', sortable: true,
      //  The avatar's tint is hashed from the name, so the same customer is the
      //  same colour on every screen — and the reason 1.4.1 holds is that the
      //  colour is identity, never status.
      cell: (c) => (
        <Inline gap={3} align="center" grow>
          <Avatar name={c.customer} />
          <Text as="span" truncate>{c.customer}</Text>
        </Inline>
      ),
    },
    {
      id: 'owner', header: 'Owner', sortable: true,
      cell: (c) => (
        <Inline gap={3} align="center" grow>
          <Avatar name={c.owner} />
          <Text as="span" truncate>{c.owner}</Text>
        </Inline>
      ),
    },
    {
      id: 'status', header: 'Status', sortable: true,
      cell: (c) => <StatusBadge status={STATUS_TONE[c.status]}>{c.status}</StatusBadge>,
    },
    {
      id: 'signature', header: 'Signature', sortable: true,
      cell: (c) => <StatusBadge status={SIGNATURE_TONE[c.signature]}>{c.signature}</StatusBadge>,
    },
    {
      id: 'endDate', header: 'End Date', sortable: true,
      cell: (c) => <Text as="span" tone="secondary">{day.format(new Date(c.endDate))}</Text>,
    },
    {
      //  `align: 'end'` moves the header AND the data to the column's right
      //  edge. Moving only the data is §2.24.2's "alignment edge made of words"
      //  defect — the source right-aligned figures to the width of the header's
      //  text, so renaming the column moved the numbers.
      id: 'value', header: 'Contract Value', align: 'end', sortable: true,
      cell: (c) => <Text as="span" weight="medium">{money.format(c.value)}</Text>,
    },
  ];

  //  `layout` decides order AND presence; `allColumns` decides what a cell
  //  renders. Keyed by id so neither can silently drop the other's column.
  const byId = new Map(allColumns.map((c) => [c.id, c]));
  const columns = layout
    .filter((l) => l.visible)
    .map((l) => byId.get(l.id))
    .filter((c): c is TableColumn<SalesContract> => Boolean(c));

  const selecting = selected.size > 0;

  return (
    <>
      {/*  §12's cell. `PageChrome` owns all three of its rules — one fixed
           block-size so nothing below moves when the bar swaps in, the header
           hidden rather than unmounted so it keeps the view switcher's state,
           and no focus movement across the swap (moving focus on a value change
           is a 3.2.2 failure, and it would fire on every checkbox click). */}
      <PageChrome
        bar={selecting ? (
          <ActionBar
            count={selected.size}
            total={rows.length}
            primary={{ id: 'bulk', label: 'Bulk Update', onSelect: () => {} }}
            iconActions={[
              { id: 'mail', label: 'Email selected', icon: 'mail', onSelect: () => {} },
              { id: 'print', label: 'Print selected', icon: 'print', onSelect: () => {} },
              { id: 'pdf', label: 'Export as PDF', icon: 'pdf', onSelect: () => {} },
            ]}
            actions={[
              { id: 'renew', label: 'Renew', onSelect: () => {} },
              { id: 'send', label: 'Send for Signature', onSelect: () => {} },
              { id: 'terminate', label: 'Terminate', onSelect: () => {} },
              { id: 'clone', label: 'Clone', onSelect: () => {} },
              { id: 'delete', label: 'Delete', onSelect: () => {} },
            ]}
            onClear={() => setSelected(new Set())}
          />
        ) : undefined}
      >
        <PageHeader
          type="list"
          title={view.label}
          views={views}
          onViewChange={setViewId}
          viewMenuOpen={viewMenuOpen}
          onViewMenuToggle={() => setViewMenuOpen((o) => !o)}
          cta={{ label: 'New', icon: 'plus', onSelect: onCreate }}
          //  AFTER the CTA, which is what `trailing` is for: these two act on the
          //  VIEW — which records it shows, what else you can do to the list —
          //  where the bar's actions act on the records.
          //
          //  The funnel is drawn LIGHTER than its neighbours, and it is an
          //  optical correction rather than a whim: its walls measure about
          //  1.6px in a 16 slot where the house convention is 1.25, so at one
          //  colour it lays down ~30% more ink. `icon/muted` is 4.52:1, a step
          //  back from `icon/default`'s 6.79 and still clear of 1.4.11's 3:1.
          trailing={[
            {
              id: 'more',
              label: 'More actions for Sales Contracts',
              icon: 'more',
              ref: moreRef,
              expanded: menuOpen,
              onSelect: () => setMenuOpen((o) => !o),
            },
            {
              id: 'filter',
              label: 'Filter sales contracts',
              icon: <Icon name="filter" size="md" tone="muted" />,
              onSelect: () => {},
            },
          ]}
        />
      </PageChrome>

      {/*  The label names what the menu BELONGS to rather than what the button
           is — "More actions" alone tells a screen-reader user nothing about
           which more. */}
      <Menu
        anchor={moreRef}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        label="More actions for Sales Contracts"
        entries={MORE_ACTIONS}
      />

      {/*  WHITE, AND FLUSH TO ALL FOUR EDGES. The shell's ground is
           `surface/canvas`, which is right as the application's default and
           wrong for a list view, where the table IS the page.

           `pad={0}` and `placement="page"` are the same instruction said twice,
           once to the region and once to the table. Either alone leaves a
           margin: padding here, or the table's own frame and radius.

           `flex-1 min-h-0` — and the `min-h-0` is the load-bearing half. With
           `flex-1` alone a long list pushes the column past the viewport and the
           SHELL scrolls, taking the page header and the sticky table header up
           with it. Bounded, the TABLE is what scrolls. */}
      <Surface tone="default" pad={0} radius="none" className="flex-1 min-h-0">
        <Table
          //  1.3.1 — required, and visually hidden. Without it the table
          //  announces as "table, 8 columns, 35 rows" and nothing else.
          caption={`${view.label} — ${rows.length} records`}
          columns={columns}
          rows={rows}
          rowKey={(c) => c.id}
          sort={sort}
          onSortChange={setSort}
          placement="page"
          onConfigure={{
            label: 'Rearrange the columns',
            expanded: configOpen,
            onSelect: () => setConfigOpen(true),
          }}
          //  Three things a Figma variant cannot express: the header checkbox
          //  indeterminate when the page is partly selected, a name on it saying
          //  WHAT it selects, and a name on every row's.
          selection={{
            selected,
            onChange: setSelected,
            allLabel: `Select all ${rows.length} sales contracts`,
            rowLabel: (c) => `Select ${c.number}, ${c.customer}`,
          }}
          empty={<Text tone="secondary">No sales contracts match this view.</Text>}
        />
      </Surface>

      <ColumnConfig
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        items={layout}
        onSave={(next) => { setLayout(next); setConfigOpen(false); }}
      />
    </>
  );
}
