import stages from "./data/deal-stages.json";
import data from "./data/deals.json";
import type { Deal, DealStage } from "./types";

/** Pipeline order used by every stage-aware UI. */
export const DEAL_STAGES = stages as { id: DealStage; label: string }[];

export const DEALS = data as Deal[];
