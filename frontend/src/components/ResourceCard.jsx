import {
  FileText,
  Github,
  Play,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SaveToVaultDialog from "./SaveToVaultDialog";
import { useState } from "react";

// ✅ TYPE CONFIG
const typeConfig = {
  blog: {
    icon: <FileText className="h-3.5 w-3.5" />,
    label: "Article",
    className: "bg-resource-blog/10 text-resource-blog border-resource-blog/20",
  },
  pdf: {
    icon: <FileText className="h-3.5 w-3.5" />,
    label: "PDF",
    className: "bg-resource-pdf/10 text-resource-pdf border-resource-pdf/20",
  },
  video: {
    icon: <Play className="h-3.5 w-3.5" />,
    label: "Video",
    className:
      "bg-resource-video/10 text-resource-video border-resource-video/20",
  },
  github: {
    icon: <Github className="h-3.5 w-3.5" />,
    label: "GitHub",
    className:
      "bg-resource-github/10 text-resource-github border-resource-github/20",
  },
};

const ResourceCard = ({ resource }) => {
  const [isSaved, setIsSaved] = useState(false);

  // ✅ SAFE TYPE HANDLING (MAIN FIX)
  const safeType = resource?.type?.toLowerCase?.() || "blog";

  const config =
    typeConfig[safeType] ||
    {
      icon: <FileText className="h-3.5 w-3.5" />,
      label: "Article",
      className: "bg-gray-100 text-gray-700 border-gray-200",
    };

  const handleSaved = () => {
    setIsSaved(true);
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
      
      {/* Hover gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.02] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      {/* HEADER */}
      <div className="mb-3 flex items-start justify-between gap-3">
        
        {/* TYPE BADGE */}
        <div
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.className}`}
        >
          {config.icon}
          {config.label}
        </div>

        {/* SAVE BUTTON */}
        <SaveToVaultDialog resource={resource} onSaved={handleSaved}>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            {isSaved ? (
              <BookmarkCheck className="h-4 w-4 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
        </SaveToVaultDialog>
      </div>

      {/* TITLE */}
      <h3 className="mb-2 line-clamp-2 font-semibold leading-snug transition-colors group-hover:text-primary">
        {resource?.title || "No Title"}
      </h3>

      {/* DESCRIPTION */}
      <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
        {resource?.description || "No description available"}
      </p>

      {/* FOOTER */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {resource?.source || "Unknown"}
        </span>

        <a
          href={resource?.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
        >
          Visit
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
};

export default ResourceCard;