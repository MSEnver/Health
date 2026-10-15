export type HealthReference = { title?: string | null; citation?: string | null; url?: string | null; sortOrder?: number };
export type HealthNote = {
  id: string; sitting: string; date?: string; category: string; title: string;
  description?: string; body?: string; introduction?: string; purpose?: string;
  contentBlocks?: unknown; materials?: unknown; instructions?: unknown; precautions?: unknown;
  healthNoticeOverride?: string; references?: HealthReference[];
  urduText?: string; urdu?: string; englishDescription?: string; displayTitle?: string; tags?: string[];
  localized?: Record<string, { title?: string; description?: string; body?: string; spiritualGoal?: string; tags?: string[] }>;
  spiritualGoal?: string; nameDetails?: { name?: string; urduName?: string; adad?: number; element?: string; recommendation?: string };
};
export type ThemeName = 'clean' | 'dark' | 'warm';
