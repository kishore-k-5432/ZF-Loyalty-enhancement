import { useState } from 'react';
import type { ReactNode } from 'react';
import type { SettingsLink } from '@canon';
import {
  Banner, Button, Checkbox, DatePicker, Divider, Field, Icon, Inline, InputField, RadioGroup, SettingsShell, Stack, Text, Textarea,
} from '@canon';
import { COMMERCE_MARK } from '../data/books-marks';
import { SETTINGS_SECTIONS } from '../data/settings';
import { PROGRAM_TYPE_LABEL, blankScheduled } from './v3/v3ProgramModel';
import type { ProgramRecord, ProgramType, SaleForm, ScheduleDates, ScheduledForm } from './v3/v3ProgramModel';
import { V3SaleBody } from './v3/V3SaleBody';
import { V3ScheduledBody } from './v3/V3ScheduledBody';
import { hasErrors, scheduledErrors } from './v3/v3spModel';

/*  VERSION 2 — New / Edit Loyalty Program. (Built as V3; promoted to V2
    when the earlier V2 was scrapped on 2026-11-17. Its parts still live in
    screens/v3/ under their V3 names.)

    General Details (name, description, program start date, Never Expire)
    and Program Type, then a body that depends on the type:
      · Points per sale  → V3SaleBody (V2's form + the pending period)
      · Scheduled points → V3ScheduledBody (a standalone program: an award
        date and repeat, a single rate or ranges, its own point value)

    The program list, the saved programs and the routing live in App. This
    screen edits a private draft and hands it back on Save. V1 and V2 are not
    imported from.  */

export interface LoyaltyV2Props {
  /** The program being edited, or a blank record for a new one. */
  initial: ProgramRecord;
  isNew: boolean;
  /** The V1 | V2 | V3 switch. App passes it for Points per sale only. */
  versionSwitch?: ReactNode;
  /** Create mode: the type was switched, so App can show or hide the switch. */
  onTypeChange: (type: ProgramType) => void;
  onSave: (record: ProgramRecord) => void;
  onCancel: () => void;
  onNavigate: (leaf: SettingsLink) => void;
  toast: string;
  onDismissToast: () => void;
  previewOpen: boolean;
  onPreviewOpenChange: (open: boolean) => void;
}

const PROGRAM_TYPE_OPTIONS = [
  {
    value: 'sale',
    label: PROGRAM_TYPE_LABEL.sale,
    description: 'Customers earn points on every purchase based on the bill value.',
  },
  {
    value: 'scheduled',
    label: PROGRAM_TYPE_LABEL.scheduled,
    description: 'Customers receive points automatically on a date you set, once or on a repeating schedule.',
  },
];

