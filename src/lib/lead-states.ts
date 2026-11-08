export const leadStatuses = ["pending", "accepted"] as const;
export type LeadStatus = (typeof leadStatuses)[number];

export const progressStages = ["intake", "investigation", "negotiation", "litigation", "closed"] as const;
export type Progress = (typeof progressStages)[number];
