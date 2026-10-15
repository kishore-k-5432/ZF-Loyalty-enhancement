import { useEffect, useState } from 'react';
import {
  AppShell, Nav, TopBar, PageHeader, Stack, Surface, Text,
} from '@canon';
import {
  NAV_ITEMS, NAV_SECTIONS, BAR_ACTIONS, LABELS, setOnCreate, setOnSettings,
} from '../data/books';
import { COMMERCE_MARK, HISTORY_MARK } from '../data/books-marks';
import { Invoices } from './Invoices';
import { InvoiceDetails } from './InvoiceDetails';
import { Bills } from './Bills';
import { NewBill } from './NewBill';
import { NewInvoice } from './NewInvoice';
import { NewPurchaseAgreement } from './NewPurchaseAgreement';
import { NewSalesContract } from './NewSalesContract';
import { SalesContracts } from './SalesContracts';
import { PurchaseOrders } from './PurchaseOrders';
import { ScheduledInvoices } from './ScheduledInvoices';
import { LoyaltyV2 } from './LoyaltyV2';

/**
 * BOOKS — the application.
 *
 * Composition only. There is not one class name, one colour and one pixel in
 * this file: every visual decision lives in the canon, and what is here is
 * which components go where and what state moves between them. That is the
 * whole point of the boundary — rule 4 fails the build the moment a screen
 * grows a styled bare element, which is how a second, unmanaged design system
 * starts.
 *
 * The three regions are `AppShell`'s, not this screen's. It also supplies the
 * `<main>`, which is what keeps `PageHeader` from announcing as a second
 * `banner` alongside the top bar.
 */

//  Which sections have a creation page. A list of what EXISTS, not a list of
//  string translations — the previous version was the latter and dropped
//  everything it did not name.
const CREATABLE = new Set(['invoices', 'bills', 'purchase-agreements', 'sales-contracts']);

const VIEWS = [
  { id: 'all', label: 'All' },
  { id: 'mine', label: 'Assigned to me' },
  { id: 'recent', label: 'Recently viewed' },
];

