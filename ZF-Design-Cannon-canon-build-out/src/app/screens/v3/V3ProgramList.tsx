import type { ReactNode } from 'react';
import type { SettingsLink, TableColumn } from '@canon';
import {
  Banner, Button, Checkbox, Divider, Inline, RadioGroup, SettingsShell, Stack, StatusBadge, Table, Tabs, Text, Toggle,
} from '@canon';
import { COMMERCE_MARK } from '../../data/books-marks';
import { SETTINGS_SECTIONS } from '../../data/settings';
import { PROGRAM_TYPE_LABEL } from './v3ProgramModel';
import type { LoyaltyPrefs, ProgramRecord } from './v3ProgramModel';

/*  VERSION 3 — Screen A: the Loyalty Program list.
    Tabs Preferences · Programs (Programs by default).  */

export type V3Tab = 'preferences' | 'programs';

const PREF_OPTIONS: { key: Exclude<keyof LoyaltyPrefs, 'enabled' | 'retainMode'>; label: string; info?: string }[] = [
  { key: 'allowAdjust', label: 'Allow users to adjust the loyalty points of customers' },
  {
    key: 'roundOff',
    label: 'Round off the loyalty points to the nearest whole number',
    info: 'Fractional points are rounded to the nearest whole number. For example, 12.5 points become 13 and 12.4 become 12.',
  },
  { key: 'deductOnReturn', label: 'Deduct loyalty points when items are returned' },
  { key: 'restrictOnRedeem', label: 'Restrict awarding loyalty points when it is redeemed' },
  { key: 'excludeTax', label: 'Exclude the tax amount while calculating loyalty points' },
  {
    key: 'retainOnSwitch',
    label: 'Retain the existing loyalty points when switching programs',
    info: 'Example: a customer with 500 points moves to another program, and the 500 points go with them. Expired points don\'t.',
  },
];

export interface V3ProgramListProps {
  tab: V3Tab;
  onTabChange: (next: V3Tab) => void;
  programs: ProgramRecord[];
  onOpen: (p: ProgramRecord) => void;
  onNew: () => void;
  toast: string;
  onDismissToast: () => void;
  onNavigate: (leaf: SettingsLink) => void;
  versionSwitch?: ReactNode;
  prefs: LoyaltyPrefs;
  onPrefsChange: (patch: Partial<LoyaltyPrefs>) => void;
}

export function V3ProgramList({
  tab, onTabChange, programs, onOpen, onNew, toast, onDismissToast, onNavigate, versionSwitch, prefs, onPrefsChange,
}: V3ProgramListProps) {
  const columns: TableColumn<ProgramRecord>[] = [
    {
      id: 'name', header: 'Name',
      cell: (p) => <Text as="button" tone="link" className="cursor-pointer text-start" onClick={() => onOpen(p)}>{p.name}</Text>,
    },
    { id: 'description', header: 'Description', cell: (p) => <Text tone="secondary">{p.description}</Text> },
    { id: 'type', header: 'Program Type', cell: (p) => <Text>{PROGRAM_TYPE_LABEL[p.type]}</Text> },
    { id: 'status', header: 'Status', cell: (p) => <StatusBadge status={p.active ? 'success' : 'inactive'}>{p.active ? 'Active' : 'Inactive'}</StatusBadge> },
  ];

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
          <Button type="button" emphasis="primary" size="md" icon="plus" onClick={onNew}>
            New Loyalty Program
          </Button>
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
          ]}
        >
          <Stack gap={8} className="pt-8">
            {tab === 'preferences' ? (
              <Stack gap={10}>
                <Inline gap={8} justify="between" align="start" className="flex-nowrap">
                  <Stack gap={2} className="min-w-0">
                    <Text as="h2" size="subheading" weight="regular">Loyalty Program</Text>
                    <Text size="body" tone="secondary">
                      Enable loyalty programs to award points on sales and allow customers to redeem them in future transactions.
                    </Text>
                  </Stack>
                  <Toggle label={prefs.enabled ? 'Enabled' : 'Disabled'} checked={prefs.enabled} onCheckedChange={(enabled) => onPrefsChange({ enabled })} />
                </Inline>

                <Divider gap="none" />

                {/*  Off with the master switch, as they mean nothing without it.  */}
                <Stack gap={5}>
                  {PREF_OPTIONS.map((o) => (
                    <Stack key={o.key} gap={4}>
                      <Checkbox
                        label={o.label}
                        info={o.info}
                        disabled={!prefs.enabled}
                        selection={prefs[o.key] ? 'checked' : 'unchecked'}
                        onSelectionChange={(next) => onPrefsChange({ [o.key]: next === 'checked' })}
                      />
                      {/*  Retained points: as they were, or re-applied under the
                           new program's rewarding rules.  */}
                      {o.key === 'retainOnSwitch' && prefs.retainOnSwitch ? (
                        <Stack gap={0} className="ps-10 max-w-settings-option-card">
                          <RadioGroup
                            label="Carried-over points"
                            hideLabel
                            variant="tile"
                            layout="inline"
                            disabled={!prefs.enabled}
                            //  A tab held across the edit that added this field has no value yet.
                            value={prefs.retainMode ?? 'as-is'}
                            onChange={(v) => onPrefsChange({ retainMode: v as LoyaltyPrefs['retainMode'] })}
                            options={[
                              { value: 'as-is', label: 'Keep as they are', description: 'Points move over unchanged, at their original value.' },
                              { value: 'new-rules', label: 'Apply the new program\'s rules', description: 'Points are recalculated under the new program\'s rewarding rules.' },
                            ]}
                          />
                        </Stack>
                      ) : null}
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            ) : (
              <Table caption="Loyalty programs" columns={columns} rows={programs} rowKey={(p) => p.id} />
            )}
          </Stack>
        </Tabs>
      </Stack>
    </SettingsShell>
  );
}
