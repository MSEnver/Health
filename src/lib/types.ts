export type HealthNote = {
  id: string; sitting: string; date?: string; category: string; title: string;
  description?: string; body?: string; urduText?: string; urdu?: string;
  englishDescription?: string; displayTitle?: string; tags?: string[];
  localized?: Record<string, { title?: string; description?: string; body?: string; spiritualGoal?: string; tags?: string[] }>;
  spiritualGoal?: string; nameDetails?: { name?: string; urduName?: string; adad?: number; element?: string; recommendation?: string };
};
export type ThemeName = 'clean' | 'dark' | 'warm';