export function LoyaltyV2({
  initial, isNew, versionSwitch, onTypeChange, onSave, onCancel, onNavigate,
  toast, onDismissToast, previewOpen, onPreviewOpenChange,
}: LoyaltyV2Props) {
  //  Missing scheduled fields take their defaults, so a record held from an
  //  earlier shape of the model (a long-lived tab across an edit) still opens.
  const [draft, setDraft] = useState<ProgramRecord>(() => ({ ...initial, scheduled: { ...blankScheduled(), ...initial.scheduled } }));
  const [tried, setTried] = useState(false);
  //  Bumped when the type is switched, so the body remounts and its right rail
  //  (the checkout simulator) starts fresh.
  const [bodyKey, setBodyKey] = useState(0);

  const setSale = (patch: Partial<SaleForm>) => setDraft((d) => ({ ...d, sale: { ...d.sale, ...patch } }));
  const setScheduled = (patch: Partial<ScheduledForm>) => setDraft((d) => ({ ...d, scheduled: { ...d.scheduled, ...patch } }));

  //  Create mode only: switching type swaps the body and resets the right rail.
  //  The forms start from the blank record App handed in.
  const switchType = (type: ProgramType) => {
    setDraft((d) => ({ ...d, type, sale: initial.sale, scheduled: initial.scheduled }));
    setBodyKey((k) => k + 1);
    onTypeChange(type);
  };

  //  The program dates sit in General Details, but belong to the type's form.
  const dates: ScheduleDates = draft.type === 'sale' ? draft.sale : draft.scheduled;
  const setDates = (patch: Partial<ScheduleDates>) => (draft.type === 'sale' ? setSale(patch) : setScheduled(patch));

  const save = () => {
    setTried(true);
    if (!draft.name.trim() || !dates.programStart) return;
    if (draft.type === 'scheduled') {
      if (hasErrors(scheduledErrors(draft.scheduled))) return;
    }
    setTried(false);
    onSave(draft);
  };

  const nameError = tried && !draft.name.trim();
  const startError = tried && !dates.programStart;
  //  An existing Points per sale program keeps V2's read-only name, description
  //  and rewarding rules. Scheduled programs and new ones are editable.
  const readOnlyBasics = !isNew && draft.type === 'sale';

  const general = (
    <Stack gap={12}>
      {toast ? <Banner tone="success" onDismiss={onDismissToast}>{toast}</Banner> : null}

      <Text as="h2" size="subheading" weight="regular">General Details</Text>

      <Stack gap={0} className="w-field-xl shrink-0">
        <Field label="Program Name" required error={nameError} message={nameError ? 'Enter a program name.' : undefined}>
          {({ id, required, error, describedBy }) => (
            <InputField id={id} required={required} error={error} aria-describedby={describedBy} readOnly={readOnlyBasics} value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
          )}
        </Field>
      </Stack>

      <Stack gap={0} className="w-field-xl shrink-0">
        <Field label="Description">
          {({ id, describedBy }) => (
            <Textarea id={id} aria-describedby={describedBy} rows={3} readOnly={readOnlyBasics} value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
          )}
        </Field>
      </Stack>

      {/*  Program dates: a start date, and Never Expire. (Was the right
           rail's Schedule Program card.)  */}
      <Inline gap={10} align="end" className="flex-nowrap">
        <Stack gap={0} className="w-field-xl shrink-0">
          <Field label="Program Start Date" required error={startError} message={startError ? 'Select the program start date.' : undefined}>
            {({ id, required, error, describedBy }) => (
              <DatePicker id={id} required={required} error={error} ariaDescribedBy={describedBy} value={dates.programStart} onChange={(v) => setDates({ programStart: v })} />
            )}
          </Field>
        </Stack>
        {/*  Beside the date, on the input's line; its description moves to the ⓘ.  */}
        <Inline gap={0} align="center" className="h-control">
          <Checkbox
            label="Never Expire"
            info="The program will remain active indefinitely."
            selection={dates.neverExpire ? 'checked' : 'unchecked'}
            onSelectionChange={(next) => setDates({ neverExpire: next === 'checked' })}
          />
        </Inline>
      </Inline>

      {/*  Program Type: chosen at creation, fixed afterwards. In edit mode
           only the chosen card is shown, with a lock note.  */}
      <Stack gap={4} className={isNew ? 'max-w-settings-option-card' : 'max-w-settings-option-panel'}>
        <RadioGroup
          label="Program Type"
          required
          variant="tile"
          layout="inline"
          value={draft.type}
          onChange={(v) => { if (isNew) switchType(v as ProgramType); }}
          options={isNew ? PROGRAM_TYPE_OPTIONS : PROGRAM_TYPE_OPTIONS.filter((o) => o.value === draft.type)}
        />
        {!isNew ? (
          <Inline gap={2} align="center">
            <Icon name="lock" size="sm" tone="muted" />
            <Text size="body-sm" tone="tertiary">Program type can&apos;t be changed after creation.</Text>
          </Inline>
        ) : null}
      </Stack>
    </Stack>
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
            <Text as="h1" size="title" weight="regular">{isNew ? 'New Loyalty Program' : 'Edit Loyalty Program'}</Text>
            {versionSwitch}
          </Inline>
          <Button type="button" emphasis="tertiary" size="md" icon="close" label="Close editor" onClick={onCancel} />
        </Inline>
      )}
      footer={(
        <Stack gap={0}>
          <Divider gap="none" />
          <Inline gap={5} className="px-10 py-6">
            <Button type="button" emphasis="primary" size="md" onClick={save}>Save</Button>
            <Button type="button" emphasis="secondary" size="md" onClick={onCancel}>Cancel</Button>
          </Inline>
        </Stack>
      )}
    >
      {draft.type === 'sale' ? (
        <V3SaleBody
          key={bodyKey}
          general={general}
          form={draft.sale}
          onChange={setSale}
          editable={!readOnlyBasics}
          previewOpen={previewOpen}
          onPreviewOpenChange={onPreviewOpenChange}
        />
      ) : (
        <V3ScheduledBody
          key={bodyKey}
          general={general}
          form={draft.scheduled}
          onChange={setScheduled}
          tried={tried}
          previewOpen={previewOpen}
          onPreviewOpenChange={onPreviewOpenChange}
        />
      )}
    </SettingsShell>
  );
}
