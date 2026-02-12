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
    const { name, isPublic, description } = req.body;
    const vault = await Vault.findByIdAndUpdate(
      req.params.id,
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
    const vault = await Vault.findByIdAndDelete(req.params.id);

    if (!vault) {
      return res.status(404).json({ error: "Vault not found" });
    }

    // Delete all resources in the vault
    await Resource.deleteMany({ vaultId: req.params.id });

    res.json({ message: "Vault deleted successfully" });
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
