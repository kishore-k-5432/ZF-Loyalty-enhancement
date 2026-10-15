import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SettingsPage } from './SettingsPage';
import type { SettingsSection } from './SettingsPage';
import { SettingsBar } from '../SettingsBar/SettingsBar';

const MARK = (
  <svg viewBox="0 0 512 512" className="size-10" aria-hidden focusable="false" fill="currentColor">
    <path d="M361 502.5H24.5c-8 0-14.4-6.5-14.4-14.4V365.8c0-26.7 17-50.5 42.2-59.2l373-128c29-10 48.6-37.3 48.6-68 0-39.6-32.3-71.9-71.9-71.9H39v238.1c0 8-6.5 14.4-14.4 14.4S10 284.9 10 276.9V24.3c0-8 6.5-14.4 14.4-14.4h377.5c55.6 0 100.8 45.2 100.8 100.8 0 43-27.3 81.3-68.1 95.3l-373 128a33.72 33.72 0 0 0-22.7 31.9v107.8H361c30.1 0 58.5-11.7 79.8-33a112 112 0 0 0 33-79.8c0-21.3-6-42.1-17.4-60.1a113.42 113.42 0 0 0-46.1-41.3 14.41 14.41 0 0 1-6.7-19.3c3.5-7.2 12.1-10.2 19.3-6.7 23.8 11.5 43.8 29.5 58 51.9 14.3 22.6 21.8 48.8 21.8 75.6 0 37.8-14.7 73.4-41.5 100.2A141.24 141.24 0 0 1 361 502.5z" />
    <path d="M172.4 211.9c-31.8 0-57.7-25.9-57.7-57.7s25.9-57.7 57.7-57.7 57.7 25.9 57.7 57.7-25.9 57.7-57.7 57.7zm0-86.6c-15.9 0-28.9 13-28.9 28.9s13 28.9 28.9 28.9 28.9-13 28.9-28.9-13-28.9-28.9-28.9zM317.1 415.7c-31.8 0-57.7-25.9-57.7-57.7s25.9-57.7 57.7-57.7 57.7 25.9 57.7 57.7-25.8 57.7-57.7 57.7zm0-86.6c-15.9 0-28.9 13-28.9 28.9s13 28.9 28.9 28.9 28.9-13 28.9-28.9-12.9-28.9-28.9-28.9z" />
  </svg>
);

const link = (id: string, label: string) => ({ id, label, href: `#${id}` });

//  The tone assignment is §4's table verbatim, and it is CATEGORICAL: Taxes is
//  red because it is a category, not because anything is wrong.
export const SECTIONS: SettingsSection[] = [
  {
    id: 'global', title: 'Organization Setting',
    cards: [
      { id: 'c1', groups: [{
        id: 'org', title: 'Organization', tone: 'green', icon: 'admin',
        links: ['Profile', 'Branding', 'Locations', 'Departments', 'Designations', 'Manage Subscription']
          .map((l) => link(l.toLowerCase().replace(/\s+/g, '-'), l)),
      }] },
      { id: 'c2', groups: [
        { id: 'people', title: 'People & Permissions', tone: 'blue', icon: 'users',
          links: ['Users', 'Roles', 'Employees', 'Employee Roles'].map((l) => link(l.toLowerCase().replace(/\s+/g, '-'), l)) },
        { id: 'taxes', title: 'Taxes & Compliance', tone: 'red', icon: 'tax',
          links: ['Taxes', 'Payroll Taxes'].map((l) => link(l.toLowerCase().replace(/\s+/g, '-'), l)) },
      ] },
      { id: 'c3', groups: [{
        id: 'setup', title: 'Setup', tone: 'orange', icon: 'settings',
        links: ['General Preferences', 'Pay Schedule', 'Salary Components', 'Statutory Components', 'Employee Portal']
          .map((l) => link(l.toLowerCase().replace(/\s+/g, '-'), l)),
      }] },
      { id: 'c4', groups: [{
        id: 'custom', title: 'Customization', tone: 'green', icon: 'preference',
        links: ['Salary Template', 'E-mail Templates', 'PDF Templates', 'Reporting Tags', 'Web Tabs']
          .map((l) => link(l.toLowerCase().replace(/\s+/g, '-'), l)),
      }] },
      { id: 'c5', groups: [{
        id: 'auto', title: 'Automation', tone: 'blue', icon: 'autoscan',
        links: ['Workflow Rules', 'Workflow Actions', 'Workflow Logs'].map((l) => link(l.toLowerCase().replace(/\s+/g, '-'), l)),
      }] },
    ],
  },
  {
    id: 'module', title: 'Module Settings',
    cards: [
      { id: 'm1', groups: [
        { id: 'entities', title: 'Common Entities', tone: 'orange', icon: 'items',
          links: ['Customers', 'Categories', 'Chart of Accounts', 'Merchants', 'Projects', 'Items']
            .map((l) => link(l.toLowerCase().replace(/\s+/g, '-'), l)) },
        { id: 'payments', title: 'Payments', tone: 'green', icon: 'bank',
          links: ['Direct Deposit', 'Paid Through Account'].map((l) => link(l.toLowerCase().replace(/\s+/g, '-'), l)) },
      ] },
      { id: 'm2', groups: [{
        id: 'travel', title: 'Travel & Expense', tone: 'red', icon: 'timesheets',
        links: ['Trips', 'Expenses', 'Reports', 'Advances'].map((l) => link(l.toLowerCase().replace(/\s+/g, '-'), l)),
      }] },
      { id: 'm3', groups: [{
        id: 'payroll', title: 'Payroll', tone: 'blue', icon: 'payroll',
        links: ['Pay Runs', 'Salary Revision', 'Leave & Attendance', 'Loans', 'Giving']
          .map((l) => link(l.toLowerCase().replace(/\s+/g, '-'), l)),
      }] },
      { id: 'm4', groups: [{
        id: 'purchases', title: 'Purchases', tone: 'orange', icon: 'purchases',
        links: ['Vendors', 'Purchase Requests', 'Request for Quotes', 'Payments Made', 'Purchase Orders', 'Bills', 'Recurring Bills', 'Vendor Credits']
          .map((l) => link(l.toLowerCase().replace(/\s+/g, '-'), l)),
      }] },
      { id: 'm5', groups: [{
        id: 'custommod', title: 'Custom Module', tone: 'red', icon: 'custom-modules',
        links: ['Overview', 'Q&A Modules', 'Payments Modules'].map((l) => link(l.toLowerCase().replace(/[\s&]+/g, '-'), l)),
      }] },
    ],
  },
  {
    id: 'ext', title: 'Extensions & Developer Data',
    cards: [
      { id: 'e1', groups: [{
        id: 'extension', title: 'Extension', tone: 'green', icon: 'apps',
        links: ['Shipping', 'E-Commerce', 'EDI', 'SMS Integration', 'Zoho Apps', 'Bharat Connect', 'WhatsApp', 'Marketplace']
          .map((l) => link(l.toLowerCase().replace(/\s+/g, '-'), l)),
      }] },
      { id: 'e2', groups: [{
        id: 'dev', title: 'Developer Data', tone: 'red', icon: 'build',
        links: ['Widgets', 'Incoming Webhooks', 'Connections', 'API Usage', 'Signals', 'Data Backup', 'Deluge Components', 'Web Forms', 'Sandbox']
          .map((l) => link(l.toLowerCase().replace(/\s+/g, '-'), l)),
      }] },
    ],
  },
];

