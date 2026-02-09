import { useState } from "react";
import { Plus, Link as LinkIcon, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const AddResourceDialog = ({ vaultId, onResourceAdded }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Link form state
  const [linkData, setLinkData] = useState({
    title: "",
    url: "",
    description: "",
  });

  // File form state
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState({
    title: "",
    description: "",
  });

  const handleAddLink = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/vault/${vaultId}/resources/link`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(linkData),
        },
      );

      if (!response.ok) throw new Error("Failed to add link");

      const resource = await response.json();
      toast.success("Link added successfully!");
      setLinkData({ title: "", url: "", description: "" });
      setOpen(false);
      onResourceAdded(resource);
    } catch (error) {
      console.error("Error adding link:", error);
      toast.error("Failed to add link");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", fileData.title || file.name);
      formData.append("description", fileData.description);

      const response = await fetch(
        `http://localhost:5000/api/vault/${vaultId}/resources/file`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) throw new Error("Failed to upload file");

      const resource = await response.json();
      toast.success("File uploaded successfully!");
      setFile(null);
      setFileData({ title: "", description: "" });
      setOpen(false);
      onResourceAdded(resource);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          Add Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add Resource</DialogTitle>
          <DialogDescription>
            Add a link or upload a file to this vault
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">
              <LinkIcon className="mr-2 h-4 w-4" />
              Link
            </TabsTrigger>
            <TabsTrigger value="file">
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link">
            <form onSubmit={handleAddLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="link-title">Title</Label>
                <Input
                  id="link-title"
                  placeholder="Resource title"
                  value={linkData.title}
                  onChange={(e) =>
                    setLinkData({ ...linkData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={linkData.url}
                  onChange={(e) =>
                    setLinkData({ ...linkData, url: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link-description">Description (Optional)</Label>
                <Textarea
                  id="link-description"
                  placeholder="Brief description of the resource"
                  value={linkData.description}
                  onChange={(e) =>
                    setLinkData({ ...linkData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Adding..." : "Add Link"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="file">
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.zip"
                    onChange={(e) => setFile(e.target.files[0])}
                    required
                  />
                </div>
                {file && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {file.name} (
                    {(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="file-title">Title (Optional)</Label>
                <Input
                  id="file-title"
                  placeholder="Leave empty to use filename"
                  value={fileData.title}
                  onChange={(e) =>
                    setFileData({ ...fileData, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file-description">Description (Optional)</Label>
                <Textarea
                  id="file-description"
                  placeholder="Brief description of the file"
                  value={fileData.description}
                  onChange={(e) =>
                    setFileData({ ...fileData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Uploading..." : "Upload File"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddResourceDialog;
