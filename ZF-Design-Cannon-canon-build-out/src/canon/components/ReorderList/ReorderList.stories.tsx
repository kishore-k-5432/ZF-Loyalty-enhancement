import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReorderList } from './ReorderList';
import type { ReorderItem } from './ReorderList';
import { Checkbox } from '../Checkbox/Checkbox';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import { Stack, Text } from '../../primitives';

const CLAUSES: ReorderItem[] = [
  { id: 'scope', label: 'Scope of Sale' },
  { id: 'pricing', label: 'Pricing & Payment' },
  { id: 'delivery', label: 'Delivery & Acceptance' },
  { id: 'warranty', label: 'Warranty' },
  { id: 'returns', label: 'Returns & Refunds' },
];

const meta = {
  title: 'Components/ReorderList', component: ReorderList,
  parameters: { layout: 'padded' },
  args: { items: CLAUSES, onReorder: () => {}, label: 'Clauses' },
} satisfies Meta<typeof ReorderList>;
export default meta;
type Story = StoryObj<typeof meta>;


/**
 * THE ONE TO USE — numbered, selectable, removable. The contract's clause list.
 *
 * Everything here works from the keyboard: Tab to a grip and press ↑/↓ to move
 * the row, Tab again for the label (Enter selects) and again for Remove. The
 * grip and the remove control are invisible until the row is hovered, but they
 * appear the moment they are focused, so the keyboard path is never hidden.
 */
export const TheWholeList: Story = {
  render: function Render() {
    const [items, setItems] = useState(CLAUSES);
    const [active, setActive] = useState('scope');
    return (
      <Stack gap={6} className="max-w-rail">
        <ReorderList
          label="Clauses" items={items} onReorder={setItems} numbered
          activeId={active} onActivate={setActive}
          onRemove={(id) => setItems((l) => l.filter((x) => x.id !== id))}
        />
        <Text size="body-sm" tone="secondary">Editing: {active}</Text>
      </Stack>
    );
  },
};

/**
 * A LOCKED ROW IS A FLOOR, NOT A WALL.
 *
 * Locked rows pin to the front and refuse to move — but moves are CLAMPED into
 * the free region rather than refused at its edge. That distinction is the whole
 * story: when a locked row could sit mid-list and a move onto it was refused,
 * nothing could be dragged past it in either direction and the arrow keys went
 * dead at that row with no explanation. Push the second row up against the first
 * and it stops, which is a boundary you can feel.
 */
export const LockedRows: Story = {
  render: function Render() {
    const [items, setItems] = useState<ReorderItem[]>([
      { id: 'gov', label: 'Governing Law', locked: true },
      ...CLAUSES,
    ]);
    return (
      <ReorderList
        label="Clauses" items={items} onReorder={setItems} numbered
        onRemove={(id) => setItems((l) => l.filter((x) => x.id !== id))}
        className="max-w-rail"
      />
    );
  },
};

/**
 * THE SLOTS — `leading` is where `ColumnConfig`'s checkbox goes, `trailing`
 * takes a badge. Both are per-row render functions rather than a fixed shape,
 * because the alternative is a `checkbox` prop, then a `badge` prop, then a
 * `count` prop, and the component grows one boolean per caller.
 */
export const WithSlots: Story = {
  render: function Render() {
    const [items, setItems] = useState(CLAUSES);
    const [on, setOn] = useState<string[]>(['scope', 'pricing']);
    return (
      <ReorderList
        label="Columns" items={items} onReorder={setItems}
        className="max-w-rail"
        leading={(item) => (
          <Checkbox
            selection={on.includes(item.id) ? 'checked' : 'unchecked'}
            ariaLabel={`Show ${item.label}`}
            onSelectionChange={() => setOn((s) => (
              s.includes(item.id) ? s.filter((x) => x !== item.id) : [...s, item.id]
            ))}
          />
        )}
        trailing={(item) => (
          on.includes(item.id) ? <StatusBadge status="approved">Shown</StatusBadge> : null
        )}
      />
    );
  },
};

/** No `onActivate` — the label is text, not a button that does nothing. */
export const ReorderOnly: Story = {
  render: function Render() {
    const [items, setItems] = useState(CLAUSES);
    return <ReorderList label="Clauses" items={items} onReorder={setItems} className="max-w-rail" />;
  },
};
