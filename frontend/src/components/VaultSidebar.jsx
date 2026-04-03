import {
  FolderOpen,
  Lock,
  Globe,
  ChevronRight,
  ExternalLink,
  FileText,
  Trash2,
  Pencil,
  NotebookPen,
  ListChecks,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import NewFolderDialog from "./NewFolderDialog";
import AddResourceDialog from "./AddResourceDialog";
import SimpleNotepad from "./SimpleNotepad";
import VaultTodoList from "./VaultTodoList";
import { toast } from "sonner";
import { vaultApi } from "@/lib/api";

const VaultSidebar = () => {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [resources, setResources] = useState([]);
  const [notes, setNotes] = useState([]);
  const [noteSearch, setNoteSearch] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [folderView, setFolderView] = useState("resources");
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [targetFolder, setTargetFolder] = useState(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [folderActionLoading, setFolderActionLoading] = useState(false);
  const [deleteResourceDialogOpen, setDeleteResourceDialogOpen] = useState(false);
  const [targetResource, setTargetResource] = useState(null);
  const [resourceActionLoading, setResourceActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch vaults on mount
  useEffect(() => {
    fetchVaults();
  }, []);

  // Fetch resources and notes when folder is selected
  useEffect(() => {
    if (selectedFolder) {
      fetchResources(selectedFolder);
      fetchNotes(selectedFolder);
      setEditingNote(null);
      setNoteSearch("");
      setFolderView("resources");
    } else {
      setResources([]);
      setNotes([]);
    }
  }, [selectedFolder]);

  const fetchVaults = async () => {
    try {
      const data = await vaultApi.getVaults();
      setFolders(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching vaults:", error);
      toast.error("Failed to load vaults");
      setFolders([]);
      setLoading(false);
    }
  };

  const fetchResources = async (vaultId) => {
    try {
      const data = await vaultApi.getResources(vaultId);
      setResources(data || []);
    } catch (error) {
      console.error("Error fetching resources:", error);
      toast.error("Failed to load resources");
      setResources([]);
    }
  };

  const fetchNotes = async (vaultId) => {
    try {
      const data = await vaultApi.getNotes(vaultId);
      setNotes(data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
      setNotes([]);
    }
  };

  const handleCreateFolder = async (name, isPublic) => {
    try {
      const newVault = await vaultApi.createVault({ name, isPublic });
      setFolders([newVault, ...folders]);
      setSelectedFolder(newVault._id);
      toast.success(`Folder "${name}" created successfully!`);
    } catch (error) {
      console.error("Error creating vault:", error);
      toast.error("Failed to create folder");
    }
  };

  const openRenameDialog = (folder) => {
    if (!folder) return;
    setTargetFolder(folder);
    setRenameDraft(folder.name || "");
    setRenameDialogOpen(true);
  };

  const handleRenameFolder = async () => {
    if (!targetFolder) return;

    const trimmedName = renameDraft.trim();
    if (!trimmedName || trimmedName === targetFolder.name) {
      setRenameDialogOpen(false);
      return;
    }

    try {
      setFolderActionLoading(true);
      const updatedFolder = await vaultApi.updateVault(targetFolder._id, {
        name: trimmedName,
        isPublic: targetFolder.isPublic,
        description: targetFolder.description || "",
      });

      setFolders((prevFolders) =>
        prevFolders.map((item) =>
          item._id === targetFolder._id ? { ...item, ...updatedFolder } : item,
        ),
      );
      toast.success("Folder renamed successfully");
      setRenameDialogOpen(false);
      setTargetFolder(null);
    } catch (error) {
      console.error("Error renaming folder:", error);
      toast.error("Failed to rename folder");
    } finally {
      setFolderActionLoading(false);
    }
  };

  const openDeleteDialog = (folder) => {
    if (!folder) return;
    setTargetFolder(folder);
    setDeleteDialogOpen(true);
  };

  const handleDeleteFolder = async () => {
    if (!targetFolder?._id) return;

    try {
      setFolderActionLoading(true);
      await vaultApi.deleteVault(targetFolder._id);
      setFolders((prevFolders) =>
        prevFolders.filter((item) => item._id !== targetFolder._id),
      );

      if (selectedFolder === targetFolder._id) {
        setSelectedFolder(null);
        setResources([]);
        setNotes([]);
        setNoteSearch("");
      }

      toast.success("Folder deleted successfully");
      setDeleteDialogOpen(false);
      setTargetFolder(null);
    } catch (error) {
      console.error("Error deleting folder:", error);
      toast.error("Failed to delete folder");
    } finally {
      setFolderActionLoading(false);
    }
  };

  const handleResourceAdded = (newResource) => {
    setResources([newResource, ...resources]);
    // Update resource count in folders list
    setFolders(
      folders.map((f) =>
        f._id === selectedFolder
          ? { ...f, resourceCount: f.resourceCount + 1 }
          : f,
      ),
    );
  };

  const openDeleteResourceDialog = (resource) => {
    if (!resource) return;
    setTargetResource(resource);
    setDeleteResourceDialogOpen(true);
  };

  const handleDeleteResource = async () => {
    if (!selectedFolder || !targetResource?._id) return;

    try {
      setResourceActionLoading(true);
      await vaultApi.deleteResource(selectedFolder, targetResource._id);
      setResources((prevResources) =>
        prevResources.filter((r) => r._id !== targetResource._id),
      );
      setFolders((prevFolders) =>
        prevFolders.map((f) =>
          f._id === selectedFolder
            ? { ...f, resourceCount: f.resourceCount - 1 }
            : f,
        ),
      );
      toast.success("Resource deleted successfully");
      setDeleteResourceDialogOpen(false);
      setTargetResource(null);
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast.error("Failed to delete resource");
    } finally {
      setResourceActionLoading(false);
    }
  };

  const handleOpenResource = (resource) => {
    if (resource.type === "link") {
      window.open(resource.url, "_blank");
    } else {
      window.open(vaultApi.getDownloadUrl(resource._id), "_blank");
    }
  };

  const handleCreateNote = async () => {
    if (!selectedFolder) return;

    try {
      const newNote = await vaultApi.addNote(selectedFolder, {
        title: "Untitled Note",
        content: "",
      });

      setNotes((prevNotes) => [newNote, ...prevNotes]);
      setEditingNote(newNote);
      toast.success("New note created");
    } catch (error) {
      console.error("Error creating note:", error);
      toast.error("Failed to create note");
    }
  };

  const handleOpenNote = (note) => {
    setEditingNote(note);
  };

  const handleNoteSaved = (updatedNote) => {
    setNotes((prevNotes) =>
      prevNotes
        .map((note) => (note._id === updatedNote._id ? updatedNote : note))
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    );
    setEditingNote(updatedNote);
  };

  const handleDeleteNote = async (noteId) => {
    if (!selectedFolder || !noteId) return;

    try {
      await vaultApi.deleteNote(selectedFolder, noteId);
      setNotes((prevNotes) => prevNotes.filter((note) => note._id !== noteId));
      setEditingNote(null);
      toast.success("Note deleted");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    }
  };

  const getResourceIcon = (type) => {
    if (type === "link")
      return <ExternalLink className="h-5 w-5 text-primary" />;
    return <FileText className="h-5 w-5 text-primary" />;
  };

  const getPlainTextFromHtml = (html) => {
    if (!html) return "";
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
  };

  const filteredNotes = notes.filter((note) => {
    if (!noteSearch.trim()) return true;

    const searchText = noteSearch.toLowerCase();
    const titleText = (note.title || "").toLowerCase();
    const contentText = getPlainTextFromHtml(note.content || "").toLowerCase();

    return titleText.includes(searchText) || contentText.includes(searchText);
  });

  const selectedFolderData = folders.find((folder) => folder._id === selectedFolder);

  const formatDate = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString();
  };

  if (loading) {
    return (
      <section id="vault" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p>Loading vaults...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      {editingNote && selectedFolder && (
        <SimpleNotepad
          vaultId={selectedFolder}
          folderName={selectedFolderData?.name}
          note={editingNote}
          onClose={() => setEditingNote(null)}
          onNoteSaved={handleNoteSaved}
          onNoteDeleted={handleDeleteNote}
        />
      )}

      <section id="vault" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">My Study Vault</h2>
              <p className="text-muted-foreground">
                Organize resources and notes for focused preparation
              </p>
            </div>
            <NewFolderDialog onCreateFolder={handleCreateFolder} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Folders</h3>
                <span className="text-sm text-muted-foreground">
                  {folders.length} folders
                </span>
              </div>

              <div className="space-y-2">
                {folders.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No folders yet. Create one to get started!
                  </p>
                ) : (
                  folders.map((folder) => (
                    <div
                      key={folder._id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedFolder(folder._id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedFolder(folder._id);
                        }
                      }}
                      className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${
                        selectedFolder === folder._id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-secondary"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FolderOpen
                          className={`h-5 w-5 ${
                            selectedFolder === folder._id
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{folder.name}</span>
                            {folder.isPublic ? (
                              <Globe className="h-3.5 w-3.5 text-accent" />
                            ) : (
                              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {folder.resourceCount} resources
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
                          onClick={(event) => {
                            event.stopPropagation();
                            openRenameDialog(folder);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                          onClick={(event) => {
                            event.stopPropagation();
                            openDeleteDialog(folder);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>

                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${
                            selectedFolder === folder._id ? "rotate-90" : ""
                          }`}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              {selectedFolder ? (
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedFolderData?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {resources.length} saved resources
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openRenameDialog(selectedFolderData)}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        Edit Folder
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(selectedFolderData)}
                      >
                        <Trash2 className="mr-1 h-4 w-4 text-destructive" />
                        Delete Folder
                      </Button>
                      <AddResourceDialog
                        vaultId={selectedFolder}
                        onResourceAdded={handleResourceAdded}
                      />
                    </div>
                  </div>

                  <Tabs value={folderView} onValueChange={setFolderView} className="mt-6 w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="resources">
                        <FileText className="mr-2 h-4 w-4" />
                        Resources
                      </TabsTrigger>
                      <TabsTrigger value="todo">
                        <ListChecks className="mr-2 h-4 w-4" />
                        To-Do List
                      </TabsTrigger>
                      <TabsTrigger value="notes">
                        <NotebookPen className="mr-2 h-4 w-4" />
                        Notepad
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="resources" className="mt-4 focus-visible:outline-none focus-visible:ring-0">
                      <div className="space-y-3">
                        {resources.length === 0 ? (
                          <div className="py-8 text-center text-muted-foreground">
                            <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
                            <p>No resources yet. Add one to get started!</p>
                          </div>
                        ) : (
                          resources.map((resource) => (
                            <div
                              key={resource._id}
                              className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-3">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                  {getResourceIcon(resource.type)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-medium">{resource.title}</p>
                                  <p className="truncate text-sm text-muted-foreground">
                                    {resource.type === "link"
                                      ? new URL(resource.url).hostname
                                      : resource.fileName}
                                  </p>
                                  {resource.description && (
                                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                                      {resource.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-shrink-0 gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenResource(resource)}
                                >
                                  {resource.type === "link" ? "Open" : "Download"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDeleteResourceDialog(resource)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="todo" className="mt-4 focus-visible:outline-none focus-visible:ring-0">
                      <VaultTodoList
                        vaultId={selectedFolder}
                        folderName={selectedFolderData?.name}
                      />
                    </TabsContent>

                    <TabsContent value="notes" className="mt-4 focus-visible:outline-none focus-visible:ring-0">
                      <div className="rounded-xl border border-border bg-background p-4">
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <NotebookPen className="h-5 w-5 text-primary" />
                            <h4 className="font-semibold">Notepad</h4>
                          </div>
                          <Button variant="outline" size="sm" onClick={handleCreateNote}>
                            <Plus className="mr-1 h-4 w-4" />
                            New Note
                          </Button>
                        </div>

                        <p className="mb-3 text-xs text-muted-foreground">
                          Open any note and edit its title from the “Note Title” field at the top.
                        </p>

                        <div className="relative mb-4">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={noteSearch}
                            onChange={(event) => setNoteSearch(event.target.value)}
                            placeholder="Search notes"
                            className="pl-9"
                          />
                        </div>

                        {notes.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                            No notes yet. Click “New Note” to start writing.
                          </div>
                        ) : filteredNotes.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                            No matching notes found.
                          </div>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {filteredNotes.map((note) => {
                              const plainText = getPlainTextFromHtml(note.content || "");
                              const preview = plainText.trim()
                                ? `${plainText.slice(0, 110)}${plainText.length > 110 ? "..." : ""}`
                                : "Empty note";

                              return (
                                <button
                                  key={note._id}
                                  onClick={() => handleOpenNote(note)}
                                  className="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-secondary"
                                >
                                  <div className="mb-2 flex items-center justify-between gap-2">
                                    <p className="truncate text-sm font-medium">
                                      {note.title || "Untitled Note"}
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(note.updatedAt || note.createdAt)}
                                    </span>
                                  </div>
                                  <p className="line-clamp-3 text-xs text-muted-foreground">
                                    {preview}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-12">
                  <div className="text-center">
                    <FolderOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                    <p className="font-medium">Select a folder</p>
                    <p className="text-sm text-muted-foreground">
                      Click on a folder to view its resources and notes
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Dialog
        open={renameDialogOpen}
        onOpenChange={(open) => {
          setRenameDialogOpen(open);
          if (!open) {
            setTargetFolder(null);
            setRenameDraft("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder Name</DialogTitle>
            <DialogDescription>
              Update the folder name for better organization.
            </DialogDescription>
          </DialogHeader>

          <Input
            value={renameDraft}
            onChange={(event) => setRenameDraft(event.target.value)}
            placeholder="Folder name"
            autoFocus
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRenameDialogOpen(false);
                setTargetFolder(null);
                setRenameDraft("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleRenameFolder}
              disabled={folderActionLoading || !renameDraft.trim()}
            >
              {folderActionLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setTargetFolder(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the folder
              {targetFolder?.name ? ` “${targetFolder.name}”` : ""} and everything
              inside it, including resources, notes, and to-do tasks. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={folderActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFolder}
              disabled={folderActionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {folderActionLoading ? "Deleting..." : "Delete Folder"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteResourceDialogOpen}
        onOpenChange={(open) => {
          setDeleteResourceDialogOpen(open);
          if (!open && !resourceActionLoading) {
            setTargetResource(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete
              {targetResource?.title ? ` “${targetResource.title}”` : " this resource"}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resourceActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteResource}
              disabled={resourceActionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resourceActionLoading ? "Deleting..." : "Delete Resource"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default VaultSidebar;
