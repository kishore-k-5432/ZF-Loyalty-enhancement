import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack, Text } from '../../primitives';
import { Field } from '../Field/Field';
import { DatePicker } from './DatePicker';
import type { DatePickerProps } from './DatePicker';

function Demo(props: Partial<DatePickerProps> & { label?: string }) {
  const { label = 'Redemption Start Date', value: initial = '2024-08-27', ...rest } = props;
  const [value, setValue] = useState(initial);
  return (
    <Stack gap={4} className="w-field-lg">
      <Field label={label} required={rest.required}>
        {({ id, required, error, describedBy }) => (
          <DatePicker
            id={id}
            required={required}
            error={error || rest.error}
            ariaDescribedBy={describedBy}
            value={value}
            onChange={setValue}
            {...rest}
          />
        )}
      </Field>
      <Text size="body-sm" tone="secondary">{`value: "${value}"`}</Text>
    </Stack>
  );
}

const meta: Meta<typeof DatePicker> = {
  title: 'Components/DatePicker',
  component: DatePicker,
  //  Room below the trigger, or the panel flips above it in the canvas.
  decorators: [(Story) => <Stack gap={0} className="pb-20 min-h-dvh"><Story /></Stack>],
};
export default meta;
type Story = StoryObj<typeof DatePicker>;

/** A chosen date. Open it: the selected day is filled, today is ringed. */
export const Default: Story = { render: () => <Demo required /> };

/** No value — the placeholder, in `text/tertiary`. Opens on the current month. */
export const Empty: Story = { render: () => <Demo value="" label="Expiration date" /> };

/** Optional field with a value — the footer offers Clear. */
export const Clearable: Story = { render: () => <Demo label="Valid until" /> };

/** `min` / `max` — days outside the range are disabled and skipped by Enter. */
export const Bounded: Story = {
  render: () => <Demo required label="Redemption End Date" value="2024-08-28" min="2024-08-27" max="2024-09-30" />,
};

export const Disabled: Story = { render: () => <Demo required disabled label="Program End Date" /> };

export const Error: Story = { render: () => <Demo required error label="Program Start Date" /> };

/** The longest month label, and a 31-day month starting on a Saturday (six rows). */
export const LongestMonth: Story = { render: () => <Demo value="2026-08-31" label="Program Start Date" /> };
