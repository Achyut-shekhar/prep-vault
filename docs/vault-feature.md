# Vault Feature Implementation Guide 🗄️

## Overview

The Vault feature is a complete full-stack implementation that allows users to organize and store placement preparation resources. It supports creating folders (vaults), saving web links, uploading files, and bookmarking search results.

---

## Architecture

### Tech Stack

- **Backend:** Node.js + Express + MongoDB + Multer
- **Frontend:** React + Shadcn/UI + Tanstack Query
- **Database:** MongoDB Atlas (NoSQL)
- **File Storage:** Local filesystem (uploads directory)

### Data Flow

```
User Action → Frontend Component → API Request → Express Route →
Mongoose Model → MongoDB → Response → Frontend Update
```

---

## Backend Implementation

### 1. Database Models

#### Vault Model (`backend/models/Vault.js`)

```javascript
{
  name: String (required),
  isPublic: Boolean (default: false),
  userId: String (required),
  description: String,
  resourceCount: Number (default: 0),
  timestamps: true
}
```

**Purpose:** Stores folder/vault metadata
**Key Features:**

- Public/Private toggle
- Auto-timestamps (createdAt, updatedAt)
- Resource count for quick display

#### Resource Model (`backend/models/Resource.js`)

```javascript
{
  vaultId: ObjectId (ref: 'Vault', required),
  title: String (required),
  type: Enum ['link', 'pdf', 'file'],
  url: String,
  fileName: String,
  filePath: String,
  fileSize: Number,
  mimeType: String,
  description: String,
  tags: [String],
  timestamps: true
}
```

**Purpose:** Stores individual resources (links or files)
**Key Features:**

- Polymorphic storage (links and files)
- File metadata tracking
- Tagging support

### 2. API Routes (`backend/routes/vault.js`)

#### Vault Management

- **GET `/api/vault`** - Fetch all vaults for a user
- **POST `/api/vault`** - Create new vault
- **PUT `/api/vault/:id`** - Update vault details
- **DELETE `/api/vault/:id`** - Delete vault and all its resources

#### Resource Management

- **GET `/api/vault/:vaultId/resources`** - Get all resources in a vault
- **POST `/api/vault/:vaultId/resources/link`** - Add a web link
- **POST `/api/vault/:vaultId/resources/file`** - Upload a file
- **DELETE `/api/vault/:vaultId/resources/:resourceId`** - Delete resource
- **GET `/api/vault/resources/:resourceId/download`** - Download file

### 3. File Upload Configuration

**Multer Setup:**

```javascript
const storage = multer.diskStorage({
  destination: 'backend/uploads/',
  filename: timestamp + '-' + random + extension
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG, ZIP only
});
```

**Accepted File Types:**

- Documents: `.pdf`, `.doc`, `.docx`, `.txt`
- Images: `.png`, `.jpg`, `.jpeg`
- Archives: `.zip`

**File Naming:**

- Format: `{timestamp}-{random}.{extension}`
- Example: `1707494400000-123456789.pdf`

### 4. Database Connection (`backend/config/db.js`)

```javascript
const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected successfully");
};
```

**Environment Variables (.env):**

```
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
```

---

## Frontend Implementation

### 1. Core Components

#### VaultSidebar (`frontend/src/components/VaultSidebar.jsx`)

**Purpose:** Main vault interface with folder list and resource display

**Features:**

- Lists all user vaults with resource count
- Shows public/private status (Globe/Lock icons)
- Displays resources when folder is selected
- Real-time updates via API calls

**State Management:**

```javascript
const [folders, setFolders] = useState([]);
const [selectedFolder, setSelectedFolder] = useState(null);
const [resources, setResources] = useState([]);
```

**Key Functions:**

- `fetchVaults()` - Load user's vaults
- `fetchResources(vaultId)` - Load resources for selected vault
- `handleDeleteResource(resourceId)` - Remove resource
- `handleOpenResource(resource)` - Open link or download file

#### NewFolderDialog (`frontend/src/components/NewFolderDialog.jsx`)

**Purpose:** Dialog for creating new vaults

**Features:**

- Name input with validation
- Public/Private toggle switch
- Creates vault via API

#### AddResourceDialog (`frontend/src/components/AddResourceDialog.jsx`)

**Purpose:** Multi-tab dialog for adding resources to vaults

**Tabs:**

1. **Link Tab**
   - Title input
   - URL input (with validation)
   - Description textarea
   - Submits to `/api/vault/:vaultId/resources/link`

2. **File Upload Tab**
   - File input with type restrictions
   - Optional title override
   - Description textarea
   - Shows file size preview
   - Uploads to `/api/vault/:vaultId/resources/file`

**Implementation:**

