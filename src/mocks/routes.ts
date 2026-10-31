import assignments from "./data/route-assignments.json";
import data from "./data/routes.json";
import type { Route, RouteAssignment } from "./types";

/** Route templates: the standing definition each daily instance comes from. */
export const ROUTES = data as Route[];
export const ROUTE_ASSIGNMENTS = assignments as RouteAssignment[];
