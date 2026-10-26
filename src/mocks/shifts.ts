import templates from "./data/shift-templates.json";
import data from "./data/shifts.json";
import type { Shift, ShiftTemplate } from "./types";

export const SHIFTS = data as Shift[];
export const SHIFT_TEMPLATES = templates as ShiftTemplate[];
