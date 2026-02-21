import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut, User, Plus, Download } from 'lucide-react';
import { studentsAPI } from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [newStudent, setNewStudent] = useState({
    reg_no: '',
    student_name: '',
    gender: '',
    dob: '',
    admission_date: '',
    f_g_name: '',
    f_g_contact: '',
    class_enrolled: '',
    section: '',
    group: '',
    monthly_fee: '',
  });

  // On mount: check auth and load all students
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const email = localStorage.getItem('userEmail');

    if (isAuthenticated !== 'true') {
      navigate('/login');
      return;
    }

    setUserEmail(email || '');
    fetchAllStudents();
  }, [navigate]);

  const fetchAllStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const students = await studentsAPI.getAll();
      setAllStudents(Array.isArray(students) ? students : []);
      setSearchResults([]);
    } catch (error) {
      console.error('Error fetching students:', error);
      alert('Error fetching students: ' + error.message);
      setAllStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setAllStudents([]);
      fetchAllStudents();
      return;
    }

    setIsSearching(true);
    try {
      const results = await studentsAPI.search(query);
      setSearchResults(Array.isArray(results) ? results : []);
      setAllStudents([]);
    } catch (error) {
      console.error('Search error:', error);
      alert('Error searching students: ' + error.message);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setIsAdding(true);

    try {
      const studentData = {
        reg_no: newStudent.reg_no ? parseInt(newStudent.reg_no, 10) : null,
        student_name: newStudent.student_name,
        gender: newStudent.gender,
        dob: newStudent.dob || null,
        admission_date: newStudent.admission_date || null,
        f_g_name: newStudent.f_g_name,
        f_g_contact: newStudent.f_g_contact,
        class_enrolled: newStudent.class_enrolled,
        section: newStudent.section,
        group: newStudent.group,
        monthly_fee: newStudent.monthly_fee ? parseInt(newStudent.monthly_fee, 10) : null,
      };

      // Remove null / empty fields
      Object.keys(studentData).forEach((key) => {
        if (studentData[key] === null || studentData[key] === '') {
          delete studentData[key];
        }
      });

      await studentsAPI.add(studentData);
      alert('Student added successfully');

      setShowAddForm(false);
      setNewStudent({
        reg_no: '',
        student_name: '',
        gender: '',
        dob: '',
        admission_date: '',
        f_g_name: '',
        f_g_contact: '',
        class_enrolled: '',
        section: '',
        group: '',
        monthly_fee: '',
      });

      fetchAllStudents();
    } catch (error) {
      console.error('Add student error:', error);
      alert('Error adding student: ' + error.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStudent((prev) => ({ ...prev, [name]: value }));
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      let data = allStudents;
      if (!data || data.length === 0) {
        data = await studentsAPI.getAll();
      }

      if (!data || data.length === 0) {
        alert('No students to export');
        return;
      }

      const headers = [
        'Registration Number',
        'Student Name',
        'Gender',
        'Date of Birth',
        'Admission Date',
        "Father/Guardian's Name",
        "Father/Guardian's Contact",
        'Class',
        'Section',
        'Group',
        'Monthly Fee',
      ];

      const escapeCSV = (value) => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const rows = [
        headers.join(','),
        ...data.map((student) =>
          [
            escapeCSV(student.reg_no),
            escapeCSV(student.student_name),
            escapeCSV(student.gender),
            escapeCSV(student.dob),
            escapeCSV(student.admission_date),
            escapeCSV(student.f_g_name),
            escapeCSV(student.f_g_contact),
            escapeCSV(student.class_enrolled),
            escapeCSV(student.section),
            escapeCSV(student.group),
            escapeCSV(student.monthly_fee),
          ].join(',')
        ),
      ];

      const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `students_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting CSV: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const studentsToRender = searchResults.length > 0 ? searchResults : allStudents;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">The Creative School</h1>
          <p className="dashboard-subtitle">Student Management System</p>
        </div>
        <div className="header-actions">
          <div className="user-info">
            <User className="user-icon" />
            <span>{userEmail}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Search and actions */}
        <div className="search-section">
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search by registration number or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              className="search-input"
            />
            <button onClick={handleSearch} className="search-btn" disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          <div className="action-buttons">
            <button onClick={handleExportCSV} className="export-csv-btn" disabled={isExporting}>
              <Download size={20} />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button onClick={() => setShowAddForm((prev) => !prev)} className="add-student-btn">
              <Plus size={20} />
              {showAddForm ? 'Cancel' : 'Add New Student'}
            </button>
          </div>
        </div>

        {/* Add student form */}
        {showAddForm && (
          <div className="add-student-form-container">
            <form onSubmit={handleAddStudent} className="add-student-form">
              <h2 className="form-title">Add New Student</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Registration Number *</label>
                  <input
                    type="text"
                    name="reg_no"
                    value={newStudent.reg_no}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Student Name *</label>
                  <input
                    type="text"
                    name="student_name"
                    value={newStudent.student_name}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Gender *</label>
                  <select
                    name="gender"
                    value={newStudent.gender}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={newStudent.dob}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Admission Date</label>
                  <input
                    type="date"
                    name="admission_date"
                    value={newStudent.admission_date}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Father/Guardian's Name</label>
                  <input
                    type="text"
                    name="f_g_name"
                    value={newStudent.f_g_name}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Father/Guardian's Contact</label>
                  <input
                    type="text"
                    name="f_g_contact"
                    value={newStudent.f_g_contact}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Class Enrolled</label>
                  <input
                    type="text"
                    name="class_enrolled"
                    value={newStudent.class_enrolled}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Section</label>
                  <input
                    type="text"
                    name="section"
                    value={newStudent.section}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Group</label>
                  <input
                    type="text"
                    name="group"
                    value={newStudent.group}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Monthly Fee</label>
                  <input
                    type="number"
                    name="monthly_fee"
                    value={newStudent.monthly_fee}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={isAdding}>
                {isAdding ? 'Adding Student...' : 'Add Student'}
              </button>
            </form>
          </div>
        )}

        {/* Students display */}
        {isLoadingStudents && (
          <div className="results-section">
            <p>Loading students...</p>
          </div>
        )}

        {!isLoadingStudents && !isSearching && studentsToRender.length > 0 && (
          <div className="results-section">
            <h2 className="results-title">
              {searchResults.length > 0 ? `Search Results (${searchResults.length})` : `All Students (${allStudents.length})`}
            </h2>
            <div className="students-grid">
              {studentsToRender.map((student) => (
                <div key={student.id || student.reg_no} className="student-card">
                  <div className="student-header">
                    <h3>{student.student_name}</h3>
                    <span className="reg-badge">{student.reg_no}</span>
                  </div>
                  <div className="student-details">
                    {student.gender && (
                      <p>
                        <strong>Gender:</strong> {student.gender}
                      </p>
                    )}
                    {student.dob && (
                      <p>
                        <strong>DOB:</strong> {new Date(student.dob).toLocaleDateString()}
                      </p>
                    )}
                    {student.admission_date && (
                      <p>
                        <strong>Admission Date:</strong> {new Date(student.admission_date).toLocaleDateString()}
                      </p>
                    )}
                    {student.f_g_name && (
                      <p>
                        <strong>Father/Guardian:</strong> {student.f_g_name}
                      </p>
                    )}
                    {student.f_g_contact && (
                      <p>
                        <strong>Contact:</strong> {student.f_g_contact}
                      </p>
                    )}
                    {student.class_enrolled && (
                      <p>
                        <strong>Class:</strong> {student.class_enrolled}
                      </p>
                    )}
                    {student.section && (
                      <p>
                        <strong>Section:</strong> {student.section}
                      </p>
                    )}
                    {student.group && (
                      <p>
                        <strong>Group:</strong> {student.group}
                      </p>
                    )}
                    {student.monthly_fee != null && (
                      <p>
                        <strong>Monthly Fee:</strong> {student.monthly_fee}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoadingStudents && !isSearching && searchQuery.trim() && studentsToRender.length === 0 && (
          <div className="no-results">
            <p>No students found matching "{searchQuery}"</p>
          </div>
        )}

        {!isLoadingStudents && !isSearching && !searchQuery.trim() && studentsToRender.length === 0 && (
          <div className="no-results">
            <p>No students found in the database</p>
          </div>
        )}
      </div>
    </div>
  );
}


