export function PrivacyNotice() {
  return (
    <details className="privacy-notice">
      <summary>Public beta · Privacy &amp; your saves</summary>
      <p>
        Your Casting Board, World Population profiles, Relationship Web, theme,
        and preferences are stored in this browser on this website. Townieverse
        has no accounts, backend, cloud synchronization, or built-in analytics.
        The hosting provider handles requests to deliver the site.
      </p>
      <p>
        Clearing site data, private browsing, or changing browsers, devices, or
        website addresses can make your saves unavailable. Export JSON backups
        regularly. Localhost saves do not automatically transfer here: export
        your complete Casting Board and all planning profiles locally, then
        import the Board first and planning profiles second on the new site.
        Planning backups include Relationship Web data; separate web backups are
        also available. Set your pack preferences and theme again after moving.
      </p>
      <p>
        Backups contain your stories and notes as readable text. Keep them
        private. App updates retain existing storage keys and do not erase
        saves; keep a backup before updates. Optional mature story themes are
        off by default. This tool plans fictional stories and never edits Sims
        game or save files.
      </p>
    </details>
  );
}
