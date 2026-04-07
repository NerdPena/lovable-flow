import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { AIChatPanel } from "@/components/chat/AIChatPanel";
import { useTasks } from "@/hooks/useTasks";

const Index = () => {
  const taskHook = useTasks();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-4 border-b px-4 bg-card shrink-0">
            <SidebarTrigger className="ml-1" />
            <div>
              <h1 className="font-extrabold text-lg">Kanban Dashboard</h1>
            </div>
          </header>

          <main className="flex-1 overflow-hidden">
            <KanbanBoard taskHook={taskHook} />
          </main>
        </div>

        <AIChatPanel tasks={taskHook.tasks} onTasksChanged={() => taskHook.refetch()} />
      </div>
    </SidebarProvider>
  );
};

export default Index;
