import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Plus, CheckCircle, X, UserMinus } from 'lucide-react';
import { studentsAPI, withdrawnAPI } from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();

  const [allStudents, setAllStudents] = useState([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [withdrawnCount, setWithdrawnCount] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Animated counter hook
  function useAnimatedCount(target, duration = 1200) {
    const [count, setCount] = useState(0);
    const prevTarget = useRef(0);
    const rafRef = useRef(null);

    useEffect(() => {
      const start = prevTarget.current;
      const diff = target - start;
      if (diff === 0) return;
      const startTime = performance.now();

      const animate = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutExpo
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = Math.round(start + diff * eased);
        setCount(current);
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          prevTarget.current = target;
        }
      };

      rafRef.current = requestAnimationFrame(animate);
      return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [target, duration]);

    return count;
  }

  const maleCount = allStudents.filter(s => s.gender && ['m', 'male'].includes(s.gender.trim().toLowerCase())).length;
  const femaleCount = allStudents.filter(s => s.gender && ['f', 'female'].includes(s.gender.trim().toLowerCase())).length;

  const animatedTotal = useAnimatedCount(allStudents.length);
  const animatedMale = useAnimatedCount(maleCount);
  const animatedFemale = useAnimatedCount(femaleCount);
  const animatedWithdrawn = useAnimatedCount(withdrawnCount);

  const DEFAULT_SECTIONS = {
    'PG': ['Snr', 'Jnr'],
    'Nur': ['Q', 'T'],
    'Prep': ['AH', 'J'],
    '1': ['A', 'B'],
    '2': ['A', 'B'],
    '3': ['No Section'],
    '4': ['No Section'],
    '5': ['A', 'B'],
    '6': ['Boys', 'Girls'],
    '7': ['Boys', 'Girls'],
    '8': ['Boys', 'Girls'],
    '9': ['Boys', 'Girls'],
    '10': ['Boys', 'Girls'],
  };

  const [newStudent, setNewStudent] = useState({
    reg_no: '',
    student_name: '',
    gender: '',
    b_form: '',
    dob: '',
    blood_group: '',
    admission_date: '',
    f_g_name: '',
    f_g_cnic: '',
    f_g_contact: '',
    address: '',
    class_enrolled: '',
    section: '',
    group: '',
    class_of_admission: '',
    caste: '',
    monthly_fee: '',
    no_fee: '',
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
    fetchWithdrawnCount();
  }, [navigate]);

  const fetchWithdrawnCount = async () => {
    try {
      const data = await withdrawnAPI.getAll();
      setWithdrawnCount(Array.isArray(data) ? data.length : 0);
    } catch (error) {
      console.error('Error fetching withdrawn count:', error);
    }
  };

  const fetchAllStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const students = await studentsAPI.getAll();
      setAllStudents(Array.isArray(students) ? students : []);
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
        b_form: newStudent.b_form,
        dob: newStudent.dob || null,
        blood_group: newStudent.blood_group || null,
        admission_date: newStudent.admission_date || null,
        f_g_name: newStudent.f_g_name,
        f_g_cnic: newStudent.f_g_cnic,
        f_g_contact: newStudent.f_g_contact,
        address: newStudent.address,
        class_enrolled: newStudent.class_enrolled,
        section: newStudent.section,
        group: newStudent.group,
        class_of_admission: newStudent.class_of_admission,
        caste: newStudent.caste,
        monthly_fee: newStudent.monthly_fee ? parseInt(newStudent.monthly_fee, 10) : null,
        no_fee: newStudent.no_fee,
      };

      // Remove null / empty fields
      Object.keys(studentData).forEach((key) => {
        if (studentData[key] === null || studentData[key] === '') {
          delete studentData[key];
        }
      });

      await studentsAPI.add(studentData);

      // Show success modal instead of alert
      setShowSuccessModal(true);

      // Reset form but don't close it so user can add another
      setNewStudent({
        reg_no: '',
        student_name: '',
        gender: '',
        b_form: '',
        dob: '',
        blood_group: '',
        admission_date: '',
        f_g_name: '',
        f_g_cnic: '',
        f_g_contact: '',
        address: '',
        class_enrolled: '',
        section: '',
        group: '',
        class_of_admission: '',
        caste: '',
        monthly_fee: '',
        no_fee: '',
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

  // For the Add Student form section datalist
  const dynamicSectionsForAdd = allStudents
    .filter(s => s.class_enrolled === newStudent.class_enrolled && s.section)
    .map(s => s.section);
  const defaultSectionsForAdd = DEFAULT_SECTIONS[newStudent.class_enrolled] || [];
  const availableSectionsForAdd = Array.from(new Set([...defaultSectionsForAdd, ...dynamicSectionsForAdd])).sort((a, b) => a.localeCompare(b));

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
        {!showAddForm ? (
          <div className="dashboard-hero">
            {/* Floating animated background elements */}
            <div className="hero-bg-orbs">
              <div className="orb orb-1"></div>
              <div className="orb orb-2"></div>
              <div className="orb orb-3"></div>
              <div className="orb orb-4"></div>
              <div className="orb orb-5"></div>
            </div>
            <div className="hero-content-inner">
              <h2 className="hero-title">Welcome to Crevo</h2>
              <p className="hero-description">Manage student records, track enrollments, and coordinate school activities easily from a centralized dashboard.</p>

              <div className="stats-container">
                <div className="stat-card" style={{ animationDelay: '0.1s' }}>
                  <div className="stat-icon stat-icon-total">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0052a3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Total Enrolled</span>
                    <span className="stat-value">{animatedTotal}</span>
                  </div>
                </div>
                <div className="stat-card" style={{ animationDelay: '0.25s' }}>
                  <div className="stat-icon stat-icon-male">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2b6cb0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="14" r="5" /><path d="M19 5l-5.4 5.4M19 5h-5M19 5v5" /></svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Male</span>
                    <span className="stat-value">{animatedMale}</span>
                  </div>
                </div>
                <div className="stat-card" style={{ animationDelay: '0.4s' }}>
                  <div className="stat-icon stat-icon-female">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b83280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5" /><path d="M12 13v8M9 18h6" /></svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Female</span>
                    <span className="stat-value">{animatedFemale}</span>
                  </div>
                </div>
                <div className="stat-card" style={{ animationDelay: '0.55s' }}>
                  <div className="stat-icon stat-icon-withdrawn">
                    <UserMinus width="28" height="28" stroke="#c05621" strokeWidth="2" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Withdrawn</span>
                    <span className="stat-value">{animatedWithdrawn}</span>
                  </div>
                </div>
              </div>

              <div className="hero-actions">
                <button onClick={() => navigate('/students')} className="view-directory-btn hero-btn">
                  <User size={22} />
                  View Students
                </button>
                <button onClick={() => setShowAddForm(true)} className="add-student-btn hero-btn">
                  <Plus size={22} />
                  Add New Student
                </button>
                <button onClick={() => navigate('/withdrawn')} className="withdrawn-btn hero-btn">
                  <UserMinus size={22} />
                  Withdrawn Students
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="add-student-header-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={() => setShowAddForm(false)} className="back-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1px solid #cbd5e0', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold', color: '#4a5568', transition: 'all 0.2s ease' }}>
              Cancel Adding Student
            </button>
          </div>
        )}

        {/* Add student form */}
        {showAddForm && (
          <div className="add-student-form-container">
            <form onSubmit={handleAddStudent} className="add-student-form">
              <h2 className="form-title">Add New Student</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Registration Number *</label>
                  <input type="number" name="reg_no" value={newStudent.reg_no} onChange={handleInputChange} className="form-input" required />
                </div>
                <div className="form-group">
                  <label>Student Name *</label>
                  <input type="text" name="student_name" value={newStudent.student_name} onChange={handleInputChange} className="form-input" required />
                </div>
                <div className="form-group">
                  <div className="label-row">
                    <label>Gender *</label>
                  </div>
                  <select name="gender" value={newStudent.gender} onChange={handleInputChange} className="form-input" required>
                    <option value="">Select Gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <div className="label-row">
                    <label>B-Form</label>
                    <label className="na-checkbox"><input type="checkbox" checked={newStudent.b_form === 'N/A'} onChange={(e) => setNewStudent(prev => ({ ...prev, b_form: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                  </div>
                  <input type="text" name="b_form" value={newStudent.b_form} onChange={handleInputChange} className="form-input" disabled={newStudent.b_form === 'N/A'} />
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input type="date" name="dob" value={newStudent.dob} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Admission Date</label>
                  <input type="date" name="admission_date" value={newStudent.admission_date} onChange={handleInputChange} className="form-input" />
                </div>
                
                <div className="form-group">
                  <div className="label-row">
                    <label>Blood Group</label>
                    <label className="na-checkbox"><input type="checkbox" checked={newStudent.blood_group === 'N/A'} onChange={(e) => setNewStudent(prev => ({ ...prev, blood_group: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                  </div>
                  <select name="blood_group" value={newStudent.blood_group} onChange={handleInputChange} className="form-input" disabled={newStudent.blood_group === 'N/A'}>
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="N/A">N/A</option>
                  </select>
                </div>
                <div className="form-group">
                  <div className="label-row">
                    <label>Father/Guardian's Name</label>
                    <label className="na-checkbox"><input type="checkbox" checked={newStudent.f_g_name === 'N/A'} onChange={(e) => setNewStudent(prev => ({ ...prev, f_g_name: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                  </div>
                  <input type="text" name="f_g_name" value={newStudent.f_g_name} onChange={handleInputChange} className="form-input" disabled={newStudent.f_g_name === 'N/A'} />
                </div>
                <div className="form-group">
                  <div className="label-row">
                    <label>Father/Guardian's CNIC</label>
                    <label className="na-checkbox"><input type="checkbox" checked={newStudent.f_g_cnic === 'N/A'} onChange={(e) => setNewStudent(prev => ({ ...prev, f_g_cnic: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                  </div>
                  <input type="text" name="f_g_cnic" value={newStudent.f_g_cnic} onChange={handleInputChange} className="form-input" disabled={newStudent.f_g_cnic === 'N/A'} />
                </div>
                <div className="form-group">
                  <div className="label-row">
                    <label>Father/Guardian's Contact</label>
                    <label className="na-checkbox"><input type="checkbox" checked={newStudent.f_g_contact === 'N/A'} onChange={(e) => setNewStudent(prev => ({ ...prev, f_g_contact: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                  </div>
                  <input type="text" name="f_g_contact" value={newStudent.f_g_contact} onChange={handleInputChange} className="form-input" disabled={newStudent.f_g_contact === 'N/A'} />
                </div>
                <div className="form-group form-group-wide">
                  <div className="label-row">
                    <label>Address</label>
                    <label className="na-checkbox"><input type="checkbox" checked={newStudent.address === 'N/A'} onChange={(e) => setNewStudent(prev => ({ ...prev, address: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                  </div>
                  <input type="text" name="address" value={newStudent.address} onChange={handleInputChange} className="form-input" disabled={newStudent.address === 'N/A'} />
                </div>
                <div className="form-group">
                  <label>Class Enrolled *</label>
                  <select name="class_enrolled" value={newStudent.class_enrolled} onChange={handleInputChange} className="form-input" required>
                    <option value="">Select</option>
                    {['PG', 'Nur', 'Prep', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <div className="label-row">
                    <label>Section</label>
                    <label className="na-checkbox"><input type="checkbox" checked={newStudent.section === 'N/A'} onChange={(e) => setNewStudent(prev => ({ ...prev, section: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                  </div>
                  <input type="text" name="section" value={newStudent.section} onChange={handleInputChange} className="form-input" list="section-suggestions" disabled={newStudent.section === 'N/A'} />
                  <datalist id="section-suggestions">
                    {availableSectionsForAdd.map(sec => <option key={sec} value={sec} />)}
                  </datalist>
                </div>
                <div className="form-group">
                  <div className="label-row">
                    <label>Group</label>
                    <label className="na-checkbox"><input type="checkbox" checked={newStudent.group === 'N/A'} onChange={(e) => setNewStudent(prev => ({ ...prev, group: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                  </div>
                  <input type="text" name="group" value={newStudent.group} onChange={handleInputChange} className="form-input" disabled={newStudent.group === 'N/A'} />
                </div>
                <div className="form-group">
                  <div className="label-row">
                    <label>Class of Admission</label>
                    <label className="na-checkbox"><input type="checkbox" checked={newStudent.class_of_admission === 'N/A'} onChange={(e) => setNewStudent(prev => ({ ...prev, class_of_admission: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                  </div>
                  <select name="class_of_admission" value={newStudent.class_of_admission} onChange={handleInputChange} className="form-input" disabled={newStudent.class_of_admission === 'N/A'}>
                    <option value="">Select</option>
                    {['PG', 'Nur', 'Prep', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="N/A">N/A</option>
                  </select>
                </div>
                <div className="form-group">
                  <div className="label-row">
                    <label>Caste</label>
                    <label className="na-checkbox"><input type="checkbox" checked={newStudent.caste === 'N/A'} onChange={(e) => setNewStudent(prev => ({ ...prev, caste: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                  </div>
                  <input type="text" name="caste" value={newStudent.caste} onChange={handleInputChange} className="form-input" disabled={newStudent.caste === 'N/A'} />
                </div>
                <div className="form-group">
                  <label>Monthly Fee</label>
                  <input type="number" name="monthly_fee" value={newStudent.monthly_fee} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>No Fee *</label>
                  <select name="no_fee" value={newStudent.no_fee} onChange={handleInputChange} className="form-input" required>
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="submit-btn" disabled={isAdding}>
                {isAdding ? 'Adding Student...' : 'Add Student'}
              </button>
            </form>
          </div>
        )}

      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal-content success-modal" style={{ background: 'white', padding: '2.5rem 2rem', borderRadius: '1rem', width: '90%', maxWidth: '400px', textAlign: 'center' }}>
            <div className="success-icon-container" style={{ margin: '0 auto 1.5rem', display: 'flex', justifyContent: 'center' }}>
              <CheckCircle size={64} color="#10b981" className="success-checkmark" />
            </div>
            <h2 style={{ margin: '0 0 0.5rem 0', color: '#1a202c', fontSize: '1.5rem' }}>Student Added!</h2>
            <p style={{ color: '#4a5568', marginBottom: '2rem', fontSize: '0.95rem' }}>The student record has been successfully created.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => setShowSuccessModal(false)}
                style={{ padding: '0.8rem 1.5rem', borderRadius: '0.75rem', border: 'none', background: 'linear-gradient(135deg, #047857, #10b981)', color: 'white', fontWeight: 'bold', fontSize: '1rem', width: '100%' }}
              >
                Add Another Student
              </button>
              <button
                onClick={() => { setShowSuccessModal(false); setShowAddForm(false); }}
                style={{ padding: '0.8rem 1.5rem', borderRadius: '0.75rem', border: '1px solid #cbd5e0', background: 'white', color: '#4a5568', fontWeight: '600', fontSize: '1rem', width: '100%' }}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


