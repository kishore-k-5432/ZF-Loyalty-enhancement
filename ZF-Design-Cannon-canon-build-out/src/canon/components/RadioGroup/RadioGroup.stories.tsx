import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { RadioGroup } from './RadioGroup';
import { Stack, Text } from '../../primitives';

/**
 * One choice from a few, all of them visible.
 *
 * **`Radio` alone is unusable** — a bare `<input type="radio">` with no
 * `<label>` is a 12px dot nobody can click and a screen reader announces as
 * "radio button, unlabelled". This is the part that makes it a control.
 *
 * **It is a `<fieldset>`** because the `<legend>` is the QUESTION and each label
 * is an ANSWER. Without it a screen reader says "Yes, radio button, 1 of 2" and
 * never says what Yes is answering — which for "Installation Required" is the
 * whole content of the question.
 *
 * **Not a `Select`** while the options are few enough to compare at a glance.
 * The line is roughly five: past that the row stops fitting and the options
 * stop being comparable anyway.
 */
const meta = {
  title: 'Components/RadioGroup', component: RadioGroup,
  parameters: { layout: 'padded' },
  args: { label: 'Choice', options: [], value: '', onChange: () => {} },
} satisfies Meta<typeof RadioGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

const YES_NO = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];

function One(p: { layout?: 'inline' | 'stacked'; disabled?: boolean; error?: boolean }) {
  const [v, setV] = useState('yes');
  return (
    <RadioGroup
      label="Installation Required"
      options={YES_NO}
      value={v}
      onChange={setV}
      layout={p.layout}
      disabled={p.disabled}
      error={p.error}
      required
    />
  );
}

export const Inline: Story = { render: () => <One /> };

/** For answers too long to sit on one line, or more than three of them. */
export const Stacked: Story = {
  render: function Render() {
    const [v, setV] = useState('standard');
    return (
      <RadioGroup
        label="Delivery Method"
        layout="stacked"
        value={v}
        onChange={setV}
        options={[
          { value: 'standard', label: 'Standard Delivery — 5 to 7 business days' },
          { value: 'express', label: 'Express Delivery — next business day' },
          { value: 'pickup', label: 'Customer Pickup' },
          { value: 'freight', label: 'Freight (over 50kg)', disabled: true },
        ]}
      />
    );
  },
};

export const States: Story = {
  render: () => (
    <Stack gap={10}>
      <One />
      <One error />
      <One disabled />
    </Stack>
  ),
};

export const Dark: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div data-theme="dark" className="bg-surface-default p-10">
      <Stack gap={6}>
        <Text size="overline" tone="secondary">dark</Text>
        <One />
      </Stack>
    </div>
  ),
};

function Tiles(p: { layout?: 'inline' | 'stacked'; disabled?: boolean }) {
  const [v, setV] = useState('earning');
  return (
    <Stack gap={0} className="max-w-settings-option-card">
      <RadioGroup
        label="Expiration method"
        required
        variant="tile"
        layout={p.layout}
        disabled={p.disabled}
        value={v}
        onChange={setV}
        options={[
          {
            value: 'earning',
            label: 'Per-earning expiry',
            description: 'Each batch of earned points expires individually. Older points consumed first (FIFO).',
            detail: v === 'earning' ? <Text size="body-sm" tone="secondary">A follow-up field sits here.</Text> : undefined,
          },
          {
            value: 'date',
            label: 'Expiration Date',
            description: 'A fixed cutoff that applies to all points regardless of when they were earned.',
            detail: v === 'date' ? <Text size="body-sm" tone="secondary">A follow-up field sits here.</Text> : undefined,
          },
        ]}
      />
    </Stack>
  );
}

/**
 * `variant="tile"` — answers that each carry a description and a follow-up
 * field. The selected tile takes the primary border and tint and its label
 * goes semibold; the follow-up sits inside its own tile, outside the label.
 */
export const Tile: Story = { render: () => <Tiles layout="inline" /> };
export const TileStacked: Story = { render: () => <Tiles layout="stacked" /> };
export const TileDisabled: Story = { render: () => <Tiles layout="inline" disabled /> };
