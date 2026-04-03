import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bold,
  Heading1,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  NotebookPen,
  Quote,
  Redo2,
  Save,
  Trash2,
  Underline,
  Undo2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { vaultApi } from "@/lib/api";

const extractPlainText = (value) => {
  if (!value) return "";
  if (!/<[^>]+>/.test(value)) return value;

  const parser = document.createElement("div");
  parser.innerHTML = value;
  return parser.textContent || parser.innerText || "";
};

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const normalizeContentForEditor = (value) => {
  if (!value) return "<p><br></p>";
  if (/<[^>]+>/.test(value)) return value;

  return value
    .split("\n")
    .map((line) => (line.trim() ? `<p>${escapeHtml(line)}</p>` : "<p><br></p>"))
    .join("");
};

const normalizeInlineFormatting = (html) => {
  if (!html || typeof document === "undefined") return html;

  const root = document.createElement("div");
  root.innerHTML = html;

  const wrapChildren = (element, tagName) => {
    const wrapper = document.createElement(tagName);
    while (element.firstChild) {
      wrapper.appendChild(element.firstChild);
    }
    element.appendChild(wrapper);
  };

  root.querySelectorAll("b").forEach((boldNode) => {
    const strongNode = document.createElement("strong");
    while (boldNode.firstChild) {
      strongNode.appendChild(boldNode.firstChild);
    }
    boldNode.replaceWith(strongNode);
  });

  root.querySelectorAll("i").forEach((italicNode) => {
    const emNode = document.createElement("em");
    while (italicNode.firstChild) {
      emNode.appendChild(italicNode.firstChild);
    }
    italicNode.replaceWith(emNode);
  });

  root.querySelectorAll("span[style]").forEach((span) => {
    const style = (span.getAttribute("style") || "").toLowerCase();
    const hasBold = /font-weight\s*:\s*(bold|[6-9]00)/.test(style);
    const hasItalic = /font-style\s*:\s*italic/.test(style);
    const hasUnderline =
      /text-decoration[^;]*underline/.test(style) ||
      /text-decoration-line\s*:\s*underline/.test(style);

    if (hasBold) wrapChildren(span, "strong");
    if (hasItalic) wrapChildren(span, "em");
    if (hasUnderline) wrapChildren(span, "u");

    span.removeAttribute("style");

    if (!span.attributes.length) {
      span.replaceWith(...span.childNodes);
    }
  });

  return root.innerHTML;
};

const placeCaretAtEnd = (element) => {
  const selection = window.getSelection();
  if (!selection || !element) return;

  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
};

const getCommandState = (command) => {
  try {
    return document.queryCommandState(command);
  } catch {
    return false;
  }
};

const getCommandEnabled = (command) => {
  try {
    return document.queryCommandEnabled(command);
  } catch {
    return true;
  }
};

const getCommandValue = (command) => {
  try {
    return String(document.queryCommandValue(command) || "").toLowerCase();
  } catch {
    return "";
  }
};

const INLINE_COMMAND_TAGS = {
  bold: new Set(["b", "strong"]),
  italic: new Set(["i", "em"]),
  underline: new Set(["u"]),
};
const INLINE_COMMANDS = ["bold", "italic", "underline"];

const getInlineCommandStates = () =>
  INLINE_COMMANDS.reduce((accumulator, inlineCommand) => {
    accumulator[inlineCommand] = getCommandState(inlineCommand);
    return accumulator;
  }, {});

const ensureInlineCommandStates = (desiredStates) => {
  INLINE_COMMANDS.forEach((inlineCommand) => {
    const desired = !!desiredStates?.[inlineCommand];
    const current = getCommandState(inlineCommand);

    if (current !== desired) {
      document.execCommand(inlineCommand, false, null);
    }
  });
};

const hasInlineFormattingStyle = (element, command) => {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;

  const style = (element.getAttribute("style") || "").toLowerCase();
  if (!style) return false;

  if (command === "underline") {
    return (
      /text-decoration[^;]*underline/.test(style) ||
      /text-decoration-line\s*:\s*underline/.test(style)
    );
  }

  if (command === "italic") {
    return /font-style\s*:\s*italic/.test(style);
  }

  if (command === "bold") {
    return /font-weight\s*:\s*(bold|[6-9]00)/.test(style);
  }

  return false;
};

const isFormattingAncestorForCommand = (element, command) => {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;

  const tagName = element.tagName.toLowerCase();
  if (INLINE_COMMAND_TAGS[command]?.has(tagName)) {
    return true;
  }

  return hasInlineFormattingStyle(element, command);
};

