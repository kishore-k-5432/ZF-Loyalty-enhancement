import { useMemo, useRef, useState } from 'react';
import {
  ActionBar, Avatar, ColumnConfig, Icon, Inline, Menu, PageChrome, PageHeader, StatusBadge,
  Surface, Table, Text,
} from '@canon';
import type {
  ColumnConfigItem, MenuEntry, StatusBadgeStatus, TableColumn, TableSort,
} from '@canon';
import { SCHEDULED_INVOICES } from '../data/scheduled-invoices';
import type { ScheduledInvoice } from '../data/scheduled-invoices';

/**
 * SALES → SCHEDULED INVOICES. The list view.
 *
 * The fourth one, and nothing structural is re-decided: `Purchase Orders` is the
 * reference and this composes the same parts in the same order. Only the
 * columns, the data and the labels change.
 *
 * ── TWO DATES, AND THEY ARE NOT INTERCHANGEABLE ──────────────────────────────
 * `Scheduled On` is when the invoice goes out; `Due Date` is when payment is
 * expected once it has. A row can be scheduled in the future and therefore have
 * a due date further out still — which is why the default sort is on
 * `scheduledOn` rather than the raised date. What a user came to this view to
 * ask is "what is about to go out", and the column they would sort by first
 * should already be sorted.
 */

/**
 * Seven record states onto the badge's fourteen, read as a life cycle: grey
 * draft → blue scheduled → cyan sent → green paid, with orange, red and grey for
 * the three ways it can stop.
 *
 * `Overdue` takes the ORANGE `overdue`, not a red one — the same call the
 * invoice and bill lists make, and for the same reason: an overdue invoice is
 * collectable, not over. `Failed` is the red one, because a send that failed
 * needs someone to act.
 */
const STATUS_TONE: Record<ScheduledInvoice['status'], StatusBadgeStatus> = {
  Draft: 'draft',
  Scheduled: 'submitted',
  Sent: 'in-progress',
  Paid: 'success',
  Overdue: 'overdue',
  Failed: 'failed',
  Cancelled: 'cancelled',
};

