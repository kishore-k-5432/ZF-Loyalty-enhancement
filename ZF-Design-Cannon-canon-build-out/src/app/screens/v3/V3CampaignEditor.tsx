import { useState } from 'react';
import type { ReactNode } from 'react';
import type { SettingsLink } from '@canon';
import type { IconName } from '@canon';
import {
  Button, Checkbox, DatePicker, Divider, Field, Icon, Inline, InputField, Pill, RadioGroup,
  Segmented, Select, SettingsShell, Stack, Surface, Text, Textarea,
} from '@canon';
import { COMMERCE_MARK } from '../../data/books-marks';
import { SETTINGS_SECTIONS } from '../../data/settings';
import { V3CriteriaBuilder, describeRow, rowHasValue } from './v3CriteriaBuilder';
import {
  PROGRAM_NAME, V3OptionCard, WEEKDAYS, clampDay, nextRun, orderedDays, v3Fmt,
} from './v3Shared';
import type { Campaign, ProgramInfo } from './v3Shared';

/*  VERSION 3 — Screen 3: New / Edit Campaign. Same layout as Edit Loyalty
    Program: the form on the left, Schedule and the live preview on the right,
    Save / Cancel in the footer.  */

export interface V3CampaignEditorProps {
  initial: Campaign;
  isNew: boolean;
  program: ProgramInfo;
  onSave: (c: Campaign) => void;
  onCancel: () => void;
  onNavigate: (leaf: SettingsLink) => void;
  versionSwitch?: ReactNode;
}

const BASE_AUDIENCE = 1240;

/*  A label over a value — the preview's rows, without the On/Off badge.  */
function PreviewRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <Inline gap={6} align="center" className="flex-nowrap px-6 py-5">
      <Surface tone="default" radius="full" border="divider" pad={4} className="shrink-0">
        <Icon name={icon} size="sm" tone="primary" />
      </Surface>
      <Stack gap={0} className="min-w-0 flex-1">
        <Text size="overline" tone="tertiary">{label}</Text>
        <Text size="body" weight="medium">{value}</Text>
      </Stack>
    </Inline>
  );
}

function joinWords(xs: string[]): string {
  return xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : (xs[0] ?? '—');
}