export function Books() {
  const [collapsed, setCollapsed] = useState(false);
  const [currentId, setCurrentId] = useState('purchase-orders');
  const [query, setQuery] = useState('');
  const [viewId, setViewId] = useState('all');
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  //  Which invoice is open, or null for the list. A sub-route of `invoices`,
  //  which is why it is its own piece of state rather than a third `currentId`
  //  value — navigating away and back should land on the list, not on whichever
  //  record was last read.
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  //  The creation page is a MODE of a section, not a section of its own: it is
  //  reached from the list's New and from the nav leaf's `+`, and Cancel has to
  //  return you to whichever list you came from.
  const [creating, setCreating] = useState(false);
  //  Settings is a MODE of the whole application, not a section of it — see the
  //  early return below.
  const [settingsOpen, setSettingsOpen] = useState(false);

  //  The nav's `+` is registered once — see data/books.tsx for why it is a
  //  dispatcher rather than a prop. In an EFFECT, not in render: registering a
  //  handler is a side effect, and under StrictMode's double render it would
  //  otherwise run twice before React had committed anything.
  //  Registered in an effect for the same reason `setOnCreate` is: attaching a
  //  handler is a side effect, and StrictMode's double render would otherwise
  //  run it twice before React had committed anything.
  useEffect(() => { setOnSettings(() => setSettingsOpen(true)); }, []);

  useEffect(() => {
    setOnCreate((section) => {
      //  `section` IS the nav id now — see `create()` in data/books.tsx. The
      //  translation table that used to sit here is gone, and with it the six
      //  leaves whose `+` rendered, took a click and silently did nothing
      //  because their noun was missing from it.
      setCurrentId(section);
      setInvoiceId(null);
      //  A section with no creation page still NAVIGATES — the `+` lands you on
      //  the section it belongs to rather than doing nothing, which is the
      //  honest behaviour while the page is unbuilt. `CREATABLE` is a fact about
      //  what exists, so a leaf gains its create mode the day its page does.
      setCreating(CREATABLE.has(section));
    });
  }, []);

  const page = LABELS[currentId] ?? 'Home';
  const view = VIEWS.find((v) => v.id === viewId)?.label ?? 'All';

  //  SEVEN branches now, across four sections, two of which have a create MODE
  //  and one of which has a detail sub-route. THIS IS PAST THE MOMENT a router
  //  earns its place — the chain encodes ordering rather than mapping an id to a
  //  screen (`&& creating` has to be tested before the bare section, and the
  //  invoice detail before the invoice list), and getting that order wrong is
  //  the first thing a hand-rolled route table does. Every section added from
  //  here makes it worse. Still deliberate, still flagged, and now overdue.
  const done = () => setCreating(false);

  //  `purchase-agreements` has ONLY a creation page — there is no list view for
  //  it yet, so the nav leaf lands straight on the form. Stated rather than
  //  disguised: the list is the missing half, not a decision.
  const screen = currentId === 'purchase-agreements' ? (
    <NewPurchaseAgreement onCancel={done} onSave={done} />
  )
    //  `sales-contracts` now has BOTH halves, so it routes the way `invoices`
    //  does: the creation page is a MODE of the section rather than a section of
    //  its own, reached from the list's New and from the nav leaf's `+`, and
    //  Cancel returns to the list it was opened from.
    : currentId === 'sales-contracts' && creating ? (
      <NewSalesContract onCancel={done} onSend={done} />
    )
    : currentId === 'sales-contracts' ? (
      <SalesContracts onCreate={() => setCreating(true)} />
    )
    : currentId === 'invoices' && creating ? (
      <NewInvoice onCancel={done} onSave={done} />
    )
    : currentId === 'bills' && creating ? (
      <NewBill onCancel={done} onSave={done} />
    )
    : currentId === 'bills' ? (
      <Bills onCreate={() => setCreating(true)} />
    )
    : currentId === 'scheduled-invoices' ? <ScheduledInvoices />
    : currentId === 'purchase-orders' ? <PurchaseOrders />
      : currentId === 'invoices' && invoiceId ? (
      <InvoiceDetails
        invoiceId={invoiceId}
        onSelect={setInvoiceId}
        onBack={() => setInvoiceId(null)}
      />
    )
        : currentId === 'invoices'
          ? <Invoices onOpen={setInvoiceId} onCreate={() => setCreating(true)} />
          : null;

  /*  SETTINGS REPLACES THE SHELL.
      Not a branch inside the body — a return before it. ZF-SETTINGS-BAR.md §1:
      the settings bar replaces the global top bar rather than stacking under
      it, and that swap is what tells the user they have left the product. Keep
      the nav and the dark bar on screen and the page says the opposite.

      It is also the only way `role="banner"` stays unique: SettingsBar claims
      it, and TopBar already has it. */
  if (settingsOpen) return <LoyaltyV2 onClose={() => setSettingsOpen(false)} />;

  return (
    <AppShell
      nav={(
        <Nav
          items={NAV_ITEMS}
          sections={NAV_SECTIONS}
          currentId={currentId}
          onNavigate={(id) => { setCurrentId(id); setInvoiceId(null); setCreating(false); }}
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          product={{ name: 'ZOM-VideoIQ', mark: COMMERCE_MARK }}
          footer={(
            <Stack gap={0} className="pt-10">
              <Surface tone="sunken" pad={5} radius="md">
                <Stack gap={3}>
                  <Text size="caption" tone="tertiary">File : <Text as="span" size="caption" tone="secondary">{'ZOM-VideoIQ'}</Text></Text>
                  <Text size="caption" tone="tertiary">Done by : <Text as="span" size="caption" tone="secondary">Kishore.K</Text></Text>
                </Stack>
              </Surface>
            </Stack>
          )}
        />
      )}
      topBar={(
        <TopBar
          leading={[{
            id: 'recent', label: 'Recent activity', icon: HISTORY_MARK, onSelect: () => {},
          }]}
          //  The scope follows the page, which is the whole reason it is a
          //  scope and not a label: searching "Purchase Orders" from the
          //  purchase orders list is a different query from searching
          //  everything.
          search={{
            scope: page,
            value: query,
            onValueChange: setQuery,
            onSubmit: () => {},
            onScopeOpen: () => {},
          }}
          org={{ name: 'Meedium', onOpen: () => {} }}
          actions={BAR_ACTIONS}
          account={{ name: 'Jenner Dopeson', initials: 'JD', onOpen: () => {} }}
          apps={{ onOpen: () => {} }}
        />
      )}
    >
      {/* Inside <main>, and scrolling with the body — §7: "if it is about the
          current page, it does not belong in the top bar". */}
      {screen ?? (
      <>
      <PageHeader
        type="list"
        title={`${view} ${page}`}
        views={VIEWS.map((v) => ({ id: v.id, label: `${v.label} ${page}` }))}
        onViewChange={setViewId}
        viewMenuOpen={viewMenuOpen}
        onViewMenuToggle={() => setViewMenuOpen((o) => !o)}
        //  NOT `() => {}`. This placeholder stands in for every section whose
        //  screen is unbuilt, and it was rendering a New button that took a
        //  click and did nothing — the same defect as the nav `+`, in the other
        //  half of the app. There is no creation page to open, so the honest
        //  thing is to say so rather than to look live.
        cta={{
          label: 'New',
          icon: 'plus',
          disabled: true,
          onSelect: () => {},
        }}
      />

      <Stack gap={8} className="p-10">
        <Surface pad={10} border="default">
          <Stack gap={4}>
            <Text size="heading">The body</Text>
            <Text tone="secondary">
              Whatever the route renders goes here. It scrolls; the rail and the
              bar do not.
            </Text>
          </Stack>
        </Surface>

        <Surface tone="sunken" pad={10} radius="md">
          <Stack gap={4}>
            <Text size="subheading">What to look at</Text>
            <Text tone="secondary">
              Press Tab from the address bar — the first stop is a skip link that
              jumps the whole rail. Press / to focus search. Collapse the rail
              with the control at its foot and hover a parent row to get its
              flyout. Most glyphs are dashed placeholders: 31 of the 51 roster
              icons have no geometry yet, and the placeholder is how we track
              that rather than hide it.
            </Text>
          </Stack>
        </Surface>
      </Stack>
      </>
      )}
    </AppShell>
  );
}
