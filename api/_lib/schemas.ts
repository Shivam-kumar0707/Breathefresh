import { z } from 'zod';

export const PlanOutputSchema = z.object({
  headline: z.string().max(120),
  summary: z.string().max(400),
  riskLevel: z.enum(['low', 'moderate', 'high', 'severe']),
  timeline: z
    .array(
      z.object({
        startHour: z.number().int().min(0).max(23),
        endHour: z.number().int().min(1).max(24),
        title: z.string().max(80),
        actionId: z.string().nullable(),
        why: z.string().max(220),
      })
    )
    .max(10),
  members: z.array(
    z.object({
      memberId: z.string(),
      tips: z.array(z.string().max(160)).max(3),
      avoid: z.array(z.string().max(120)).max(2),
    })
  ),
  topActions: z.array(z.string()).max(6),
});

export type PlanOutput = z.infer<typeof PlanOutputSchema>;

export const ExplainOutputSchema = z.object({
  explanation: z.string().max(300),
  soWhat: z.string().max(150),
});

export type ExplainOutput = z.infer<typeof ExplainOutputSchema>;

export const VisionOutputSchema = z.object({
  roomType: z.string(),
  issues: z.array(
    z.object({
      type: z.string(),
      severity: z.enum(['low', 'moderate', 'high']),
      note: z.string(),
    })
  ),
  purifierSpot: z.string(),
  ventilationNotes: z.string(),
  suggestedActionIds: z.array(z.string()),
});

export type VisionOutput = z.infer<typeof VisionOutputSchema>;
