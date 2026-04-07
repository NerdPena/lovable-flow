import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { ProjectTimeline } from "@/components/dashboard/ProjectTimeline";
import { AIChatPanel } from "@/components/chat/AIChatPanel";
import { useTasks } from "@/hooks/useTasks";
import { LayoutDashboard, Columns3 } from "lucide-react";

type TabView = "board" | "dashboard";

const Index = () => {
  const taskHook = useTasks();
  const [activeTab, setActiveTab] = useState<TabView>("board");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-4 border-b px-4 bg-card shrink-0">
            <SidebarTrigger className="ml-1" />
            <h1 className="font-extrabold text-lg">FlowBoard</h1>

            <div className="ml-auto flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setActiveTab("board")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === "board"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Columns3 className="h-3.5 w-3.5" />
                Board
              </button>
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === "dashboard"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-hidden">
            {activeTab === "board" ? (
              <KanbanBoard taskHook={taskHook} />
            ) : (
              <ProjectTimeline tasks={taskHook.tasks} />
            )}
          </main>
        </div>

        <AIChatPanel tasks={taskHook.tasks} onTasksChanged={() => taskHook.refetch()} />
      </div>
    </SidebarProvider>
  );
};

export default Index;