const meta = {
  title: 'Components/SettingsPage', component: SettingsPage,
  parameters: { layout: 'fullscreen' },
  args: { sections: SECTIONS },
} satisfies Meta<typeof SettingsPage>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * THE WHOLE PAGE, under its bar — which is how it is always seen.
 *
 * Type in the search: it filters **in place**. §6 is emphatic that the page is a
 * directory, so navigating on the first keystroke destroys the overview the user
 * came for. Empty groups, cards and whole sections drop out, because a
 * two-character query otherwise leaves a page of empty tinted headers.
 *
 * Look for the thing that makes a card read as composed rather than assembled:
 * the group icon and every link label below it sit on **one vertical edge**, at
 * `card + 21`. Both insets come from the same padding, so the border takes care
 * of itself and neither number is typed anywhere.
 */
export const TheWholePage: Story = {
  render: function Render() {
    const [q, setQ] = useState('');
    return (
      <div className="h-screen flex flex-col">
        <SettingsBar mark={MARK} onSearch={setQ} onClose={() => {}}>
          <SettingsPage sections={SECTIONS} query={q} />
        </SettingsBar>
      </div>
    );
  },
};

/**
 * THE BACKDROP IS A DISSOLVE, AND THE 50% IS THE WHOLE POINT.
 *
 * Each section is `surface/default` at full strength on its top edge and **gone
 * by the halfway line**, so the bottom half is bare `surface/canvas` and the
 * cards float straight on the page. Spread the same two colours over the full
 * height and you get an even, flat tint — the top never solid, the bottom never
 * clear.
 *
 * It is a percentage of the section's height, so it holds across all three
 * lengths here without one hard-coded pixel. Watch where each section's white
 * gives out relative to its own height.
 */
export const TheDissolve: Story = {
  render: () => <SettingsPage sections={SECTIONS} />,
};

/**
 * FILTERED. §6.2 in action — try `sections={SECTIONS} query="tax"`.
 *
 * Only the Taxes group survives, and it survives **whole**: the match is on the
 * group title as well as the link labels, so "tax" surfaces the group rather
 * than just the two links whose own text contains it. Everything else — cards,
 * sections, headers — is gone rather than left standing empty.
 */
export const Filtered: Story = {
  render: () => <SettingsPage sections={SECTIONS} query="tax" />,
};

/**
 * NARROW. The grid reflows below 1000px — the exact figure the spec measured,
 * not Tailwind's 1024 `lg`, which is 24px wrong.
 *
 * `repeat(5, …)` is a fixed COUNT: at 375 it still resolves to five columns of
 * 44px and the page overflows by 69. `auto-fill` with a real 220px minimum is
 * what actually reflows — four columns, then three, then one, and a card never
 * goes below a width its labels can live in.
 *
 * Drag the Storybook viewport narrow and watch the count drop while the labels
 * stay on one line each.
 */
export const Narrow: Story = {
  parameters: { viewport: { defaultViewport: 'tablet' } },
  render: () => <SettingsPage sections={SECTIONS} />,
};
