import type { ReactNode } from 'react';
import type { SettingsLink, TableColumn } from '@canon';
import {
  Banner, Button, Inline, SettingsShell, Stack, StatusBadge, Surface, Table, Tabs, Text,
} from '@canon';
import { COMMERCE_MARK } from '../../data/books-marks';
import { SETTINGS_SECTIONS } from '../../data/settings';
import { PROGRAM_TYPE_LABEL } from './v3ProgramModel';
import type { ProgramRecord } from './v3ProgramModel';

/*  VERSION 3 — Screen A: the Loyalty Program list.
    Tabs Preferences · Programs (Programs by default).  */

export type V3Tab = 'preferences' | 'programs';

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
}

export function V3ProgramList({
  tab, onTabChange, programs, onOpen, onNew, toast, onDismissToast, onNavigate, versionSwitch,
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
              <Surface radius="card" border="default" pad={12}>
                <Text size="body" tone="secondary">Preferences — unchanged in this POC</Text>
              </Surface>
            ) : (
              <Table caption="Loyalty programs" columns={columns} rows={programs} rowKey={(p) => p.id} />
            )}
          </Stack>
        </Tabs>
      </Stack>
    </SettingsShell>
  );
}
