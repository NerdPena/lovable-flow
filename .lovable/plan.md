

## Kanban Board with AI Assistant

### Design Style
Inspired by your reference images — clean card-based layout with a purple/indigo accent sidebar, rounded cards with priority badges, avatar stacks, and a modern feel. Light background with subtle column header colors (blue/green/orange/purple/teal for each status).

### Layout
- **Left sidebar** — Navigation with icons: Home, Board, Settings. Collapsible. Purple/indigo gradient aesthetic like the "slothui" reference.
- **Main area** — 5-column Kanban board: Backlog → Todo → In Progress → Review → Done
- **AI Chat panel** — Slide-out panel from the right side, accessible via a floating chat button

### Kanban Board Features
- **5 columns** with color-coded headers and task counts
- **Drag & drop** cards between columns using dnd-kit
- **Task cards** showing: title, description preview, priority badge (High/Medium/Low with colors), due date, and action menu
- **Add task** — "+" button on each column header opens a form to create a new task with title, description, priority, and due date
- **Edit/delete tasks** — Click a card to open a detail modal for editing or deleting
- **Sort by** newest/priority

### AI Chatbot
- Floating chat bubble in the bottom-right corner
- Slide-out chat panel with conversation history
- Capabilities: general Q&A, suggest tasks for the board, summarize current board status
- Powered by Lovable AI via an edge function

### Database (Lovable Cloud)
- **Tasks table** — id, title, description, priority, due_date, status (column), position (for ordering), created_at, updated_at
- Data persists across sessions so you can come back anytime
- Real-time updates

### Pages
1. **Main Board** (`/`) — The Kanban board with sidebar and AI chat
2. **404** — Already exists

