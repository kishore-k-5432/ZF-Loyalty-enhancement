import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip } from './Tooltip';
import { Checkbox } from '../Checkbox/Checkbox';
import { Stack, Text } from '../../primitives';

/**
 * A short explanation on hover — most often why a control is disabled.
 *
 * `surface/inverse` bubble, `text/inverse` body 13/20, radius `lg`, popover
 * shadow, max width `chrome/tooltip` (240). It follows the pointer and sits to
 * its right, flipping left near the viewport edge. The text is also in the
 * trigger as visually hidden text, because a disabled control cannot take
 * focus and a hover-only reason would be lost to keyboard and screen-reader
 * users.
 *
 * Review in all four pane × hue combinations: `surface/inverse` is light in
 * Dark, so the bubble inverts with the theme.
 */
const meta = {
  title: 'Components/Tooltip', component: Tooltip,
  parameters: { layout: 'padded' },
  args: { content: 'Tooltip text.', children: null },
} satisfies Meta<typeof Tooltip>;
export default meta;
type Story = StoryObj<typeof meta>;

const REASON = 'You can\'t enable Points Expiration while Redemption Window is enabled. Disable Redemption Window to use this option.';

/*  The case it was made for: hover the disabled checkbox.  */
export const OnDisabledCheckbox: Story = {
  render: () => (
    <Stack gap={8}>
      <Text size="body" tone="secondary">Hover the disabled option.</Text>
      <Tooltip content={REASON}>
        <Checkbox
          label="Points Expiration"
          description="Enable points expiry that controls how long individual points stay valid in a customer's wallet"
          disabled
          selection="unchecked"
        />
      </Tooltip>
    </Stack>
  ),
};

/*  One short line: the bubble shrinks to its text.  */
export const ShortText: Story = {
  render: () => (
    <Tooltip content="Not available in this plan.">
      <Text size="body">Hover me</Text>
    </Tooltip>
  ),
};

/*  The longest realistic reason: wraps inside 240.  */
export const LongText: Story = {
  render: () => (
    <Tooltip content={`${REASON} Points that are already in customers' wallets keep the rules they were earned under, so changing this later does not affect existing balances.`}>
      <Text size="body">Hover me</Text>
    </Tooltip>
  ),
};

/*  Near the right edge: the bubble flips to the pointer's left.  */
export const FlipsAtEdge: Story = {
  render: () => (
    <Stack gap={0} align="end">
      <Tooltip content={REASON}>
        <Text size="body">Hover me, at the right edge</Text>
      </Tooltip>
    </Stack>
  ),
};

/*  `enabled={false}`: the children alone, no bubble.  */
export const Off: Story = {
  render: () => (
    <Tooltip content={REASON} enabled={false}>
      <Checkbox label="Points Expiration" selection="checked" />
    </Tooltip>
  ),
};
