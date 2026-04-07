import type { Database } from "@/integrations/supabase/types";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];
export type TaskPriority = Database["public"]["Enums"]["task_priority"];
export type TaskStatus = Database["public"]["Enums"]["task_status"];
export type TaskCategory = Database["public"]["Enums"]["task_category"];

export const CATEGORY_CONFIG: Record<TaskCategory, { label: string; emoji: string }> = {
  personal: { label: "Personal", emoji: "👤" },
  printers: { label: "Printers", emoji: "🖨️" },
  rv_park: { label: "RV Park", emoji: "🏕️" },
};

export const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "Todo" },
  { id: "in_progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];

export const COLUMN_COLORS: Record<TaskStatus, { bg: string; accent: string; text: string }> = {
  backlog: { bg: "bg-column-backlog", accent: "bg-column-backlog-accent", text: "text-column-backlog-accent" },
  todo: { bg: "bg-column-todo", accent: "bg-column-todo-accent", text: "text-column-todo-accent" },
  in_progress: { bg: "bg-column-in-progress", accent: "bg-column-in-progress-accent", text: "text-column-in-progress-accent" },
  review: { bg: "bg-column-review", accent: "bg-column-review-accent", text: "text-column-review-accent" },
  done: { bg: "bg-column-done", accent: "bg-column-done-accent", text: "text-column-done-accent" },
};

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  high: { label: "High", color: "text-priority-high", bg: "bg-priority-high/10" },
  medium: { label: "Medium", color: "text-priority-medium", bg: "bg-priority-medium/10" },
  low: { label: "Low", color: "text-priority-low", bg: "bg-priority-low/10" },
};
