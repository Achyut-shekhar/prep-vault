# PrepVault 🚀

**A Full-Stack Placement Preparation Platform**

PrepVault aggregates interview resources from across the internet using the Google Search API and allows users to save, organize, and share placement materials through private and public study vaults.

---

## 🎯 Problem Statement

Placement preparation content is scattered across hundreds of websites — blogs, PDFs, YouTube, GitHub repos, interview experiences, and cheat sheets.

**Students waste time:**
*   Searching repeatedly for the same topics.
*   Losing track of good resources.
*   Struggling to organize company-specific preparation materials.
*   Finding it difficult to share curated material with peers.

## ✅ Solution Overview

**PrepVault solves this by:**
1.  **Aggregating** placement resources from trusted public sources in one place.
2.  **Organizing** resources into folders (company-wise / exam-wise).
3.  **Enabling** private & shareable study vaults.
4.  **Facilitating** peer-to-peer knowledge sharing.

---

## 🏗️ Core Features

### 1️⃣ Smart Search & Resource Aggregation
*   **Powered by:** Google Custom Search API.
*   **Functionality:** Users search for topics like "Amazon SDE", "HackWithInfy", "GATE CSE".
*   **Result:** A unified page showing Blogs, Interview Experiences, Cheat Sheets, PDFs, GitHub Repos, and Video Links.
*   **Safety:** We do not copy content; we provide legal links + previews.

### 2️⃣ Personal Study Vault (Private)
*   **Folder-Based Organization:** Create folders like `📂 Amazon SDE`, `📂 DSA Revision`.
*   **Private Storage:** Save article links, PDFs, and notes visible only to you.

### 3️⃣ Shareable Resources (Public)
*   **Shareable Folders:** specific folders can be made public to generate a unique link.
*   **Community Sharing:** Perfect for sharing curated lists with juniors, friends, or study groups.
    *   *Example:* `https://prepvault.app/share/amazon-sde-achyut`

### 4️⃣ Community Feed
*   A placement-focused microblog (Twitter/Reddit style).
*   Users can post interview experiences, tips, and resource links.
*   Resources from the feed can be directly saved to your Personal Vault.

### 5️⃣ Authentication & User Accounts
*   Secure login via Google or Email/Password.
*   Cloud-based profile management.

---

## 💻 Technology Stack

### Frontend
- **Framework:** React + Vite
- **Language:** JavaScript
- **Styling:** Tailwind CSS + Shadcn/UI
- **State Management:** Tanstack Query
- **Routing:** React Router DOM

### Backend & Infrastructure
- **Server:** Node.js (Express) or Serverless Functions
- **Database:** Firebase / PostgreSQL
- **Authentication:** Firebase Auth / Clerk
- **External API:** Google Programmable Search Engine API

---

## 📂 Project Structure

```
prep-vault/
├── frontend/            # React + Vite Application
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/             # Backend API & Services (In Development)
└── README.md            # Project Documentation
```

## 🛠️ Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/Achyut-shekhar/prep-vault.git
    cd prep-vault
    ```

2.  **Frontend Setup:**
    ```sh
    cd frontend
   bun install
   bun dev
    ```

3.  **Backend Setup:**
    *   *(Coming Soon)*

## 📄 License
This project is licensed under the MIT License.
