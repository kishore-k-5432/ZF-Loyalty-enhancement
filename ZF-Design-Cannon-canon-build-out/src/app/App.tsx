import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Segmented } from '@canon';
import { LoyaltyV1 } from './screens/LoyaltyV1';
import { LoyaltyV2 } from './screens/LoyaltyV2';
import { LoyaltyV3 } from './screens/LoyaltyV3';

/**
 * Application root. Still intentionally bare — no routing library until there
 * are enough screens to need one. The layout shell is no longer missing: it is
 * `AppShell` in the canon, because where the rail, the bar and the body sit
 * relative to each other is a design decision, not a scaffolding one.
 *
 * ── TWO VERSIONS OF THE LOYALTY FLOW, CHOSEN BY THE URL HASH ────────────────
 * `#v1` is the reviewed flow, frozen. `#v2` is the working version. `#v3` adds
 * periodic loyalty and scheduled points (campaigns). Only the
 * hash is read — never the host or port — so `localhost:<any port>/#v2` and a
 * deployed URL behave the same. Open each in its own tab to compare.
 */
const VERSIONS = ['v1', 'v2', 'v3'] as const;
type Version = (typeof VERSIONS)[number];

/*  What each version changes — shown when hovering its pill.  */
const VERSION_NOTES: Record<Version, string> = {
  v1: 'Points expiry moved into a section of its own.',
  v2: 'Redemption window or points expiration — one or the other, not both.',
  v3: 'Adds the points pending period, and bonus campaigns.',
};

function versionFromHash(): Version {
  const h = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  return (VERSIONS as readonly string[]).includes(h) ? (h as Version) : 'v1';
}

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
  const [version, setVersion] = useState<Version>(versionFromHash);
  const scrollMark = useRef<ScrollMark | null>(null);

  //  A bare URL is rewritten to `#v1`, so the address bar always says which
  //  version is on screen — the thing a reviewer copies into a bug report.
  //  `replaceState`, not an assignment, so Back does not step through it.
  useEffect(() => {
    if (window.location.hash.replace(/^#\/?/, '').toLowerCase() !== version) {
      window.history.replaceState(null, '', `#${version}`);
    }
  }, [version]);

  //  Editing the hash by hand, or Back/Forward, switches the version.
  useEffect(() => {
    //  The old screen is still on the page here, so its place is noted first.
    const onHash = () => {
      scrollMark.current = markScroll();
      setVersion(versionFromHash());
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
  useEffect(() => {
    const base = document.title.replace(/ · V\d+$/, '');
    document.title = `${base} · ${version.toUpperCase()}`;
  }, [version]);

  const versionSwitch = (
    <Segmented
      size="sm"
      label="Loyalty flow version"
      value={version}
      onChange={(next) => { window.location.hash = next; }}
      options={VERSIONS.map((v) => ({ value: v, label: v.toUpperCase(), tooltip: VERSION_NOTES[v] }))}
    />
  );

  if (version === 'v3') return <LoyaltyV3 onClose={() => undefined} versionSwitch={versionSwitch} />;

  return version === 'v2'
    ? <LoyaltyV2 onClose={() => undefined} versionSwitch={versionSwitch} />
    : <LoyaltyV1 onClose={() => undefined} versionSwitch={versionSwitch} />;
}
