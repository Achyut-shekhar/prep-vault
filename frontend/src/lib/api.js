const isLocalHost =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

const rawApiUrl = isLocalHost
  ? import.meta.env.VITE_LOCAL_API_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api"
  : import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const normalizedApiUrl = rawApiUrl.replace(/\/$/, "");
const API_URL = normalizedApiUrl.endsWith("/api")
  ? normalizedApiUrl
  : `${normalizedApiUrl}/api`;
const BACKEND_URL = API_URL.replace(/\/api$/, "");

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return { data: await response.json(), isJson: true };
  }

  return { data: await response.text(), isJson: false };
};

// Get auth token from localStorage
const getToken = () => localStorage.getItem("token");

// Create headers with auth token
const getHeaders = () => {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

// API request wrapper
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const { data, isJson } = await parseResponse(response);

    if (!response.ok) {
      // If unauthorized, clear token and redirect to login
      if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }

      if (!isJson) {
        const textPreview =
          typeof data === "string"
            ? data.replace(/\s+/g, " ").trim().slice(0, 140)
            : "";

        if (response.status === 404) {
          throw new Error(
            `API endpoint not found (404) at ${url}. Backend route may be missing or an older deployment is running.`,
          );
        }

        throw new Error(
          `Request failed with status ${response.status}: non-JSON response from ${url}${textPreview ? ` (${textPreview})` : ""}`,
        );
      }

      throw new Error(data.message || data.error || "API request failed");
    }

    if (!isJson) {
      throw new Error(
        `Expected JSON response but received non-JSON from ${url}`,
      );
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// Vault API methods
export const vaultApi = {
  // Get all vaults for the current user
  getVaults: async () => {
    return apiRequest("/vault");
  },

  // Get a public vault by share link
  getPublicVault: async (vaultId) => {
    return apiRequest(`/vault/public/${vaultId}`);
  },

  // Create a new vault
  createVault: async (vaultData) => {
    return apiRequest("/vault", {
      method: "POST",
      body: JSON.stringify(vaultData),
    });
  },

  // Update a vault
  updateVault: async (vaultId, vaultData) => {
    return apiRequest(`/vault/${vaultId}`, {
      method: "PUT",
      body: JSON.stringify(vaultData),
    });
  },

  // Delete a vault
  deleteVault: async (vaultId) => {
    return apiRequest(`/vault/${vaultId}`, {
      method: "DELETE",
    });
  },

  // Get all resources for a vault
  getResources: async (vaultId) => {
    return apiRequest(`/vault/${vaultId}/resources`);
  },

  // Add a link resource
  addLinkResource: async (vaultId, resourceData) => {
    return apiRequest(`/vault/${vaultId}/resources/link`, {
      method: "POST",
      body: JSON.stringify(resourceData),
    });
  },

  // Upload a file resource
  uploadFileResource: async (vaultId, formData) => {
    const token = getToken();
    const headers = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/vault/${vaultId}/resources/file`, {
      method: "POST",
      headers,
      body: formData, // Don't set Content-Type, browser will set it with boundary
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      throw new Error(data.message || "File upload failed");
    }

    return data;
  },

  // Delete a resource
  deleteResource: async (vaultId, resourceId) => {
    return apiRequest(`/vault/${vaultId}/resources/${resourceId}`, {
      method: "DELETE",
    });
  },

  // Get all notes for a vault
  getNotes: async (vaultId) => {
    return apiRequest(`/vault/${vaultId}/notes`);
  },

  // Create a note in a vault
  addNote: async (vaultId, noteData) => {
    return apiRequest(`/vault/${vaultId}/notes`, {
      method: "POST",
      body: JSON.stringify(noteData),
    });
  },

  // Update a note in a vault
  updateNote: async (vaultId, noteId, noteData) => {
    return apiRequest(`/vault/${vaultId}/notes/${noteId}`, {
      method: "PUT",
      body: JSON.stringify(noteData),
    });
  },

  // Delete a note in a vault
  deleteNote: async (vaultId, noteId) => {
    return apiRequest(`/vault/${vaultId}/notes/${noteId}`, {
      method: "DELETE",
    });
  },

  // Get all todos for a vault
  getTodos: async (vaultId) => {
    return apiRequest(`/vault/${vaultId}/todos`);
  },

  // Create a todo in a vault
  addTodo: async (vaultId, todoData) => {
    return apiRequest(`/vault/${vaultId}/todos`, {
      method: "POST",
      body: JSON.stringify(todoData),
    });
  },

  // Update a todo in a vault
  updateTodo: async (vaultId, todoId, todoData) => {
    return apiRequest(`/vault/${vaultId}/todos/${todoId}`, {
      method: "PUT",
      body: JSON.stringify(todoData),
    });
  },

  // Delete a todo in a vault
  deleteTodo: async (vaultId, todoId) => {
    return apiRequest(`/vault/${vaultId}/todos/${todoId}`, {
      method: "DELETE",
    });
  },

  // Reorder todos in a vault
  reorderTodos: async (vaultId, orderedTodoIds) => {
    return apiRequest(`/vault/${vaultId}/todos/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ orderedTodoIds }),
    });
  },

  // Clear completed todos in a vault
  clearCompletedTodos: async (vaultId) => {
    return apiRequest(`/vault/${vaultId}/todos`, {
      method: "DELETE",
    });
  },

  // Upload an image to a note
  uploadNoteImage: async (vaultId, noteId, formData) => {
    const token = getToken();
    const headers = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_URL}/vault/${vaultId}/notes/${noteId}/images`,
      {
        method: "POST",
        headers,
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      throw new Error(data.message || "Image upload failed");
    }

    return data;
  },

  // Delete an image from a note
  deleteNoteImage: async (vaultId, noteId, imageId) => {
    return apiRequest(`/vault/${vaultId}/notes/${noteId}/images/${imageId}`, {
      method: "DELETE",
    });
  },

  // Build full URL for uploaded files
  getUploadUrl: (relativeUrl) => {
    if (!relativeUrl) return "";
    if (
      relativeUrl.startsWith("http://") ||
      relativeUrl.startsWith("https://")
    ) {
      return relativeUrl;
    }
    return `${BACKEND_URL}${relativeUrl}`;
  },

  // Get download URL for a file
  getDownloadUrl: (resourceId) => {
    const token = getToken();
    return `${API_URL}/vault/resources/${resourceId}/download?token=${token}`;
  },
};

// Search API methods
export const searchApi = {
  search: async (query, type = "all") => {
    return apiRequest(`/search?q=${encodeURIComponent(query)}&type=${type}`);
  },
};

// AI API methods
export const aiApi = {
  extractArticle: async (url) => {
    return apiRequest("/ai/extract", {
      method: "POST",
      body: JSON.stringify({ url }),
    });
  },

  generateNotesFromArticle: async ({
    url,
    articleText,
    articleTitle,
    saveToVault = false,
    vaultId,
    noteStyle = "detailed",
    createTodos = false,
  }) => {
    return apiRequest("/ai/notes/from-article", {
      method: "POST",
      body: JSON.stringify({
        url,
        articleText,
        articleTitle,
        saveToVault,
        vaultId,
        noteStyle,
        createTodos,
      }),
    });
  },

  scrapeStructured: async (url) => {
    return apiRequest("/ai/scrape/structured", {
      method: "POST",
      body: JSON.stringify({ url }),
    });
  },
};

// Export API_URL for direct use if needed
export { API_URL };
