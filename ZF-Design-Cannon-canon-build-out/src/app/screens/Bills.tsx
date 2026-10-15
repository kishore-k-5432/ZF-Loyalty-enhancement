import { useMemo, useRef, useState } from 'react';
import {
  ActionBar, Avatar, ColumnConfig, Icon, Inline, Menu, PageChrome, PageHeader, StatusBadge,
  Surface, Table, Text,
} from '@canon';
import type {
  ColumnConfigItem, MenuEntry, StatusBadgeStatus, TableColumn, TableSort,
} from '@canon';
import { BILLS } from '../data/bills';
import type { Bill } from '../data/bills';

/**
 * PURCHASES → BILLS. The list view.
 *
 * The third one, and by now the recipe is not re-derived: `Purchase Orders` is
 * the reference and this composes the same parts in the same order. Only the
 * columns, the data and the labels change.
 */

/**
 * Six record states onto the badge's fourteen.
 *
 * `Overdue` takes `overdue`, which is the ORANGE one and not a red — the same
 * distinction the invoice list makes, and for the same reason: an overdue bill
 * is collectable, not over. Red would say the money is gone.
 *
 * `Void` takes `void` and `Paid` takes `success`: one is the end of the road
 * with nothing owed because it was settled, the other with nothing owed because
 * it was cancelled, and the badge is the only thing carrying that difference.
 */
const STATUS_TONE: Record<Bill['status'], StatusBadgeStatus> = {
  Draft: 'draft',
  Open: 'submitted',
  'Partially Paid': 'in-progress',
  Paid: 'success',
  Overdue: 'overdue',
  Void: 'void',
};

const MORE_ACTIONS: MenuEntry[] = [
  {
    id: 'sort', label: 'Sort by', icon: 'sort',
    children: [
      { id: 'sort-date', label: 'Date', checked: true, onSelect: () => {} },
      { id: 'sort-number', label: 'Bill#', checked: false, onSelect: () => {} },
      { id: 'sort-vendor', label: 'Vendor Name', checked: false, onSelect: () => {} },
      { id: 'sort-due', label: 'Due Date', checked: false, onSelect: () => {} },
      { id: 'sort-balance', label: 'Balance Due', checked: false, onSelect: () => {} },
    ],
  },
  { separator: true },
  {
    id: 'import', label: 'Import', icon: 'import',
    children: [
      { id: 'imp-bills', label: 'Import Bills', onSelect: () => {} },
      { id: 'imp-vendors', label: 'Import Vendors', onSelect: () => {} },
    ],
  },
  { separator: true },
  {
    id: 'export', label: 'Export', icon: 'export',
    children: [
      { id: 'exp-bills', label: 'Export Bills', onSelect: () => {} },
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

//  Built once, not per render and not per cell.
const money = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
});
const day = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric',
});

export interface BillsProps {
  /** The New CTA and the nav leaf's `+` both land on the creation page. */
  onCreate: () => void;
}

