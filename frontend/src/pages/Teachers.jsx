import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut, Download, ArrowLeft, LayoutGrid, Table as TableIcon, Plus, X, CheckCircle, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { teachersAPI } from '../services/api';
import './Teachers.css';

export default function Teachers() {
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [allTeachers, setAllTeachers] = useState([]);
    const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [viewMode, setViewMode] = useState('card');

    // Add teacher state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [newTeacher, setNewTeacher] = useState({
        teacher_name: '',
        teacher_fg_name: '',
        dob: '',
        qualification: '',
        joining_date: '',
        teacher_cnic: '',
        teacher_contact: '',
        teacher_address: '',
    });

    // Update teacher state
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedTeacherForUpdate, setSelectedTeacherForUpdate] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateFormData, setUpdateFormData] = useState({});

    // Delete teacher state
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [teacherToDelete, setTeacherToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false);

    useEffect(() => {
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        if (isAuthenticated !== 'true') {
            navigate('/login');
            return;
        }
        fetchAllTeachers();
    }, [navigate]);

    const fetchAllTeachers = async () => {
        setIsLoadingTeachers(true);
        try {
            const teachers = await teachersAPI.getAll();
            setAllTeachers(Array.isArray(teachers) ? teachers : []);
        } catch (error) {
            console.error('Error fetching teachers:', error);
            alert('Error fetching teachers: ' + error.message);
            setAllTeachers([]);
        } finally {
            setIsLoadingTeachers(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userEmail');
        navigate('/login');
    };

    // Client-side search/filter
    const filteredTeachers = searchQuery.trim()
        ? allTeachers.filter(t => {
            const q = searchQuery.trim().toLowerCase();
            return (
                String(t.teacher_id).includes(q) ||
                (t.teacher_name || '').toLowerCase().includes(q) ||
                (t.teacher_fg_name || '').toLowerCase().includes(q) ||
                (t.teacher_cnic || '').toLowerCase().includes(q) ||
                (t.teacher_contact || '').toLowerCase().includes(q)
            );
        })
        : allTeachers;

    const handleExportXLSX = async () => {
        setIsExporting(true);
        try {
            const dataToExport = filteredTeachers;
            if (!dataToExport || dataToExport.length === 0) {
                alert('No teachers to export.');
                return;
            }

            const formattedData = dataToExport.map((t) => ({
                'Teacher ID': t.teacher_id,
                'Teacher Name': t.teacher_name || 'N/A',
                'Father/Guardian Name': t.teacher_fg_name || 'N/A',
                'Date of Birth': t.dob ? new Date(t.dob).toLocaleDateString() : 'N/A',
                'Qualification': t.qualification || 'N/A',
                'Joining Date': t.joining_date ? new Date(t.joining_date).toLocaleDateString() : 'N/A',
                'CNIC': t.teacher_cnic || 'N/A',
                'Contact': t.teacher_contact || 'N/A',
                'Address': t.teacher_address || 'N/A',
            }));

            const ws = XLSX.utils.json_to_sheet(formattedData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Teachers");

            const dateStr = new Date().toISOString().split('T')[0];
            const filename = searchQuery.trim()
                ? `Teachers_Search_Results_${dateStr}`
                : `All_Teachers_${dateStr}`;
            XLSX.writeFile(wb, `${filename}.xlsx`);
        } catch (error) {
            alert('Error exporting XLSX: ' + error.message);
        } finally {
            setIsExporting(false);
        }
    };

    // ---- ADD ----
    const handleAddInputChange = (e) => {
        const { name, value } = e.target;
        setNewTeacher(prev => ({ ...prev, [name]: value }));
    };

    const handleAddTeacher = async (e) => {
        e.preventDefault();
        setIsAdding(true);
        try {
            const teacherData = {
                teacher_name: newTeacher.teacher_name,
                teacher_fg_name: newTeacher.teacher_fg_name || null,
                dob: newTeacher.dob || null,
                qualification: newTeacher.qualification || null,
                joining_date: newTeacher.joining_date || null,
                teacher_cnic: newTeacher.teacher_cnic || null,
                teacher_contact: newTeacher.teacher_contact || null,
                teacher_address: newTeacher.teacher_address || null,
            };

            Object.keys(teacherData).forEach((key) => {
                if (teacherData[key] === null || teacherData[key] === '') {
                    delete teacherData[key];
                }
            });

            await teachersAPI.add(teacherData);
            setShowSuccessModal(true);
            setNewTeacher({
                teacher_name: '',
                teacher_fg_name: '',
                dob: '',
                qualification: '',
                joining_date: '',
                teacher_cnic: '',
                teacher_contact: '',
                teacher_address: '',
            });
            fetchAllTeachers();
        } catch (error) {
            alert('Error adding teacher: ' + error.message);
        } finally {
            setIsAdding(false);
        }
    };

    // ---- UPDATE ----
    const handleOpenUpdateModal = (teacher) => {
        setSelectedTeacherForUpdate(teacher);
        setUpdateFormData({
            teacher_name: teacher.teacher_name || '',
            teacher_fg_name: teacher.teacher_fg_name || '',
            dob: teacher.dob || '',
            qualification: teacher.qualification || '',
            joining_date: teacher.joining_date || '',
            teacher_cnic: teacher.teacher_cnic || '',
            teacher_contact: teacher.teacher_contact || '',
            teacher_address: teacher.teacher_address || '',
        });
        setIsUpdateModalOpen(true);
    };

    const handleUpdateInputChange = (e) => {
        const { name, value } = e.target;
        setUpdateFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const dataToUpdate = { ...updateFormData };
            // Convert empty strings to null for optional fields
            Object.keys(dataToUpdate).forEach(key => {
                if (dataToUpdate[key] === '') dataToUpdate[key] = null;
            });

            await teachersAPI.update(selectedTeacherForUpdate.teacher_id, dataToUpdate);
            alert('Teacher updated successfully');
            setIsUpdateModalOpen(false);
            setSelectedTeacherForUpdate(null);
            fetchAllTeachers();
        } catch (error) {
            alert('Error updating teacher: ' + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    // ---- DELETE ----
    const handleOpenDeleteConfirm = (teacher) => {
        setTeacherToDelete(teacher);
        setIsDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!teacherToDelete) return;
        setIsDeleting(true);
        try {
            await teachersAPI.delete(teacherToDelete.teacher_id);
            setIsDeleteConfirmOpen(false);
            setTeacherToDelete(null);
            setDeleteSuccessOpen(true);
            fetchAllTeachers();
        } catch (error) {
            alert('Error deleting teacher: ' + error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="teachers-container">
            <div className="teachers-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft size={20} />
                        <span className="back-btn-text">Back to Dashboard</span>
                    </button>
                    <div className="header-content">
                        <h1 className="dashboard-title">Teacher Directory</h1>
                    </div>
                </div>
                <div className="header-actions">
                    <button onClick={handleLogout} className="logout-btn">
                        <LogOut size={18} />
                        <span className="logout-text">Logout</span>
                    </button>
                </div>
            </div>

            <div className="teachers-content">
                {/* Search, Export, Toggle, and Actions */}
                <div className="search-section">
                    <div className="search-container">
                        <Search className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by ID, name, CNIC, or contact..."
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

                        <div className="record-action-buttons">
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="action-record-btn add-teacher-record-btn"
                            >
                                <Plus size={18} />
                                <span>Add New Teacher</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Teachers display */}
                {isLoadingTeachers && (
                    <div className="results-section">
                        <p className="loading-text">Loading teachers...</p>
                    </div>
                )}

                {!isLoadingTeachers && filteredTeachers.length > 0 && (
                    <div className="results-section">
                        <div className="results-header-row">
                            <h2 className="results-title">
                                {searchQuery.trim()
                                    ? `Search Results (${filteredTeachers.length})`
                                    : `All Teachers (${filteredTeachers.length})`}
                            </h2>
                            <button onClick={handleExportXLSX} className="export-xlsx-btn" disabled={isExporting}>
                                <Download size={20} />
                                <span>{isExporting ? 'Exporting...' : 'Export XLSX'}</span>
                            </button>
                        </div>

                        {viewMode === 'card' ? (
                            <div className="teachers-grid">
                                {filteredTeachers.map((teacher) => (
                                    <div key={teacher.teacher_id} className="teacher-card">
                                        <div className="teacher-header-card">
                                            <h3>{teacher.teacher_name}</h3>
                                            <span className="teacher-id-badge">{teacher.teacher_id}</span>
                                        </div>
                                        <div className="teacher-details">
                                            <p><strong>Father/Guardian:</strong> {teacher.teacher_fg_name || 'N/A'}</p>
                                            <p><strong>DOB:</strong> {teacher.dob ? new Date(teacher.dob).toLocaleDateString() : 'N/A'}</p>
                                            <p><strong>Qualification:</strong> {teacher.qualification || 'N/A'}</p>
                                            <p><strong>Joining Date:</strong> {teacher.joining_date ? new Date(teacher.joining_date).toLocaleDateString() : 'N/A'}</p>
                                            <p><strong>CNIC:</strong> {teacher.teacher_cnic || 'N/A'}</p>
                                            <p><strong>Contact:</strong> {teacher.teacher_contact || 'N/A'}</p>
                                            <p><strong>Address:</strong> {teacher.teacher_address || 'N/A'}</p>
                                        </div>
                                        <div className="teacher-card-actions">
                                            <button onClick={() => handleOpenUpdateModal(teacher)} className="card-action-btn card-update-btn">
                                                <Edit2 size={15} /> Update
                                            </button>
                                            <button onClick={() => handleOpenDeleteConfirm(teacher)} className="card-action-btn card-delete-btn">
                                                <Trash2 size={15} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="teachers-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th>Father/Guardian</th>
                                            <th>DOB</th>
                                            <th>Qualification</th>
                                            <th>Joining Date</th>
                                            <th>CNIC</th>
                                            <th>Contact</th>
                                            <th>Address</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTeachers.map((teacher) => (
                                            <tr key={teacher.teacher_id}>
                                                <td><span className="teacher-id-badge">{teacher.teacher_id}</span></td>
                                                <td><strong>{teacher.teacher_name || 'N/A'}</strong></td>
                                                <td>{teacher.teacher_fg_name || 'N/A'}</td>
                                                <td>{teacher.dob ? new Date(teacher.dob).toLocaleDateString() : 'N/A'}</td>
                                                <td>{teacher.qualification || 'N/A'}</td>
                                                <td>{teacher.joining_date ? new Date(teacher.joining_date).toLocaleDateString() : 'N/A'}</td>
                                                <td>{teacher.teacher_cnic || 'N/A'}</td>
                                                <td>{teacher.teacher_contact || 'N/A'}</td>
                                                <td>{teacher.teacher_address || 'N/A'}</td>
                                                <td>
                                                    <div className="table-action-btns">
                                                        <button onClick={() => handleOpenUpdateModal(teacher)} className="table-action-btn table-update-btn">
                                                            <Edit2 size={13} /> Update
                                                        </button>
                                                        <button onClick={() => handleOpenDeleteConfirm(teacher)} className="table-action-btn table-delete-btn">
                                                            <Trash2 size={13} /> Delete
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

                {!isLoadingTeachers && filteredTeachers.length === 0 && searchQuery.trim() && (
                    <div className="no-results">
                        <p>No teachers found matching "{searchQuery}"</p>
                    </div>
                )}

                {!isLoadingTeachers && filteredTeachers.length === 0 && !searchQuery.trim() && (
                    <div className="no-results">
                        <p>No teachers found in the database</p>
                    </div>
                )}
            </div>

            {/* ===== ADD TEACHER MODAL ===== */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content add-teacher-modal">
                        <div className="modal-header">
                            <h2>Add New Teacher</h2>
                            <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                                <X size={22} />
                            </button>
                        </div>
                        <form onSubmit={handleAddTeacher} className="add-teacher-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Teacher Name *</label>
                                    <input type="text" name="teacher_name" value={newTeacher.teacher_name} onChange={handleAddInputChange} required className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Father/Guardian Name</label>
                                    <input type="text" name="teacher_fg_name" value={newTeacher.teacher_fg_name} onChange={handleAddInputChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Date of Birth</label>
                                    <input type="date" name="dob" value={newTeacher.dob} onChange={handleAddInputChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Qualification</label>
                                    <input type="text" name="qualification" value={newTeacher.qualification} onChange={handleAddInputChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Joining Date</label>
                                    <input type="date" name="joining_date" value={newTeacher.joining_date} onChange={handleAddInputChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>CNIC</label>
                                    <input type="text" name="teacher_cnic" value={newTeacher.teacher_cnic} onChange={handleAddInputChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Contact</label>
                                    <input type="text" name="teacher_contact" value={newTeacher.teacher_contact} onChange={handleAddInputChange} className="form-input" />
                                </div>
                                <div className="form-group form-group-wide">
                                    <label>Address</label>
                                    <input type="text" name="teacher_address" value={newTeacher.teacher_address} onChange={handleAddInputChange} className="form-input" />
                                </div>
                            </div>
                            <div className="modal-footer-btns" style={{ marginTop: '1.5rem' }}>
                                <button type="button" className="modal-cancel-btn" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                                <button type="submit" className="modal-submit-btn modal-teal-btn" disabled={isAdding}>
                                    {isAdding ? 'Adding...' : 'Add Teacher'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== ADD SUCCESS MODAL ===== */}
            {showSuccessModal && (
                <div className="modal-overlay">
                    <div className="modal-content success-modal-centered">
                        <div className="success-icon-wrap teal-icon">
                            <CheckCircle size={52} />
                        </div>
                        <h2 className="success-modal-title">Teacher Added!</h2>
                        <p className="success-modal-desc">The teacher record has been successfully created.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="modal-submit-btn modal-teal-btn"
                                style={{ width: '100%' }}
                            >
                                Add Another Teacher
                            </button>
                            <button
                                onClick={() => { setShowSuccessModal(false); setIsAddModalOpen(false); }}
                                className="modal-cancel-btn"
                                style={{ width: '100%' }}
                            >
                                Back to Teachers
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== UPDATE TEACHER MODAL ===== */}
            {isUpdateModalOpen && selectedTeacherForUpdate && (
                <div className="modal-overlay">
                    <div className="modal-content add-teacher-modal">
                        <div className="modal-header">
                            <h2>Update Teacher: {selectedTeacherForUpdate.teacher_name}</h2>
                            <button className="modal-close-btn" onClick={() => setIsUpdateModalOpen(false)}>
                                <X size={22} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateSubmit} className="add-teacher-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Teacher Name *</label>
                                    <input type="text" name="teacher_name" value={updateFormData.teacher_name} onChange={handleUpdateInputChange} required className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Father/Guardian Name</label>
                                    <input type="text" name="teacher_fg_name" value={updateFormData.teacher_fg_name} onChange={handleUpdateInputChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Date of Birth</label>
                                    <input type="date" name="dob" value={updateFormData.dob ? updateFormData.dob.substring(0, 10) : ''} onChange={handleUpdateInputChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Qualification</label>
                                    <input type="text" name="qualification" value={updateFormData.qualification} onChange={handleUpdateInputChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Joining Date</label>
                                    <input type="date" name="joining_date" value={updateFormData.joining_date ? updateFormData.joining_date.substring(0, 10) : ''} onChange={handleUpdateInputChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>CNIC</label>
                                    <input type="text" name="teacher_cnic" value={updateFormData.teacher_cnic} onChange={handleUpdateInputChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Contact</label>
                                    <input type="text" name="teacher_contact" value={updateFormData.teacher_contact} onChange={handleUpdateInputChange} className="form-input" />
                                </div>
                                <div className="form-group form-group-wide">
                                    <label>Address</label>
                                    <input type="text" name="teacher_address" value={updateFormData.teacher_address} onChange={handleUpdateInputChange} className="form-input" />
                                </div>
                            </div>
                            <div className="modal-footer-btns" style={{ marginTop: '1.5rem' }}>
                                <button type="button" className="modal-cancel-btn" onClick={() => setIsUpdateModalOpen(false)}>Cancel</button>
                                <button type="submit" className="modal-submit-btn modal-blue-btn" disabled={isUpdating}>
                                    {isUpdating ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== DELETE CONFIRMATION MODAL ===== */}
            {isDeleteConfirmOpen && teacherToDelete && (
                <div className="modal-overlay">
                    <div className="modal-content delete-confirm-modal">
                        <div className="modal-header">
                            <h3>Confirm Deletion</h3>
                            <button className="modal-close-btn" onClick={() => { setIsDeleteConfirmOpen(false); setTeacherToDelete(null); }}>
                                <X size={22} />
                            </button>
                        </div>

                        <div className="delete-warning-banner">
                            <AlertTriangle size={20} />
                            <span>This action is permanent and cannot be undone.</span>
                        </div>

                        {/* Teacher preview */}
                        <div className="delete-teacher-preview">
                            <div className="delete-preview-header">
                                <span className="delete-preview-name">{teacherToDelete.teacher_name}</span>
                                <span className="teacher-id-badge">{teacherToDelete.teacher_id}</span>
                            </div>
                            <div className="delete-preview-details">
                                <span><strong>Father/Guardian:</strong> {teacherToDelete.teacher_fg_name || 'N/A'}</span>
                                <span><strong>Qualification:</strong> {teacherToDelete.qualification || 'N/A'}</span>
                                <span><strong>Contact:</strong> {teacherToDelete.teacher_contact || 'N/A'}</span>
                                <span><strong>CNIC:</strong> {teacherToDelete.teacher_cnic || 'N/A'}</span>
                            </div>
                        </div>

                        <p className="delete-confirm-question">Are you sure you want to permanently delete this teacher record?</p>

                        <div className="modal-footer-btns">
                            <button
                                className="modal-cancel-btn"
                                onClick={() => { setIsDeleteConfirmOpen(false); setTeacherToDelete(null); }}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="modal-submit-btn modal-red-btn"
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== DELETE SUCCESS MODAL ===== */}
            {deleteSuccessOpen && (
                <div className="modal-overlay">
                    <div className="modal-content success-modal-centered">
                        <div className="success-icon-wrap red-icon">
                            <CheckCircle size={52} />
                        </div>
                        <h2 className="success-modal-title">Record Deleted</h2>
                        <p className="success-modal-desc">The teacher record has been permanently removed from the database.</p>
                        <button
                            onClick={() => setDeleteSuccessOpen(false)}
                            className="modal-submit-btn modal-red-btn"
                            style={{ width: '100%' }}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
