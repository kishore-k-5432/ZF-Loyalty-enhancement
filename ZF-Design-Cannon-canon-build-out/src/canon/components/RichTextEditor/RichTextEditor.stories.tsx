import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RichTextEditor } from './RichTextEditor';
import { Field } from '../Field/Field';
import { Stack } from '../../primitives';

const meta = {
  title: 'Components/RichTextEditor', component: RichTextEditor,
  parameters: { layout: 'padded' },
  args: { value: '', onChange: () => {} },
} satisfies Meta<typeof RichTextEditor>;
export default meta;
type Story = StoryObj<typeof meta>;

const CLAUSE = '<p>The Seller agrees to sell and the Buyer agrees to purchase the products '
  + 'or services described in this contract (the "Goods/Services") in accordance with the '
  + 'terms and conditions set forth herein.</p><p>All quantities, descriptions, pricing and '
  + 'delivery schedules are as specified in this contract.</p>';

/**
 * THE ONE TO USE. Type in it, then move the caret in and out of the bold run —
 * the B lights up and goes out on its own, because the state is read back off
 * the document rather than remembered. Six of the eleven buttons render the
 * dashed placeholder: `list-bullet`, `list-ordered`, `indent`, `outdent`, `link`
 * and `unlink` are roster names with no export behind them yet. They still work.
 */
export const TheWholeEditor: Story = {
  render: function Render() {
    const [html, setHtml] = useState(CLAUSE);
    return (
      <RichTextEditor
        value={html} onChange={setHtml} maxLength={2000} counter
        aria-label="Clause text"
      />
    );
  },
};

/**
 * THE COUNTER, NEAR ITS LIMIT. Set low so the behaviour is reachable: within 10%
 * it turns `danger/text` AND starts announcing the remaining count. Outside that
 * band it announces nothing, because a counter read out on every keystroke makes
 * the field unusable with a screen reader.
 *
 * Try to type past the end — the limit is enforced at `beforeinput`, so the
 * keystroke never lands. Truncating afterwards would fight the caret, and
 * allowing the overflow would make the counter a description of a rule nothing
 * enforces.
 */
export const AtTheLimit: Story = {
  render: function Render() {
    const [html, setHtml] = useState('<p>Ninety characters of this and the counter turns.</p>');
    return <RichTextEditor value={html} onChange={setHtml} maxLength={60} counter aria-label="Short note" />;
  },
};

/** Empty, with a placeholder — a real sibling element, never `::before`. */
export const Empty: Story = {
  render: function Render() {
    const [html, setHtml] = useState('');
    return (
      <RichTextEditor
        value={html} onChange={setHtml} rows={5}
        placeholder="Write the clause…" aria-label="Clause text"
      />
    );
  },
};

/** Disabled — the toolbar goes with it. An editable body under a dead toolbar is worse. */
export const Disabled: Story = {
  render: () => (
    <RichTextEditor value={CLAUSE} onChange={() => {}} disabled rows={5} aria-label="Clause text" />
  ),
};

/**
 * INSIDE A `Field`, through the render prop — the label, the asterisk and
 * `aria-describedby` all come from `Field`, exactly as they do for an input.
 */
export const InAField: Story = {
  render: function Render() {
    const [html, setHtml] = useState('');
    return (
      <Stack gap={6}>
        <Field label="Custom clause" required message="Required" showMessage>
          {({ id, describedBy }) => (
            <RichTextEditor
              id={id} aria-describedby={describedBy}
              value={html} onChange={setHtml} rows={4}
              placeholder="Write the clause…"
            />
          )}
        </Field>
      </Stack>
    );
  },
};
