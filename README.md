# PrepVault 🚀

**A Full-Stack Placement Preparation Platform**

PrepVault aggregates interview resources from across the internet using search APIs and allows users to save, organize, and share placement materials through private and public study vaults with MongoDB persistence.

---

## 🎯 Problem Statement

Placement preparation content is scattered across hundreds of websites — blogs, PDFs, YouTube, GitHub repos, interview experiences, and cheat sheets.

**Students waste time:**

- Searching repeatedly for the same topics.
- Losing track of good resources.
- Struggling to organize company-specific preparation materials.
- Finding it difficult to share curated material with peers.

## ✅ Solution Overview

**PrepVault solves this by:**

1.  **Aggregating** placement resources from trusted public sources in one place.
2.  **Organizing** resources into folders (company-wise / exam-wise) with MongoDB storage.
3.  **Enabling** private & shareable study vaults with file upload support.
4.  **Facilitating** bookmark-to-vault functionality from search results.
5.  **Supporting** local file uploads (PDFs, documents, images) to vaults.

---

## 🏗️ Core Features

### 1️⃣ Smart Search & Resource Aggregation

- **Powered by:** Custom Search API integration.
- **Functionality:** Users search for topics like "Amazon SDE", "HackWithInfy", "GATE CSE".
- **Result:** A unified page showing Blogs, Interview Experiences, GitHub Repos, and Video Links.
- **Bookmark:** Save any search result directly to your vault folders.

### 2️⃣ Personal Study Vault (MongoDB-Powered)

- **Folder-Based Organization:** Create folders like `📂 Amazon SDE`, `📂 DSA Revision`.
- **Private/Public Toggle:** Each folder can be marked as private or public.
- **Resource Types:**
  - Save web links with title, URL, and description
  - Upload files (PDF, DOC, DOCX, TXT, images, ZIP) up to 10MB
  - Organize with tags and categories
- **Cloud Storage:** All data persisted in MongoDB Atlas.
- **File Management:** Download, view, and delete resources.

### 3️⃣ Bookmark-to-Vault Integration

- **One-Click Save:** Click bookmark icon on any search result.
- **Folder Selection:** Choose which vault folder to save the resource.
- **Visual Feedback:** Bookmark icon updates to show saved status.
- **Auto-tagging:** Resources tagged with their type (blog, video, github).

### 4️⃣ Community Feed (Planned)

- A placement-focused microblog (Twitter/Reddit style).
- Users can post interview experiences, tips, and resource links.
- Resources from the feed can be directly saved to your Personal Vault.

### 5️⃣ Authentication & User Accounts (Planned)

- Secure login via Google or Email/Password.
- Cloud-based profile management.

---

## 💻 Technology Stack

### Frontend

- **Framework:** React 18 + Vite
- **Language:** JavaScript (JSX)
- **Styling:** Tailwind CSS + Shadcn/UI Components
- **State Management:** Tanstack Query (React Query)
- **Routing:** React Router DOM v6
- **UI Components:** Radix UI primitives
- **Icons:** Lucide React
- **Notifications:** Sonner (Toast notifications)

### Backend & Infrastructure

- **Server:** Node.js with Express 5
- **Database:** MongoDB Atlas (Cloud)
- **ODM:** Mongoose 8
- **File Upload:** Multer (multipart/form-data)
- **Authentication:** CORS-enabled REST API
- **Environment:** dotenv for configuration

### External APIs

- **Search:** Google Custom Search API integration
- **Data Sources:** Web scraping with Cheerio, Axios

---

## 📂 Project Structure

```
prep-vault/
├── frontend/                  # React + Vite Application
│   ├── src/
│   │   ├── components/       # UI Components
│   │   │   ├── ui/          # Shadcn UI components
│   │   │   ├── VaultSidebar.jsx
│   │   │   ├── AddResourceDialog.jsx
│   │   │   ├── SaveToVaultDialog.jsx
│   │   │   └── ResourceCard.jsx
│   │   ├── pages/           # Route pages
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities
│   │   └── App.jsx          # Main app component
│   ├── public/
│   ├── package.json
│   └── requirements.txt     # Frontend dependencies list
├── backend/                  # Node.js API Server
│   ├── config/
│   │   └── db.js           # MongoDB connection
│   ├── models/
│   │   ├── Vault.js        # Vault schema
│   │   └── Resource.js     # Resource schema
│   ├── routes/
│   │   ├── search.js       # Search API routes
│   │   └── vault.js        # Vault CRUD + file upload
│   ├── uploads/            # File storage directory
│   ├── index.js            # Express server entry
│   ├── package.json
│   └── requirements.txt    # Backend dependencies list
├── docs/
│   ├── git-workflow.md     # Git branching guide
│   └── vault-feature.md    # Vault implementation docs
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

---

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+ and npm/bun
- MongoDB Atlas account (or local MongoDB)
- Git

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Achyut-shekhar/prep-vault.git
cd prep-vault
```

### 2️⃣ Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file with your MongoDB URI
echo "PORT=5000" > .env
echo "MONGODB_URI=your_mongodb_connection_string" >> .env

# Start development server
npm run dev
```

**Backend runs on:** `http://localhost:5000`

### 3️⃣ Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev
```

**Frontend runs on:** `http://localhost:5173`

---

## 🔌 API Endpoints

### Search API

- `POST /api/search` - Search for resources

### Vault API

- `GET /api/vault` - Get all vaults for user
- `POST /api/vault` - Create new vault
- `PUT /api/vault/:id` - Update vault
- `DELETE /api/vault/:id` - Delete vault
- `GET /api/vault/:vaultId/resources` - Get resources in vault
- `POST /api/vault/:vaultId/resources/link` - Add link resource
- `POST /api/vault/:vaultId/resources/file` - Upload file resource
- `DELETE /api/vault/:vaultId/resources/:resourceId` - Delete resource
- `GET /api/vault/resources/:resourceId/download` - Download file

---

## 📖 Documentation

- **[Git Workflow Guide](docs/git-workflow.md)** - Branching and commit strategies
- **[Vault Feature Documentation](docs/vault-feature.md)** - Detailed vault implementation guide

---

## 🚀 Features in Development

- [ ] User authentication (Firebase/Clerk)
- [ ] Shareable public vault links
- [ ] Community feed with interview experiences
- [ ] Advanced search filters
- [ ] Resource recommendations
- [ ] Mobile responsive design enhancements

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the ISC License.

---

## 👨‍💻 Author

**Achyut Shekhar**

- GitHub: [@Achyut-shekhar](https://github.com/Achyut-shekhar)

---

## 🙏 Acknowledgments

- Shadcn/UI for beautiful component library
- MongoDB Atlas for database hosting
- React and Vite communities

---

**Happy Coding! 🎉**
