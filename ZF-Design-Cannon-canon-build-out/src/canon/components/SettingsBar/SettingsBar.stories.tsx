import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SettingsBar } from './SettingsBar';
import { Stack, Surface, Text } from '../../primitives';

/**  The Books mark, as the app passes it. §6 calls the product mark a brand
     asset — not a ZF icon, never recoloured. This one is monochrome and follows
     `currentColor`, which is the caller's choice to make, not the bar's.  */
const BOOKS_MARK = (
  <svg viewBox="0 0 512 512" className="size-10" aria-hidden focusable="false" fill="currentColor">
    <path d="M361 502.5H24.5c-8 0-14.4-6.5-14.4-14.4V365.8c0-26.7 17-50.5 42.2-59.2l373-128c29-10 48.6-37.3 48.6-68 0-39.6-32.3-71.9-71.9-71.9H39v238.1c0 8-6.5 14.4-14.4 14.4S10 284.9 10 276.9V24.3c0-8 6.5-14.4 14.4-14.4h377.5c55.6 0 100.8 45.2 100.8 100.8 0 43-27.3 81.3-68.1 95.3l-373 128a33.72 33.72 0 0 0-22.7 31.9v107.8H361c30.1 0 58.5-11.7 79.8-33a112 112 0 0 0 33-79.8c0-21.3-6-42.1-17.4-60.1a113.42 113.42 0 0 0-46.1-41.3 14.41 14.41 0 0 1-6.7-19.3c3.5-7.2 12.1-10.2 19.3-6.7 23.8 11.5 43.8 29.5 58 51.9 14.3 22.6 21.8 48.8 21.8 75.6 0 37.8-14.7 73.4-41.5 100.2A141.24 141.24 0 0 1 361 502.5z" />
    <path d="M172.4 211.9c-31.8 0-57.7-25.9-57.7-57.7s25.9-57.7 57.7-57.7 57.7 25.9 57.7 57.7-25.9 57.7-57.7 57.7zm0-86.6c-15.9 0-28.9 13-28.9 28.9s13 28.9 28.9 28.9 28.9-13 28.9-28.9-13-28.9-28.9-28.9zM317.1 415.7c-31.8 0-57.7-25.9-57.7-57.7s25.9-57.7 57.7-57.7 57.7 25.9 57.7 57.7-25.8 57.7-57.7 57.7zm0-86.6c-15.9 0-28.9 13-28.9 28.9s13 28.9 28.9 28.9 28.9-13 28.9-28.9-12.9-28.9-28.9-28.9z" />
  </svg>
);

const SECTIONS = [
  ['Organization', ['Profile', 'Branding', 'Locations', 'Departments', 'Manage Subscription']],
  ['People & Permissions', ['Users', 'Roles', 'Employees', 'Employee Roles']],
  ['Taxes & Compliance', ['Taxes', 'Payroll Taxes']],
  ['Setup', ['General Preferences', 'Pay Schedule', 'Salary Components', 'Employee Portal']],
  ['Customization', ['Salary Template', 'E-mail Templates', 'PDF Templates', 'Reporting Tags']],
  ['Automation', ['Workflow Rules', 'Workflow Actions', 'Workflow Logs']],
] as const;

const Body = () => (
  <Stack gap={10} className="p-10">
    <Text size="heading" weight="semibold">Global Settings</Text>
    {SECTIONS.map(([group, items]) => (
      <Surface key={group} pad={10} radius="card" border="default">
        <Stack gap={4}>
          <Text size="body" weight="semibold">{group}</Text>
          {items.map((i) => <Text key={i} size="body" tone="secondary">{i}</Text>)}
        </Stack>
      </Surface>
    ))}
  </Stack>
);

const meta = {
  title: 'Components/SettingsBar', component: SettingsBar,
  parameters: { layout: 'fullscreen' },
  args: { mark: BOOKS_MARK, onClose: () => {} },
} satisfies Meta<typeof SettingsBar>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * THE ONE TO USE. **Scroll it** — that is where the component lives.
 *
 * The shadow appears only once the content beneath has actually moved, driven by
 * a 1px sentinel and one `IntersectionObserver` rather than a scroll listener
 * firing on every frame. The sentinel is absolutely positioned: in flow it puts
 * the bar's top at y=1, showing a strip of page above a bar meant to reach the
 * edge, and the bar then snaps up a pixel on the first scroll.
 */
export const TheWholeBar: Story = {
  render: function Render() {
    const [q, setQ] = useState('');
    return (
      <div className="h-screen flex flex-col">
        <SettingsBar mark={BOOKS_MARK} onSearch={setQ} onClose={() => {}}>
          <Body />
        </SettingsBar>
        <Text size="body-sm" tone="tertiary" className="sr-only">{q}</Text>
      </div>
    );
  },
};

/**
 * THE SEARCH IS CENTRED ON THE BAR, NOT BETWEEN THE CLUSTERS.
 *
 * This is §3.1, and it is the thing that is easy to get wrong and hard to
 * notice. Two `minmax(0, 1fr)` tracks resolve equal by definition, so the middle
 * track sits on the bar's centre line whatever the sides hold. Laid out as a
 * flex row with spacers it lands 5px off — and worse, it MOVES as the title
 * changes length, so the field drifts while the user navigates.
 *
 * Compare the two bars below: wildly different title lengths, search in exactly
 * the same place. Put a ruler on it.
 */
export const SearchHoldsTheCentre: Story = {
  render: () => (
    <Stack gap={0}>
      <SettingsBar mark={BOOKS_MARK} title="Users" onClose={() => {}} />
      <SettingsBar
        mark={BOOKS_MARK}
        title="Workflow Rules, Actions and Execution Logs"
        onClose={() => {}}
      />
    </Stack>
  ),
};

/**
 * TRUNCATION, AND THE 562px CLAMP THAT WAS WRONG.
 *
 * §8.3 measured the mock's literal clamp against real widths: at 1440 the brand
 * overlapped the search by 12px, at 1280 by 92, at 1024 by 220 — the title ran
 * *under* the field with its ellipsis hidden beneath it, so it read as a hard
 * clip rather than truncation. The clamp is the grid track instead:
 * `minmax(0, 1fr)` plus `max-w-full`, correct at every width and no magic
 * number.
 *
 * Narrow the Storybook viewport and watch the ellipsis appear while the search
 * stays put.
 */
export const TitleTruncates: Story = {
  render: () => (
    <SettingsBar
      mark={BOOKS_MARK}
      title="Organization Profile, Branding, Locations, Departments and Manage Subscription"
      onClose={() => {}}
    />
  ),
};

/** Both optional controls off — the bar still names where you are. */
export const TitleOnly: Story = {
  render: () => (
    <SettingsBar mark={BOOKS_MARK} showSearch={false} showClose={false} onClose={() => {}} />
  ),
};
