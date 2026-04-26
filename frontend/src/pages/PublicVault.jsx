import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  FolderOpen,
  Globe,
  Loader2,
  FileText,
  Github,
  Play,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { vaultApi } from "@/lib/api";

const typeConfig = {
  link: {
    icon: <FileText className="h-4 w-4" />,
    label: "Link",
  },
  blog: {
    icon: <FileText className="h-4 w-4" />,
    label: "Article",
  },
  pdf: {
    icon: <FileText className="h-4 w-4" />,
    label: "PDF",
  },
  video: {
    icon: <Play className="h-4 w-4" />,
    label: "Video",
  },
  github: {
    icon: <Github className="h-4 w-4" />,
    label: "GitHub",
  },
};

const PublicVault = () => {
  const { vaultId } = useParams();
  const [vault, setVault] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadVault = async () => {
      if (!vaultId) return;

      try {
        setLoading(true);
        const data = await vaultApi.getPublicVault(vaultId);
        setVault(data?.vault || null);
        setResources(data?.resources || []);
        setError("");
      } catch (fetchError) {
        console.error("Error loading public vault:", fetchError);
        setError(fetchError.message || "Failed to load shared folder");
      } finally {
        setLoading(false);
      }
    };

    loadVault();
  }, [vaultId]);

  const shareUrl = vaultId ? `${window.location.origin}/share/${vaultId}` : "";

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied");
    } catch (copyError) {
      console.error("Error copying public share link:", copyError);
      toast.error("Failed to copy share link");
    }
  };

  const getTypeLabel = (type) => {
    const config = typeConfig[type?.toLowerCase?.()] || typeConfig.link;
    return config.label;
  };

  const getTypeIcon = (type) => {
    const config = typeConfig[type?.toLowerCase?.()] || typeConfig.link;
    return config.icon;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        <section className="py-16">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center">
                <p className="text-lg font-semibold">
                  Shared folder unavailable
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{error}</p>
                <Button asChild className="mt-6">
                  <Link to="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="mx-auto max-w-5xl space-y-8">
                <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
                  <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-sm text-accent">
                        <Globe className="h-4 w-4" />
                        Public Folder
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                          {vault?.name || "Shared Folder"}
                        </h1>
                        <p className="mt-3 max-w-2xl text-muted-foreground">
                          {vault?.description ||
                            "A public folder shared from PrepVault."}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1">
                          <FolderOpen className="h-4 w-4" />
                          {vault?.resourceCount || resources.length} resources
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1">
                          <Globe className="h-4 w-4" />
                          Read only
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button variant="outline" onClick={handleCopyLink}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Share Link
                      </Button>
                      <Button asChild>
                        <Link to="/vault">
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Open PrepVault
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {resources.length === 0 ? (
                    <div className="col-span-full rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
                      No resources have been added to this public folder yet.
                    </div>
                  ) : (
                    resources.map((resource) => (
                      <article
                        key={resource._id}
                        className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                      >
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div className="inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                            {getTypeIcon(resource.type)}
                            {getTypeLabel(resource.type)}
                          </div>
                          {resource.url && (
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-primary"
                            >
                              Visit
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>

                        <h2 className="line-clamp-2 text-lg font-semibold">
                          {resource.title}
                        </h2>
                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                          {resource.description || "No description available."}
                        </p>
                      </article>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PublicVault;