const ToolbarButton = ({
  icon: Icon,
  label,
  onClick,
  active = false,
  disabled = false,
}) => (
  <Button
    type="button"
    variant="outline"
    size="sm"
    className={`h-8 px-2 ${
      active
        ? "border-primary/60 bg-primary/15 text-primary hover:bg-primary/20"
        : ""
    }`}
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
    title={label}
    aria-pressed={active}
    disabled={disabled}
  >
    <Icon className="h-4 w-4" />
    <span className="sr-only">{label}</span>
  </Button>
);

const SimpleNotepad = ({
  vaultId,
  folderName,
  note,
  onClose,
  onNoteSaved,
  onNoteDeleted,
}) => {
  const [title, setTitle] = useState(note?.title || "Untitled Note");
  const [editorHtml, setEditorHtml] = useState(
    normalizeContentForEditor(note?.content || ""),
  );
  const [images, setImages] = useState(note?.images || []);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(
    note?.updatedAt || note?.createdAt || null,
  );
  const [toolbarState, setToolbarState] = useState({
    canUndo: false,
    canRedo: false,
    bold: false,
    italic: false,
    underline: false,
    heading: false,
    bulletList: false,
    orderedList: false,
    quote: false,
  });
  const editorRef = useRef(null);
  const selectionRangeRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    const normalizedContent = normalizeContentForEditor(note?.content || "");
    setTitle(note?.title || "Untitled Note");
    setEditorHtml(normalizedContent);
    setImages(note?.images || []);
    setHasUnsavedChanges(false);
    setLastSavedAt(note?.updatedAt || note?.createdAt || null);

    if (editorRef.current) {
      editorRef.current.innerHTML = normalizedContent;
      placeCaretAtEnd(editorRef.current);
    }
  }, [note]);

  const refreshToolbarState = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) {
      setToolbarState({
        canUndo: false,
        canRedo: false,
        bold: false,
        italic: false,
        underline: false,
        heading: false,
        bulletList: false,
        orderedList: false,
        quote: false,
      });
      return;
    }

    const range = selection.getRangeAt(0);
    const isInsideEditor = editor.contains(range.commonAncestorContainer);
    const blockType = getCommandValue("formatBlock");

    setToolbarState({
      canUndo: isInsideEditor ? getCommandEnabled("undo") : false,
      canRedo: isInsideEditor ? getCommandEnabled("redo") : false,
      bold: isInsideEditor ? getCommandState("bold") : false,
      italic: isInsideEditor ? getCommandState("italic") : false,
      underline: isInsideEditor ? getCommandState("underline") : false,
      heading: isInsideEditor
        ? blockType.includes("h1") || blockType.includes("h2")
        : false,
      bulletList: isInsideEditor ? getCommandState("insertUnorderedList") : false,
      orderedList: isInsideEditor ? getCommandState("insertOrderedList") : false,
      quote: isInsideEditor ? blockType.includes("blockquote") : false,
    });
  }, []);

  const captureSelection = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) {
      refreshToolbarState();
      return;
    }

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) {
      refreshToolbarState();
      return;
    }

    selectionRangeRef.current = range.cloneRange();
    refreshToolbarState();
  }, [refreshToolbarState]);

  const restoreSelection = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection) return;

    editor.focus();

    if (
      selectionRangeRef.current &&
      editor.contains(selectionRangeRef.current.commonAncestorContainer)
    ) {
      selection.removeAllRanges();
      selection.addRange(selectionRangeRef.current);
      return;
    }

    placeCaretAtEnd(editor);
    captureSelection();
  }, [captureSelection]);

  const handleSave = useCallback(async (showToast = true) => {
    if (!vaultId || !note?._id || saving) return;

    try {
      setSaving(true);
      const normalizedBeforeSave = normalizeInlineFormatting(editorHtml);
      const updatedNote = await vaultApi.updateNote(vaultId, note._id, {
        title: title.trim() || "Untitled Note",
        content: normalizedBeforeSave,
      });

      const normalized = normalizeContentForEditor(
        updatedNote.content || normalizedBeforeSave,
      );

      setEditorHtml((prev) => (prev === normalized ? prev : normalized));
      if (editorRef.current && editorRef.current.innerHTML !== normalized) {
        editorRef.current.innerHTML = normalized;
        placeCaretAtEnd(editorRef.current);
      }

      setImages(updatedNote.images || images);
      setHasUnsavedChanges(false);
      setLastSavedAt(updatedNote.updatedAt || new Date().toISOString());
      refreshToolbarState();
      onNoteSaved(updatedNote);
      if (showToast) {
        toast.success("Note saved");
      }
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note");
    } finally {
      setSaving(false);
    }
  }, [
    vaultId,
    note?._id,
    saving,
    title,
    editorHtml,
    onNoteSaved,
    images,
    refreshToolbarState,
  ]);

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm(
        "You have unsaved changes. Close this note?",
      );
      if (!confirmClose) return;
    }

    onClose();
  }, [hasUnsavedChanges, onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      const isMetaOrCtrl = event.metaKey || event.ctrlKey;

      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }

      if (isMetaOrCtrl && event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleSave();
      }

      if (isMetaOrCtrl && event.key.toLowerCase() === "z") {
        const editor = editorRef.current;
        const selection = window.getSelection();
        const isInsideEditor =
          !!editor &&
          ((document.activeElement === editor && editor.isContentEditable) ||
            (selection &&
              selection.rangeCount > 0 &&
              editor.contains(selection.getRangeAt(0).commonAncestorContainer)));

        if (!isInsideEditor) return;

        event.preventDefault();
        if (event.shiftKey) {
          applyEditorCommand("redo");
        } else {
          applyEditorCommand("undo");
        }
      }

      if (isMetaOrCtrl && event.key.toLowerCase() === "y") {
        const editor = editorRef.current;
        const selection = window.getSelection();
        const isInsideEditor =
          !!editor &&
          ((document.activeElement === editor && editor.isContentEditable) ||
            (selection &&
              selection.rangeCount > 0 &&
              editor.contains(selection.getRangeAt(0).commonAncestorContainer)));

        if (!isInsideEditor) return;

        event.preventDefault();
        applyEditorCommand("redo");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose, handleSave]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const autosaveTimer = setTimeout(() => {
      handleSave(false);
    }, 1200);

    return () => clearTimeout(autosaveTimer);
  }, [title, editorHtml, hasUnsavedChanges, handleSave]);

  const syncEditorState = useCallback(() => {
    if (!editorRef.current) return;
    setEditorHtml(editorRef.current.innerHTML);
    setHasUnsavedChanges(true);
    refreshToolbarState();
  }, [refreshToolbarState]);

  const applyEditorCommand = useCallback(
    (command, value = null) => {
      if (!editorRef.current) return;

      const isInlineCommand = INLINE_COMMANDS.includes(command);
      const selectionBefore = window.getSelection();
      const fallbackRange = selectionRangeRef.current;
      const rangeBefore = selectionBefore?.rangeCount
        ? selectionBefore.getRangeAt(0)
        : fallbackRange;
      const wasCollapsedSelection = !!rangeBefore?.collapsed;
      const inlineStatesBefore =
        isInlineCommand && wasCollapsedSelection ? getInlineCommandStates() : null;

      restoreSelection();
      document.execCommand("styleWithCSS", false, false);

      if (isInlineCommand && wasCollapsedSelection) {
        const desiredInlineStates = {
          ...(inlineStatesBefore || {}),
          [command]: !(inlineStatesBefore?.[command] || false),
        };

        const editor = editorRef.current;
        const selection = window.getSelection();

        if (editor && selection && selection.rangeCount > 0 && !desiredInlineStates[command]) {
          const range = selection.getRangeAt(0);
          if (range.collapsed) {
            let currentNode =
              range.startContainer.nodeType === Node.TEXT_NODE
                ? range.startContainer.parentElement
                : range.startContainer;

            while (currentNode && currentNode !== editor) {
              if (
                currentNode.nodeType === Node.ELEMENT_NODE &&
                isFormattingAncestorForCommand(currentNode, command)
              ) {
                if (!currentNode.nextSibling) {
                  currentNode.parentNode?.insertBefore(
                    document.createTextNode("\u200B"),
                    currentNode.nextSibling,
                  );
                }

                const nextRange = document.createRange();
                nextRange.setStartAfter(currentNode);
                nextRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(nextRange);
                selectionRangeRef.current = nextRange.cloneRange();
                break;
              }

              currentNode = currentNode.parentElement;
            }
          }
        }

        document.execCommand("styleWithCSS", false, false);
        document.execCommand("removeFormat", false, null);
        ensureInlineCommandStates(desiredInlineStates);

        requestAnimationFrame(() => {
          syncEditorState();
          captureSelection();
          refreshToolbarState();
        });
        return;
      }

      document.execCommand(command, false, value);

      requestAnimationFrame(() => {
        syncEditorState();
        captureSelection();
        refreshToolbarState();
      });
    },
    [captureSelection, restoreSelection, syncEditorState, refreshToolbarState],
  );

  const insertImageAtCursor = useCallback(
    (imageUrl, imageName) => {
      const editor = editorRef.current;
      if (!editor) return;

      restoreSelection();

      const selection = window.getSelection();
      let range = selection?.rangeCount ? selection.getRangeAt(0) : null;

      if (!range || !editor.contains(range.commonAncestorContainer)) {
        range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
      }

      const image = document.createElement("img");
      image.src = imageUrl;
      image.alt = imageName || "Note image";
      image.className = "my-3 max-h-80 w-auto max-w-full rounded-lg border border-border";

      const spacer = document.createElement("p");
      spacer.innerHTML = "<br>";

      const fragment = document.createDocumentFragment();
      fragment.appendChild(image);
      fragment.appendChild(spacer);

      range.deleteContents();
      range.insertNode(fragment);

      const nextRange = document.createRange();
      nextRange.setStart(spacer, 0);
      nextRange.collapse(true);

      selection?.removeAllRanges();
      selection?.addRange(nextRange);
      selectionRangeRef.current = nextRange.cloneRange();

      syncEditorState();
      refreshToolbarState();
    },
    [restoreSelection, syncEditorState, refreshToolbarState],
  );

  const uploadAndInsertImage = useCallback(
    async (file, successMessage = "Image inserted") => {
      if (!file || !vaultId || !note?._id) return;

      try {
        setUploadingImage(true);

        const formData = new FormData();
        formData.append("image", file);

        const uploadedImage = await vaultApi.uploadNoteImage(
          vaultId,
          note._id,
          formData,
        );

        setImages((prev) => [...prev, uploadedImage]);
        insertImageAtCursor(
          vaultApi.getUploadUrl(uploadedImage.url),
          uploadedImage.fileName,
        );
        toast.success(successMessage);
      } catch (error) {
        console.error("Error uploading note image:", error);
        toast.error("Failed to add image");
      } finally {
        setUploadingImage(false);
      }
    },
    [vaultId, note?._id, insertImageAtCursor],
  );

  const handleUploadNoteImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await uploadAndInsertImage(file, "Image inserted in note");
    event.target.value = "";
  };

  const handleEditorPaste = async (event) => {
    const items = Array.from(event.clipboardData?.items || []);
    const imageItem = items.find((item) => item.type.startsWith("image/"));

    if (!imageItem) return;

    const imageFile = imageItem.getAsFile();
    if (!imageFile) return;

    event.preventDefault();
    await uploadAndInsertImage(imageFile, "Image pasted into note");
  };

  const handleDeleteNote = async () => {
    const confirmed = window.confirm("Are you sure you want to delete this note?");
    if (!confirmed) return;

    try {
      await onNoteDeleted(note._id);
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    }
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      captureSelection();
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [captureSelection]);

  const handleTitleChange = (event) => {
    setTitle(event.target.value);
    setHasUnsavedChanges(true);
  };

  const plainText = useMemo(() => extractPlainText(editorHtml), [editorHtml]);
  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;

  const saveStatusText = useMemo(() => {
    if (saving) return "Saving...";
    if (hasUnsavedChanges) return "Unsaved changes";
    if (!lastSavedAt) return "All changes saved";

    return `Saved at ${new Date(lastSavedAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }, [saving, hasUnsavedChanges, lastSavedAt]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-md transition-all duration-300">
      <div className="mx-4 my-4 flex h-[calc(100vh-2rem)] w-full max-w-[1400px] flex-col overflow-hidden rounded-[2.5rem] border border-border/40 bg-gradient-to-b from-background to-background/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] ring-1 ring-black/5 dark:bg-zinc-950/90 dark:ring-white/10 relative">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary/20 to-accent/20 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <div className="z-10 border-b border-border/20 bg-card/60 backdrop-blur-2xl">
          <div className="container mx-auto flex w-full max-w-7xl items-center gap-4 px-6 py-4">
            <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full hover:bg-muted/50 transition-colors h-10 w-10 shrink-0">
              <X className="h-5 w-5" />
            </Button>

            <div className="min-w-0 flex-1 pl-2">
              <div className="mb-0.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary/70">
                <NotebookPen className="h-3.5 w-3.5" />
                <span>My Study Vault</span>
                {folderName ? <span>• {folderName}</span> : null}
              </div>

              <Input
                value={title}
                onChange={handleTitleChange}
                placeholder="Untitled Note..."
                className="h-12 border-0 bg-transparent px-0 text-xl md:text-3xl font-extrabold tracking-tight shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/30 text-foreground transition-all"
              />
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={handleUploadNoteImage}
            />

            <Button
              variant="outline"
              size="default"
              className="rounded-xl border-border/50 bg-background/50 backdrop-blur-sm font-medium hover:bg-muted"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => imageInputRef.current?.click()}
              disabled={uploadingImage}
            >
              <ImagePlus className="mr-1 h-4 w-4" />
              {uploadingImage ? "Uploading..." : "Add Image"}
            </Button>

            <Button variant="ghost" size="default" className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0" onClick={handleDeleteNote}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>

            <Button size="default" onClick={handleSave} disabled={saving} className="rounded-xl font-semibold shadow-md shrink-0">
              <Save className="mr-1 h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        <div className="border-b border-border bg-card/50 px-4 py-2">
          <div className="container mx-auto flex w-full max-w-7xl flex-wrap items-center gap-2">
            <ToolbarButton
              icon={Undo2}
              label="Undo"
              onClick={() => applyEditorCommand("undo")}
              disabled={!toolbarState.canUndo}
            />
            <ToolbarButton
              icon={Redo2}
              label="Redo"
              onClick={() => applyEditorCommand("redo")}
              disabled={!toolbarState.canRedo}
            />

            <div className="mx-1 h-6 w-px bg-border" />

            <ToolbarButton
              icon={Bold}
              label="Bold"
              onClick={() => applyEditorCommand("bold")}
              active={toolbarState.bold}
            />
            <ToolbarButton
              icon={Italic}
              label="Italic"
              onClick={() => applyEditorCommand("italic")}
              active={toolbarState.italic}
            />
            <ToolbarButton
              icon={Underline}
              label="Underline"
              onClick={() => applyEditorCommand("underline")}
              active={toolbarState.underline}
            />

            <div className="mx-1 h-6 w-px bg-border" />

            <ToolbarButton
              icon={Heading1}
              label="Heading"
              onClick={() => applyEditorCommand("formatBlock", "h2")}
              active={toolbarState.heading}
            />
            <ToolbarButton
              icon={List}
              label="Bulleted list"
              onClick={() => applyEditorCommand("insertUnorderedList")}
              active={toolbarState.bulletList}
            />
            <ToolbarButton
              icon={ListOrdered}
              label="Numbered list"
              onClick={() => applyEditorCommand("insertOrderedList")}
              active={toolbarState.orderedList}
            />
            <ToolbarButton
              icon={Quote}
              label="Quote"
              onClick={() => applyEditorCommand("formatBlock", "blockquote")}
              active={toolbarState.quote}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-muted/10 via-background to-muted/20">
          <div className="container mx-auto w-full max-w-5xl px-4 py-8 md:py-12">
            <div className="rounded-[2.5rem] border border-border/30 bg-card/80 p-6 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <div className="relative">
                {plainText.trim().length === 0 && (
                  <p className="pointer-events-none absolute left-0 top-0 text-lg md:text-xl text-muted-foreground/30 font-medium">
                    Start writing your masterpiece...
                  </p>
                )}

                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={() => {
                    syncEditorState();
                    captureSelection();
                  }}
                  onPaste={handleEditorPaste}
                  onKeyUp={captureSelection}
                  onMouseUp={captureSelection}
                  onBlur={captureSelection}
                  onFocus={captureSelection}
                  className="min-h-[60vh] text-lg text-foreground/90 leading-[1.8] outline-none focus:outline-none [&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-muted-foreground/90 [&_blockquote]:bg-primary/[0.02] [&_blockquote]:py-2 [&_blockquote]:pr-4 [&_blockquote]:rounded-r-xl [&_h1]:my-8 [&_h1]:text-4xl [&_h1]:md:text-5xl [&_h1]:font-extrabold [&_h1]:tracking-tight [&_h2]:my-6 [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:font-bold [&_h2]:tracking-tight [&_img]:my-8 [&_img]:max-h-[32rem] [&_img]:w-auto [&_img]:max-w-full [&_img]:rounded-[1.5rem] [&_img]:border [&_img]:border-border/30 [&_img]:shadow-xl [&_img]:transition-transform [&_img]:hover:scale-[1.01] [&_img]:duration-500 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-8 [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-8 [&_p]:my-4"
                />
              </div>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Tip: paste image directly in editor with Ctrl/Cmd + V.
            </p>
          </div>
        </div>

        <div className="z-10 border-t border-border/20 bg-card/60 backdrop-blur-2xl">
          <div className="container mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3 text-xs font-medium text-muted-foreground/80 tracking-wide uppercase">
            <span>
              {wordCount} words • {plainText.length} characters • {images.length} image(s)
            </span>
            <span className="flex items-center gap-2">
              {saving ? <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> : null}
              {saveStatusText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleNotepad;