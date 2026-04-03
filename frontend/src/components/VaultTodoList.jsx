import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Edit2,
  Flag,
  Plus,
  Repeat,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { vaultApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getPriorityLabel = (priority) => {
  if (priority === "high") return "High";
  if (priority === "low") return "Low";
  return "Medium";
};

const getRepeatLabel = (repeat) => {
  if (repeat === "daily") return "Daily";
  if (repeat === "weekly") return "Weekly";
  if (repeat === "monthly") return "Monthly";
  if (repeat === "yearly") return "Yearly";
  return "No repeat";
};

const formatDueDate = (dueDate) => {
  if (!dueDate) return null;

  const date = new Date(dueDate);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const isOverdue = (dueDate, completed) => {
  if (!dueDate || completed) return false;

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return due < today;
};

const formatToday = () =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

const TodoRow = ({ todo, onToggle, onToggleImportant, onEdit, onDelete }) => {
  const getPriorityClasses = (priority) => {
    switch (priority) {
      case "high":
        return "bg-rose-500/10 text-rose-600 border border-rose-500/20 hover:bg-rose-500/20";
      case "low":
        return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20";
      default:
        return "bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20";
    }
  };

  return (
    <div
      className={`group relative flex items-start gap-3.5 rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
        todo.completed
          ? "border-border/50 bg-muted/30 opacity-75"
          : todo.important
            ? "border-primary/40 bg-primary/[0.04] shadow-sm shadow-primary/5"
            : "border-border bg-card"
      }`}
    >
      <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-white/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-white/5" />
      
      <div className="mt-0.5 relative flex items-center justify-center">
        <Checkbox
          checked={todo.completed}
          onCheckedChange={(checked) => onToggle(todo._id, checked)}
          className={`h-5 w-5 rounded-full transition-all duration-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white data-[state=checked]:border-none`}
        />
        {todo.completed && (
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-20 duration-1000" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`text-[15px] transition-all duration-300 ${
            todo.completed
              ? "text-muted-foreground line-through"
              : "font-semibold text-foreground"
          }`}
        >
          {todo.title}
        </p>

        {todo.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground/80 leading-relaxed">
            {todo.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <Badge variant="outline" className={`text-xs font-semibold px-2 py-0.5 rounded-md transition-colors ${getPriorityClasses(todo.priority)}`}>
            <Flag className="mr-1.5 h-3 w-3" />
            {getPriorityLabel(todo.priority)}
          </Badge>

          {todo.repeat && todo.repeat !== "none" && (
            <Badge variant="outline" className="text-xs text-muted-foreground border-border/60 bg-muted/30 hover:bg-muted/50 rounded-md">
              <Repeat className="mr-1.5 h-3 w-3 text-primary/70" />
              {getRepeatLabel(todo.repeat)}
            </Badge>
          )}

          {todo.dueDate && (
            <Badge
              variant="outline"
              className={`text-xs rounded-md ${
                isOverdue(todo.dueDate, todo.completed)
                  ? "border-destructive/30 bg-destructive/10 text-destructive font-medium"
                  : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <Calendar className="mr-1.5 h-3 w-3" />
              {formatDueDate(todo.dueDate)}
              {isOverdue(todo.dueDate, todo.completed) ? " (Overdue)" : ""}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex shrink-0 gap-1 rounded-xl bg-background/80 p-1 shadow-sm opacity-100 backdrop-blur-sm transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100 border border-border/50">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-8 w-8 rounded-lg transition-colors ${
            todo.important
              ? "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
              : "text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
          }`}
          onClick={() => onToggleImportant(todo)}
        >
          <Star className={`h-4 w-4 ${todo.important ? "fill-amber-500 drop-shadow-md" : ""}`} />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          onClick={() => onEdit(todo)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
          onClick={() => onDelete(todo._id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const VaultTodoList = ({ vaultId, folderName }) => {
  const [todos, setTodos] = useState([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTodo, setEditingTodo] = useState(null);
  const [showCompleted, setShowCompleted] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    repeat: "none",
  });

  const folderKey = useMemo(() => String(vaultId || "").trim(), [vaultId]);
  const completedCount = todos.filter((todo) => todo.completed).length;
  const activeCount = todos.length - completedCount;
  const importantCount = todos.filter((todo) => todo.important).length;

  const searchedTodos = useMemo(() => {
    let result = [...todos];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (todo) =>
          todo.title.toLowerCase().includes(query) ||
          (todo.description || "").toLowerCase().includes(query),
      );
    }

    result.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;

      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;

      if (aDate !== bDate) return aDate - bDate;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    return result;
  }, [todos, searchQuery]);

  const visibleActiveTodos = useMemo(() => {
    if (statusFilter === "completed") return [];
    let nextTodos = searchedTodos.filter((todo) => !todo.completed);

    if (statusFilter === "important") {
      nextTodos = nextTodos.filter((todo) => todo.important);
    }

    return nextTodos;
  }, [searchedTodos, statusFilter]);

  const visibleCompletedTodos = useMemo(() => {
    if (statusFilter === "active") return [];
    let nextTodos = searchedTodos.filter((todo) => todo.completed);

    if (statusFilter === "important") {
      nextTodos = nextTodos.filter((todo) => todo.important);
    }

    return nextTodos;
  }, [searchedTodos, statusFilter]);

  useEffect(() => {
    const fetchTodos = async () => {
      if (!folderKey) {
        setTodos([]);
        return;
      }

      try {
        setIsLoading(true);
        const data = await vaultApi.getTodos(folderKey);
        setTodos(data || []);
      } catch (error) {
        console.error("Error fetching todos:", error);
        toast.error("Failed to load to-do list");
        setTodos([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodos();
  }, [folderKey]);

  const handleAddTodo = async (event) => {
    event.preventDefault();

    const title = draft.trim();
    if (!title || !folderKey || isSaving) return;

    try {
      setIsSaving(true);
      const createdTodo = await vaultApi.addTodo(folderKey, { title, repeat: "none" });
      setTodos((prev) => [createdTodo, ...prev]);
      setDraft("");
    } catch (error) {
      console.error("Error creating todo:", error);
      toast.error("Failed to add task");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleTodo = async (todoId, checked) => {
    const nextCompleted = Boolean(checked);
    const previousTodos = [...todos];

    setTodos((prev) =>
      prev.map((todo) =>
        todo._id === todoId ? { ...todo, completed: nextCompleted } : todo,
      ),
    );

    try {
      await vaultApi.updateTodo(folderKey, todoId, { completed: nextCompleted });
    } catch (error) {
      console.error("Error updating todo:", error);
      setTodos(previousTodos);
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTodo = async (todoId) => {
    const previousTodos = [...todos];
    setTodos((prev) => prev.filter((todo) => todo._id !== todoId));

    try {
      await vaultApi.deleteTodo(folderKey, todoId);
      toast.success("Task deleted");
    } catch (error) {
      console.error("Error deleting todo:", error);
      setTodos(previousTodos);
      toast.error("Failed to delete task");
    }
  };

  const handleToggleImportant = async (todo) => {
    const previousTodos = [...todos];
    const nextImportant = !todo.important;

    setTodos((prev) =>
      prev.map((item) =>
        item._id === todo._id ? { ...item, important: nextImportant } : item,
      ),
    );

    try {
      await vaultApi.updateTodo(folderKey, todo._id, { important: nextImportant });
    } catch (error) {
      console.error("Error updating importance:", error);
      setTodos(previousTodos);
      toast.error("Failed to update importance");
    }
  };

  const handleClearCompleted = async () => {
    if (!folderKey || !completedCount) return;

    const previousTodos = [...todos];
    setTodos((prev) => prev.filter((todo) => !todo.completed));

    try {
      await vaultApi.clearCompletedTodos(folderKey);
      toast.success(`Cleared ${completedCount} completed task(s)`);
    } catch (error) {
      console.error("Error clearing completed todos:", error);
      setTodos(previousTodos);
      toast.error("Failed to clear completed tasks");
    }
  };

  const openEditDialog = (todo) => {
    setEditingTodo(todo);
    setEditForm({
      title: todo.title,
      description: todo.description || "",
      priority: todo.priority || "medium",
      dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split("T")[0] : "",
      repeat: todo.repeat || "none",
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTodo) return;

    const title = editForm.title.trim();
    if (!title) {
      toast.error("Task title cannot be empty");
      return;
    }

    try {
      setIsSaving(true);
      const updatedTodo = await vaultApi.updateTodo(folderKey, editingTodo._id, {
        title,
        description: editForm.description.trim(),
        priority: editForm.priority,
        dueDate: editForm.dueDate || null,
        repeat: editForm.repeat,
      });

      setTodos((prev) =>
        prev.map((todo) => (todo._id === editingTodo._id ? updatedTodo : todo)),
      );

      setShowEditDialog(false);
      setEditingTodo(null);
      toast.success("Task updated");
    } catch (error) {
      console.error("Error updating todo:", error);
      toast.error("Failed to update task");
    } finally {
      setIsSaving(false);
    }
  };

  if (!folderKey) return null;

  return (
    <div className="mt-8 rounded-3xl border border-border/60 bg-gradient-to-b from-card/80 to-card p-5 md:p-8 shadow-sm backdrop-blur-xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary shadow-sm">
            <ClipboardList className="h-4 w-4" />
            My Tasks
          </div>
          <h4 className="text-2xl font-bold tracking-tight text-foreground">{folderName || "This list"}</h4>
          <p className="mt-1 text-sm font-medium text-muted-foreground/80">{formatToday()}</p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-background/50 px-5 py-3 text-right shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] backdrop-blur-sm">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Tasks left</p>
          <p className="mt-1 text-3xl font-extrabold text-primary">{activeCount}</p>
        </div>
      </div>

      <form onSubmit={handleAddTodo} className="mb-6 relative group">
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary/30 to-accent/30 opacity-0 blur transition duration-500 group-hover:opacity-100" />
        <div className="relative flex items-center gap-3 rounded-2xl border border-border/80 bg-background px-4 py-2 shadow-sm transition duration-300 focus-within:ring-2 focus-within:ring-primary/20">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Plus className="h-4 w-4" />
          </div>
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a new task..."
            className="h-12 border-0 bg-transparent px-1 text-base placeholder:text-muted-foreground/60 shadow-none focus-visible:ring-0"
            disabled={isSaving || isLoading}
          />
          <Button type="submit" size="default" className="rounded-xl font-medium shadow-md transition-all hover:-translate-y-0.5" disabled={isSaving || isLoading || !draft.trim()}>
            {isSaving ? "Adding..." : "Add Task"}
          </Button>
        </div>
      </form>

      <div className="mb-4 space-y-3 rounded-xl border border-border bg-card p-3">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant={statusFilter === "all" ? "default" : "outline"} onClick={() => setStatusFilter("all")}>All</Button>
          <Button type="button" size="sm" variant={statusFilter === "active" ? "default" : "outline"} onClick={() => setStatusFilter("active")}>Active</Button>
          <Button type="button" size="sm" variant={statusFilter === "important" ? "default" : "outline"} onClick={() => setStatusFilter("important")}>Important ({importantCount})</Button>
          <Button type="button" size="sm" variant={statusFilter === "completed" ? "default" : "outline"} onClick={() => setStatusFilter("completed")}>Completed</Button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search" className="pl-9" />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Clear search">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{activeCount} remaining • {completedCount} completed</span>
          <Button type="button" variant="ghost" size="sm" disabled={!completedCount} onClick={handleClearCompleted}>Clear completed</Button>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Loading tasks...
          </div>
        ) : (
          <>
            {visibleActiveTodos.length > 0 && (
              <div className="space-y-2">
                {visibleActiveTodos.map((todo) => (
                  <TodoRow key={todo._id} todo={todo} onToggle={handleToggleTodo} onToggleImportant={handleToggleImportant} onEdit={openEditDialog} onDelete={handleDeleteTodo} />
                ))}
              </div>
            )}

            {statusFilter !== "active" && completedCount > 0 && (
              <div className="rounded-xl border border-border bg-card p-2">
                <button type="button" onClick={() => setShowCompleted((prev) => !prev)} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-muted/50">
                  <span className="font-medium text-muted-foreground">Completed ({visibleCompletedTodos.length})</span>
                  {showCompleted ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </button>

                {showCompleted && (
                  <div className="mt-2 space-y-2">
                    {visibleCompletedTodos.map((todo) => (
                      <TodoRow key={todo._id} todo={todo} onToggle={handleToggleTodo} onToggleImportant={handleToggleImportant} onEdit={openEditDialog} onDelete={handleDeleteTodo} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {visibleActiveTodos.length === 0 && (statusFilter === "active" || visibleCompletedTodos.length === 0) && (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />
                <p className="font-medium">{searchQuery ? "No tasks match your search" : "No tasks yet"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchQuery ? "Try a different search query" : "Add tasks like aptitude practice, revision, and mock interviews."}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) setEditingTodo(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
            <DialogDescription>Update task details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={editForm.title} onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Task title" />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editForm.description} onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Task description (optional)" rows={3} />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={editForm.priority} onValueChange={(value) => setEditForm((prev) => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Due date</Label>
                <Input type="date" value={editForm.dueDate} onChange={(event) => setEditForm((prev) => ({ ...prev, dueDate: event.target.value }))} />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Repeat</Label>
                <Select value={editForm.repeat} onValueChange={(value) => setEditForm((prev) => ({ ...prev, repeat: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No repeat</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setShowEditDialog(false); setEditingTodo(null); }}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VaultTodoList;