```javascript
// Link submission
const handleAddLink = async (e) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(linkData),
  });
};

// File upload
const handleFileUpload = async (e) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  formData.append("description", description);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });
};
```

#### SaveToVaultDialog (`frontend/src/components/SaveToVaultDialog.jsx`)

**Purpose:** Bookmark dialog for saving search results to vaults

**Features:**

- Fetches user's vaults on open
- Displays vault list with resource counts
- One-click save to selected folder
- Shows loading states
- Navigates to Vault page if no folders exist

**Integration:**

```javascript
<SaveToVaultDialog resource={resource} onSaved={handleSaved}>
  <Button>Bookmark Icon</Button>
</SaveToVaultDialog>
```

**Saved Resource Format:**

```javascript
{
  title: resource.title,
  url: resource.url,
  description: resource.description,
  tags: [resource.type] // e.g., 'blog', 'video', 'github'
}
```

#### ResourceCard (`frontend/src/components/ResourceCard.jsx`)

**Purpose:** Display search results with bookmark functionality

**Features:**

- Shows resource type badge (Article, Video, GitHub, PDF)
- Bookmark button with SaveToVaultDialog
- Visual feedback (BookmarkCheck icon when saved)
- External link to resource

---

## API Request/Response Examples

### Create Vault

```javascript
// Request
POST /api/vault
{
  "name": "Amazon SDE Prep",
  "isPublic": false,
  "description": "Resources for Amazon interviews"
}

// Response
{
  "_id": "65abc123...",
  "name": "Amazon SDE Prep",
  "isPublic": false,
  "userId": "default-user",
  "description": "Resources for Amazon interviews",
  "resourceCount": 0,
  "createdAt": "2026-02-09T10:30:00.000Z",
  "updatedAt": "2026-02-09T10:30:00.000Z"
}
```

### Add Link Resource

```javascript
// Request
POST /api/vault/65abc123.../resources/link
{
  "title": "Amazon Interview Experience",
  "url": "https://leetcode.com/discuss/interview-question/...",
  "description": "SDE-1 interview at Amazon Bangalore",
  "tags": ["interview", "amazon"]
}

// Response
{
  "_id": "65def456...",
  "vaultId": "65abc123...",
  "title": "Amazon Interview Experience",
  "type": "link",
  "url": "https://leetcode.com/...",
  "description": "SDE-1 interview at Amazon Bangalore",
  "tags": ["interview", "amazon"],
  "createdAt": "2026-02-09T10:35:00.000Z"
}
```

### Upload File

```javascript
// Request
POST /api/vault/65abc123.../resources/file
Content-Type: multipart/form-data

file: [Binary PDF Data]
title: "DSA Cheat Sheet"
description: "Quick reference for algorithms"

// Response
{
  "_id": "65ghi789...",
  "vaultId": "65abc123...",
  "title": "DSA Cheat Sheet",
  "type": "pdf",
  "fileName": "DSA-Cheat-Sheet.pdf",
  "filePath": "/uploads/1707494400000-123456789.pdf",
  "fileSize": 2457600,
  "mimeType": "application/pdf",
  "description": "Quick reference for algorithms",
  "createdAt": "2026-02-09T10:40:00.000Z"
}
```

---

## User Workflows

### Workflow 1: Create Vault and Add Resources

1. Navigate to `/vault` page
2. Click "New Folder" button
3. Enter folder name (e.g., "Google Interview Prep")
4. Toggle Public/Private
5. Click "Create Folder"
6. Select the new folder from sidebar
7. Click "Add Resource" button
8. Choose tab:
   - **Link:** Enter title, URL, description → Submit
   - **File:** Choose file, add details → Upload
9. Resource appears in folder with delete/open actions

### Workflow 2: Bookmark from Search

1. Search for a topic (e.g., "Amazon SDE")
2. Browse search results
3. Click bookmark icon on desired result
4. Dialog opens showing all vaults
5. Click on target vault folder
6. Toast confirms save
7. Bookmark icon changes to BookmarkCheck
8. Navigate to Vault page to see saved resource

### Workflow 3: Download File

1. Open vault folder with file resources
2. Click "Download" button on file resource
3. Browser initiates download
4. File downloaded with original filename

---

## Error Handling

### Backend

- **404 Errors:** Vault or resource not found
- **400 Errors:** Invalid input, file type not allowed
- **500 Errors:** Database or file system errors

### Frontend

- **Toast Notifications:** Success/error messages
- **Loading States:** Spinners during API calls
- **Empty States:** Messages when no folders or resources exist
- **Validation:** Form validation before submission

---

## Security Considerations

### Current Implementation