export function V3CampaignEditor({ initial, isNew, program, onSave, onCancel, onNavigate, versionSwitch }: V3CampaignEditorProps) {
  const [c, setC] = useState<Campaign>(initial);
  const [tried, setTried] = useState(false);
  const set = (patch: Partial<Campaign>) => setC((prev) => ({ ...prev, ...patch }));

  /* ── Validation ─────────────────────────────────────────────────────────── */
  const nameError = tried && !c.name.trim();
  const pointsError = tried && !(Number(c.points) > 0);

  const { start: pStart, end: pEnd } = program;
  const datesOutside = Boolean(pStart) && (
    !c.start
    || c.start < (pStart as string)
    || (pEnd !== null && c.start > pEnd)
    || (c.noEnd ? pEnd !== null : Boolean(c.end) && ((pEnd !== null && c.end > pEnd) || c.end < (pStart as string)))
  );
  const datesMessage = `Campaign dates must be within the program dates (${v3Fmt(pStart ?? '')} – ${pEnd ? v3Fmt(pEnd) : 'no end date'}).`;

  const save = () => {
    setTried(true);
    if (!c.name.trim() || !(Number(c.points) > 0) || datesOutside) return;
    onSave(c);
  };

  /* ── Live preview ───────────────────────────────────────────────────────── */
  const day = clampDay(c.monthDay);
  const lead = c.trigger === 'birthday' ? 'On their birthday'
    : c.trigger === 'anniversary' ? 'On their membership anniversary'
      : c.frequency === 'daily' ? 'Every day'
        : c.frequency === 'weekly' ? `Every week on ${joinWords(orderedDays(c.weekdays))}`
          : `Every month on day ${day}`;

  const periodWord = c.trigger !== 'recurring' ? 'in the last 12 months'
    : c.frequency === 'daily' ? 'yesterday' : c.frequency === 'weekly' ? 'last week' : 'last month';

  const activeRows = c.conditionsOn ? c.criteria.filter(rowHasValue) : [];
  const audience = activeRows.length === 0
    ? 'all loyalty customers'
    : activeRows.reduce((acc, r, i) => {
      const part = describeRow(r, periodWord);
      return i === 0 ? `customers ${part}` : `${acc}${r.join === 'OR' ? ', or' : ''} ${part}`;
    }, '');
  const pts = Number(c.points) || 0;
  const summary = `${lead}, ${audience} get ${pts.toLocaleString('en-IN')} ${pts === 1 ? 'point' : 'points'}.`;

  const matching = Math.round(BASE_AUDIENCE / 2 ** activeRows.length);
  const availability = program.pendingOn && !c.skipPending ? 'Follows program pending period' : 'Immediate';

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
            <Inline gap={3} align="center">
              <Button type="button" emphasis="tertiary" size="md" icon="chevron-left" label="Back to Campaigns" onClick={onCancel} />
              <Text as="button" size="body" tone="link" className="cursor-pointer" onClick={onCancel}>Campaigns</Text>
              <Text size="body" tone="tertiary">/</Text>
              <Text as="h1" size="title" weight="regular">{isNew ? 'New Campaign' : 'Edit Campaign'}</Text>
            </Inline>
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
      <Inline gap={16} align="start" className="flex-nowrap pe-10 pb-20">
        <Stack gap={0} className="flex-1 min-w-0 max-w-settings-form">
          {/*  1. GENERAL DETAILS  */}
          <Stack gap={12}>
            <Text as="h2" size="subheading" weight="regular">General Details</Text>

            <Stack gap={0} className="w-field-xl shrink-0">
              <Field label="Campaign Name" required error={nameError} message={nameError ? 'Enter a campaign name.' : undefined}>
                {({ id, required, error, describedBy }) => (
                  <InputField id={id} required={required} error={error} aria-describedby={describedBy} value={c.name} onChange={(e) => set({ name: e.target.value })} />
                )}
              </Field>
            </Stack>

            <Stack gap={0} className="w-field-xl shrink-0">
              <Field label="Description">
                {({ id, describedBy }) => (
                  <Textarea id={id} aria-describedby={describedBy} rows={3} value={c.description} onChange={(e) => set({ description: e.target.value })} />
                )}
              </Field>
            </Stack>

            <Stack gap={0} className="w-field-xl shrink-0">
              <Field label="Loyalty Program" required>
                {({ id, required, describedBy }) => (
                  <Select id={id} required={required} ariaDescribedBy={describedBy} value={c.program} onChange={(v) => set({ program: v })} options={[{ value: PROGRAM_NAME, label: PROGRAM_NAME }]} />
                )}
              </Field>
            </Stack>
          </Stack>

          <Stack gap={16} className="pt-15 max-w-settings-form">
            {/*  2. TRIGGER  */}
            <V3OptionCard title="Trigger" icon="automation">
              <Stack gap={0} className="max-w-settings-option-panel">
                <RadioGroup
                  label="When should points be awarded?"
                  required
                  variant="tile"
                  layout="stacked"
                  value={c.trigger}
                  onChange={(v) => set({ trigger: v as Campaign['trigger'] })}
                  options={[
                    {
                      value: 'recurring',
                      label: 'Recurring',
                      description: 'Award points on a repeating schedule.',
                      detail: c.trigger === 'recurring' ? (
                        <Stack gap={6}>
                          <Segmented
                            size="sm"
                            label="Repeat"
                            className="self-start"
                            value={c.frequency}
                            onChange={(v) => set({ frequency: v as Campaign['frequency'] })}
                            options={[
                              { value: 'daily', label: 'Daily' },
                              { value: 'weekly', label: 'Weekly' },
                              { value: 'monthly', label: 'Monthly' },
                            ]}
                          />
                          {c.frequency === 'weekly' ? (
                            <Inline gap={2} wrap>
                              {WEEKDAYS.map((d) => (
                                <Pill
                                  key={d}
                                  label={d}
                                  selected={c.weekdays.includes(d)}
                                  onSelectedChange={(on) => set({ weekdays: on ? [...c.weekdays, d] : c.weekdays.filter((x) => x !== d) })}
                                />
                              ))}
                            </Inline>
                          ) : null}
                          {c.frequency === 'monthly' ? (
                            <Stack gap={0} className="w-field-xs">
                              <Field label="On day" message="1–28" showMessage>
                                {({ id, describedBy }) => (
                                  <InputField id={id} aria-describedby={describedBy} format="numeric" align="end" value={c.monthDay} onChange={(e) => set({ monthDay: e.target.value })} onBlur={() => set({ monthDay: String(clampDay(c.monthDay)) })} />
                                )}
                              </Field>
                            </Stack>
                          ) : null}
                        </Stack>
                      ) : undefined,
                    },
                    {
                      value: 'birthday',
                      label: 'Customer\'s birthday',
                      description: 'Award points once a year on the customer\'s date of birth. Customers without a date of birth are skipped.',
                    },
                    {
                      value: 'anniversary',
                      label: 'Membership anniversary',
                      description: 'Award points once a year on the date the customer joined the loyalty program.',
                    },
                  ]}
                />
              </Stack>
            </V3OptionCard>

            {/*  3. CONDITIONS  */}
            <V3OptionCard title="Conditions" icon="filter">
              <Checkbox
                label="Award only to customers who match these conditions"
                selection={c.conditionsOn ? 'checked' : 'unchecked'}
                onSelectionChange={(next) => set({ conditionsOn: next === 'checked' })}
              />
              {c.conditionsOn ? (
                <V3CriteriaBuilder rows={c.criteria} onChange={(criteria) => set({ criteria })} />
              ) : null}
              <Text size="body-sm" tone="secondary">
                &lsquo;Last period&rsquo; follows the trigger: previous day, week, or month. For birthday and anniversary triggers it means the last 12 months.
              </Text>
            </V3OptionCard>

            {/*  4. REWARD  */}
            <V3OptionCard title="Reward" icon="gift">
              <Stack gap={0} className="w-field-lg shrink-0">
                <Field label="Points to award" required error={pointsError} message={pointsError ? 'Enter the points to award.' : undefined}>
                  {({ id, required, error, describedBy }) => (
                    <InputField id={id} required={required} error={error} aria-describedby={describedBy} format="numeric" prefix="Points" align="end" value={c.points} onChange={(e) => set({ points: e.target.value })} />
                  )}
                </Field>
              </Stack>
              {program.pendingOn ? (
                <Checkbox
                  label="Skip pending period"
                  description="Bonus points become available immediately. Pending periods protect against returns, and campaign points have no bill to return."
                  selection={c.skipPending ? 'checked' : 'unchecked'}
                  onSelectionChange={(next) => set({ skipPending: next === 'checked' })}
                />
              ) : (
                <Text size="body" tone="tertiary">This program has no pending period.</Text>
              )}
            </V3OptionCard>
          </Stack>
        </Stack>

        {/*  RIGHT COLUMN — Schedule, then the sticky live preview.  */}
        <Stack gap={8} className="self-stretch w-settings-aside shrink-0">
          {/*  5. SCHEDULE  */}
          <Surface tone="sunken" radius="xl" pad={12}>
            <Stack gap={10}>
              <Text as="h2" size="subheading" weight="regular">Schedule</Text>
              <Stack gap={8}>
                <Field label="Campaign Start Date" required>
                  {({ id, required, describedBy }) => (
                    <DatePicker id={id} required={required} ariaDescribedBy={describedBy} error={datesOutside} value={c.start} onChange={(v) => set({ start: v })} />
                  )}
                </Field>
                <Field label="Campaign End Date" disabled={c.noEnd}>
                  {({ id, describedBy }) => (
                    <DatePicker id={id} ariaDescribedBy={describedBy} disabled={c.noEnd} error={datesOutside && !c.noEnd} min={c.start} value={c.noEnd ? '' : c.end} onChange={(v) => set({ end: v })} />
                  )}
                </Field>
                <Checkbox
                  label="No end date"
                  selection={c.noEnd ? 'checked' : 'unchecked'}
                  onSelectionChange={(next) => set({ noEnd: next === 'checked' })}
                />
                {datesOutside ? <Text size="body-sm" tone="danger">{datesMessage}</Text> : null}
              </Stack>
            </Stack>
          </Surface>

          {/*  6. LIVE PREVIEW  */}
          <Stack gap={0} className="sticky top-10 max-h-settings-sticky-max overflow-y-auto overscroll-contain">
            <Surface tone="sunken" radius="xl" pad={12}>
              <Stack gap={10}>
                <Stack gap={2}>
                  <Text as="h2" size="subheading" weight="regular">Live preview</Text>
                  <Text size="body" tone="secondary">What this campaign will do.</Text>
                </Stack>

                <Surface tone="default" radius="lg" border="divider" pad={8}>
                  <Stack gap={2}>
                    <Text size="overline" tone="tertiary">Summary</Text>
                    <Text size="body" weight="medium">{summary}</Text>
                  </Stack>
                </Surface>

                <Surface tone="default" radius="lg" border="divider" pad={0}>
                  <Stack gap={0}>
                    <PreviewRow icon="refresh" label="Next run" value={nextRun(c)} />
                    <Divider gap="none" />
                    <PreviewRow icon="users" label="Customers matching today" value={`~${matching.toLocaleString('en-IN')} customers match today`} />
                  </Stack>
                </Surface>

                <Stack gap={6}>
                  <Text size="overline" tone="tertiary">Points behaviour</Text>
                  <Surface tone="default" radius="lg" border="divider" pad={0}>
                    <Stack gap={0}>
                      <PreviewRow icon="alert-circle" label="Expiry" value={`Follows program (${program.expiry})`} />
                      <Divider gap="none" />
                      <PreviewRow icon="hourglass" label="Availability" value={availability} />
                    </Stack>
                  </Surface>
                </Stack>
              </Stack>
            </Surface>
          </Stack>
        </Stack>
      </Inline>
    </SettingsShell>
  );
}
