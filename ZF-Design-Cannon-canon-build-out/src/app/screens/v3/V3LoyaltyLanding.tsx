import type { ReactNode } from 'react';
import type { SettingsLink } from '@canon';
import type { TableColumn } from '@canon';
import {
  Banner, Button, Icon, Inline, SettingsShell, Stack, StatusBadge, Surface, Table, Tabs, Text,
} from '@canon';
import { COMMERCE_MARK } from '../../data/books-marks';
import { SETTINGS_SECTIONS } from '../../data/settings';
import { PROGRAM_NAME, nextRun, triggerLabel } from './v3Shared';
import type { Campaign } from './v3Shared';

/*  VERSION 3 — Screen 2: the Loyalty Program landing page.
    Tabs Preferences · Programs · Campaigns. The primary button follows the tab:
    "New Loyalty Program" on the first two, "New Campaign" on Campaigns.  */

export type V3Tab = 'preferences' | 'programs' | 'campaigns';

export interface V3LoyaltyLandingProps {
  tab: V3Tab;
  onTabChange: (next: V3Tab) => void;
  campaigns: Campaign[];
  onOpenProgram: () => void;
  onNewProgram: () => void;
  /** `null` opens a blank campaign. */
  onOpenCampaign: (c: Campaign | null) => void;
  showEmpty: boolean;
  onShowEmptyChange: (next: boolean) => void;
  toast: string;
  onDismissToast: () => void;
  onNavigate: (leaf: SettingsLink) => void;
  versionSwitch?: ReactNode;
}

type ProgramRow = { id: string; name: string; description: string; active: boolean };
const PROGRAMS: ProgramRow[] = [{ id: 'p1', name: PROGRAM_NAME, description: '—', active: true }];

export function V3LoyaltyLanding({
  tab, onTabChange, campaigns, onOpenProgram, onNewProgram, onOpenCampaign,
  showEmpty, onShowEmptyChange, toast, onDismissToast, onNavigate, versionSwitch,
}: V3LoyaltyLandingProps) {
  const onCampaigns = tab === 'campaigns';

  const programColumns: TableColumn<ProgramRow>[] = [
    {
      id: 'name', header: 'Name',
      cell: (r) => <Text as="button" tone="link" className="cursor-pointer text-start" onClick={onOpenProgram}>{r.name}</Text>,
    },
    { id: 'description', header: 'Description', cell: (r) => <Text tone="secondary">{r.description}</Text> },
    { id: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.active ? 'success' : 'inactive'}>{r.active ? 'Active' : 'Inactive'}</StatusBadge> },
  ];

  const campaignColumns: TableColumn<Campaign>[] = [
    {
      id: 'name', header: 'Name',
      cell: (c) => <Text as="button" tone="link" className="cursor-pointer text-start" onClick={() => onOpenCampaign(c)}>{c.name}</Text>,
    },
    { id: 'program', header: 'Program', cell: (c) => <Text>{c.program}</Text> },
    { id: 'trigger', header: 'Trigger', cell: (c) => <Text>{triggerLabel(c)}</Text> },
    { id: 'next', header: 'Next Run', cell: (c) => <Text tone="secondary">{c.active ? nextRun(c) : '—'}</Text> },
    { id: 'status', header: 'Status', cell: (c) => <StatusBadge status={c.active ? 'success' : 'inactive'}>{c.active ? 'Active' : 'Inactive'}</StatusBadge> },
  ];

  const empty = (
    <Surface radius="card" border="default" pad={12}>
      <Stack gap={6} align="center" className="py-20">
        <Surface tone="sunken" radius="full" pad={6}>
          <Icon name="gift" size="xl" tone="primary" />
        </Surface>
        <Text as="h3" size="subheading" weight="regular">No campaigns yet</Text>
        <Text size="body" tone="secondary" className="text-center max-w-settings-option-panel">
          Award bonus points automatically on a schedule, a birthday, or a membership anniversary.
        </Text>
        <Button type="button" emphasis="primary" size="md" icon="plus" onClick={() => onOpenCampaign(null)}>
          New Campaign
        </Button>
      </Stack>
    </Surface>
  );

  return (
    <SettingsShell
      sections={SETTINGS_SECTIONS}
      currentId="loyalty-program"
      onNavigate={onNavigate}
      mark={COMMERCE_MARK}
      title="All Settings"
      org="Nithish & co"
      searchPlaceholder="Search settings ( / )"
      onBack={() => undefined}
      onClose={() => undefined}
      header={(
        <Inline justify="between" align="center" grow>
          <Inline gap={8} align="center">
            <Text as="h1" size="title" weight="regular">Loyalty Program</Text>
            {versionSwitch}
          </Inline>
          {onCampaigns ? (
            <Button type="button" emphasis="primary" size="md" icon="plus" onClick={() => onOpenCampaign(null)}>
              New Campaign
            </Button>
          ) : (
            <Button type="button" emphasis="primary" size="md" icon="plus" onClick={onNewProgram}>
              New Loyalty Program
            </Button>
          )}
        </Inline>
      )}
    >
      <Stack gap={8} className="pe-10 pb-20">
        {toast ? <Banner tone="success" onDismiss={onDismissToast}>{toast}</Banner> : null}

        <Tabs
          inset="none"
          label="Loyalty Program"
          value={tab}
          onChange={(v) => onTabChange(v as V3Tab)}
          items={[
            { id: 'preferences', label: 'Preferences' },
            { id: 'programs', label: 'Programs' },
            { id: 'campaigns', label: 'Campaigns', badge: String(campaigns.length) },
          ]}
        >
          <Stack gap={8} className="pt-8">
            {tab === 'preferences' ? (
              <Surface radius="card" border="default" pad={12}>
                <Text size="body" tone="secondary">Preferences — unchanged in this POC</Text>
              </Surface>
            ) : null}

            {tab === 'programs' ? (
              <Table caption="Loyalty programs" columns={programColumns} rows={PROGRAMS} rowKey={(r) => r.id} />
            ) : null}

            {onCampaigns ? (
              <>
                {showEmpty || campaigns.length === 0
                  ? empty
                  : <Table caption="Campaigns" columns={campaignColumns} rows={campaigns} rowKey={(c) => c.id} />}
                <Inline gap={0}>
                  <Text as="button" size="caption" tone="link" className="cursor-pointer" onClick={() => onShowEmptyChange(!showEmpty)}>
                    {showEmpty ? 'Show campaigns (POC)' : 'Show empty state (POC)'}
                  </Text>
                </Inline>
              </>
            ) : null}
          </Stack>
        </Tabs>
      </Stack>
    </SettingsShell>
  );
}
