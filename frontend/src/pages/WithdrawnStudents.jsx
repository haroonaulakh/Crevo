import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut, Download, ArrowLeft, LayoutGrid, Table as TableIcon, UserMinus, Trash2, AlertTriangle, CheckCircle, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { withdrawnAPI } from '../services/api';
import './WithdrawnStudents.css';

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

    const CLASSES = ['All Classes', 'PG', 'Nur', 'Prep', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

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
        </div>
    );
}
