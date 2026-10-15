import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack, Surface, Text } from '../../primitives';
import { SettingsShell } from './SettingsShell';
import type { SettingsSection } from '../SettingsPage/filter';

const leaf = (label: string) => ({
  id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  label,
  href: `#${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
});

const SECTIONS: SettingsSection[] = [
  {
    id: 'organization',
    title: 'Organization settings',
    cards: [
      { id: 'c1', groups: [
        { id: 'organization', title: 'Organization', tone: 'green', icon: 'organization',
          links: ['Profile', 'Branding', 'Custom Domain', 'Locations'].map(leaf) },
      ] },
      { id: 'c2', groups: [
        { id: 'users', title: 'Users & Roles', tone: 'red', icon: 'users',
          links: ['Users', 'Roles', 'User Preferences'].map(leaf) },
        { id: 'taxes', title: 'Taxes & Compliance', tone: 'blue', icon: 'tax',
          links: ['Taxes', 'Direct Taxes', 'e-Way Bills', 'e-Invoicing'].map(leaf) },
      ] },
      { id: 'c3', groups: [
        { id: 'customization', title: 'Customization', tone: 'orange', icon: 'customization',
          links: ['PDF Templates', 'Email Notifications', 'Reporting Tags'].map(leaf) },
        { id: 'automation', title: 'Automation', tone: 'red', icon: 'automation',
          links: ['Workflow Rules', 'Workflow Actions', 'Schedules'].map(leaf) },
      ] },
    ],
  },
  {
    id: 'module',
    title: 'Module settings',
    cards: [
      { id: 'c4', groups: [
        { id: 'entities', title: 'Common Entities', tone: 'green', icon: 'items',
          links: ['Customers', 'Categories', 'Chart of Accounts', 'Items'].map(leaf) },
      ] },
      { id: 'c5', groups: [
        { id: 'purchases', title: 'Purchases', tone: 'green', icon: 'purchases',
          links: ['Vendors', 'Purchase Orders', 'Bills', 'Vendor Credits'].map(leaf) },
        { id: 'custom-modules', title: 'Custom Modules', tone: 'blue', icon: 'custom-modules',
          links: ['Overview', 'testmod'].map(leaf) },
      ] },
    ],
  },
];

const MARK = (
  <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden fill="currentColor">
    <path d="M3 4h14v3H3zM3 9h9v3H3zM3 14h14v3H3z" />
  </svg>
);

/*  Enough body to make the scroller scroll — otherwise the bar's scrolled
    elevation, which is the whole reason §2.3 keeps a shadow on a floating bar,
    has nothing to demonstrate.  */
function Body() {
  return (
    <Stack gap={8} className="p-section">
      {Array.from({ length: 12 }, (_, i) => (
        <Surface key={i} pad={10} radius="card" border="default">
          <Text as="h3" size="body-lg" weight="semibold" className="block">Section {i + 1}</Text>
          <Text tone="secondary" className="block">
            Scroll this column: the rail, the bar and the two 2px gutters all stay put.
          </Text>
        </Surface>
      ))}
    </Stack>
  );
}

function Demo(props: { start?: string }) {
  const [currentId, setCurrentId] = useState(props.start ?? 'purchase-orders');
  const label = SECTIONS
    .flatMap((s) => s.cards)
    .flatMap((c) => c.groups)
    .flatMap((g) => g.links)
    .find((l) => l.id === currentId)?.label ?? 'Settings';
  return (
    <SettingsShell
      sections={SECTIONS}
      currentId={currentId}
      onNavigate={(l) => setCurrentId(l.id)}
      mark={MARK}
      title={label}
      onBack={() => undefined}
      onClose={() => undefined}
    >
      <Body />
    </SettingsShell>
  );
}

const meta: Meta<typeof SettingsShell> = {
  title: 'Components/SettingsShell',
  component: SettingsShell,
  //  `fullscreen`: the shell is `100dvh` by contract and any padding around it
  //  makes the 2px gutter arithmetic meaningless.
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof SettingsShell>;

/**
 * The whole surface. Three white panels on a near-white canvas, separated by
 * nothing but a 2px gutter and a 12px radius — §2.1 argues those two are a
 * pair, and this is where you can see why.
 *
 * Click through the rail: the body stays, the bar does not move, and the
 * selected row's branch stays open.
 */
export const Default: Story = { render: () => <Demo /> };

/**
 * §6.6 — NARROW. Below 900 the rail leaves the grid and becomes a drawer over
 * the body, toggled from the bar. Resize the preview under 900px.
 *
 * Two things to check, both of which the reference build got wrong:
 * the drawer must be **240 wide**, not shrink-to-fit (measured at 192.48 when
 * `inline-size` is left off a fixed element — §6.6.1); and while it is open the
 * bar and body must be `inert`, so Tab cannot walk out of the drawer behind
 * the scrim.
 */
export const Narrow: Story = {
  render: () => <Demo />,
  parameters: { viewport: { defaultViewport: 'mobile2' } },
};

/**
 * §7.3 — press Tab once from the very top. The skip link must appear as a real,
 * readable chip in the top-left corner.
 *
 * It is `position: fixed` and that is load-bearing: this shell is a grid, so
 * the usual `position: static` reveal would enrol the link as a grid item and
 * auto-placement drops it into a 2 x 2px gutter cell — measured at 97% painted
 * over, with the focus ring drawn around a 2px box.
 */
export const SkipLink: Story = { render: () => <Demo /> };

/** Dark. Reviewed on both axes per §2.9.9. */
export const Dark: Story = {
  render: () => <div data-theme="dark" className="contents"><Demo /></div>,
};

/** The Red brand — §2.20.9's axis. The mark follows `data-brand`; nothing else should. */
export const RedBrand: Story = {
  render: () => <div data-brand="red" className="contents"><Demo /></div>,
};
