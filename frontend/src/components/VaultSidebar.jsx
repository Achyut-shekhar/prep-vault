import {
  FolderOpen,
  Lock,
  Globe,
  ChevronRight,
  ExternalLink,
  FileText,
  Download,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import NewFolderDialog from "./NewFolderDialog";
import AddResourceDialog from "./AddResourceDialog";
import { toast } from "sonner";
import { vaultApi } from "@/lib/api";

const VaultSidebar = () => {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch vaults on mount
  useEffect(() => {
    fetchVaults();
  }, []);

  // Fetch resources when folder is selected
  useEffect(() => {
    if (selectedFolder) {
      fetchResources(selectedFolder);
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

  const handleDeleteResource = async (resourceId) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      await vaultApi.deleteResource(selectedFolder, resourceId);
      setResources(resources.filter((r) => r._id !== resourceId));
      setFolders(
        folders.map((f) =>
          f._id === selectedFolder
            ? { ...f, resourceCount: f.resourceCount - 1 }
            : f,
        ),
      );
      toast.success("Resource deleted successfully");
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast.error("Failed to delete resource");
    }
  };

  const handleOpenResource = (resource) => {
    if (resource.type === "link") {
      window.open(resource.url, "_blank");
    } else {
      window.open(vaultApi.getDownloadUrl(resource._id), "_blank");
    }
  };

  const getResourceIcon = (type) => {
    if (type === "link")
      return <ExternalLink className="h-5 w-5 text-primary" />;
    return <FileText className="h-5 w-5 text-primary" />;
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
    <section id="vault" className="py-20">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">My Study Vault</h2>
            <p className="text-muted-foreground">
              Organize resources into folders for focused preparation
            </p>
          </div>
          <NewFolderDialog onCreateFolder={handleCreateFolder} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Folders list */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Folders</h3>
              <span className="text-sm text-muted-foreground">
                {folders.length} folders
              </span>
            </div>

            <div className="space-y-2">
              {folders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No folders yet. Create one to get started!
                </p>
              ) : (
                folders.map((folder) => (
                  <button
                    key={folder._id}
                    onClick={() => setSelectedFolder(folder._id)}
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
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${
                        selectedFolder === folder._id ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Selected folder content */}
          <div className="lg:col-span-2">
            {selectedFolder ? (
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {folders.find((f) => f._id === selectedFolder)?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {resources.length} saved resources
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <AddResourceDialog
                      vaultId={selectedFolder}
                      onResourceAdded={handleResourceAdded}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {resources.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
                      <p>No resources yet. Add one to get started!</p>
                    </div>
                  ) : (
                    resources.map((resource) => (
                      <div
                        key={resource._id}
                        className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                            {getResourceIcon(resource.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">
                              {resource.title}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {resource.type === "link"
                                ? new URL(resource.url).hostname
                                : resource.fileName}
                            </p>
                            {resource.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                {resource.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
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
                            onClick={() => handleDeleteResource(resource._id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-12">
                <div className="text-center">
                  <FolderOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="font-medium">Select a folder</p>
                  <p className="text-sm text-muted-foreground">
                    Click on a folder to view its resources
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default VaultSidebar;
