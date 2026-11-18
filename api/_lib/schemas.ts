import { z } from 'zod';

export const PlanOutputSchema = z.object({
  headline: z.string().default('Personalized Protective Family Protocol'),
  summary: z.string().default('Tailored protocol designed to minimize household inhalation during peak smog hours.'),
  riskLevel: z.enum(['low', 'moderate', 'high', 'severe']).catch('high'),
  timeline: z
    .array(
      z.object({
        startHour: z.number().int().min(0).max(24).catch(8),
        endHour: z.number().int().min(0).max(24).catch(10),
        title: z.string(),
        actionId: z.string().nullable().catch(null),
        why: z.string(),
      })
    )
    .catch([]),
  members: z
    .array(
      z.object({
        memberId: z.string(),
        tips: z.array(z.string()).catch([]),
        avoid: z.array(z.string()).catch([]),
      })
    )
    .catch([]),
  topActions: z.array(z.string()).catch([]),
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