- CORS enabled for localhost development
- File size limits (10MB max)
- File type restrictions (whitelist only)
- Express built-in JSON size limits

### Recommended Enhancements

- [ ] User authentication & authorization
- [ ] JWT token-based API security
- [ ] File virus scanning
- [ ] Rate limiting for uploads
- [ ] Encrypted file storage
- [ ] CDN for file serving
- [ ] Cloud storage (AWS S3, Cloudinary)

---

## Database Indexes

**Recommended indexes for performance:**

```javascript
// Vault collection
db.vaults.createIndex({ userId: 1, createdAt: -1 });

// Resource collection
db.resources.createIndex({ vaultId: 1, createdAt: -1 });
db.resources.createIndex({ type: 1 });
```

---

## File Storage Strategy

### Current: Local Filesystem

```
backend/
└── uploads/
    ├── 1707494400000-123456789.pdf
    ├── 1707494500000-987654321.png
    └── ...
```

**Pros:**

- Simple implementation
- No external dependencies
- Fast local access

**Cons:**

- Not scalable
- No redundancy
- Server disk space limited
- Lost on server restart (if not persistent)

### Future: Cloud Storage (Recommended)

- **AWS S3:** Scalable, secure, CDN-ready
- **Cloudinary:** Image/video optimization
- **Google Cloud Storage:** Similar to S3
- **Azure Blob Storage:** Microsoft ecosystem

---

## Testing Checklist

### Backend API Tests

- [ ] Create vault
- [ ] Get all vaults
- [ ] Update vault
- [ ] Delete vault
- [ ] Add link resource
- [ ] Upload file (valid types)
- [ ] Reject invalid file types
- [ ] Download file
- [ ] Delete resource
- [ ] Handle large files (>10MB rejection)

### Frontend UI Tests

- [ ] Display vault list
- [ ] Create new vault
- [ ] Select vault and view resources
- [ ] Add link via dialog
- [ ] Upload file via dialog
- [ ] Bookmark from search results
- [ ] Delete resource
- [ ] Open link in new tab
- [ ] Download file
- [ ] Handle empty states
- [ ] Show loading states
- [ ] Display error toasts

---

## Performance Optimization

### Backend

- Implement pagination for large resource lists
- Add caching layer (Redis)
- Optimize MongoDB queries with proper indexes
- Compress file uploads
- Use streaming for large file downloads

### Frontend

- Lazy load resource images
- Implement virtual scrolling for long lists
- Debounce search inputs
- Cache vault list in React Query
- Optimize re-renders with React.memo

---

## Future Enhancements

### Planned Features

1. **Sharing:** Generate public links for vaults
2. **Collaboration:** Allow multiple users per vault
3. **Search:** Full-text search within resources
4. **Tags:** Advanced tagging and filtering
5. **Export:** Download entire vault as ZIP
6. **Import:** Bulk import from JSON/CSV
7. **Analytics:** Track most accessed resources
8. **Recommendations:** Suggest related resources
9. **Mobile App:** React Native implementation
10. **Offline Mode:** PWA with service workers

---

## Deployment Considerations

### Backend

- Set `NODE_ENV=production`
- Configure MongoDB connection pooling
- Set up file upload limits on reverse proxy (Nginx)
- Enable HTTPS
- Configure CORS for production domain
- Set up monitoring (PM2, New Relic)

### Frontend

- Build with `npm run build`
- Serve static files via CDN
- Configure API endpoint via environment variables
- Enable service worker for PWA
- Set up error tracking (Sentry)

### Database

- Enable MongoDB Atlas backups
- Set up read replicas for scaling
- Configure authentication and network access
- Monitor query performance

---

## Troubleshooting

### Common Issues

**Issue:** Files not uploading

- Check `uploads/` directory exists
- Verify file size < 10MB
- Confirm file type is allowed
- Check disk space on server

**Issue:** MongoDB connection fails

- Verify MONGODB_URI in .env
- Check network access in MongoDB Atlas
- Confirm database user credentials
- Test connection with MongoDB Compass

**Issue:** Resources not displaying

- Check browser console for errors
- Verify API endpoint is running
- Test API with Postman/Thunder Client
- Check CORS configuration

**Issue:** Slow file downloads

- Implement streaming for large files
- Consider CDN for static files
- Check server bandwidth
- Optimize file sizes (compression)

---

## Resources & References

- [MongoDB Mongoose Docs](https://mongoosejs.com/)
- [Multer Documentation](https://github.com/expressjs/multer)
- [Express.js Guide](https://expressjs.com/)
- [React Query Docs](https://tanstack.com/query/latest)
- [Shadcn/UI Components](https://ui.shadcn.com/)

---

**Last Updated:** February 9, 2026
**Version:** 1.0.0