const MORE_ACTIONS: MenuEntry[] = [
  {
    id: 'sort', label: 'Sort by', icon: 'sort',
    children: [
      { id: 'sort-scheduled', label: 'Scheduled On', checked: true, onSelect: () => {} },
      { id: 'sort-date', label: 'Date', checked: false, onSelect: () => {} },
      { id: 'sort-customer', label: 'Customer Name', checked: false, onSelect: () => {} },
      { id: 'sort-due', label: 'Due Date', checked: false, onSelect: () => {} },
      { id: 'sort-amount', label: 'Amount', checked: false, onSelect: () => {} },
    ],
  },
  { separator: true },
  {
    id: 'import', label: 'Import', icon: 'import',
    children: [
      { id: 'imp-sched', label: 'Import Scheduled Invoices', onSelect: () => {} },
      { id: 'imp-cust', label: 'Import Customers', onSelect: () => {} },
    ],
  },
  { separator: true },
  {
    id: 'export', label: 'Export', icon: 'export',
    children: [
      { id: 'exp-sched', label: 'Export Scheduled Invoices', onSelect: () => {} },
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

//  Fixed rather than `new Date()`: a list view whose contents shift with the
//  wall clock cannot be screenshotted or compared against a design.
const TODAY = new Date('2026-09-04');

export function ScheduledInvoices() {
  //  Sorted on what the view is FOR — see the header.
  const [sort, setSort] = useState<TableSort>({ columnId: 'scheduledOn', direction: 'asc' });
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const moreRef = useRef<HTMLButtonElement>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [layout, setLayout] = useState<ColumnConfigItem[]>([
    { id: 'date', label: 'Date', visible: true },
    { id: 'number', label: 'Invoice#', visible: true, locked: true },
    { id: 'customer', label: 'Customer', visible: true },
    { id: 'status', label: 'Status', visible: true },
    { id: 'dueDate', label: 'Due Date', visible: true },
    { id: 'scheduledOn', label: 'Scheduled On', visible: true },
    { id: 'amount', label: 'Amount', visible: true },
  ]);
  const [viewId, setViewId] = useState('upcoming');
  const [viewMenuOpen, setViewMenuOpen] = useState(false);

  //  `upcoming` leads, because a scheduled-invoice list is a queue of what is
  //  about to happen — "All" is the fallback, not the headline.
  const views = [
    { id: 'upcoming', label: 'Upcoming Invoices' },
    { id: 'all', label: 'All Scheduled Invoices' },
    { id: 'failed', label: 'Failed Sends' },
    { id: 'overdue', label: 'Overdue Invoices' },
  ];
  const view = views.find((v) => v.id === viewId) ?? views[0];

  const rows = useMemo(() => {
    const filtered = viewId === 'upcoming'
      ? SCHEDULED_INVOICES.filter((s) => new Date(s.scheduledOn) >= TODAY)
      : viewId === 'failed'
        ? SCHEDULED_INVOICES.filter((s) => s.status === 'Failed')
        : viewId === 'overdue'
          ? SCHEDULED_INVOICES.filter((s) => s.status === 'Overdue')
          : SCHEDULED_INVOICES;

    //  Sort on the VALUE, not on what the cell renders. An amount sorted as a
    //  string puts ₹9,375 above ₹9,21,340, and a date sorted as "24 Aug 2026"
    //  sorts by day-of-month.
    const key = (s: ScheduledInvoice): string | number => ({
      date: s.date, number: s.number, customer: s.customer, status: s.status,
      dueDate: s.dueDate, scheduledOn: s.scheduledOn, amount: s.amount,
    }[sort.columnId] ?? s.scheduledOn);

    return [...filtered].sort((a, b) => {
      const [x, y] = [key(a), key(b)];
      const d = typeof x === 'number' && typeof y === 'number'
        ? x - y : String(x).localeCompare(String(y));
      return sort.direction === 'asc' ? d : -d;
    });
  }, [viewId, sort]);

  const allColumns: TableColumn<ScheduledInvoice>[] = [
    {
      id: 'date', header: 'Date', sortable: true,
      cell: (s) => <Text as="span">{day.format(new Date(s.date))}</Text>,
    },
    {
      id: 'number', header: 'Invoice#', sortable: true,
      //  `primary/text` at 5.92:1 — `primary/default` is 4.32 and fails at 13px.
      cell: (s) => <Text as="a" href="#" tone="link" weight="medium">{s.number}</Text>,
    },
    {
      id: 'customer', header: 'Customer', sortable: true,
      //  The tint is hashed from the name, so the same customer is the same
      //  colour on every screen — the colour is identity, never status.
      cell: (s) => (
        <Inline gap={3} align="center" grow>
          <Avatar name={s.customer} />
          <Text as="span" truncate>{s.customer}</Text>
        </Inline>
      ),
    },
    {
      id: 'status', header: 'Status', sortable: true,
      cell: (s) => <StatusBadge status={STATUS_TONE[s.status]}>{s.status}</StatusBadge>,
    },
    {
      id: 'dueDate', header: 'Due Date', sortable: true,
      cell: (s) => <Text as="span" tone="secondary">{day.format(new Date(s.dueDate))}</Text>,
    },
    {
      //  The column this view is sorted on, so it carries the weight — it is the
      //  one figure a user came here to read.
      id: 'scheduledOn', header: 'Scheduled On', sortable: true,
      cell: (s) => <Text as="span" weight="medium">{day.format(new Date(s.scheduledOn))}</Text>,
    },
    {
      //  `align: 'end'` moves the header AND the data. Moving only the data is
      //  §2.24.2's "alignment edge made of words" defect.
      id: 'amount', header: 'Amount', align: 'end', sortable: true,
      cell: (s) => <Text as="span" weight="medium">{money.format(s.amount)}</Text>,
    },
  ];

  const byId = new Map(allColumns.map((c) => [c.id, c]));
  const columns = layout
    .filter((l) => l.visible)
    .map((l) => byId.get(l.id))
    .filter((c): c is TableColumn<ScheduledInvoice> => Boolean(c));

  const selecting = selected.size > 0;

  return (
    <>
      {/*  §12's cell — one fixed block-size so nothing below moves when the bar
           swaps in, the header hidden rather than unmounted so it keeps the view
           switcher's state, and no focus movement across the swap. */}
      <PageChrome
        bar={selecting ? (
          <ActionBar
            count={selected.size}
            total={rows.length}
            primary={{ id: 'reschedule', label: 'Reschedule', onSelect: () => {} }}
            iconActions={[
              { id: 'mail', label: 'Email selected', icon: 'mail', onSelect: () => {} },
              { id: 'print', label: 'Print selected', icon: 'print', onSelect: () => {} },
              { id: 'pdf', label: 'Export as PDF', icon: 'pdf', onSelect: () => {} },
            ]}
            actions={[
              { id: 'send-now', label: 'Send now', onSelect: () => {} },
              { id: 'pause', label: 'Pause schedule', onSelect: () => {} },
              { id: 'retry', label: 'Retry failed sends', onSelect: () => {} },
              { id: 'cancel', label: 'Cancel schedule', onSelect: () => {} },
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
          //  DISABLED, and deliberately. A scheduled invoice is created by
          //  scheduling an invoice, not from a blank form, and there is no such
          //  page yet. A New button that takes a click and does nothing is the
          //  defect this codebase just finished removing from the nav.
          cta={{ label: 'New', icon: 'plus', disabled: true, onSelect: () => {} }}
          trailing={[
            {
              id: 'more',
              label: 'More actions for Scheduled Invoices',
              icon: 'more',
              ref: moreRef,
              expanded: menuOpen,
              onSelect: () => setMenuOpen((o) => !o),
            },
            {
              id: 'filter',
              label: 'Filter scheduled invoices',
              //  `icon/muted` (4.52:1) rather than `icon/default` (6.79) — an
              //  optical correction: the funnel's walls lay down ~30% more ink
              //  than the house 1.25 stroke.
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
        label="More actions for Scheduled Invoices"
        entries={MORE_ACTIONS}
      />

      {/*  WHITE AND FLUSH. `pad={0}` and `placement="page"` are the same
           instruction said twice; either alone leaves a margin. `min-h-0` is
           what makes the TABLE scroll rather than the shell. */}
      <Surface tone="default" pad={0} radius="none" className="flex-1 min-h-0">
        <Table
          caption={`${view.label} — ${rows.length} records`}
          columns={columns}
          rows={rows}
          rowKey={(s) => s.id}
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
            allLabel: `Select all ${rows.length} scheduled invoices`,
            rowLabel: (s) => `Select ${s.number}, ${s.customer}`,
          }}
          empty={<Text tone="secondary">No scheduled invoices match this view.</Text>}
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