export function Bills({ onCreate }: BillsProps) {
  const [sort, setSort] = useState<TableSort>({ columnId: 'date', direction: 'desc' });
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const moreRef = useRef<HTMLButtonElement>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [layout, setLayout] = useState<ColumnConfigItem[]>([
    { id: 'date', label: 'Date', visible: true },
    { id: 'number', label: 'Bill#', visible: true, locked: true },
    { id: 'reference', label: 'Reference#', visible: true },
    { id: 'vendor', label: 'Vendor Name', visible: true },
    { id: 'status', label: 'Status', visible: true },
    { id: 'dueDate', label: 'Due Date', visible: true },
    { id: 'amount', label: 'Amount', visible: true },
    { id: 'balance', label: 'Balance Due', visible: true },
  ]);
  const [viewId, setViewId] = useState('all');
  const [viewMenuOpen, setViewMenuOpen] = useState(false);

  const views = [
    { id: 'all', label: 'All Bills' },
    { id: 'unpaid', label: 'Unpaid Bills' },
    { id: 'overdue', label: 'Overdue Bills' },
    { id: 'draft', label: 'Draft Bills' },
  ];
  const view = views.find((v) => v.id === viewId) ?? views[0];

  const rows = useMemo(() => {
    const filtered = viewId === 'unpaid'
      ? BILLS.filter((b) => b.balance > 0 && b.status !== 'Draft')
      : viewId === 'overdue'
        ? BILLS.filter((b) => b.status === 'Overdue')
        : viewId === 'draft'
          ? BILLS.filter((b) => b.status === 'Draft')
          : BILLS;

    //  Sort on the VALUE, not on what the cell renders. An amount sorted as a
    //  string puts ₹9,375 above ₹9,21,340, and a date sorted as "24 Aug 2026"
    //  sorts by day-of-month.
    const key = (b: Bill): string | number => ({
      date: b.date, number: b.number, reference: b.reference, vendor: b.vendor,
      status: b.status, dueDate: b.dueDate, amount: b.amount, balance: b.balance,
    }[sort.columnId] ?? b.date);

    return [...filtered].sort((a, b) => {
      const [x, y] = [key(a), key(b)];
      const d = typeof x === 'number' && typeof y === 'number'
        ? x - y : String(x).localeCompare(String(y));
      return sort.direction === 'asc' ? d : -d;
    });
  }, [viewId, sort]);

  const allColumns: TableColumn<Bill>[] = [
    {
      id: 'date', header: 'Date', sortable: true,
      cell: (b) => <Text as="span">{day.format(new Date(b.date))}</Text>,
    },
    {
      id: 'number', header: 'Bill#', sortable: true,
      //  `primary/text` at 5.92:1 — `primary/default` is 4.32 and fails at 13px.
      cell: (b) => <Text as="a" href="#" tone="link" weight="medium">{b.number}</Text>,
    },
    {
      id: 'reference', header: 'Reference#', sortable: true,
      cell: (b) => <Text as="span" tone="secondary">{b.reference}</Text>,
    },
    {
      id: 'vendor', header: 'Vendor Name', sortable: true,
      //  The tint is hashed from the name, so the same vendor is the same colour
      //  on every screen — the colour is identity, never status.
      cell: (b) => (
        <Inline gap={3} align="center" grow>
          <Avatar name={b.vendor} />
          <Text as="span" truncate>{b.vendor}</Text>
        </Inline>
      ),
    },
    {
      id: 'status', header: 'Status', sortable: true,
      cell: (b) => <StatusBadge status={STATUS_TONE[b.status]}>{b.status}</StatusBadge>,
    },
    {
      id: 'dueDate', header: 'Due Date', sortable: true,
      cell: (b) => <Text as="span" tone="secondary">{day.format(new Date(b.dueDate))}</Text>,
    },
    {
      //  `align: 'end'` moves the header AND the data. Moving only the data is
      //  §2.24.2's "alignment edge made of words" defect.
      id: 'amount', header: 'Amount', align: 'end', sortable: true,
      cell: (b) => <Text as="span">{money.format(b.amount)}</Text>,
    },
    {
      id: 'balance', header: 'Balance Due', align: 'end', sortable: true,
      //  The one figure a user came here for, so it is the one in `medium`.
      //  Settled balances stay `text/secondary` rather than going to zero-weight
      //  grey: a paid bill still has a row, and hiding its number would make the
      //  column look ragged.
      cell: (b) => (
        <Text as="span" weight={b.balance > 0 ? 'medium' : 'regular'} tone={b.balance > 0 ? 'default' : 'secondary'}>
          {money.format(b.balance)}
        </Text>
      ),
    },
  ];

  const byId = new Map(allColumns.map((c) => [c.id, c]));
  const columns = layout
    .filter((l) => l.visible)
    .map((l) => byId.get(l.id))
    .filter((c): c is TableColumn<Bill> => Boolean(c));

  const selecting = selected.size > 0;

  return (
    <>
      {/*  §12's cell — one fixed block-size so nothing below moves, the header
           hidden rather than unmounted so it keeps the view switcher's state, and
           no focus movement across the swap. */}
      <PageChrome
        bar={selecting ? (
          <ActionBar
            count={selected.size}
            total={rows.length}
            primary={{ id: 'pay', label: 'Record Payment', onSelect: () => {} }}
            iconActions={[
              { id: 'mail', label: 'Email selected', icon: 'mail', onSelect: () => {} },
              { id: 'print', label: 'Print selected', icon: 'print', onSelect: () => {} },
              { id: 'pdf', label: 'Export as PDF', icon: 'pdf', onSelect: () => {} },
            ]}
            actions={[
              { id: 'approve', label: 'Approve', onSelect: () => {} },
              { id: 'schedule', label: 'Schedule payment', onSelect: () => {} },
              { id: 'void', label: 'Void', onSelect: () => {} },
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
          //  AFTER the CTA: these act on the VIEW, where the bar's actions act on
          //  the records. The funnel is `icon/muted` (4.52:1) rather than
          //  `icon/default` (6.79) — an optical correction, because its walls lay
          //  down ~30% more ink than the house 1.25 stroke.
          trailing={[
            {
              id: 'more',
              label: 'More actions for Bills',
              icon: 'more',
              ref: moreRef,
              expanded: menuOpen,
              onSelect: () => setMenuOpen((o) => !o),
            },
            {
              id: 'filter',
              label: 'Filter bills',
              icon: <Icon name="filter" size="md" tone="muted" />,
              onSelect: () => {},
            },
          ]}
        />
      </PageChrome>

      <Menu
        anchor={moreRef}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        label="More actions for Bills"
        entries={MORE_ACTIONS}
      />

      {/*  WHITE AND FLUSH. `pad={0}` and `placement="page"` are the same
           instruction said twice, once to the region and once to the table;
           either alone leaves a margin. `min-h-0` is what makes the TABLE scroll
           rather than the shell. */}
      <Surface tone="default" pad={0} radius="none" className="flex-1 min-h-0">
        <Table
          caption={`${view.label} — ${rows.length} records`}
          columns={columns}
          rows={rows}
          rowKey={(b) => b.id}
          sort={sort}
          onSortChange={setSort}
          placement="page"
          onConfigure={{
            label: 'Rearrange the columns',
            expanded: configOpen,
            onSelect: () => setConfigOpen(true),
          }}
          selection={{
            selected,
            onChange: setSelected,
            allLabel: `Select all ${rows.length} bills`,
            rowLabel: (b) => `Select ${b.number}, ${b.vendor}`,
          }}
          empty={<Text tone="secondary">No bills match this view.</Text>}
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
