import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, FolderOpen, Lock, Globe, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

const SaveToVaultDialog = ({ resource, children, onSaved }) => {
  const [open, setOpen] = useState(false);
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedVault, setSelectedVault] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      fetchVaults();
    }
  }, [open]);

  const fetchVaults = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/vault");
      if (!response.ok) throw new Error("Failed to fetch vaults");
      const data = await response.json();
      setVaults(data);
    } catch (error) {
      console.error("Error fetching vaults:", error);
      toast.error("Failed to load folders");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToVault = async (vaultId) => {
    setSaving(true);
    setSelectedVault(vaultId);

    try {
      const response = await fetch(
        `http://localhost:5000/api/vault/${vaultId}/resources/link`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: resource.title,
            url: resource.url,
            description: resource.description || "",
            tags: [resource.type],
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to save resource");

      const savedResource = await response.json();
      toast.success("Resource saved to vault!");
      setOpen(false);
      if (onSaved) {
        onSaved(vaultId, savedResource);
      }
    } catch (error) {
      console.error("Error saving resource:", error);
      toast.error("Failed to save resource");
    } finally {
      setSaving(false);
      setSelectedVault(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save to Vault</DialogTitle>
          <DialogDescription>
            Choose a folder to save "{resource.title}"
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : vaults.length === 0 ? (
          <div className="py-8 text-center">
            <FolderOpen className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No folders yet. Create one in your Vault first!
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                navigate("/vault");
                window.location.href = "/vault";
              }}
            >
              Go to Vault
            </Button>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-2">
              {vaults.map((vault) => (
                <button
                  key={vault._id}
                  onClick={() => handleSaveToVault(vault._id)}
                  disabled={saving}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FolderOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{vault.name}</span>
                        {vault.isPublic ? (
                          <Globe className="h-3.5 w-3.5 text-accent" />
                        ) : (
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {vault.resourceCount} resources
                      </span>
                    </div>
                  </div>
                  {saving && selectedVault === vault._id && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SaveToVaultDialog;
