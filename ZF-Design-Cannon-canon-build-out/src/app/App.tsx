import { useEffect, useState } from 'react';
import { Segmented } from '@canon';
import { LoyaltyV1 } from './screens/LoyaltyV1';
import { LoyaltyV2 } from './screens/LoyaltyV2';

/**
 * Application root. Still intentionally bare — no routing library until there
 * are enough screens to need one. The layout shell is no longer missing: it is
 * `AppShell` in the canon, because where the rail, the bar and the body sit
 * relative to each other is a design decision, not a scaffolding one.
 *
 * ── TWO VERSIONS OF THE LOYALTY FLOW, CHOSEN BY THE URL HASH ────────────────
 * `#v1` is the reviewed flow, frozen. `#v2` is the working version. Only the
 * hash is read — never the host or port — so `localhost:<any port>/#v2` and a
 * deployed URL behave the same. Open each in its own tab to compare.
 */
const VERSIONS = ['v1', 'v2'] as const;
type Version = (typeof VERSIONS)[number];

function versionFromHash(): Version {
  const h = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  return (VERSIONS as readonly string[]).includes(h) ? (h as Version) : 'v1';
}

export function App() {
  const [version, setVersion] = useState<Version>(versionFromHash);

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
    const onHash = () => setVersion(versionFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

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
      options={VERSIONS.map((v) => ({ value: v, label: v.toUpperCase() }))}
    />
  );

  return version === 'v2'
    ? <LoyaltyV2 onClose={() => undefined} versionSwitch={versionSwitch} />
    : <LoyaltyV1 onClose={() => undefined} versionSwitch={versionSwitch} />;
}
