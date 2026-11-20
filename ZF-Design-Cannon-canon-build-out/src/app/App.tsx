import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { SettingsLink } from '@canon';
import { Button, Icon, Inline, Menu, Segmented } from '@canon';
import { LoyaltyV1 } from './screens/LoyaltyV1';
import { LoyaltyV2 } from './screens/LoyaltyV2';
import { LoyaltyV3 } from './screens/LoyaltyV3';
import type { V3Audience } from './screens/LoyaltyV3';
import { V3ProgramList } from './screens/v3/V3ProgramList';
import type { V3Tab } from './screens/v3/V3ProgramList';
import { DEFAULT_PREFS, SEED_PROGRAMS, SEED_TARGET_ID, blankRecord, cloneRecord } from './screens/v3/v3ProgramModel';
import type { LoyaltyPrefs, ProgramRecord, ProgramType } from './screens/v3/v3ProgramModel';
import { newId } from './screens/v3/v3Shared';

/**
 * Application root — the Loyalty Program POC. No routing library: the URL hash
 * is read directly.
 *
 * ── THE HUB ─────────────────────────────────────────────────────────────────
 * The POC opens on the Loyalty Program LIST. Opening a program shows its
 * editor:
 *   · a Points per sale program shows the V1 | V2 | V3 switch beside its
 *     title — V1 is the earlier flow; V2 (formerly V3) has program types, the
 *     pending period and the redemption window / expiry choice; V3 (started
 *     2026-11-20 as a copy of V2) holds changes proposed to V2, for comparison;
 *   · a Scheduled points program shows V2 | V3 — it has no V1.
 * The saved programs live here, so they survive switching versions.
 *
 * ── HASH ROUTES ─────────────────────────────────────────────────────────────
 *   (bare) / #programs          the list
 *   #v1 · #v2 · #v3             the seeded Points per sale program, in that
 *                               version. These links are shared with DRIs, so
 *                               they must keep opening the editor directly.
 *                               (#v3 pointed at V2 from 2026-11-17 to -20; it
 *                               now opens the new V3.)
 *   #programs/scheduled         a scheduled program is open, in either V2 or
 *                               V3 (reload → list)
 *   #/settings/loyalty-program  the settings rail's link (V1/V2) → the list;
 *                               other rail links are ignored
 * Only the hash is read — never the host or port.
 */
const VERSIONS = ['v1', 'v2', 'v3'] as const;
type Version = (typeof VERSIONS)[number];

/*  What each version changes — shown when hovering its pill.  */
const VERSION_NOTES: Record<Version, string> = {
  v1: 'Points expiry moved into a section of its own.',
  v2: 'Adds the points pending period, and a redemption window or points expiration — one or the other.',
  v3: 'Changes proposed to V2, kept apart for comparison.',
};

/*  V3 only — who the program is configured for. Existing Customers is the V3
    built so far; New Customers starts as the same and will diverge.  */
type Audience = V3Audience;
const AUDIENCE_LABEL: Record<Audience, string> = { existing: 'Existing Customers', new: 'New Customers' };

type View =
  | { kind: 'list' }
  /** `id` null = a new program. `session` remounts the editor on every open. */
  | { kind: 'program'; id: string | null; type: ProgramType; session: number };

type Route = { version?: Version; list?: boolean; scheduled?: boolean; ignore?: boolean };

function readRoute(): Route {
  const h = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if ((VERSIONS as readonly string[]).includes(h)) return { version: h as Version };
  if (h.startsWith('settings/')) return h === 'settings/loyalty-program' ? { list: true } : { ignore: true };
  if (h === 'programs/scheduled') return { scheduled: true };
  return { list: true };
}

function hashFor(view: View, version: Version): string {
  if (view.kind === 'list') return '#programs';
  return view.type === 'sale' ? `#${version}` : '#programs/scheduled';
}

let sessions = 0;
const nextSession = () => { sessions += 1; return sessions; };

/* ── KEEPING THE PLACE ACROSS A VERSION SWITCH ────────────────────────────
   Switching versions mounts a different screen, which would reset the scroll.
   The place is kept by section, not by pixel: the versions differ in height
   (V3 adds an Availability group), so the same scrollTop would land on other
   content. Before the switch, the first heading visible in the page scroller
   is noted with its offset; after it, the same heading is put back at that
   offset. With no matching heading, the raw scrollTop is restored.  */

type ScrollMark = { scrollTop: number; heading: string | null; offset: number };

/*  The page scroller: the tallest element that scrolls vertically AND holds
    the form's section headings. Height alone picked the settings rail on the
    left — it is taller than the form's scroller (the page header sits above
    the form, not above the rail) and overflows too — so the form's place was
    never recorded.  */
function pageScroller(): HTMLElement | null {
  let best: HTMLElement | null = null;
  document.querySelectorAll<HTMLElement>('#root *').forEach((el) => {
    const oy = getComputedStyle(el).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight
      && el.querySelector('h3, h4')
      && (!best || el.clientHeight > best.clientHeight)) best = el;
  });
  return best;
}

function headings(scroller: HTMLElement): HTMLElement[] {
  return Array.from(scroller.querySelectorAll<HTMLElement>('h2, h3, h4'));
}

function markScroll(): ScrollMark | null {
  const scroller = pageScroller();
  if (!scroller) return null;
  const top = scroller.getBoundingClientRect().top;
  const first = headings(scroller).find((h) => h.getBoundingClientRect().bottom > top);
  return {
    scrollTop: scroller.scrollTop,
    heading: first?.textContent?.trim() ?? null,
    offset: first ? first.getBoundingClientRect().top - top : 0,
  };
}

function restoreScroll(mark: ScrollMark) {
  const scroller = pageScroller();
  if (!scroller) return;
  const top = scroller.getBoundingClientRect().top;
  const match = mark.heading
    ? headings(scroller).find((h) => h.textContent?.trim() === mark.heading)
    : undefined;
  scroller.scrollTop = match
    ? scroller.scrollTop + (match.getBoundingClientRect().top - top) - mark.offset
    : mark.scrollTop;
}

export function App() {
  const [initialRoute] = useState(readRoute);
  const [version, setVersion] = useState<Version>(initialRoute.version ?? 'v2');
  const [view, setView] = useState<View>(() => (initialRoute.version
    ? { kind: 'program', id: SEED_TARGET_ID, type: 'sale', session: nextSession() }
    : { kind: 'list' }));
  const [programs, setPrograms] = useState<ProgramRecord[]>(SEED_PROGRAMS);
  const [tab, setTab] = useState<V3Tab>('programs');
  //  The Preferences tab, kept here so it survives opening a program.
  const [prefs, setPrefs] = useState<LoyaltyPrefs>(DEFAULT_PREFS);
  const [toast, setToast] = useState('');
  //  Live preview show / hide — one setting for every version and type.
  //  Closed by default across the whole POC.
  const [previewOpen, setPreviewOpen] = useState(false);
  const scrollMark = useRef<ScrollMark | null>(null);
  //  V3's audience dropdown — beside the switch, only while V3 is shown.
  const [audience, setAudience] = useState<Audience>('existing');
  const [audienceOpen, setAudienceOpen] = useState(false);
  const audienceRef = useRef<HTMLButtonElement>(null);

  //  The hashchange handler is registered once, so it reads these through refs.
  const viewRef = useRef(view);
  const versionRef = useRef(version);
  viewRef.current = view;
  versionRef.current = version;

  //  Moving between screens pushes a history entry, so Back returns.
  const go = (next: View) => {
    setView(next);
    const h = hashFor(next, versionRef.current);
    if (window.location.hash !== h) window.history.pushState(null, '', h);
  };

  //  Keep the address bar in step without adding history — the first load
  //  (bare → #programs) and a type switch on a new program.
  useEffect(() => {
    const h = hashFor(view, version);
    if (window.location.hash !== h) window.history.replaceState(null, '', h);
  }, [view, version]);

  //  The version switch, a hand-edited hash, Back/Forward and the V1/V2 rail.
  useEffect(() => {
    const onHash = () => {
      const r = readRoute();
      const current = viewRef.current;
      if (r.ignore) {
        window.history.replaceState(null, '', hashFor(current, versionRef.current));
        return;
      }
      if (r.version) {
        //  The old screen is still on the page here, so its place is noted first.
        scrollMark.current = markScroll();
        setVersion(r.version);
        if (!(current.kind === 'program' && current.type === 'sale')) {
          setView({ kind: 'program', id: SEED_TARGET_ID, type: 'sale', session: nextSession() });
        }
        return;
      }
      if (r.scheduled && current.kind === 'program' && current.type === 'scheduled') return;
      setView({ kind: 'list' });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  //  Put the place back once the new version is on the page — again a frame
  //  later, in case late layout (fonts, measured fields) moved it.
  useLayoutEffect(() => {
    const mark = scrollMark.current;
    if (!mark) return undefined;
    scrollMark.current = null;
    restoreScroll(mark);
    const raf = requestAnimationFrame(() => restoreScroll(mark));
    return () => cancelAnimationFrame(raf);
  }, [version, audience]);

  //  A Scheduled points program has no V1, so V1 shows it in V2.
  const shown: Version = view.kind === 'program' && view.type === 'scheduled' && version === 'v1' ? 'v2' : version;

  //  Two tabs side by side are told apart by their tab titles.
  const onProgram = view.kind === 'program';
  useEffect(() => {
    const base = document.title.replace(/ · V\d+$/, '');
    document.title = onProgram ? `${base} · ${shown.toUpperCase()}` : base;
  }, [shown, onProgram]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = window.setTimeout(() => setToast(''), 3000);
    return () => window.clearTimeout(t);
  }, [toast]);


  const toList = () => { setTab('programs'); go({ kind: 'list' }); };
  //  The settings rail's "Loyalty Program" opens the list. Other rail items do
  //  nothing in this POC.
  const onNavigate = (leaf: SettingsLink) => { if (leaf.id === 'loyalty-program') toList(); };

  //  Points per sale switches through the hash (#v1 · #v2 · #v3 open it).
  //  Scheduled points keeps #programs/scheduled and switches in place.
  const scheduledOpen = view.kind === 'program' && view.type === 'scheduled';
  const segmented = (
    <Segmented
      size="sm"
      label="Loyalty flow version"
      value={shown}
      onChange={(next) => {
        if (!scheduledOpen) { window.location.hash = next; return; }
        scrollMark.current = markScroll();
        setVersion(next as Version);
      }}
      options={VERSIONS.filter((v) => !(scheduledOpen && v === 'v1'))
        .map((v) => ({ value: v, label: v.toUpperCase(), tooltip: VERSION_NOTES[v] }))}
    />
  );

  //  A text dropdown (a tertiary button + Menu), not a field-style Select.
  const versionSwitch = shown !== 'v3' ? segmented : (
    <Inline gap={4} align="center" className="flex-nowrap">
      {segmented}
      <Button
        ref={audienceRef}
        type="button"
        emphasis="tertiary"
        size="md"
        aria-haspopup="menu"
        aria-expanded={audienceOpen}
        iconRight={<Icon name="caret-down-bold" size="caret" tone="inherit" />}
        onClick={() => setAudienceOpen((o) => !o)}
      >
        {AUDIENCE_LABEL[audience]}
      </Button>
      <Menu
        anchor={audienceRef}
        open={audienceOpen}
        onClose={() => setAudienceOpen(false)}
        label="Customers this program is for"
        align="start"
        entries={(Object.keys(AUDIENCE_LABEL) as Audience[]).map((a) => ({
          id: a,
          label: AUDIENCE_LABEL[a],
          icon: a === audience ? 'check' : <Icon name="check" size="md" tone="inherit" className="invisible" />,
          onSelect: () => {
            setAudienceOpen(false);
            if (a === audience) return;
            //  Same as a version switch: the place is kept by section.
            scrollMark.current = markScroll();
            setAudience(a);
          },
        }))}
      />
    </Inline>
  );

  /* ── The list ──────────────────────────────────────────────────────────── */
  if (view.kind === 'list') {
    return (
      <V3ProgramList
        tab={tab}
        onTabChange={setTab}
        programs={programs}
        onOpen={(p) => go({ kind: 'program', id: p.id, type: p.type, session: nextSession() })}
        onNew={() => go({ kind: 'program', id: null, type: 'sale', session: nextSession() })}
        toast={toast}
        onDismissToast={() => setToast('')}
        onNavigate={onNavigate}
        versionSwitch={undefined}
        prefs={prefs}
        onPrefsChange={(patch) => setPrefs((p) => ({ ...p, ...patch }))}
      />
    );
  }

  /* ── A program ─────────────────────────────────────────────────────────── */
  const isNew = view.id === null;
  const record = view.id ? programs.find((p) => p.id === view.id) : undefined;
  const preview = { previewOpen, onPreviewOpenChange: setPreviewOpen };

  //  V1 exists only for Points per sale.
  if (view.type === 'sale' && version === 'v1') {
    return <LoyaltyV1 key={`${view.session}-${version}`} isNew={isNew} onClose={toList} versionSwitch={versionSwitch} {...preview} />;
  }

  //  V2 and V3 share the saved programs; switching remounts the editor.
  const editorProps = {
    initial: record ? cloneRecord(record) : blankRecord(view.type),
    isNew,
    versionSwitch,
    onTypeChange: (type: ProgramType) => setView((v) => (v.kind === 'program' ? { ...v, type } : v)),
    onSave: (r: ProgramRecord) => {
      if (isNew) {
        setPrograms((prev) => [...prev, { ...cloneRecord(r), id: newId('p') }]);
        setToast('Loyalty program created');
        toList();
      } else {
        setPrograms((prev) => prev.map((p) => (p.id === r.id ? cloneRecord(r) : p)));
        setToast('Loyalty program updated');
      }
    },
    onCancel: toList,
    onNavigate,
    toast,
    onDismissToast: () => setToast(''),
    ...preview,
  };
  //  V3 also takes the audience, and remounts when it changes.
  return shown === 'v3'
    ? <LoyaltyV3 key={`${view.session}-v3-${audience}`} audience={audience} {...editorProps} />
    : <LoyaltyV2 key={`${view.session}-${shown}`} {...editorProps} />;
}
