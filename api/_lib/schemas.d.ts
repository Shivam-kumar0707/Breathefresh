import { z } from 'zod';
export declare const PlanOutputSchema: z.ZodObject<{
    headline: z.ZodString;
    summary: z.ZodString;
    riskLevel: z.ZodEnum<["low", "moderate", "high", "severe"]>;
    timeline: z.ZodArray<z.ZodObject<{
        startHour: z.ZodNumber;
        endHour: z.ZodNumber;
        title: z.ZodString;
        actionId: z.ZodNullable<z.ZodString>;
        why: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        startHour: number;
        endHour: number;
        title: string;
        actionId: string | null;
        why: string;
    }, {
        startHour: number;
        endHour: number;
        title: string;
        actionId: string | null;
        why: string;
    }>, "many">;
    members: z.ZodArray<z.ZodObject<{
        memberId: z.ZodString;
        tips: z.ZodArray<z.ZodString, "many">;
        avoid: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        memberId: string;
        tips: string[];
        avoid: string[];
    }, {
        memberId: string;
        tips: string[];
        avoid: string[];
    }>, "many">;
    topActions: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    headline: string;
    summary: string;
    riskLevel: "low" | "moderate" | "high" | "severe";
    timeline: {
        startHour: number;
        endHour: number;
        title: string;
        actionId: string | null;
        why: string;
    }[];
    members: {
        memberId: string;
        tips: string[];
        avoid: string[];
    }[];
    topActions: string[];
}, {
    headline: string;
    summary: string;
    riskLevel: "low" | "moderate" | "high" | "severe";
    timeline: {
        startHour: number;
        endHour: number;
        title: string;
        actionId: string | null;
        why: string;
    }[];
    members: {
        memberId: string;
        tips: string[];
        avoid: string[];
    }[];
    topActions: string[];
}>;
export type PlanOutput = z.infer<typeof PlanOutputSchema>;
export declare const ExplainOutputSchema: z.ZodObject<{
    explanation: z.ZodString;
    soWhat: z.ZodString;
}, "strip", z.ZodTypeAny, {
    explanation: string;
    soWhat: string;
}, {
    explanation: string;
    soWhat: string;
}>;
export type ExplainOutput = z.infer<typeof ExplainOutputSchema>;
export declare const VisionOutputSchema: z.ZodObject<{
    roomType: z.ZodString;
    issues: z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        severity: z.ZodEnum<["low", "moderate", "high"]>;
        note: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: string;
        severity: "low" | "moderate" | "high";
        note: string;
    }, {
        type: string;
        severity: "low" | "moderate" | "high";
        note: string;
    }>, "many">;
    purifierSpot: z.ZodString;
    ventilationNotes: z.ZodString;
    suggestedActionIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    issues: {
        type: string;
        severity: "low" | "moderate" | "high";
        note: string;
    }[];
    roomType: string;
    purifierSpot: string;
    ventilationNotes: string;
    suggestedActionIds: string[];
}, {
    issues: {
        type: string;
        severity: "low" | "moderate" | "high";
        note: string;
    }[];
    roomType: string;
    purifierSpot: string;
    ventilationNotes: string;
    suggestedActionIds: string[];
}>;
export type VisionOutput = z.infer<typeof VisionOutputSchema>;
