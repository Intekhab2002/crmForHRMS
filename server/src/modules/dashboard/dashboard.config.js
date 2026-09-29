import {
  DASHBOARD_LAYOUT_VERSION,
  DASHBOARD_PERMISSION,
  DASHBOARD_TYPE,
  VISUALIZATION,
} from "./dashboard.constants.js";

const freeze = (value) => Object.freeze(value);

export const DASHBOARD_CONFIG = freeze({
  [DASHBOARD_TYPE.OPERATIONAL]: freeze({
    code: DASHBOARD_TYPE.OPERATIONAL,
    name: "Operational",
    permission: DASHBOARD_PERMISSION[DASHBOARD_TYPE.OPERATIONAL],
    layoutVersion: DASHBOARD_LAYOUT_VERSION,
    defaultWidgets: freeze([
      { id: "tickets.total", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 10 },
      { id: "tickets.open", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 20 },
      { id: "tickets.in_progress", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 30 },
      { id: "tickets.waiting", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 40 },
      { id: "tickets.closed", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 50 },
      { id: "tickets.unassigned", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 60 },
      { id: "sla.running", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 70 },
      { id: "sla.breached", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 80 },
      { id: "sla.compliance", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 90 },
      { id: "tickets.status_distribution", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 100 },
      { id: "sla.status_distribution", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 110 },
      { id: "tickets.priority_workload", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 120 },
      { id: "tickets.created_closed_trend", w: 12, h: 5, minW: 6, minH: 4, visible: true, order: 130 },
      { id: "tickets.my_tickets", w: 12, h: 6, minW: 6, minH: 4, visible: true, order: 140 },
    ]),
  }),
  [DASHBOARD_TYPE.MANAGEMENT]: freeze({
    code: DASHBOARD_TYPE.MANAGEMENT,
    name: "Management",
    permission: DASHBOARD_PERMISSION[DASHBOARD_TYPE.MANAGEMENT],
    layoutVersion: DASHBOARD_LAYOUT_VERSION,
    defaultWidgets: freeze([]),
  }),
  [DASHBOARD_TYPE.PROFESSIONAL]: freeze({
    code: DASHBOARD_TYPE.PROFESSIONAL,
    name: "Professional",
    permission: DASHBOARD_PERMISSION[DASHBOARD_TYPE.PROFESSIONAL],
    layoutVersion: DASHBOARD_LAYOUT_VERSION,
    defaultWidgets: freeze([]),
  }),
  [DASHBOARD_TYPE.EXECUTIVE]: freeze({
    code: DASHBOARD_TYPE.EXECUTIVE,
    name: "Executive",
    permission: DASHBOARD_PERMISSION[DASHBOARD_TYPE.EXECUTIVE],
    layoutVersion: DASHBOARD_LAYOUT_VERSION,
    defaultWidgets: freeze([]),
  }),
  [DASHBOARD_TYPE.AUDIT]: freeze({
    code: DASHBOARD_TYPE.AUDIT,
    name: "Audit",
    permission: DASHBOARD_PERMISSION[DASHBOARD_TYPE.AUDIT],
    layoutVersion: DASHBOARD_LAYOUT_VERSION,
    defaultWidgets: freeze([]),
  }),
});

export const DASHBOARD_DEFAULT_QUERY_LIMIT = 10;
export const DASHBOARD_MAX_QUERY_LIMIT = 100;

export default DASHBOARD_CONFIG;
