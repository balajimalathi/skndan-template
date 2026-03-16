import { z } from "zod";

/**
 * Single blackout date selection.
 * The actual date value is interpreted in the organization's timezone
 * by server actions and stored as a UTC timestamp at midnight/start-of-day.
 */
export const BlackoutDateSchema = z.object({
  // ISO date string \"YYYY-MM-DD\" coming from the UI
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  // Optional staff identifier; when omitted/null the blackout is org-wide
  staffId: z.string().nullable().optional(),
  // Optional human-readable reason shown in admin UI
  reason: z.string().max(256).optional(),
});

/**
 * Range selection for blackout dates.
 * Used when the UI allows selecting a span of dates in a single action.
 */
export const BlackoutDateRangeSchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "From date must be in YYYY-MM-DD format"),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "To date must be in YYYY-MM-DD format")
    .refine(
      (to, ctx) => {
        const from = ctx.parent?.from as string | undefined;
        if (!from) return true;
        return new Date(to) >= new Date(from);
      },
      {
        message: "End of range must be on or after start date",
      },
    ),
  staffId: z.string().nullable().optional(),
  reason: z.string().max(256).optional(),
});

export type BlackoutDateInput = z.infer<typeof BlackoutDateSchema>;

export type BlackoutDateRangeInput = z.infer<typeof BlackoutDateRangeSchema>;

