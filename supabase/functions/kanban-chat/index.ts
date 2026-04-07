import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const tools = [
  {
    type: "function",
    function: {
      name: "add_task",
      description: "Create a new task on the Kanban board",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Task title" },
          description: { type: "string", description: "Task description" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
          category: { type: "string", enum: ["personal", "printers", "rv_park"], description: "Task category" },
          status: { type: "string", enum: ["backlog", "todo", "in_progress", "review", "done"], description: "Which column to place the task in" },
          due_date: { type: "string", description: "Due date in YYYY-MM-DD format, or null" },
          start_hour: { type: "string", description: "Start time in HH:MM format, or null" },
          estimated_minutes: { type: "number", description: "Estimated duration in minutes" },
        },
        required: ["title"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_task",
      description: "Update an existing task's fields (title, description, priority, category, status, due_date, start_hour, estimated_minutes)",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string", description: "The UUID of the task to update" },
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
          category: { type: "string", enum: ["personal", "printers", "rv_park"] },
          status: { type: "string", enum: ["backlog", "todo", "in_progress", "review", "done"] },
          due_date: { type: "string", description: "YYYY-MM-DD or null to clear" },
          start_hour: { type: "string", description: "HH:MM or null to clear" },
          estimated_minutes: { type: "number", description: "Duration in minutes or null to clear" },
        },
        required: ["task_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_task",
      description: "Delete a task from the board",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string", description: "The UUID of the task to delete" },
        },
        required: ["task_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "move_task",
      description: "Move a task to a different column/status",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string", description: "The UUID of the task to move" },
          status: { type: "string", enum: ["backlog", "todo", "in_progress", "review", "done"] },
        },
        required: ["task_id", "status"],
        additionalProperties: false,
      },
    },
  },
];

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  const supabase = getSupabase();

  if (name === "add_task") {
    const insert: Record<string, unknown> = { title: args.title };
    if (args.description) insert.description = args.description;
    if (args.priority) insert.priority = args.priority;
    if (args.category) insert.category = args.category;
    if (args.status) insert.status = args.status;
    if (args.due_date && args.due_date !== "null") insert.due_date = args.due_date;
    if (args.start_hour && args.start_hour !== "null") insert.start_hour = args.start_hour;
    if (args.estimated_minutes !== undefined) insert.estimated_minutes = args.estimated_minutes;
    const { data, error } = await supabase.from("tasks").insert(insert).select().single();
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ success: true, task: data });
  }

  if (name === "update_task") {
    const { task_id, ...updates } = args;
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) clean[k] = v === "null" ? null : v;
    }
    const { data, error } = await supabase.from("tasks").update(clean).eq("id", task_id).select().single();
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ success: true, task: data });
  }

  if (name === "delete_task") {
    const { error } = await supabase.from("tasks").delete().eq("id", args.task_id);
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ success: true });
  }

  if (name === "move_task") {
    const { data, error } = await supabase.from("tasks").update({ status: args.status }).eq("id", args.task_id).select().single();
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ success: true, task: data });
  }

  return JSON.stringify({ error: "Unknown tool" });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, tasks } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build task context
    let taskContext = "";
    if (tasks && Array.isArray(tasks) && tasks.length > 0) {
      taskContext = "\n\n## Current Board State\n" + tasks.map((t: any) =>
        `- [${t.status}] "${t.title}" (id: ${t.id}, priority: ${t.priority}, category: ${t.category}${t.due_date ? `, due: ${t.due_date}` : ""}${t.start_hour ? `, start: ${t.start_hour}` : ""}${t.estimated_minutes ? `, est: ${t.estimated_minutes}min` : ""}${t.description ? `, desc: ${t.description}` : ""})`
      ).join("\n");
    } else {
      taskContext = "\n\nThe board is currently empty.";
    }

    const systemPrompt = `You are FlowBoard AI — a helpful assistant built into a Kanban board app.
You have full access to the user's board and can see all their tasks. You can also create, update, delete, and move tasks using the available tools.

When the user asks you to modify tasks, USE THE TOOLS — don't just describe what to do.
When the user asks to see or summarize tasks, refer to the board state below.
When suggesting new tasks, offer to create them using the add_task tool.

Keep responses concise, friendly, and actionable. Use markdown formatting.
Priority indicators: 🔴 High, 🟡 Medium, 🟢 Low.
${taskContext}`;

    const aiMessages = [{ role: "system", content: systemPrompt }, ...messages];

    // Non-streaming loop to handle tool calls
    let finalResponse: any = null;
    let loopMessages = [...aiMessages];
    const MAX_TOOL_ROUNDS = 5;

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: loopMessages,
          tools,
          stream: false,
        }),
      });

      if (!aiResp.ok) {
        const status = aiResp.status;
        if (status === 429 || status === 402) {
          return new Response(JSON.stringify({ error: status === 429 ? "Rate limited" : "Payment required" }), {
            status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await aiResp.text();
        console.error("AI gateway error:", status, t);
        return new Response(JSON.stringify({ error: "AI error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await aiResp.json();
      const choice = result.choices?.[0];
      
      if (!choice) {
        return new Response(JSON.stringify({ error: "No response from AI" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If there are tool calls, execute them and continue
      if (choice.finish_reason === "tool_calls" || choice.message?.tool_calls?.length > 0) {
        const toolCalls = choice.message.tool_calls;
        loopMessages.push(choice.message);

        for (const tc of toolCalls) {
          const args = typeof tc.function.arguments === "string"
            ? JSON.parse(tc.function.arguments)
            : tc.function.arguments;
          
          console.log(`Executing tool: ${tc.function.name}`, args);
          const toolResult = await executeTool(tc.function.name, args);
          console.log(`Tool result:`, toolResult);

          loopMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: toolResult,
          });
        }
        continue;
      }

      // No tool calls — we have a final text response
      finalResponse = choice.message?.content || "";
      break;
    }

    if (finalResponse === null) {
      finalResponse = "I completed the requested actions on your board.";
    }

    // Return the final text as a JSON response (non-streaming since we needed tool loop)
    return new Response(JSON.stringify({ content: finalResponse, tool_used: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
