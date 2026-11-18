/**
 * Central Prompt Store for BreatheFresh Server Functions
 */
export declare function getPlanSystemPrompt(language?: string): string;
export declare function getExplainSystemPrompt(language?: string): string;
export declare function getChatSystemPrompt(contextPackStr: string, language?: string): string;
export declare const RED_FLAG_KEYWORDS: string[];
export declare function hasRedFlagSymptoms(text: string): boolean;
