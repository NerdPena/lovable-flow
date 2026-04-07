import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Timer } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, differenceInDays, startOfDay, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Task, TaskCategory } from "@/types/kanban";
import { CATEGORY_CONFIG, PRIORITY_CONFIG, COLUMN_COLORS } from "@/types/kanban";

interface ProjectTimelineProps {
  tasks: Task[];
}

export function ProjectTimeline({ tasks }: ProjectTimelineProps) {
  const [selectedProject, setSelectedProject] = useState<TaskCategory | "all">("all");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const filteredTasks = useMemo(() => {
    if (selectedProject === "all") return tasks;
    return tasks.filter((t) => t.category === selectedProject);
  }, [tasks, selectedProject]);

  // Tasks with due dates for the Gantt/calendar view
  const scheduledTasks = useMemo(() => {
    return filteredTasks
      .filter((t) => t.due_date)
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());
  }, [filteredTasks]);

  const unscheduledTasks = useMemo(() => {
    return filteredTasks.filter((t) => !t.due_date);
  }, [filteredTasks]);

  // Calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Stats
  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const done = filteredTasks.filter((t) => t.status === "done").length;
    const inProgress = filteredTasks.filter((t) => t.status === "in_progress").length;
    const overdue = filteredTasks.filter(
      (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done"
    ).length;
    const totalMinutes = filteredTasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
    return { total, done, inProgress, overdue, totalMinutes };
  }, [filteredTasks]);

  // Group tasks by day for calendar grid
  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    scheduledTasks.forEach((task) => {
      const key = task.due_date!;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    });
    return map;
  }, [scheduledTasks]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header controls */}
      <div className="flex items-center justify-between gap-4 p-4 pb-2 shrink-0">
        <div className="flex items-center gap-3">
          <Select
            value={selectedProject}
            onValueChange={(v) => setSelectedProject(v as TaskCategory | "all")}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">📋 All Projects</SelectItem>
              <SelectItem value="personal">👤 Personal</SelectItem>
              <SelectItem value="printers">🖨️ Printers</SelectItem>
              <SelectItem value="rv_park">🏕️ RV Park</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-sm min-w-[140px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 px-4 pb-3 shrink-0 flex-wrap">
        <StatCard label="Total Tasks" value={stats.total} />
        <StatCard label="In Progress" value={stats.inProgress} accent="text-column-in-progress-accent" />
        <StatCard label="Completed" value={stats.done} accent="text-column-done-accent" />
        <StatCard label="Overdue" value={stats.overdue} accent="text-destructive" />
        <StatCard label="Est. Time" value={`${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`} />
      </div>

      {/* Main content — scrollable */}
      <div className="flex-1 overflow-auto px-4 pb-4 space-y-6 kanban-scroll">
        {/* Gantt-style timeline */}
        <section>
          <h3 className="font-bold text-sm mb-3 text-muted-foreground uppercase tracking-wider">
            Timeline — {format(currentMonth, "MMMM yyyy")}
          </h3>
          <div className="bg-card rounded-xl border overflow-hidden">
            {/* Day headers */}
            <div className="flex border-b">
              <div className="w-[220px] shrink-0 p-2 text-[10px] font-semibold text-muted-foreground border-r bg-muted/30">
                Task
              </div>
              <div className="flex-1 flex min-w-0">
                {calendarDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={`flex-1 min-w-[32px] text-center text-[10px] py-1.5 border-r last:border-r-0 ${
                      isToday(day) ? "bg-primary/10 font-bold text-primary" : "text-muted-foreground"
                    } ${day.getDay() === 0 || day.getDay() === 6 ? "bg-muted/20" : ""}`}
                  >
                    <div>{format(day, "d")}</div>
                    <div className="text-[8px]">{format(day, "EEE")}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Task rows */}
            {scheduledTasks.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No scheduled tasks for this period
              </div>
            ) : (
              scheduledTasks.map((task) => {
                const taskDate = new Date(task.due_date!);
                const estDays = task.estimated_minutes ? Math.max(1, Math.ceil(task.estimated_minutes / 480)) : 1;
                const taskStart = startOfDay(task.start_hour ? taskDate : taskDate);
                const priority = PRIORITY_CONFIG[task.priority];

                return (
                  <div key={task.id} className="flex border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                    <div className="w-[220px] shrink-0 p-2 border-r flex flex-col justify-center gap-0.5">
                      <span className="text-xs font-semibold truncate">{task.title}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-medium ${priority.color}`}>{priority.label}</span>
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                          {CATEGORY_CONFIG[task.category]?.emoji} {CATEGORY_CONFIG[task.category]?.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex-1 flex min-w-0 relative">
                      {calendarDays.map((day) => {
                        const dayStart = startOfDay(day);
                        const offsetFromTask = differenceInDays(dayStart, startOfDay(taskDate));
                        const isInRange = offsetFromTask >= 0 && offsetFromTask < estDays;
                        const isStart = offsetFromTask === 0;
                        const isEnd = offsetFromTask === estDays - 1;

                        return (
                          <div
                            key={day.toISOString()}
                            className={`flex-1 min-w-[32px] border-r last:border-r-0 relative ${
                              isToday(day) ? "bg-primary/5" : ""
                            } ${day.getDay() === 0 || day.getDay() === 6 ? "bg-muted/10" : ""}`}
                          >
                            {isInRange && (
                              <div
                                className={`absolute top-1/2 -translate-y-1/2 h-5 ${
                                  task.status === "done"
                                    ? "bg-column-done-accent/70"
                                    : task.priority === "high"
                                    ? "bg-priority-high/70"
                                    : task.priority === "medium"
                                    ? "bg-priority-medium/70"
                                    : "bg-primary/50"
                                } ${isStart ? "left-1 rounded-l-full" : "left-0"} ${
                                  isEnd ? "right-1 rounded-r-full" : "right-0"
                                }`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Calendar Grid */}
        <section>
          <h3 className="font-bold text-sm mb-3 text-muted-foreground uppercase tracking-wider">
            Calendar View
          </h3>
          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
                {d}
              </div>
            ))}
            {/* Pad start */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[80px] rounded-lg bg-muted/20" />
            ))}
            {calendarDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayTasks = tasksByDay.get(dateKey) || [];
              return (
                <div
                  key={dateKey}
                  className={`min-h-[80px] rounded-lg border p-1.5 transition-colors ${
                    isToday(day)
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-card hover:border-border"
                  }`}
                >
                  <div
                    className={`text-[10px] font-semibold mb-1 ${
                      isToday(day) ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className={`text-[9px] px-1 py-0.5 rounded truncate font-medium ${
                          task.status === "done"
                            ? "bg-column-done/80 text-column-done-accent line-through"
                            : task.priority === "high"
                            ? "bg-priority-high/10 text-priority-high"
                            : task.priority === "medium"
                            ? "bg-priority-medium/10 text-priority-medium"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {task.start_hour ? task.start_hour.slice(0, 5) + " " : ""}
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-[9px] text-muted-foreground pl-1">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Unscheduled tasks */}
        {unscheduledTasks.length > 0 && (
          <section>
            <h3 className="font-bold text-sm mb-3 text-muted-foreground uppercase tracking-wider">
              Unscheduled Tasks ({unscheduledTasks.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {unscheduledTasks.map((task) => {
                const priority = PRIORITY_CONFIG[task.priority];
                return (
                  <div key={task.id} className="bg-card rounded-lg border p-3 flex flex-col gap-1">
                    <span className="text-xs font-semibold truncate">{task.title}</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 border-0 ${priority.bg} ${priority.color}`}>
                        {priority.label}
                      </Badge>
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                        {CATEGORY_CONFIG[task.category]?.emoji} {CATEGORY_CONFIG[task.category]?.label}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground">
                        {task.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="bg-card rounded-lg border px-4 py-2 min-w-[120px]">
      <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</div>
      <div className={`text-lg font-bold ${accent || ""}`}>{value}</div>
    </div>
  );
}
