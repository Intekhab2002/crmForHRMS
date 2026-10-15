import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ticket-details-layout";
const VALID_MODES = new Set(["half", "full", "collapsed"]);

export const DEFAULT_TICKET_DETAILS_LAYOUT = Object.freeze({
  version: 1,
  panels: Object.freeze({
    "ticket-details": "half",
    "ticket-lifecycle": "half",
    "ticket-quick-update": "full",
  }),
});

function normalizeLayout(value) {
  if (!value || value.version !== 1 || !value.panels) return DEFAULT_TICKET_DETAILS_LAYOUT;
  const panels = {};
  for (const [panelId, defaultMode] of Object.entries(DEFAULT_TICKET_DETAILS_LAYOUT.panels)) {
    const mode = value.panels[panelId];
    panels[panelId] = VALID_MODES.has(mode) ? mode : defaultMode;
  }
  return { version: 1, panels };
}

function readLayout() {
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    return stored ? normalizeLayout(JSON.parse(stored)) : DEFAULT_TICKET_DETAILS_LAYOUT;
  } catch {
    return DEFAULT_TICKET_DETAILS_LAYOUT;
  }
}

export function useTicketDetailsLayout() {
  const [layout, setLayout] = useState(readLayout);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch {
      // Storage can be unavailable in private browsing or restricted environments.
    }
  }, [layout]);

  const setPanelMode = useCallback((panelId, mode) => {
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_TICKET_DETAILS_LAYOUT.panels, panelId)) return;
    if (!VALID_MODES.has(mode)) return;
    setLayout((current) => ({
      version: 1,
      panels: { ...current.panels, [panelId]: mode },
    }));
  }, []);

  const resetLayout = useCallback(() => {
    setLayout({ version: 1, panels: { ...DEFAULT_TICKET_DETAILS_LAYOUT.panels } });
  }, []);

  return { layout, setPanelMode, resetLayout };
}
