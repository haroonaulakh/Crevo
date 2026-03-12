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

  // Update a student
  update: async (reg_no, studentData) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/students/${reg_no}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to update student');
    }

    return response.json();
  },

  // Delete a student
  delete: async (reg_no) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/students/${reg_no}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to delete student');
    }

    return response.json();
  },

  // Withdraw a student (move to withdrawn table with class_of_withdrawl)
  withdraw: async (reg_no, class_of_withdrawl) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/students/${reg_no}/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ class_of_withdrawl }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to withdraw student');
    }

    return response.json();
  },
};

// Withdrawn Students API
export const withdrawnAPI = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/withdrawn`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to fetch withdrawn students' }));
        throw new Error(error.detail || 'Failed to fetch withdrawn students');
      }

      return response.json();
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch withdrawn students');
    }
  },

  add: async (studentData) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/withdrawn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to add withdrawn student record');
    }

    return response.json();
  },

  delete: async (reg_no) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/withdrawn/${reg_no}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to delete withdrawn student');
    }

    return response.json();
  },
};


// Timetable API
export const timetableAPI = {
  // Teachers
  getTeachers: async () => {
    const res = await fetch(`${API_BASE_URL}/api/v1/timetable/teachers`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed to fetch teachers');
    return res.json();
  },

  // Courses offered
  getCourses: async () => {
    const res = await fetch(`${API_BASE_URL}/api/v1/timetable/courses`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed to fetch courses');
    return res.json();
  },

  // Class sections from students table
  getClassSections: async () => {
    const res = await fetch(`${API_BASE_URL}/api/v1/timetable/class-sections`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed to fetch class sections');
    return res.json();
  },

  // Teacher courses
  getTeacherCourses: async () => {
    const res = await fetch(`${API_BASE_URL}/api/v1/timetable/teacher-courses`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed to fetch teacher courses');
    return res.json();
  },

  updateTeacherCourses: async (teacherId, data) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/timetable/teacher-courses/${teacherId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed to update teacher courses');
    return res.json();
  },

  // Class-wise courses
  getClassCourses: async () => {
    const res = await fetch(`${API_BASE_URL}/api/v1/timetable/class-courses`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed to fetch class courses');
    return res.json();
  },

  updateClassCourses: async (classId, data) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/timetable/class-courses/${classId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed to update class courses');
    return res.json();
  },

  // Time slots
  getTimeSlots: async () => {
    const res = await fetch(`${API_BASE_URL}/api/v1/timetable/time-slots`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed to fetch time slots');
    return res.json();
  },

  replaceTimeSlots: async (timeSlots) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/timetable/time-slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time_slots: timeSlots }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed to save time slots');
    return res.json();
  },

  // Generate timetable
  generate: async (fixedAssignments = []) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/timetable/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fixed_assignments: fixedAssignments }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed to generate timetable');
    return res.json();
  },
};

// Teachers API
export const teachersAPI = {
  getAll: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/timetable/teachers`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Failed to fetch teachers' }));
        throw new Error(error.detail || 'Failed to fetch teachers');
      }
      return res.json();
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('10060')) {
        throw error;
      }
      throw new Error(error.message || 'Failed to fetch teachers');
    }
  },

  add: async (teacherData) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/timetable/teachers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teacherData),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to add teacher');
    }
    return res.json();
  },

  update: async (teacherId, teacherData) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/timetable/teachers/${teacherId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teacherData),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to update teacher');
    }
    return res.json();
  },

  delete: async (teacherId) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/timetable/teachers/${teacherId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to delete teacher');
    }
    return res.json();
  },
};
