import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "./TaskCard";
import type { Task, TaskStatus } from "@/types/kanban";
import { COLUMN_COLORS } from "@/types/kanban";

interface KanbanColumnProps {
  id: TaskStatus;
  label: string;
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

export function KanbanColumn({ id, label, tasks, onAddTask, onEditTask, onDeleteTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: "column" } });
  const colors = COLUMN_COLORS[id];

  return (
    <div className={`flex flex-col rounded-2xl ${colors.bg} min-w-[280px] w-[280px] shrink-0`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${colors.accent}`} />
          <h3 className="font-bold text-sm">{label}</h3>
          <span className="text-xs font-semibold text-muted-foreground bg-card rounded-full px-2 py-0.5">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg hover:bg-card"
          onClick={() => onAddTask(id)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-col gap-2.5 p-3 pt-1 kanban-scroll overflow-y-auto min-h-[200px] rounded-b-2xl transition-colors ${
          isOver ? "bg-primary/5" : ""
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEditTask} onDelete={onDeleteTask} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
