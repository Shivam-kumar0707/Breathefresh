import { z } from 'zod';
export declare const PlanOutputSchema: z.ZodObject<
  {
    headline: z.ZodDefault<z.ZodString>;
    summary: z.ZodDefault<z.ZodString>;
    riskLevel: z.ZodCatch<z.ZodEnum<['low', 'moderate', 'high', 'severe']>>;
    timeline: z.ZodCatch<
      z.ZodArray<
        z.ZodObject<
          {
            startHour: z.ZodCatch<z.ZodNumber>;
            endHour: z.ZodCatch<z.ZodNumber>;
            title: z.ZodString;
            actionId: z.ZodCatch<z.ZodNullable<z.ZodString>>;
            why: z.ZodString;
          },
          'strip',
          z.ZodTypeAny,
          {
            actionId: string | null;
            title: string;
            startHour: number;
            endHour: number;
            why: string;
          },
          {
            title: string;
            why: string;
            actionId?: unknown;
            startHour?: unknown;
            endHour?: unknown;
          }
        >,
        'many'
      >
    >;
    members: z.ZodCatch<
      z.ZodArray<
        z.ZodObject<
          {
            memberId: z.ZodString;
            tips: z.ZodCatch<z.ZodArray<z.ZodString, 'many'>>;
            avoid: z.ZodCatch<z.ZodArray<z.ZodString, 'many'>>;
          },
          'strip',
          z.ZodTypeAny,
          {
            memberId: string;
            tips: string[];
            avoid: string[];
          },
          {
            memberId: string;
            tips?: unknown;
            avoid?: unknown;
          }
        >,
        'many'
      >
    >;
    topActions: z.ZodCatch<z.ZodArray<z.ZodString, 'many'>>;
  },
  'strip',
  z.ZodTypeAny,
  {
    headline: string;
    summary: string;
    riskLevel: 'moderate' | 'low' | 'high' | 'severe';
    timeline: {
      actionId: string | null;
      title: string;
      startHour: number;
      endHour: number;
      why: string;
    }[];
    members: {
      memberId: string;
      tips: string[];
      avoid: string[];
    }[];
    topActions: string[];
  },
  {
    headline?: string | undefined;
    summary?: string | undefined;
    riskLevel?: unknown;
    timeline?: unknown;
    members?: unknown;
    topActions?: unknown;
  }
>;
export type PlanOutput = z.infer<typeof PlanOutputSchema>;
export declare const ExplainOutputSchema: z.ZodObject<
  {
    explanation: z.ZodString;
    soWhat: z.ZodString;
  },
  'strip',
  z.ZodTypeAny,
  {
    explanation: string;
    soWhat: string;
  },
  {
    explanation: string;
    soWhat: string;
  }
>;
export type ExplainOutput = z.infer<typeof ExplainOutputSchema>;
export declare const VisionOutputSchema: z.ZodObject<
  {
    roomType: z.ZodString;
    issues: z.ZodArray<
      z.ZodObject<
        {
          type: z.ZodString;
          severity: z.ZodEnum<['low', 'moderate', 'high']>;
          note: z.ZodString;
        },
        'strip',
        z.ZodTypeAny,
        {
          type: string;
          severity: 'moderate' | 'low' | 'high';
          note: string;
        },
        {
          type: string;
          severity: 'moderate' | 'low' | 'high';
          note: string;
        }
      >,
      'many'
    >;
    purifierSpot: z.ZodString;
    ventilationNotes: z.ZodString;
    suggestedActionIds: z.ZodArray<z.ZodString, 'many'>;
  },
  'strip',
  z.ZodTypeAny,
  {
    issues: {
      type: string;
      severity: 'moderate' | 'low' | 'high';
      note: string;
    }[];
    roomType: string;
    purifierSpot: string;
    ventilationNotes: string;
    suggestedActionIds: string[];
  },
  {
    issues: {
      type: string;
      severity: 'moderate' | 'low' | 'high';
      note: string;
    }[];
    roomType: string;
    purifierSpot: string;
    ventilationNotes: string;
    suggestedActionIds: string[];
  }
>;
export type VisionOutput = z.infer<typeof VisionOutputSchema>;
