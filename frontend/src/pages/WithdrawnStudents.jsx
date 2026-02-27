import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut, Download, ArrowLeft, LayoutGrid, Table as TableIcon, UserMinus, Trash2, AlertTriangle, CheckCircle, X, PlusCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { withdrawnAPI } from '../services/api';
import './WithdrawnStudents.css';

const CLASSES = ['All Classes', 'PG', 'Nur', 'Prep', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const CLASS_OPTIONS = ['PG', 'Nur', 'Prep', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

const EMPTY_FORM = {
    reg_no: '',
    student_name: '',
    gender: '',
    b_form: '',
    dob: '',
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
    class_of_withdrawl: '',
    blood_group: '',
};

export default function WithdrawnStudents() {
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [allWithdrawn, setAllWithdrawn] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedClass, setSelectedClass] = useState('All Classes');
    const [selectedSection, setSelectedSection] = useState('All Sections');
    const [viewMode, setViewMode] = useState('card');

    // --- Delete state ---
    const [studentToDelete, setStudentToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

    // --- Manual Add state ---
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState(EMPTY_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [addError, setAddError] = useState('');
    const [showAddSuccess, setShowAddSuccess] = useState(false);

    useEffect(() => {
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        if (isAuthenticated !== 'true') {
            navigate('/login');
            return;
        }
        fetchWithdrawnStudents();
    }, [navigate]);

    useEffect(() => {
        setSelectedSection('All Sections');
    }, [selectedClass]);

    const fetchWithdrawnStudents = async () => {
        setIsLoading(true);
        try {
            const data = await withdrawnAPI.getAll();
            setAllWithdrawn(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching withdrawn students:', error);
            alert('Error fetching withdrawn students: ' + error.message);
            setAllWithdrawn([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userEmail');
        navigate('/login');
    };

    // Client-side search/filter
    const searchFiltered = searchQuery.trim()
        ? allWithdrawn.filter(s =>
            String(s.reg_no).includes(searchQuery.trim()) ||
            (s.student_name || '').toLowerCase().includes(searchQuery.trim().toLowerCase())
        )
        : allWithdrawn;

    let filteredStudents = selectedClass === 'All Classes'
        ? searchFiltered
        : searchFiltered.filter(s => s.class_enrolled === selectedClass);

    if (selectedClass !== 'All Classes' && selectedSection !== 'All Sections') {
        filteredStudents = filteredStudents.filter(s => s.section === selectedSection);
    }

    const getAvailableSections = () => {
        if (selectedClass === 'All Classes') return [];
        const existingSections = allWithdrawn
            .filter(s => s.class_enrolled === selectedClass)
            .map(s => s.section)
            .filter(s => s && s.trim() !== '');
        return [...new Set(existingSections)].sort();
    };

    const availableSections = getAvailableSections();

    const handleExportXLSX = async () => {
        setIsExporting(true);
        try {
            if (!filteredStudents || filteredStudents.length === 0) {
                alert('No withdrawn students to export matching the current criteria.');
                return;
            }

            const formattedData = filteredStudents.map((student) => ({
                'Registration Number': student.reg_no,
                'Student Name': student.student_name || 'N/A',
                'Class of Withdrawl': student.class_of_withdrawl || 'N/A',
                'Gender': student.gender || 'N/A',
                'B-Form': student.b_form || 'N/A',
                'Date of Birth': student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A',
                'Admission Date': student.admission_date ? new Date(student.admission_date).toLocaleDateString() : 'N/A',
                "Father/Guardian's Name": student.f_g_name || 'N/A',
                "Father/Guardian's CNIC": student.f_g_cnic || 'N/A',
                "Father/Guardian's Contact": student.f_g_contact || 'N/A',
                'Address': student.address || 'N/A',
                'Class Enrolled': student.class_enrolled || 'N/A',
                'Section': student.section || 'N/A',
                'Group': student.group || 'N/A',
                'Class of Admission': student.class_of_admission || 'N/A',
                'Caste': student.caste || 'N/A',
                'Monthly Fee': student.monthly_fee != null ? student.monthly_fee : 'N/A',
                'No Fee': student.no_fee || 'N/A',
            }));

            const ws = XLSX.utils.json_to_sheet(formattedData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Withdrawn Students');
            const dateStr = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `Withdrawn_Students_${dateStr}.xlsx`);
        } catch (error) {
            alert('Error exporting XLSX: ' + error.message);
        } finally {
            setIsExporting(false);
        }
    };

    const handleDeleteClick = (student) => {
        setStudentToDelete(student);
    };

    const handleConfirmDelete = async () => {
        if (!studentToDelete) return;
        setIsDeleting(true);
        try {
            await withdrawnAPI.delete(studentToDelete.reg_no);
            setAllWithdrawn(prev => prev.filter(s => s.reg_no !== studentToDelete.reg_no));
            setStudentToDelete(null);
            setShowDeleteSuccess(true);
        } catch (error) {
            alert('Error deleting record: ' + error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    // ---- Manual Add handlers ----
    const handleAddFormChange = (e) => {
        const { name, value } = e.target;
        setAddForm(prev => ({ ...prev, [name]: value }));
        setAddError('');
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setAddError('');

        if (!addForm.reg_no || !addForm.student_name) {
            setAddError('Registration Number and Student Name are required.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                ...addForm,
                reg_no: parseInt(addForm.reg_no, 10),
                monthly_fee: addForm.monthly_fee !== '' ? parseInt(addForm.monthly_fee, 10) : null,
                dob: addForm.dob || null,
                admission_date: addForm.admission_date || null,
            };
            // Remove empty strings so backend treats them as optional
            Object.keys(payload).forEach(k => {
                if (payload[k] === '') payload[k] = null;
            });

            const newRecord = await withdrawnAPI.add(payload);
            setAllWithdrawn(prev => [newRecord, ...prev]);
            setShowAddModal(false);
            setAddForm(EMPTY_FORM);
            setShowAddSuccess(true);
        } catch (error) {
            setAddError(error.message || 'Failed to add record.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseAddModal = () => {
        if (!isSubmitting) {
            setShowAddModal(false);
            setAddForm(EMPTY_FORM);
            setAddError('');
        }
    };

    return (
        <div className="withdrawn-container">
            <div className="withdrawn-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft size={20} />
                        <span className="back-btn-text">Back to Dashboard</span>
                    </button>
                    <div className="header-content">
                        <div className="withdrawn-title-row">
                            <UserMinus size={22} className="withdrawn-header-icon" />
                            <h1 className="dashboard-title">Withdrawn Students</h1>
                        </div>
                        <p className="withdrawn-subtitle">Archive of students who have left the school</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="add-withdrawn-btn" onClick={() => setShowAddModal(true)}>
                        <PlusCircle size={18} />
                        <span>Add Record</span>
                    </button>
                    <button onClick={handleLogout} className="logout-btn">
                        <LogOut size={18} />
                        <span className="logout-text">Logout</span>
                    </button>
                </div>
            </div>

            <div className="withdrawn-content">
                {/* Search + Toggle + Export bar */}
                <div className="search-section withdrawn-search-section">
                    <div className="search-container">
                        <Search className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by registration number or name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <div className="action-buttons-wrapper">
                        <div className="view-toggle">
                            <button
                                className={`toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
                                onClick={() => setViewMode('card')}
                                title="Card View"
                            >
                                <LayoutGrid size={20} />
                            </button>
                            <button
                                className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                                onClick={() => setViewMode('table')}
                                title="Table View"
                            >
                                <TableIcon size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Class filters */}
                <div className="class-filters-container">
                    {CLASSES.map(cls => (
                        <button
                            key={cls}
                            className={`class-filter-btn ${selectedClass === cls ? 'active' : ''}`}
                            onClick={() => setSelectedClass(cls)}
                        >
                            {cls}
                        </button>
                    ))}
                </div>

                {/* Section filters */}
                {selectedClass !== 'All Classes' && availableSections.length > 0 && (
                    <div className="class-filters-container" style={{ marginTop: '10px' }}>
                        <button
                            className={`class-filter-btn ${selectedSection === 'All Sections' ? 'active' : ''}`}
                            onClick={() => setSelectedSection('All Sections')}
                        >
                            All Sections
                        </button>
                        {availableSections.map(sec => (
                            <button
                                key={sec}
                                className={`class-filter-btn ${selectedSection === sec ? 'active' : ''}`}
                                onClick={() => setSelectedSection(sec)}
                            >
                                {sec}
                            </button>
                        ))}
                    </div>
                )}

                {/* Loading */}
                {isLoading && (
                    <div className="results-section">
                        <p className="loading-text">Loading withdrawn students...</p>
                    </div>
                )}

                {/* Students */}
                {!isLoading && filteredStudents.length > 0 && (
                    <div className="results-section">
                        <div className="results-header-row">
                            <h2 className="results-title">
                                {selectedClass === 'All Classes'
                                    ? `All Withdrawn Students (${filteredStudents.length})`
                                    : `Class: ${selectedClass}${selectedSection !== 'All Sections' ? ` (${selectedSection})` : ''} — ${filteredStudents.length} student(s)`}
                            </h2>
                            <button onClick={handleExportXLSX} className="export-xlsx-btn" disabled={isExporting}>
                                <Download size={20} />
                                <span>{isExporting ? 'Exporting...' : 'Export XLSX'}</span>
                            </button>
                        </div>

                        {viewMode === 'card' ? (
                            <div className="students-grid">
                                {filteredStudents.map((student) => (
                                    <div key={student.reg_no} className="student-card withdrawn-card">
                                        <div className="student-header-card">
                                            <h3>{student.student_name}</h3>
                                            <span className="reg-badge">{student.reg_no}</span>
                                        </div>
                                        {/* Withdrawal class badge */}
                                        <div className="withdrawl-class-badge">
                                            <UserMinus size={13} />
                                            <span>Withdrawn from: <strong>{student.class_of_withdrawl || 'N/A'}</strong></span>
                                        </div>
                                        <div className="student-details">
                                            <p><strong>Gender:</strong> {student.gender || 'N/A'}</p>
                                            <p><strong>B-Form:</strong> {student.b_form || 'N/A'}</p>
                                            <p><strong>DOB:</strong> {student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}</p>
                                            <p><strong>Admission Date:</strong> {student.admission_date ? new Date(student.admission_date).toLocaleDateString() : 'N/A'}</p>
                                            <p><strong>Father/Guardian:</strong> {student.f_g_name || 'N/A'}</p>
                                            <p><strong>Contact CNIC:</strong> {student.f_g_cnic || 'N/A'}</p>
                                            <p><strong>Contact:</strong> {student.f_g_contact || 'N/A'}</p>
                                            <p><strong>Address:</strong> {student.address || 'N/A'}</p>
                                            <p><strong>Class Enrolled:</strong> {student.class_enrolled || 'N/A'}</p>
                                            <p><strong>Section:</strong> {student.section || 'N/A'}</p>
                                            <p><strong>Group:</strong> {student.group || 'N/A'}</p>
                                            <p><strong>Class of Adm.:</strong> {student.class_of_admission || 'N/A'}</p>
                                            <p><strong>Caste:</strong> {student.caste || 'N/A'}</p>
                                            <p><strong>Monthly Fee:</strong> {student.monthly_fee != null ? student.monthly_fee : 'N/A'}</p>
                                            <p><strong>No Fee:</strong> {student.no_fee || 'N/A'}</p>
                                        </div>
                                        <div className="student-card-actions">
                                            <button
                                                className="card-action-btn card-delete-btn"
                                                onClick={() => handleDeleteClick(student)}
                                            >
                                                <Trash2 size={14} /> Delete Permanently
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="students-table">
                                    <thead>
                                        <tr>
                                            <th>Reg No.</th>
                                            <th>Name</th>
                                            <th>Class of Withdrawl</th>
                                            <th>Class Enrolled</th>
                                            <th>Section</th>
                                            <th>Gender</th>
                                            <th>B-Form</th>
                                            <th>DOB</th>
                                            <th>Admission Date</th>
                                            <th>Father Name</th>
                                            <th>Contact CNIC</th>
                                            <th>Contact</th>
                                            <th>Address</th>
                                            <th>Group</th>
                                            <th>Class of Adm.</th>
                                            <th>Caste</th>
                                            <th>Monthly Fee</th>
                                            <th>No Fee</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudents.map((student) => (
                                            <tr key={student.reg_no}>
                                                <td><span className="reg-badge">{student.reg_no}</span></td>
                                                <td><strong>{student.student_name || 'N/A'}</strong></td>
                                                <td><span className="withdrawal-class-cell">{student.class_of_withdrawl || 'N/A'}</span></td>
                                                <td>{student.class_enrolled || 'N/A'}</td>
                                                <td>{student.section || 'N/A'}</td>
                                                <td>{student.gender || 'N/A'}</td>
                                                <td>{student.b_form || 'N/A'}</td>
                                                <td>{student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}</td>
                                                <td>{student.admission_date ? new Date(student.admission_date).toLocaleDateString() : 'N/A'}</td>
                                                <td>{student.f_g_name || 'N/A'}</td>
                                                <td>{student.f_g_cnic || 'N/A'}</td>
                                                <td>{student.f_g_contact || 'N/A'}</td>
                                                <td>{student.address || 'N/A'}</td>
                                                <td>{student.group || 'N/A'}</td>
                                                <td>{student.class_of_admission || 'N/A'}</td>
                                                <td>{student.caste || 'N/A'}</td>
                                                <td>{student.monthly_fee != null ? student.monthly_fee : 'N/A'}</td>
                                                <td>{student.no_fee || 'N/A'}</td>
                                                <td>
                                                    <div className="table-action-btns">
                                                        <button
                                                            className="table-action-btn table-delete-btn"
                                                            onClick={() => handleDeleteClick(student)}
                                                        >
                                                            <Trash2 size={12} /> Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {!isLoading && filteredStudents.length === 0 && (
                    <div className="no-results withdrawn-empty">
                        <UserMinus size={48} className="empty-icon" />
                        <p>No withdrawn students found{searchQuery.trim() ? ` matching "${searchQuery}"` : ''}.</p>
                    </div>
                )}
            </div>

            {/* ===== Manual Add Modal ===== */}
            {showAddModal && (
                <div className="modal-overlay" onClick={handleCloseAddModal}>
                    <div className="modal-content add-withdrawn-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><PlusCircle size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />Add Withdrawn Record</h2>
                            <button className="modal-close-btn" onClick={handleCloseAddModal} disabled={isSubmitting}>
                                <X size={20} />
                            </button>
                        </div>

                        <form className="add-withdrawn-form" onSubmit={handleAddSubmit}>
                            <p className="add-form-hint">Fields marked <span className="required-star">*</span> are required.</p>

                            <div className="add-form-grid">
                                {/* Row 1 */}
                                <div className="form-group">
                                    <label>Reg. No. <span className="required-star">*</span></label>
                                    <input type="number" name="reg_no" value={addForm.reg_no} onChange={handleAddFormChange} placeholder="e.g. 101" required />
                                </div>
                                <div className="form-group">
                                    <label>Student Name <span className="required-star">*</span></label>
                                    <input type="text" name="student_name" value={addForm.student_name} onChange={handleAddFormChange} placeholder="Full name" required />
                                </div>
                                <div className="form-group">
                                    <label>Gender</label>
                                    <select name="gender" value={addForm.gender} onChange={handleAddFormChange}>
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>B-Form</label>
                                    <input type="text" name="b_form" value={addForm.b_form} onChange={handleAddFormChange} placeholder="B-Form number" />
                                </div>
                                <div className="form-group">
                                    <label>Date of Birth</label>
                                    <input type="date" name="dob" value={addForm.dob} onChange={handleAddFormChange} />
                                </div>
                                <div className="form-group">
                                    <label>Admission Date</label>
                                    <input type="date" name="admission_date" value={addForm.admission_date} onChange={handleAddFormChange} />
                                </div>

                                {/* Row 2 */}
                                <div className="form-group">
                                    <label>Father/Guardian Name</label>
                                    <input type="text" name="f_g_name" value={addForm.f_g_name} onChange={handleAddFormChange} placeholder="Guardian name" />
                                </div>
                                <div className="form-group">
                                    <label>Guardian CNIC</label>
                                    <input type="text" name="f_g_cnic" value={addForm.f_g_cnic} onChange={handleAddFormChange} placeholder="CNIC number" />
                                </div>
                                <div className="form-group">
                                    <label>Guardian Contact</label>
                                    <input type="text" name="f_g_contact" value={addForm.f_g_contact} onChange={handleAddFormChange} placeholder="Phone number" />
                                </div>
                                <div className="form-group form-group-wide">
                                    <label>Address</label>
                                    <input type="text" name="address" value={addForm.address} onChange={handleAddFormChange} placeholder="Full address" />
                                </div>

                                {/* Row 3 */}
                                <div className="form-group">
                                    <label>Class Enrolled</label>
                                    <select name="class_enrolled" value={addForm.class_enrolled} onChange={handleAddFormChange}>
                                        <option value="">Select</option>
                                        {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Class of Withdrawal</label>
                                    <select name="class_of_withdrawl" value={addForm.class_of_withdrawl} onChange={handleAddFormChange}>
                                        <option value="">Select</option>
                                        {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Section</label>
                                    <input type="text" name="section" value={addForm.section} onChange={handleAddFormChange} placeholder="e.g. A" />
                                </div>
                                <div className="form-group">
                                    <label>Group</label>
                                    <input type="text" name="group" value={addForm.group} onChange={handleAddFormChange} placeholder="e.g. Science" />
                                </div>
                                <div className="form-group">
                                    <label>Class of Admission</label>
                                    <select name="class_of_admission" value={addForm.class_of_admission} onChange={handleAddFormChange}>
                                        <option value="">Select</option>
                                        {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Caste</label>
                                    <input type="text" name="caste" value={addForm.caste} onChange={handleAddFormChange} placeholder="Caste" />
                                </div>
                                <div className="form-group">
                                    <label>Monthly Fee</label>
                                    <input type="number" name="monthly_fee" value={addForm.monthly_fee} onChange={handleAddFormChange} placeholder="e.g. 500" />
                                </div>
                                <div className="form-group">
                                    <label>No Fee</label>
                                    <select name="no_fee" value={addForm.no_fee} onChange={handleAddFormChange}>
                                        <option value="">Select</option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>
                            </div>

                            {addError && (
                                <div className="add-form-error">
                                    <AlertTriangle size={15} /> {addError}
                                </div>
                            )}

                            <div className="modal-footer-btns">
                                <button type="button" className="modal-cancel-btn" onClick={handleCloseAddModal} disabled={isSubmitting}>Cancel</button>
                                <button type="submit" className="modal-submit-btn add-withdrawn-submit-btn" disabled={isSubmitting}>
                                    {isSubmitting ? 'Adding...' : 'Add Record'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== Delete Confirmation Modal ===== */}
            {studentToDelete && (
                <div className="modal-overlay" onClick={() => !isDeleting && setStudentToDelete(null)}>
                    <div className="modal-content delete-confirm-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Delete Permanently</h2>
                            <button className="modal-close-btn" onClick={() => setStudentToDelete(null)} disabled={isDeleting}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="delete-warning-banner">
                            <AlertTriangle size={18} />
                            This will permanently remove the record from the withdrawal archive. This cannot be undone.
                        </div>
                        <div className="delete-student-preview">
                            <div className="delete-preview-header">
                                <span className="delete-preview-name">{studentToDelete.student_name}</span>
                                <span className="reg-badge">{studentToDelete.reg_no}</span>
                            </div>
                            <div className="delete-preview-details">
                                <span>Class of Withdrawl: <strong>{studentToDelete.class_of_withdrawl || 'N/A'}</strong></span>
                                <span>Class Enrolled: <strong>{studentToDelete.class_enrolled || 'N/A'}</strong></span>
                                <span>Gender: <strong>{studentToDelete.gender || 'N/A'}</strong></span>
                                <span>Father/Guardian: <strong>{studentToDelete.f_g_name || 'N/A'}</strong></span>
                            </div>
                        </div>
                        <p className="delete-confirm-question">Are you sure you want to delete this record?</p>
                        <div className="modal-footer-btns">
                            <button className="modal-cancel-btn" onClick={() => setStudentToDelete(null)} disabled={isDeleting}>Cancel</button>
                            <button className="modal-submit-btn modal-red-btn" onClick={handleConfirmDelete} disabled={isDeleting}>
                                {isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Delete Success Modal ===== */}
            {showDeleteSuccess && (
                <div className="modal-overlay" onClick={() => setShowDeleteSuccess(false)}>
                    <div className="modal-content success-modal-centered" onClick={e => e.stopPropagation()}>
                        <div className="success-icon-wrap red-icon">
                            <CheckCircle size={40} />
                        </div>
                        <p className="success-modal-title">Record Deleted</p>
                        <p className="success-modal-desc">The withdrawn student record has been permanently removed.</p>
                        <div className="modal-footer-btns" style={{ justifyContent: 'center' }}>
                            <button className="modal-submit-btn modal-red-btn" onClick={() => setShowDeleteSuccess(false)}>Done</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Add Success Modal ===== */}
            {showAddSuccess && (
                <div className="modal-overlay" onClick={() => setShowAddSuccess(false)}>
                    <div className="modal-content success-modal-centered" onClick={e => e.stopPropagation()}>
                        <div className="success-icon-wrap">
                            <CheckCircle size={40} />
                        </div>
                        <p className="success-modal-title">Record Added</p>
                        <p className="success-modal-desc">The withdrawn student record has been successfully added to the archive.</p>
                        <div className="modal-footer-btns" style={{ justifyContent: 'center' }}>
                            <button className="modal-submit-btn add-withdrawn-submit-btn" onClick={() => setShowAddSuccess(false)}>Done</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
