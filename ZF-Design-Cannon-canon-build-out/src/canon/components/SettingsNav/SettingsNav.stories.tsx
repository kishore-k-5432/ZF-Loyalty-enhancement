import type { Meta, StoryObj } from '@storybook/react-vite';
import { SettingsNav } from './SettingsNav';
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

/*  The rail is 240 by contract and takes its height from the panel it sits in,
    so every story frames it the way the shell does. Bare, it would hug and
    none of §3.3's truncation behaviour would show.  */
const Panel = (props: { children: React.ReactNode }) => (
  <div className="h-dvh w-settings-nav grid bg-surface-canvas p-1">{props.children}</div>
);

const meta: Meta<typeof SettingsNav> = {
  title: 'Components/SettingsNav',
  component: SettingsNav,
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <Panel><Story /></Panel>],
};
export default meta;
type Story = StoryObj<typeof SettingsNav>;

/** Nothing selected — every group closed, every caret pointing right. */
export const Collapsed: Story = { args: { sections: SECTIONS } };

/**
 * A leaf is current, so ITS BRANCH IS OPEN — derived from the route, not from a
 * click (§5). Deep-linking into a leaf must find its group already open.
 */
export const Selected: Story = { args: { sections: SECTIONS, currentId: 'purchase-orders' } };

/**
 * §4.3 — TAB TO THE SELECTED ROW AND LOOK AT THE RING.
 *
 * This is the story worth opening. `focus/ring` and `primary/default` are the
 * same value in Light (both #3874EB, measured), so a `focus/ring` outline on a
 * selected row is invisible: focused and resting render identically. In Dark
 * they differ but only at 1.31:1, which fails 1.4.11 and is invisible too.
 *
 * The ring here is `primary/on-primary` — 4.32:1 in Light, 6.57:1 in Dark. It
 * reads as the blue fill inset by 2px rather than as a ring around the row,
 * because the 4px inter-row gap and the nav's 4px inline padding are also
 * white. That is what an inset ring looks like on a light panel, and it is not
 * a bug to "fix" with a positive `outline-offset` — at offset >= 0 the outline
 * paints outside the border box and eats the gap.
 */
export const SelectedFocus: Story = {
  args: { sections: SECTIONS, currentId: 'bills' },
  parameters: {
    docs: { description: { story: 'Tab into the rail and walk to the blue row.' } },
  },
};

/**
 * §3.3 — a product-configurable name that does not fit. The label box is 186
 * and the row must stay 240: the label truncates, the rail does not widen.
 * The accessible name stays complete because the full string is the text node.
 */
export const LongLabels: Story = {
  args: {
    currentId: 'a-custom-module-with-a-very-long-configured-name',
    sections: [{
      id: 'custom',
      title: 'Custom modules',
      cards: [{ id: 'c1', groups: [{
        id: 'custom',
        title: 'A custom module group with a very long name',
        tone: 'blue',
        icon: 'custom-modules',
        links: [
          leaf('A custom module with a very long configured name'),
          leaf('Short'),
        ],
      }] }],
    }],
  },
};

/** Dark. §2.9.9 — two components were invisible in Dark and every screenshot hid it. */
export const Dark: Story = {
  args: { sections: SECTIONS, currentId: 'bills' },
  decorators: [(Story) => <div data-theme="dark"><Story /></div>],
};

/** The Red brand. §2.20.9 — Red failed WCAG where Blue passed. */
export const RedBrand: Story = {
  args: { sections: SECTIONS, currentId: 'bills' },
  decorators: [(Story) => <div data-brand="red"><Story /></div>],
};
