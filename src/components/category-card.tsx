import type { LucideIcon } from 'lucide-react';
import { Activity, BookOpen, Brain, HeartPulse, Leaf, MoonStar, Sparkles, Stethoscope, Wind } from 'lucide-react';
const icons: Record<string, LucideIcon> = { Names: BookOpen, Hair: Sparkles, Spiritual: MoonStar, Joints: Activity, Cardiovascular: HeartPulse, Digestive: Leaf, Respiratory: Wind, Homeopathy: Stethoscope, Skin: Brain };
export function CategoryCard({ id, label, count, onSelect }: { id: string; label: string; count: number; onSelect: (id: string) => void }) {
  const Icon = icons[id] ?? BookOpen;
  return <button type="button" className="category-card" onClick={() => onSelect(id)}><span className="category-icon"><Icon size={25}/></span><span className="category-label">{label}</span><span className="category-count">{count}</span></button>;
}
