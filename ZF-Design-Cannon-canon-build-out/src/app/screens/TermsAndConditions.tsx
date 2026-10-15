import { useState } from 'react';
import {
  Banner, Button, Divider, ReorderList, RichTextEditor, Stack, Surface, Tabs, Text,
} from '@canon';
import type { ReorderItem } from '@canon';

/**
 * STEP 4 — Terms & Conditions.
 *
 * Two lists of clauses behind one tab strip, and one editor. The order of the
 * clauses IS the contract, which is why the left column is a `ReorderList` and
 * not a `MiniList`: a mini list is where you came FROM, and its order is the
 * list view's sort. Here the order is content the user is authoring.
 *
 * Two ideas that look alike and must not be confused, the same way the detail
 * view's two selections must not be:
 *
 * · `activeId` is the clause being EDITED — it drives the right-hand column.
 * · the order is the document's, and moving a row renumbers the contract.
 *
 * Neither is a selection: there is no bulk action here, so there are no
 * checkboxes and no `ActionBar`. Removing is per-row, on the row.
 */

interface Clause extends ReorderItem {
  /** The clause text, as HTML. */
  body: string;
}

const STANDARD: Clause[] = [
  {
    id: 'scope',
    label: 'Scope of Sale',
    body:
      '<p>The Seller agrees to sell and the Buyer agrees to purchase the products or services '
      + 'described in this contract (the "Goods/Services") in accordance with the terms and '
      + 'conditions set forth herein.</p>'
      + '<p>All quantities, descriptions, pricing and delivery schedules are as specified in this '
      + 'contract. Any additional products or services requested by the Buyer will be subject to a '
      + 'separate agreement.</p>',
  },
  {
    id: 'pricing',
    label: 'Pricing & Payment',
    body:
      '<p>All prices are exclusive of taxes unless stated otherwise. Payment is due according to '
      + 'the payment terms agreed in this contract.</p>'
      + '<p>Late payments may attract interest at the rate set out in the payment schedule.</p>',
  },
  {
    id: 'delivery',
    label: 'Delivery & Acceptance',
    body:
      '<p>The Seller will deliver the Goods/Services to the address specified. Risk passes to the '
      + 'Buyer on delivery.</p>'
      + '<p>The Buyer has ten business days from delivery to inspect and report any shortfall.</p>',
  },
  {
    id: 'warranty',
    label: 'Warranty',
    body:
      '<p>The Seller warrants that the Goods/Services will be free from material defects for '
      + 'twelve months from the date of delivery.</p>',
  },
  {
    id: 'returns',
    label: 'Returns & Refunds',
    body:
      '<p>Returns are accepted within thirty days of delivery, in the original condition and '
      + 'packaging, subject to the Seller’s returns process.</p>',
  },
  {
    id: 'confidentiality',
    label: 'Confidentiality',
    body:
      '<p>Each party will keep confidential all non-public information disclosed by the other and '
      + 'will use it only for the purposes of this contract.</p>',
  },
  {
    id: 'ip',
    label: 'Intellectual Property',
    body:
      '<p>Nothing in this contract transfers any intellectual property. Each party retains all '
      + 'rights in its own materials.</p>',
  },
  {
    id: 'liability',
    label: 'Limitation of Liability',
    body:
      '<p>Neither party is liable for indirect or consequential loss. Each party’s total '
      + 'liability is limited to the total contract value.</p>',
  },
  {
    id: 'termination',
    label: 'Termination',
    body:
      '<p>Either party may terminate this contract on thirty days’ written notice, or '
      + 'immediately on a material breach that is not remedied within fifteen days.</p>',
  },
  {
    id: 'dispute',
    label: 'Dispute Resolution',
    body:
      '<p>The parties will attempt to resolve any dispute in good faith before commencing '
      + 'proceedings. Unresolved disputes will be referred to arbitration.</p>',
  },
  {
    id: 'governing',
    label: 'Governing Law',
    body:
      '<p>This contract is governed by the laws of the jurisdiction stated in the contract header, '
      + 'and the parties submit to its exclusive jurisdiction.</p>',
  },
];

const CUSTOM_SEED: Clause[] = [];

const MAX = 2000;

