const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const normalizedApiUrl = rawApiUrl.replace(/\/$/, "");
const API_URL = normalizedApiUrl.endsWith("/api")
  ? normalizedApiUrl
  : `${normalizedApiUrl}/api`;
const BACKEND_URL = API_URL.replace(/\/api$/, "");

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
    const data = await response.json();

    if (!response.ok) {
      // If unauthorized, clear token and redirect to login
      if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      throw new Error(data.message || "API request failed");
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
    if (relativeUrl.startsWith("http://") || relativeUrl.startsWith("https://")) {
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

// Export API_URL for direct use if needed
export { API_URL };
