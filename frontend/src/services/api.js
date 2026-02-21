// Base API URL from environment, fallback to local backend
let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Ensure we don't end up with /api/v1 duplicated
baseUrl = baseUrl.replace(/\/api\/v1\/?$/, '');

const API_BASE_URL = baseUrl;

// Authentication API
export const authAPI = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Login failed');
    }

    return response.json();
  },
};

// Students API
export const studentsAPI = {
  // Search by reg_no and/or name (backend handles logic)
  search: async (query) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/students/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Search failed');
    }

    return response.json();
  },

  // Add a new student
  add: async (studentData) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/students/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to add student');
    }

    return response.json();
  },

  // Get all students
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/students/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to fetch students' }));
        throw new Error(error.detail || 'Failed to fetch students');
      }

      return response.json();
    } catch (error) {
      // Re-throw network errors with original message
      if (error.message.includes('Failed to fetch') || error.message.includes('10060')) {
        throw error;
      }
      throw new Error(error.message || 'Failed to fetch students');
    }
  },

  // Get a single student by registration number (or id, depending on usage)
  getById: async (studentId) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/students/${studentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to fetch student');
    }

    return response.json();
  },
};


