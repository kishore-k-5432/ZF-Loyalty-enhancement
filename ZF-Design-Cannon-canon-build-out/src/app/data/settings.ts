import type { SettingsSection } from '@canon';

/**
 * The settings directory. Application data, not design data — the canon owns how
 * a card looks, this owns which destinations exist and how they group.
 *
 * The `tone` on each group is CATEGORICAL, and that is worth restating here
 * because it is the thing most likely to be "corrected" by someone reading the
 * data alone: Taxes is red because it is a category, not because anything is
 * wrong, and Setup is orange for the same reason. Nothing on this page has a
 * status. The mapping is ZF-SETTINGS-PAGE.md §4's table verbatim.
 */

const link = (label: string) => ({
  id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  label,
  href: `#/settings/${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
});

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: 'global',
    title: 'Organization Settings',
    cards: [
      {
        id: 'organization',
        groups: [{
          id: 'organization', title: 'Organization', tone: 'green', icon: 'organization',
          links: ['Profile', 'Branding', 'Custom Domain', 'Locations', 'Networking',
            'AI Integration', 'Manage Subscription'].map(link),
        }],
      },
      {
        id: 'taxes',
        groups: [{
          id: 'taxes', title: 'Taxes & Compliance', tone: 'blue', icon: 'tax',
          links: ['Taxes', 'Direct Taxes', 'e-Way Bills', 'e-Invoicing',
            'MSME Settings'].map(link),
        }],
      },
      {
        id: 'setup',
        groups: [{
          id: 'setup', title: 'Setup & Configurations', tone: 'orange', icon: 'preference',
          links: ['General', 'Currencies', 'Loyalty Program'].map(link),
        }],
      },
      {
        id: 'customization',
        groups: [{
          id: 'customization', title: 'Customization', tone: 'orange', icon: 'customization',
          links: ['Transaction Number Series', 'PDF Templates', 'Email Notifications',
            'SMS Notifications', 'Reporting Tags', 'Web Tabs', 'Digital Signature',
            'WhatsApp Templates'].map(link),
        }],
      },
      {
        id: 'automation',
        groups: [{
          id: 'automation', title: 'Automation', tone: 'red', icon: 'automation',
          links: ['Workflow Rules', 'Workflow Actions', 'Workflow Logs', 'Schedules'].map(link),
        }],
      },
    ],
  },
  {
    id: 'module',
    title: 'Module Settings',
    cards: [
      {
        id: 'general',
        groups: [{
          id: 'module-general', title: 'General', tone: 'green', icon: 'general',
          links: ['Customers and Vendors', 'Items', 'Accountant', 'Tasks'].map(link),
        }],
      },
      {
        id: 'inventory',
        groups: [{
          id: 'inventory', title: 'Inventory', tone: 'red', icon: 'inventory',
          links: ['Units of Measurement', 'Assemblies', 'Inventory Adjustments',
            'Stock Counts', 'Picklists', 'Packages', 'Shipments', 'Transfer Orders'].map(link),
        }],
      },
      {
        id: 'sales',
        groups: [{
          id: 'sales', title: 'Sales', tone: 'green', icon: 'sales',
          links: ['Sales Orders', 'Invoices', 'Sales Receipts', 'Payments Received',
            'Sales Returns', 'Credit Notes'].map(link),
        }],
      },
      {
        id: 'online-store',
        groups: [{
          id: 'online-store', title: 'Online Store', tone: 'blue', icon: 'online-payment',
          links: ['Preferences', 'Checkout', 'Customer Portal', 'Domain'].map(link),
        }],
      },
      {
        id: 'custom-modules',
        groups: [{
          id: 'custom-modules', title: 'Custom Modules', tone: 'blue', icon: 'custom-modules',
          //  `testmod` is a real user-created module in the source screen, not
          //  placeholder text.
          links: ['Overview', 'testmod'].map(link),
        }],
      },
    ],
  },
  {
    //  The reference rail shows this heading with its groups scrolled past —
    //  it is the last section, and its groups live below the fold.
    id: 'extensions',
    title: 'Extension and Developer Data',
    cards: [],
  },
];
