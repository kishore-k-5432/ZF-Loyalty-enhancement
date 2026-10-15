import type { NavNode, TopBarAction } from '@canon';

/**
 * BOOKS — the application's own data. Nav tree, bar actions, dispatchers.
 *
 * NO JSX IN THIS FILE. The product marks are in `books-marks.tsx`; see the note
 * at the top of that file for why the split is load-bearing.
 *
 * It lives here and not in the canon because none of it is a design decision:
 * the canon owns how a nav row looks, the application owns which rows there
 * are. Swap this file and the same shell is a different product.
 *
 * The two marks are inlined rather than served from `public/brand/`. A file
 * referenced by URL cannot inherit `currentColor`, so it cannot follow the
 * role it sits on — the rail's mark takes `nav/brand-text` and the bar's takes
 * `chrome/text`, and both invert on an active row or a hover fill. Neither is a
 * roster glyph either: `icons:sync` checks for a 16-unit viewBox and these are
 * 512, so they could not be ingested and should not be.
 */

/* ── The rail ─────────────────────────────────────────────────────────────────
   Every `icon` here is a real `ICON_NAMES` entry — the roster is the contract,
   and a name with no geometry renders a visible dashed placeholder rather than
   nothing. That placeholder IS the tracking mechanism: 31 of the 51 glyphs have
   not been exported yet, and most of this list is among them.

   `action` is the row's `+` — the create trigger that appears on hover. It is
   absent where there is nothing to create: Home, Banking, Reports, Documents
   and the two app links. */

/*  The `+` on a nav leaf. It has to reach the router, and NAV_ITEMS is a module
    const that cannot see React state — so the handler is registered once by the
    screen that owns the routing rather than threaded through the tree.

    A module-level dispatcher and not a factory function, because `Nav` compares
    node identity between renders: rebuilding NAV_ITEMS on every render of Books
    would give the flyouts a new object each time and reset their open state. */
let onCreate: (kind: string) => void = () => {};
export const setOnCreate = (fn: (kind: string) => void) => { onCreate = fn; };

/**
 * The top bar's settings gear, registered the same way and for the same reason:
 * `BAR_ACTIONS` is a static data structure, so it cannot close over React state.
 *
 * It shipped as `onSelect: () => {}` — a control that rendered, took a click and
 * did nothing, which is the exact defect the nav `+` had on six leaves.
 */
let onSettings: () => void = () => {};
export const setOnSettings = (fn: () => void) => { onSettings = fn; };

/**
 * The `+` on a nav leaf.
 *
 * TAKES THE SECTION'S OWN ID, not a free-text noun. It used to pass `'bill'`,
 * `'purchase agreement'`, `'sales order'` — and the handler in `Books` then
 * translated those strings back into section ids through a hand-written
 * `switch`. Every leaf whose noun was missing from that switch fell through to
 * `return`, so its `+` rendered, took a click, and did nothing at all: `item`,
 * `vendor`, `expense`, `sales order`, `purchase order`, `estimate` and the rest
 * — six of the ten. The translation table was the bug, so there is no
 * translation any more.
 *
 * `label` still takes the noun, because "New Purchase Agreement" is what the
 * control announces and `purchase-agreements` is not a sentence.
 */
const create = (id: string, noun: string) => ({
  label: `New ${noun}`,
  onSelect: () => onCreate(id),
});

export const NAV_ITEMS: NavNode[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  {
    id: 'items', label: 'Items', icon: 'items', action: create('items', 'Item'),
    children: [
      { id: 'all-items', label: 'All Items' },
      { id: 'price-lists', label: 'Price Lists' },
      { id: 'inventory-adjustments', label: 'Inventory Adjustments' },
    ],
  },
  {
    id: 'inventory', label: 'Inventory', icon: 'inventory',
    children: [{ id: 'assemblies', label: 'Assemblies' }],
  },
  {
    id: 'sales', label: 'Sales', icon: 'sales',
    children: [
      { id: 'customers', label: 'Customers', action: create('customers', 'Customer') },
      { id: 'quotes', label: 'Quotes', action: create('quotes', 'Quote') },
      { id: 'sales-orders', label: 'Sales Orders', action: create('sales-orders', 'Sales Order') },
      { id: 'invoices', label: 'Invoices', action: create('invoices', 'Invoice') },
      { id: 'sales-contracts', label: 'Sales Contracts', action: create('sales-contracts', 'Sales Contract') },
      { id: 'scheduled-invoices', label: 'Scheduled Invoices' },
      { id: 'payments-received', label: 'Payments Received' },
      { id: 'credit-notes', label: 'Credit Notes', action: create('credit-notes', 'Credit Note') },
    ],
  },
  {
    id: 'purchases', label: 'Purchases', icon: 'purchases',
    children: [
      { id: 'vendors', label: 'Vendors', action: create('vendors', 'Vendor') },
      { id: 'expenses', label: 'Expenses', action: create('expenses', 'Expense') },
      { id: 'bills', label: 'Bills', action: create('bills', 'Bill') },
      { id: 'payments-made', label: 'Payments Made' },
      { id: 'purchase-orders', label: 'Purchase Orders', action: create('purchase-orders', 'Purchase Order') },
      { id: 'purchase-agreements', label: 'Purchase Agreements', action: create('purchase-agreements', 'Purchase Agreement') },
    ],
  },
  {
    id: 'time-tracking', label: 'Time Tracking', icon: 'timesheets',
    children: [
      { id: 'projects', label: 'Projects', action: create('projects', 'Project') },
      { id: 'timesheet', label: 'Timesheet' },
    ],
  },
  { id: 'banking', label: 'Banking', icon: 'bank' },
  {
    id: 'filing', label: 'Filing & Compliance', icon: 'tax',
    children: [{ id: 'gst-filing', label: 'GST Filing' }],
  },
  {
    id: 'accountant', label: 'Accountant', icon: 'accountant',
    children: [
      { id: 'manual-journals', label: 'Manual Journals', action: create('manual-journals', 'Journal') },
      { id: 'chart-of-accounts', label: 'Chart of Accounts' },
      { id: 'budgets', label: 'Budgets' },
    ],
  },
  { id: 'reports', label: 'Reports', icon: 'reports' },
  { id: 'documents', label: 'Documents', icon: 'documents' },
  {
    id: 'custom-modules', label: 'Custom Modules', icon: 'custom-modules',
    children: [{ id: 'custom-one', label: 'Deliveries' }],
  },
];

//  No Apps section — this product lists no third-party apps in the rail.
export const NAV_SECTIONS: { header: string; items: NavNode[] }[] = [];

/* ── The bar ──────────────────────────────────────────────────────────────── */

/** `filled` marks the one primary action. There is at most one. */
export const BAR_ACTIONS: TopBarAction[] = [
  { id: 'new', label: 'Create new', icon: 'plus', filled: true, onSelect: () => {} },
  { id: 'invite', label: 'Invite users', icon: 'users', onSelect: () => {} },
  { id: 'notifications', label: 'Notifications', icon: 'bell', count: 1, onSelect: () => {} },
  { id: 'settings', label: 'Settings', icon: 'settings', onSelect: () => onSettings() },
];

/** A flat index of every row, so the screen can name the page it is on. */
export const LABELS: Record<string, string> = Object.fromEntries(
  [...NAV_ITEMS, ...NAV_SECTIONS.flatMap((s) => s.items)]
    .flatMap((n) => [[n.id, n.label] as const, ...(n.children ?? []).map((c) => [c.id, c.label] as const)]),
);