export function TermsAndConditions() {
  const [tab, setTab] = useState('standard');
  const [standard, setStandard] = useState<Clause[]>(STANDARD);
  const [custom, setCustom] = useState<Clause[]>(CUSTOM_SEED);
  const [activeStandard, setActiveStandard] = useState('scope');
  const [activeCustom, setActiveCustom] = useState('');

  //  ONE editor, pointed at whichever tab is in front. Two editors — one per tab
  //  — would each hold their own caret and their own undo stack, and the tab
  //  strip would silently discard whichever one was not on screen.
  const onStandard = tab === 'standard';
  const clauses = onStandard ? standard : custom;
  const setClauses = onStandard ? setStandard : setCustom;
  const activeId = onStandard ? activeStandard : activeCustom;
  const setActiveId = onStandard ? setActiveStandard : setActiveCustom;

  const index = clauses.findIndex((c) => c.id === activeId);
  const active = index === -1 ? undefined : clauses[index];

  const patch = (id: string, body: string) =>
    setClauses((list) => list.map((c) => (c.id === id ? { ...c, body } : c)));

  //  Remove has to answer "what is being edited now?". Falling through to
  //  nothing selected would blank the right-hand column and leave the user
  //  looking at an empty panel they did not ask for, so the neighbour takes over
  //  — the one below, or the one above if the last row went.
  const remove = (id: string) => {
    const at = clauses.findIndex((c) => c.id === id);
    const next = clauses.filter((c) => c.id !== id);
    setClauses(next);
    if (id !== activeId) return;
    setActiveId(next[Math.min(at, next.length - 1)]?.id ?? '');
  };

  //  TAKES ITS TARGET EXPLICITLY, and does not read `tab`.
  //
  //  "Add Custom Clause" switches to the Custom tab and adds in the same
  //  handler. `setTab` does not update `tab` until the next render, so an `add`
  //  that derived its list from `tab` would still be looking at 'standard' and
  //  would append the new custom clause to the STANDARD list — while the tab
  //  strip moved to a Custom tab that stayed empty. Naming the target removes
  //  the ordering question rather than relying on getting it right.
  const add = (target: 'standard' | 'custom') => {
    const item: Clause = {
      id: `custom-${Date.now()}`,
      label: 'Untitled clause',
      body: '',
    };
    if (target === 'standard') {
      setStandard((list) => [...list, item]);
      setActiveStandard(item.id);
    } else {
      setCustom((list) => [...list, item]);
      setActiveCustom(item.id);
    }
  };

  const list = (
    <Stack gap={5}>
      <ReorderList
        label={onStandard ? 'Standard clauses' : 'Custom terms'}
        items={clauses}
        onReorder={(next) => setClauses(next as Clause[])}
        numbered
        activeId={activeId}
        onActivate={setActiveId}
        onRemove={remove}
      />
      {/*  `tertiary` — the label alone, which takes no side padding, so "Add
           Clause" starts on the same left edge as the clause rows and the tab
           above them. `me-auto` rather than a width: the button is only as wide
           as its label and the spring is what puts it left, so nothing invisible
           is left sitting across the column catching clicks. */}
      <Button
        emphasis="tertiary"
        icon="plus"
        onSelect={() => add(onStandard ? 'standard' : 'custom')}
        className="me-auto"
      >
        {onStandard ? 'Add Clause' : 'Add Term'}
      </Button>
    </Stack>
  );

  const editor = active ? (
    <Stack gap={6} className="min-w-0">
      <Text size="subheading" className="min-w-0 truncate">
        {index + 1}. {active.label}
      </Text>

      <RichTextEditor
        key={active.id}
        value={active.body}
        onChange={(html) => patch(active.id, html)}
        maxLength={MAX}
        counter
        rows={12}
        placeholder="Write the clause…"
        aria-label={`${active.label} text`}
      />

      <Banner tone="info">You can reorder clauses by dragging them.</Banner>
    </Stack>
  ) : (
    <Surface tone="sunken" pad={10} radius="card" className="min-w-0">
      <Stack gap={2}>
        <Text size="body" weight="medium">No clause selected</Text>
        <Text size="body-sm" tone="secondary">
          {clauses.length === 0
            ? 'Add a clause to start writing.'
            : 'Pick a clause on the left to edit its text.'}
        </Text>
      </Stack>
    </Surface>
  );

  return (
    <Surface pad={10} radius="card" border="default">
      <Stack gap={10}>
        <Stack gap={2}>
          <Text size="subheading">Terms &amp; Conditions</Text>
          <Text size="body" tone="secondary">
            Add or customize the terms and conditions for this sales contract.
          </Text>
        </Stack>

        {/*  `inset="none"` — the strip's default `section` inset is 30, which
             pushed "Standard Clauses" 30px right of the "Terms & Conditions"
             heading directly above it. Flush is right here because the card has
             already inset its own content, which is exactly the case that prop
             exists for. */}
        <Tabs
          inset="none"
          label="Clause type"
          value={tab}
          onChange={setTab}
          items={[
            { id: 'standard', label: 'Standard Clauses' },
            { id: 'custom', label: 'Custom Terms' },
          ]}
          trailing={
            <Button
              emphasis="tertiary"
              icon="plus"
              onSelect={() => { setTab('custom'); add('custom'); }}
            >
              Add Custom Clause
            </Button>
          }
        >
          {/*  `Surface`, not `Stack`, for the two columns. `Stack` declares
               `flex flex-col` in its own base, so a `grid` class on top of it is
               two `display` values at equal specificity settled by whichever
               Tailwind emitted last — the cascade hazard this repo has been
               bitten by repeatedly. `Surface` sets no `display` at all, so the
               grid is the only one in play. */}
          <Surface
            pad={0}
            radius="none"
            className="grid grid-cols-clause gap-10 pt-tab-panel-gap"
          >
            {list}
            {/*  The middle track. `self-stretch` on the vertical `Divider` runs
                 it the full height of the taller column, and the grid's `gap-10`
                 puts 20 on each side — the rule owns no margin of its own, so
                 there is one number here and not three.

                 `items-start` is GONE from the grid for this: under it every
                 track shrinks to its content and the rule would have collapsed
                 to nothing. */}
            <Divider orientation="vertical" />
            {editor}
          </Surface>
        </Tabs>
      </Stack>
    </Surface>
  );
}
