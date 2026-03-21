const express = require("express");
const router = express.Router();
const Vault = require("../models/Vault");
const Resource = require("../models/Resource");
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt|png|jpg|jpeg|zip/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          "Only PDF, DOC, DOCX, TXT, PNG, JPG, JPEG, and ZIP files are allowed",
        ),
      );
    }
  },
});

const noteImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `note-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const uploadNoteImage = multer({
  storage: noteImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for note images
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      return cb(null, true);
    }

    cb(new Error("Only JPG, PNG, and WEBP images are allowed"));
  },
});

// Get all vaults for a user
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const vaults = await Vault.find({ userId }).sort({ createdAt: -1 });
    res.json(vaults);
  } catch (error) {
    console.error("Error fetching vaults:", error);
    res.status(500).json({ error: "Failed to fetch vaults" });
  }
});

// Create a new vault
router.post("/", auth, async (req, res) => {
  try {
    const { name, isPublic, description } = req.body;
    const userId = req.user.userId;

    const vault = new Vault({
      name,
      isPublic,
      description,
      userId,
    });

    await vault.save();
    res.status(201).json(vault);
  } catch (error) {
    console.error("Error creating vault:", error);
    res.status(500).json({ error: "Failed to create vault" });
  }
});

// Update a vault
router.put("/:id", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, isPublic, description } = req.body;
    const vault = await Vault.findOneAndUpdate(
      { _id: req.params.id, userId },
      { name, isPublic, description },
      { new: true },
    );

    if (!vault) {
      return res.status(404).json({ error: "Vault not found" });
    }

    res.json(vault);
  } catch (error) {
    console.error("Error updating vault:", error);
    res.status(500).json({ error: "Failed to update vault" });
  }
});

// Delete a vault
router.delete("/:id", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const vault = await Vault.findOneAndDelete({ _id: req.params.id, userId });

    if (!vault) {
      return res.status(404).json({ error: "Vault not found" });
    }

    const resources = await Resource.find({ vaultId: req.params.id });

    for (const resource of resources) {
      if (resource.filePath && fs.existsSync(resource.filePath)) {
        fs.unlinkSync(resource.filePath);
      }
    }

    // Delete all resources metadata for this vault
    await Resource.deleteMany({ vaultId: req.params.id });

    res.json({
      message:
        "Folder deleted successfully with all its resources, notes, and to-do tasks",
    });
  } catch (error) {
    console.error("Error deleting vault:", error);
    res.status(500).json({ error: "Failed to delete vault" });
  }
});

// Get all resources for a vault
router.get("/:vaultId/resources", auth, async (req, res) => {
  try {
    const resources = await Resource.find({ vaultId: req.params.vaultId }).sort(
      { createdAt: -1 },
    );
    res.json(resources);
  } catch (error) {
    console.error("Error fetching resources:", error);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

// Get all notes for a vault
router.get("/:vaultId/notes", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const vault = await Vault.findOne({ _id: req.params.vaultId, userId });

    if (!vault) {
      return res.status(404).json({ error: "Vault not found" });
    }

    const sortedNotes = [...vault.notes].sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    );

    res.json(sortedNotes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// Get all todos for a vault
router.get("/:vaultId/todos", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const vault = await Vault.findOne({ _id: req.params.vaultId, userId });

    if (!vault) {
      return res.status(404).json({ error: "Vault not found" });
    }

    const sortedTodos = [...(vault.todos || [])].sort((a, b) => {
      const orderA = Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER;
      const orderB = Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    res.json(sortedTodos);
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

// Create a todo in a vault
router.post("/:vaultId/todos", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, description, priority, dueDate, repeat, important } = req.body;
    const normalizedTitle = (title || "").trim();
    const normalizedRepeat = ["none", "daily", "weekly", "monthly", "yearly"].includes(repeat)
      ? repeat
      : "none";
    const normalizedImportant = typeof important === "boolean" ? important : false;

    if (!normalizedTitle) {
      return res.status(400).json({ error: "Todo title is required" });
    }

    if (normalizedTitle.length > 200) {
      return res.status(400).json({ error: "Todo title must be at most 200 characters" });
    }

    const vault = await Vault.findOne({ _id: req.params.vaultId, userId });

    if (!vault) {
      return res.status(404).json({ error: "Vault not found" });
    }

    let parsedDueDate = null;
    if (dueDate) {
      const candidate = new Date(dueDate);
      if (Number.isNaN(candidate.getTime())) {
        return res.status(400).json({ error: "Invalid due date" });
      }
      parsedDueDate = candidate;
    }

    const nextOrder = (vault.todos || []).length
      ? Math.max(...vault.todos.map((todo) => (Number.isFinite(todo.order) ? todo.order : 0))) + 1
      : 0;

    vault.todos.push({
      title: normalizedTitle,
      description: typeof description === "string" ? description.trim() : "",
      priority: ["low", "medium", "high"].includes(priority) ? priority : "medium",
      dueDate: parsedDueDate,
      repeat: normalizedRepeat,
      important: normalizedImportant,
      completed: false,
      order: nextOrder,
    });

    await vault.save();
    const createdTodo = vault.todos[vault.todos.length - 1];

    res.status(201).json(createdTodo);
  } catch (error) {
    console.error("Error creating todo:", error);
    res.status(500).json({ error: "Failed to create todo" });
  }
});

// Reorder todos in a vault
router.patch("/:vaultId/todos/reorder", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderedTodoIds } = req.body;

    if (!Array.isArray(orderedTodoIds) || orderedTodoIds.length === 0) {
      return res.status(400).json({ error: "orderedTodoIds must be a non-empty array" });
    }

    const vault = await Vault.findOne({ _id: req.params.vaultId, userId });

    if (!vault) {
      return res.status(404).json({ error: "Vault not found" });
    }

    const existingIds = vault.todos.map((todo) => String(todo._id));
    const incomingIds = orderedTodoIds.map((id) => String(id));

    if (incomingIds.length !== existingIds.length) {
      return res.status(400).json({ error: "orderedTodoIds must include all todos" });
    }

    const existingSet = new Set(existingIds);
    const incomingSet = new Set(incomingIds);

    if (existingSet.size !== incomingSet.size) {
      return res.status(400).json({ error: "orderedTodoIds contains duplicates or invalid ids" });
    }

    for (const todoId of incomingSet) {
      if (!existingSet.has(todoId)) {
        return res.status(400).json({ error: "orderedTodoIds contains invalid todo ids" });
      }
    }

    incomingIds.forEach((todoId, index) => {
      const todo = vault.todos.id(todoId);
      if (todo) {
        todo.order = index;
      }
    });

    await vault.save();

    const sortedTodos = [...vault.todos].sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json(sortedTodos);
  } catch (error) {
    console.error("Error reordering todos:", error);
    res.status(500).json({ error: "Failed to reorder todos" });
  }
});

// Update a todo in a vault
router.put("/:vaultId/todos/:todoId", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, description, priority, completed, dueDate, repeat, important } = req.body;
    const vault = await Vault.findOne({ _id: req.params.vaultId, userId });

    if (!vault) {
      return res.status(404).json({ error: "Vault not found" });
    }

    const todo = vault.todos.id(req.params.todoId);
    if (!todo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    if (typeof title === "string") {
      const normalizedTitle = title.trim();
      if (!normalizedTitle) {
        return res.status(400).json({ error: "Todo title is required" });
      }
      if (normalizedTitle.length > 200) {
        return res.status(400).json({ error: "Todo title must be at most 200 characters" });
      }
      todo.title = normalizedTitle;
    }

    if (typeof description === "string") {
      todo.description = description.trim();
    }

    if (typeof completed === "boolean") {
      todo.completed = completed;
    }

    if (typeof priority === "string" && ["low", "medium", "high"].includes(priority)) {
      todo.priority = priority;
    }

    if (typeof repeat === "string" && ["none", "daily", "weekly", "monthly", "yearly"].includes(repeat)) {
      todo.repeat = repeat;
    }

    if (typeof important === "boolean") {
      todo.important = important;
    }

    if (dueDate === null || dueDate === "") {
      todo.dueDate = null;
    } else if (typeof dueDate === "string") {
      const candidate = new Date(dueDate);
      if (Number.isNaN(candidate.getTime())) {
        return res.status(400).json({ error: "Invalid due date" });
      }
      todo.dueDate = candidate;
    }

    todo.updatedAt = new Date();
    await vault.save();

    res.json(todo);
  } catch (error) {
    console.error("Error updating todo:", error);
    res.status(500).json({ error: "Failed to update todo" });
  }
});

// Delete a todo in a vault
router.delete("/:vaultId/todos/:todoId", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const vault = await Vault.findOne({ _id: req.params.vaultId, userId });

    if (!vault) {
      return res.status(404).json({ error: "Vault not found" });
    }

    const todo = vault.todos.id(req.params.todoId);
    if (!todo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    todo.deleteOne();

    vault.todos = vault.todos
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((item, index) => {
        item.order = index;
        return item;
      });

    await vault.save();

    res.json({ message: "Todo deleted successfully" });
  } catch (error) {
    console.error("Error deleting todo:", error);
    res.status(500).json({ error: "Failed to delete todo" });
  }
});

// Clear completed todos in a vault
router.delete("/:vaultId/todos", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const vault = await Vault.findOne({ _id: req.params.vaultId, userId });

    if (!vault) {
      return res.status(404).json({ error: "Vault not found" });
    }

    const initialCount = vault.todos.length;
    vault.todos = vault.todos.filter((todo) => !todo.completed);
    vault.todos = vault.todos.map((todo, index) => {
      todo.order = index;
      return todo;
    });
    const removedCount = initialCount - vault.todos.length;

    await vault.save();
    res.json({ message: "Completed todos cleared", removedCount });
  } catch (error) {
    console.error("Error clearing completed todos:", error);
    res.status(500).json({ error: "Failed to clear completed todos" });
  }
});

// Create a note in a vault
router.post("/:vaultId/notes", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, content, images } = req.body;
    const vault = await Vault.findOne({ _id: req.params.vaultId, userId });

    if (!vault) {
      return res.status(404).json({ error: "Vault not found" });
    }

    const noteTitle = (title || "Untitled Note").trim();

    vault.notes.push({
      title: noteTitle || "Untitled Note",
      content: content || "",
      images: Array.isArray(images) ? images : [],
    });

    await vault.save();
    const createdNote = vault.notes[vault.notes.length - 1];

    res.status(201).json(createdNote);
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ error: "Failed to create note" });
  }
});

// Update a note in a vault
router.put("/:vaultId/notes/:noteId", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, content } = req.body;
    const vault = await Vault.findOne({ _id: req.params.vaultId, userId });

    if (!vault) {
      return res.status(404).json({ error: "Vault not found" });
    }

    const note = vault.notes.id(req.params.noteId);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    note.title = (title || note.title || "Untitled Note").trim() || "Untitled Note";
    note.content = content ?? note.content;
    note.updatedAt = new Date();

    await vault.save();
    res.json(note);
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({ error: "Failed to update note" });
  }
});

// Delete a note in a vault
router.delete("/:vaultId/notes/:noteId", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const vault = await Vault.findOne({ _id: req.params.vaultId, userId });

    if (!vault) {
      return res.status(404).json({ error: "Vault not found" });
    }

    const note = vault.notes.id(req.params.noteId);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    note.deleteOne();
    await vault.save();

    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

// Upload image to a note
router.post(
  "/:vaultId/notes/:noteId/images",
  auth,
  uploadNoteImage.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      const userId = req.user.userId;
      const vault = await Vault.findOne({ _id: req.params.vaultId, userId });

      if (!vault) {
        return res.status(404).json({ error: "Vault not found" });
      }

      const note = vault.notes.id(req.params.noteId);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }

      const imageData = {
        url: `/uploads/${req.file.filename}`,
        fileName: req.file.originalname,
      };

      note.images = note.images || [];
      note.images.push(imageData);
      note.updatedAt = new Date();
      await vault.save();

      const savedImage = note.images[note.images.length - 1];
      res.status(201).json(savedImage);
    } catch (error) {
      console.error("Error uploading note image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  },
);

// Delete image from a note
router.delete("/:vaultId/notes/:noteId/images/:imageId", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const vault = await Vault.findOne({ _id: req.params.vaultId, userId });

    if (!vault) {
      return res.status(404).json({ error: "Vault not found" });
    }

    const note = vault.notes.id(req.params.noteId);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    const image = note.images.id(req.params.imageId);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    const relativePath = image.url.startsWith("/") ? image.url.slice(1) : image.url;
    const imageFilePath = path.join(__dirname, "..", relativePath);
    if (fs.existsSync(imageFilePath)) {
      fs.unlinkSync(imageFilePath);
    }

    image.deleteOne();
    note.updatedAt = new Date();
    await vault.save();

    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting note image:", error);
    res.status(500).json({ error: "Failed to delete image" });
  }
});

// Add a link resource
router.post("/:vaultId/resources/link", auth, async (req, res) => {
  try {
    const { title, url, description, tags } = req.body;

    const resource = new Resource({
      vaultId: req.params.vaultId,
      title,
      type: "link",
      url,
      description,
      tags,
    });

    await resource.save();

    // Update resource count in vault
    await Vault.findByIdAndUpdate(req.params.vaultId, {
      $inc: { resourceCount: 1 },
    });

    res.status(201).json(resource);
  } catch (error) {
    console.error("Error adding link resource:", error);
    res.status(500).json({ error: "Failed to add link resource" });
  }
});

// Upload a file resource
router.post(
  "/:vaultId/resources/file",
  auth,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { title, description, tags } = req.body;

      const resource = new Resource({
        vaultId: req.params.vaultId,
        title: title || req.file.originalname,
        type: req.file.mimetype === "application/pdf" ? "pdf" : "file",
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        description,
        tags: tags ? JSON.parse(tags) : [],
      });

      await resource.save();

      // Update resource count in vault
      await Vault.findByIdAndUpdate(req.params.vaultId, {
        $inc: { resourceCount: 1 },
      });

      res.status(201).json(resource);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  },
);

// Delete a resource
router.delete("/:vaultId/resources/:resourceId", auth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resourceId);

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    // Delete file if it exists
    if (resource.filePath && fs.existsSync(resource.filePath)) {
      fs.unlinkSync(resource.filePath);
    }

    await Resource.findByIdAndDelete(req.params.resourceId);

    // Update resource count in vault
    await Vault.findByIdAndUpdate(req.params.vaultId, {
      $inc: { resourceCount: -1 },
    });

    res.json({ message: "Resource deleted successfully" });
  } catch (error) {
    console.error("Error deleting resource:", error);
    res.status(500).json({ error: "Failed to delete resource" });
  }
});

// Download a file
router.get("/resources/:resourceId/download", auth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resourceId);

    if (!resource || !resource.filePath) {
      return res.status(404).json({ error: "File not found" });
    }

    if (!fs.existsSync(resource.filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    res.download(resource.filePath, resource.fileName);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({ error: "Failed to download file" });
  }
});

module.exports = router;
