import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { SettingsLink } from '@canon';
import { Segmented } from '@canon';
import { LoyaltyV1 } from './screens/LoyaltyV1';
import { LoyaltyV2 } from './screens/LoyaltyV2';
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
 *   · a Points per sale program shows the V1 | V2 switch beside its title —
 *     V1 is the earlier flow; V2 (formerly V3) has program types, the
 *     pending period and the redemption window / expiry choice;
 *   · a Scheduled points program exists only in V2, so it has no switch.
 * The saved programs live here, so they survive switching versions.
 *
 * ── HASH ROUTES ─────────────────────────────────────────────────────────────
 *   (bare) / #programs          the list
 *   #v1 · #v2                   the seeded Points per sale program, in that
 *                               version. These links are shared with DRIs, so
 *                               they must keep opening the editor directly.
 *   #v3                         the old V3 link → V2, which it now is
 *   #programs/scheduled         a scheduled program is open (reload → list)
 *   #/settings/loyalty-program  the settings rail's link (V1/V2) → the list;
 *                               other rail links are ignored
 * Only the hash is read — never the host or port.
 */
const VERSIONS = ['v1', 'v2'] as const;
type Version = (typeof VERSIONS)[number];

/*  What each version changes — shown when hovering its pill.  */
const VERSION_NOTES: Record<Version, string> = {
  v1: 'Points expiry moved into a section of its own.',
  v2: 'Adds the points pending period, and a redemption window or points expiration — one or the other.',
};

type View =
  | { kind: 'list' }
  /** `id` null = a new program. `session` remounts the editor on every open. */
  | { kind: 'program'; id: string | null; type: ProgramType; session: number };

type Route = { version?: Version; list?: boolean; scheduled?: boolean; ignore?: boolean };

function readRoute(): Route {
  const h = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if ((VERSIONS as readonly string[]).includes(h)) return { version: h as Version };
  //  V3 became V2; a shared #v3 link still opens it.
  if (h === 'v3') return { version: 'v2' };
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

/*  The page scroller: the tallest element that scrolls vertically.  */
function pageScroller(): HTMLElement | null {
  let best: HTMLElement | null = null;
  document.querySelectorAll<HTMLElement>('#root *').forEach((el) => {
    const oy = getComputedStyle(el).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight
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
  const [previewOpen, setPreviewOpen] = useState(true);
  const scrollMark = useRef<ScrollMark | null>(null);

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
  }, [version]);

  //  Two tabs side by side are told apart by their tab titles.
  const onSaleProgram = view.kind === 'program' && view.type === 'sale';
  useEffect(() => {
    const base = document.title.replace(/ · V\d+$/, '');
    document.title = onSaleProgram ? `${base} · ${version.toUpperCase()}` : base;
  }, [version, onSaleProgram]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = window.setTimeout(() => setToast(''), 3000);
    return () => window.clearTimeout(t);
  }, [toast]);


  const toList = () => { setTab('programs'); go({ kind: 'list' }); };
  //  The settings rail's "Loyalty Program" opens the list. Other rail items do
  //  nothing in this POC.
  const onNavigate = (leaf: SettingsLink) => { if (leaf.id === 'loyalty-program') toList(); };

  const versionSwitch = (
    <Segmented
      size="sm"
      label="Loyalty flow version"
      value={version}
      onChange={(next) => { window.location.hash = next; }}
      options={VERSIONS.map((v) => ({ value: v, label: v.toUpperCase(), tooltip: VERSION_NOTES[v] }))}
    />
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

  return (
    <LoyaltyV2
      key={view.session}
      initial={record ? cloneRecord(record) : blankRecord('sale')}
      isNew={isNew}
      versionSwitch={view.type === 'sale' ? versionSwitch : undefined}
      onTypeChange={(type) => setView((v) => (v.kind === 'program' ? { ...v, type } : v))}
      onSave={(r) => {
        if (isNew) {
          setPrograms((prev) => [...prev, { ...cloneRecord(r), id: newId('p') }]);
          setToast('Loyalty program created');
          toList();
        } else {
          setPrograms((prev) => prev.map((p) => (p.id === r.id ? cloneRecord(r) : p)));
          setToast('Loyalty program updated');
        }
      }}
      onCancel={toList}
      onNavigate={onNavigate}
      toast={toast}
      onDismissToast={() => setToast('')}
      {...preview}
    />
  );
}
