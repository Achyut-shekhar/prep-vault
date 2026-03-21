import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

const STORAGE_KEY = "prep-vault-folder-todos";

const getTodoMap = () => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error("Failed to read vault todos:", error);
    return {};
  }
};

const saveTodoMap = (todoMap) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todoMap));
};

const VaultTodoList = ({ vaultId, folderName }) => {
  const [todoMap, setTodoMap] = useState({});
  const [draft, setDraft] = useState("");

  const folderKey = useMemo(() => String(vaultId || "").trim(), [vaultId]);
  const todos = todoMap[folderKey] || [];
  const completedCount = todos.filter((todo) => todo.completed).length;

  useEffect(() => {
    setTodoMap(getTodoMap());
  }, []);

  const updateTodos = (nextTodos) => {
    const nextMap = {
      ...todoMap,
      [folderKey]: nextTodos,
    };

    if (!nextTodos.length) {
      delete nextMap[folderKey];
    }

    setTodoMap(nextMap);
    saveTodoMap(nextMap);
  };

  const handleAddTodo = (event) => {
    event.preventDefault();

    const title = draft.trim();
    if (!title || !folderKey) {
      return;
    }

    updateTodos([
      ...todos,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        completed: false,
      },
    ]);
    setDraft("");
  };

  const handleToggleTodo = (todoId, checked) => {
    updateTodos(
      todos.map((todo) =>
        todo.id === todoId
          ? { ...todo, completed: Boolean(checked) }
          : todo,
      ),
    );
  };

  const handleDeleteTodo = (todoId) => {
    updateTodos(todos.filter((todo) => todo.id !== todoId));
  };

  if (!folderKey) {
    return null;
  }

  return (
    <div className="mt-8 rounded-xl border border-border bg-background p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <ClipboardList className="h-3.5 w-3.5" />
            Folder Prep Checklist
          </div>
          <h4 className="font-semibold">
            To-do list for {folderName || "this folder"}
          </h4>
          <p className="text-sm text-muted-foreground">
            Keep preparation tasks separate for each vault folder.
          </p>
        </div>

        <div className="rounded-xl bg-muted px-3 py-2 text-right">
          <p className="text-xs text-muted-foreground">Progress</p>
          <p className="text-sm font-semibold">
            {completedCount}/{todos.length || 0}
          </p>
        </div>
      </div>

      <form onSubmit={handleAddTodo} className="mb-4 flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`Add a task for ${folderName || "this folder"}`}
          className="h-11"
        />
        <Button type="submit" className="h-11 shrink-0">
          <Plus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </form>

      <div className="space-y-3">
        {todos.length > 0 ? (
          todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-3"
            >
              <Checkbox
                checked={todo.completed}
                onCheckedChange={(checked) => handleToggleTodo(todo.id, checked)}
                className="mt-0.5"
              />

              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    todo.completed
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  }`}
                >
                  {todo.title}
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => handleDeleteTodo(todo.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />
            <p className="font-medium">No tasks yet for this folder</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add things like aptitude practice, revision, mock interviews, or sheet completion.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VaultTodoList;
