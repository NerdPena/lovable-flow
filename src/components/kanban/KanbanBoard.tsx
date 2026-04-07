import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { TaskDialog } from "./TaskDialog";
import { useTasks } from "@/hooks/useTasks";
import { COLUMNS, type Task, type TaskStatus } from "@/types/kanban";

interface KanbanBoardProps {
  taskHook: ReturnType<typeof useTasks>;
}

export function KanbanBoard({ taskHook }: KanbanBoardProps) {
  const { tasks, isLoading, addTask, updateTask, deleteTask, moveTask } = taskHook;
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("backlog");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const tasksByColumn = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      backlog: [], todo: [], in_progress: [], review: [], done: [],
    };
    tasks.forEach((t) => map[t.status]?.push(t));
    return map;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task;
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let targetStatus: TaskStatus;
    if (over.data.current?.type === "column") {
      targetStatus = over.id as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === over.id);
      targetStatus = overTask?.status ?? task.status;
    }

    const columnTasks = tasksByColumn[targetStatus].filter((t) => t.id !== taskId);
    const overIndex = over.data.current?.type === "task"
      ? columnTasks.findIndex((t) => t.id === over.id)
      : columnTasks.length;

    const position = overIndex >= 0 ? overIndex : columnTasks.length;

    if (task.status !== targetStatus || task.position !== position) {
      moveTask.mutate(
        { id: taskId, status: targetStatus, position },
        { onError: () => toast.error("Failed to move task") }
      );
    }
  };

  const handleAddTask = useCallback((status: TaskStatus) => {
    setEditingTask(null);
    setDefaultStatus(status);
    setDialogOpen(true);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  }, []);

  const handleDeleteTask = useCallback((id: string) => {
    deleteTask.mutate(id, {
      onSuccess: () => toast.success("Task deleted"),
      onError: () => toast.error("Failed to delete task"),
    });
  }, [deleteTask]);

  const handleSubmit = useCallback(
    (values: any) => {
      if (editingTask) {
        updateTask.mutate(
          { id: editingTask.id, ...values, due_date: values.due_date || null },
          {
            onSuccess: () => toast.success("Task updated"),
            onError: () => toast.error("Failed to update task"),
          }
        );
      } else {
        const columnTasks = tasksByColumn[values.status as TaskStatus];
        addTask.mutate(
          { ...values, due_date: values.due_date || null, position: columnTasks.length },
          {
            onSuccess: () => toast.success("Task created"),
            onError: () => toast.error("Failed to create task"),
          }
        );
      }
    },
    [editingTask, updateTask, addTask, tasksByColumn]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 p-6 overflow-x-auto h-full">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              label={col.label}
              tasks={tasksByColumn[col.id]}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="rotate-3 opacity-90">
              <TaskCard task={activeTask} onEdit={() => {}} onDelete={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        defaultStatus={defaultStatus}
        onSubmit={handleSubmit}
      />
    </>
  );
}
