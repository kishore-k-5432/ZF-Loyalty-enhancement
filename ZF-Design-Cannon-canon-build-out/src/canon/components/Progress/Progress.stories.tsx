import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from './Progress';
import { Inline, Stack, Text } from '../../primitives';

const meta = {
  title: 'Components/Progress', component: Progress,
  parameters: { layout: 'padded' },
  args: { value: 40, label: 'Uploading receipt-08.pdf' },
} satisfies Meta<typeof Progress>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The three tones: running, finished, failed. */
export const Tones: Story = {
  render: () => (
    <Stack gap={8} className="max-w-rail">
      <Progress value={30} label="Uploading a" />
      <Progress value={100} tone="success" label="Uploaded b" />
      <Progress value={62} tone="danger" label="Failed c" />
    </Stack>
  ),
};

/**
 * THE FLOOR. `min-inline-size: 48` is not a nicety — ZF-UPLOAD.md §14.5 measured
 * what happens without it in a flex row where the bar is the only shrinkable
 * item: at a 90-character meta string the bar was 3.72px, and at 120 — which a
 * localized byte string reaches ("2 418 745 332 octets sur 8 192 000 000 octets
 * transférés à 1,2 Mo/s · 30 %") — it hit 0 and pushed 140px of text past the
 * row's right border, unclipped.
 *
 * Squeeze the browser window: the bar stops at 48 and the text ellipsises.
 * "A progress bar that can reach 0px is worse than no progress bar: it reads as
 * 'nothing is happening' at exactly the moment something is."
 */
export const TheFloorHolds: Story = {
  render: () => (
    <Stack gap={6} className="max-w-rail">
      <Inline gap={4} align="center" className="min-w-0 overflow-hidden">
        <Progress value={30} label="Uploading with a very long meta string" />
        <Text size="body-sm" tone="secondary" className="flex-initial min-w-0 truncate">
          2 418 745 332 octets sur 8 192 000 000 octets transférés à 1,2 Mo/s · 30 %
        </Text>
      </Inline>
      <Text size="body-sm" tone="tertiary">The bar stops at 48; the string takes the loss.</Text>
    </Stack>
  ),
};

/** Clamped, so a caller dividing by a zero total cannot paint outside the track. */
export const Clamped: Story = {
  render: () => (
    <Stack gap={8} className="max-w-rail">
      <Progress value={-40} label="Negative clamps to 0" />
      <Progress value={9001} label="Over 100 clamps to 100" />
    </Stack>
  ),
};

/**
 * IN FORCED COLORS the track and the fill are both backgrounds, and backgrounds
 * flatten — the bar disappears outright, at the exact moment it is the only
 * thing reporting that work is happening. `index.css` restores it off
 * `[data-zf-progress]`: a real border for the track (borders are not flattened)
 * and `Highlight` for the fill.
 *
 * Turn on high-contrast mode to check it. The rule lives in `index.css` and not
 * here because `Highlight` and `CanvasText` are colours, and rule 1 keeps
 * colours out of component files.
 */
export const ForcedColors: Story = {
  render: () => <Progress value={45} label="Uploading in forced colors" />,
};
