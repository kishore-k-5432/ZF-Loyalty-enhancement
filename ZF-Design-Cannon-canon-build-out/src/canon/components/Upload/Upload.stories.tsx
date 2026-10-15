import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Upload } from './Upload';
import type { UploadFile } from './Upload';
import { Stack, Text } from '../../primitives';

const meta = {
  title: 'Components/Upload', component: Upload,
  parameters: { layout: 'padded' },
  args: { files: [], onAdd: () => {}, onRemove: () => {}, onRetry: () => {}, onCancel: () => {} },
} satisfies Meta<typeof Upload>;
export default meta;
type Story = StoryObj<typeof meta>;

const MB = 1024 * 1024;

/**
 * THE ONE TO USE. Drop files on it, or use the button — and the button is the
 * point: §1.1 is that pointer drag has no keyboard equivalent, *not a poor one,
 * none*, so the trigger drives a real `<input type="file">` and the zone is a
 * convenience layered over it.
 *
 * `maxSize` is 2 MB here so the rejection path is reachable. Drop something
 * bigger and the ZONE goes red and names the file — it does not become a row,
 * because a rejected file has no id, no progress and nothing to retry (§9.2).
 */
export const TheWholeZone: Story = {
  render: function Render() {
    const [files, setFiles] = useState<UploadFile[]>([]);
    return (
      <Upload
        maxSize={2 * MB}
        files={files}
        onAdd={(added) => setFiles((l) => [
          ...l,
          ...added.map((f, i) => ({
            id: `${f.name}-${l.length + i}`,
            name: f.name,
            size: f.size,
            state: 'complete' as const,
            kind: f.name.split('.').pop()?.toUpperCase(),
          })),
        ])}
        onRemove={(id) => setFiles((l) => l.filter((f) => f.id !== id))}
        onRetry={() => {}}
        onCancel={(id) => setFiles((l) => l.filter((f) => f.id !== id))}
      />
    );
  },
};

const FOUR: UploadFile[] = [
  { id: '1', name: 'invoice-scan.png', size: 8 * MB, state: 'queued' },
  { id: '2', name: 'receipt-08.pdf', size: 8 * MB, state: 'uploading', sent: 2.4 * MB },
  { id: '3', name: 'purchase-order-signed.pdf', size: 8 * MB, state: 'complete', kind: 'PDF' },
  { id: '4', name: 'contract-appendix-b.docx', size: 24 * MB, state: 'error', error: 'Upload failed — the connection dropped' },
];

/**
 * THE FOUR ROW STATES, §9.1. Each gets a different affordance — cancel, cancel,
 * remove, retry — which is the whole reason the row has states at all.
 *
 * **The row is 56 in every one of them.** The progress bar lives INSIDE the 16px
 * meta band with the byte string hugging its end, so it never adds a third line
 * and the list never reflows mid-upload.
 *
 * The tick on `complete` is decorative and `aria-hidden`: the same fact is
 * already in the meta text, so only retry and remove are controls.
 */
export const RowStates: Story = {
  render: function Render() {
    const [files, setFiles] = useState(FOUR);
    return (
      <Upload
        size="compact"
        files={files}
        onAdd={() => {}}
        onRemove={(id) => setFiles((l) => l.filter((f) => f.id !== id))}
        onRetry={(id) => setFiles((l) => l.map((f) => (
          f.id === id ? { ...f, state: 'uploading' as const, sent: 0 } : f)))}
        onCancel={(id) => setFiles((l) => l.filter((f) => f.id !== id))}
      />
    );
  },
};

/**
 * A LONG FILENAME BREAKS THE ROW IN TWO PLACES, and §14.1 is that the flex fix
 * alone cures neither. `grid-cols-1` on the list has to come first: without an
 * explicit track the implicit column is sized to the row's min-content
 * contribution, the row is never squeezed, and every `min-w-0` below reads as if
 * it were working while doing nothing. The md measured a 682.58px row inside a
 * 680px list with `scrollWidth === clientWidth`.
 *
 * Both filenames below should ellipsise and keep their trailing buttons on the
 * row. Hover the name for the full string — §14.2, truncated text has no tooltip
 * of its own.
 */
export const LongFilenames: Story = {
  render: function Render() {
    const [files, setFiles] = useState<UploadFile[]>([
      {
        id: 'a', size: 8 * MB, state: 'uploading', sent: 2.4 * MB,
        name: 'quarterly-reconciliation-statement-including-all-vendor-adjustments-and-notes-final-v7.pdf',
      },
      {
        id: 'b', size: 12 * MB, state: 'error',
        name: 'annual-consolidated-financial-position-and-cashflow-appendix-c-revised.xlsx',
        error: 'The file is larger than the 10 MB limit for this account and could not be processed',
      },
    ]);
    return (
      <Upload
        size="compact" files={files}
        onAdd={() => {}} onRetry={() => {}}
        onRemove={(id) => setFiles((l) => l.filter((f) => f.id !== id))}
        onCancel={(id) => setFiles((l) => l.filter((f) => f.id !== id))}
      />
    );
  },
};

/** `compact` — 178 rather than 280. Once files are listed the big zone is dead space. */
export const Compact: Story = {
  render: () => (
    <Upload
      size="compact" files={[]}
      onAdd={() => {}} onRemove={() => {}} onRetry={() => {}} onCancel={() => {}}
    />
  ),
};

/**
 * DISABLED, and it is nearly invisible — which is a token problem, not a bug
 * here. Both of §10.1's facts reproduce exactly against our own values:
 * `border/disabled` on `surface/disabled` is **1.06:1**, and `surface/disabled`
 * is the SAME VALUE as `surface/sunken` in both Light and Dark, so the disabled
 * fill is pixel-identical to the rest fill.
 *
 * That leaves the border and the text carrying the whole state. The border is
 * `border/strong` for that reason — and even that is only **1.52:1**, under the
 * 3:1 non-text threshold. Open item 49.
 */
export const Disabled: Story = {
  render: () => (
    <Stack gap={6}>
      <Upload
        disabled files={[]}
        onAdd={() => {}} onRemove={() => {}} onRetry={() => {}} onCancel={() => {}}
      />
      <Text size="body-sm" tone="tertiary">
        Compare against the rest state above — the fills are identical by design of the token, not by accident.
      </Text>
    </Stack>
  ),
};

/**
 * EXTRA SOURCES on the caret. "From My Desktop" is always first and always
 * drives the input; anything else is the host's.
 *
 * The cloud-provider STRIP from §6 is **not** here. `MenuEntry` is
 * `MenuItem | {separator}` with no custom-node escape, and seven brand-logo
 * buttons inside `role="menu"` breaks the ARIA contract — §6.3 itself says the
 * strip is "a plain group of buttons", which is not what a menu contains. It
 * needs either a `Popover` primitive or a deliberate `Menu` extension, and both
 * are decisions about a core component rather than about this one.
 */
export const WithSources: Story = {
  render: () => (
    <Upload
      files={[]}
      sources={[
        { id: 'docs', label: 'From Books Documents', icon: 'documents', onSelect: () => {} },
        { separator: true },
        { id: 'drive', label: 'From Google Drive', onSelect: () => {} },
        { id: 'dropbox', label: 'From Dropbox', onSelect: () => {} },
        { id: 'onedrive', label: 'From OneDrive', onSelect: () => {} },
      ]}
      onAdd={() => {}} onRemove={() => {}} onRetry={() => {}} onCancel={() => {}}
    />
  ),
};
