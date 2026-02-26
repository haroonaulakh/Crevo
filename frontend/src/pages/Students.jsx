import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut, Download, ArrowLeft, LayoutGrid, Table as TableIcon, Edit2, Trash2, X, AlertTriangle, CheckCircle, UserMinus } from 'lucide-react';
import * as XLSX from 'xlsx';
import { studentsAPI } from '../services/api';
import './Students.css';

export default function Students() {
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // --- Update state ---
    const [isLookingUpUpdate, setIsLookingUpUpdate] = useState(false);
    const [isRegPromptOpen, setIsRegPromptOpen] = useState(false);
    const [regNoInputValue, setRegNoInputValue] = useState('');
    const [updateNotFoundMsg, setUpdateNotFoundMsg] = useState('');
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedStudentForUpdate, setSelectedStudentForUpdate] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateFormData, setUpdateFormData] = useState({});

    // --- Delete Type Modal ---
    const [isDeleteTypeModalOpen, setIsDeleteTypeModalOpen] = useState(false);
    const [pendingDeleteStudent, setPendingDeleteStudent] = useState(null); // pre-set when clicking inline delete btn

    // --- WITHDRAW state ---
    const [isWithdrawRegPromptOpen, setIsWithdrawRegPromptOpen] = useState(false);
    const [withdrawRegNoValue, setWithdrawRegNoValue] = useState('');
    const [isLookingUpWithdraw, setIsLookingUpWithdraw] = useState(false);
    const [withdrawNotFoundMsg, setWithdrawNotFoundMsg] = useState('');
    const [studentToWithdraw, setStudentToWithdraw] = useState(null);
    const [isWithdrawDetailsOpen, setIsWithdrawDetailsOpen] = useState(false);
    const [useCurrentClass, setUseCurrentClass] = useState(true);
    const [manualWithdrawClass, setManualWithdrawClass] = useState('');
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [withdrawSuccessOpen, setWithdrawSuccessOpen] = useState(false);

    // --- PERMANENT DELETE state ---
    const [isDeletePromptOpen, setIsDeletePromptOpen] = useState(false);
    const [deleteRegNoValue, setDeleteRegNoValue] = useState('');
    const [isLookingUpDelete, setIsLookingUpDelete] = useState(false);
    const [deleteNotFoundMsg, setDeleteNotFoundMsg] = useState('');
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false);

    const [selectedClass, setSelectedClass] = useState('All Classes');
    const [selectedSection, setSelectedSection] = useState('All Sections');
    const [viewMode, setViewMode] = useState('card');

    const CLASSES = ['All Classes', 'PG', 'Nur', 'Prep', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

    useEffect(() => {
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        if (isAuthenticated !== 'true') {
            navigate('/login');
            return;
        }
        fetchAllStudents();
    }, [navigate]);

    useEffect(() => {
        setSelectedSection('All Sections');
    }, [selectedClass]);

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

    // ---- UPDATE ----
    const handlePromptUpdate = async (e) => {
        if (e) e.preventDefault();
        if (!regNoInputValue || !regNoInputValue.trim()) return;
        const query = regNoInputValue.trim();
        setIsLookingUpUpdate(true);
        setUpdateNotFoundMsg('');
        try {
            const results = await studentsAPI.search(query);
            const match = results.find(s => String(s.reg_no) === query);
            if (match) {
                setIsRegPromptOpen(false);
                setUpdateNotFoundMsg('');
                handleOpenUpdateModal(match);
            } else {
                setUpdateNotFoundMsg(`No student found with Registration Number "${query}".`);
            }
        } catch (error) {
            setUpdateNotFoundMsg('An error occurred while searching. Please try again.');
        } finally {
            setIsLookingUpUpdate(false);
        }
    };

    const handleOpenUpdateModal = (student) => {
        setSelectedStudentForUpdate(student);
        setUpdateFormData({
            student_name: student.student_name || '',
            gender: student.gender || '',
            b_form: student.b_form || '',
            dob: student.dob || '',
            admission_date: student.admission_date || '',
            f_g_name: student.f_g_name || '',
            f_g_cnic: student.f_g_cnic || '',
            f_g_contact: student.f_g_contact || '',
            address: student.address || '',
            class_enrolled: student.class_enrolled || '',
            section: student.section || '',
            group: student.group || '',
            class_of_admission: student.class_of_admission || '',
            caste: student.caste || '',
            monthly_fee: student.monthly_fee != null ? student.monthly_fee : '',
            no_fee: student.no_fee || '',
        });
        setIsUpdateModalOpen(true);
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const dataToUpdate = { ...updateFormData };
            if (dataToUpdate.monthly_fee === '') dataToUpdate.monthly_fee = null;
            await studentsAPI.update(selectedStudentForUpdate.reg_no, dataToUpdate);
            alert('Student updated successfully');
            setIsUpdateModalOpen(false);
            setSelectedStudentForUpdate(null);
            fetchAllStudents();
        } catch (error) {
            alert('Error updating student: ' + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateInputChange = (e) => {
        const { name, value } = e.target;
        setUpdateFormData((prev) => ({ ...prev, [name]: value }));
    };

    // ---- DELETE TYPE MODAL ----
    // Opens from toolbar button (no pre-set student)
    const openDeleteTypeModal = () => {
        setPendingDeleteStudent(null);
        setIsDeleteTypeModalOpen(true);
    };

    // Opens from inline card/table button (student already known)
    const openDeleteTypeModalForStudent = (student) => {
        setPendingDeleteStudent(student);
        setIsDeleteTypeModalOpen(true);
    };

    const handleChooseWithdraw = () => {
        setIsDeleteTypeModalOpen(false);
        if (pendingDeleteStudent) {
            // Skip reg_no prompt – we already have the student
            setStudentToWithdraw(pendingDeleteStudent);
            setUseCurrentClass(true);
            setManualWithdrawClass('');
            setWithdrawNotFoundMsg('');
            setIsWithdrawDetailsOpen(true);
        } else {
            setWithdrawRegNoValue('');
            setWithdrawNotFoundMsg('');
            setIsWithdrawRegPromptOpen(true);
        }
    };

    const handleChooseDeletePermanently = () => {
        setIsDeleteTypeModalOpen(false);
        if (pendingDeleteStudent) {
            setStudentToDelete(pendingDeleteStudent);
            setIsDeleteConfirmOpen(true);
        } else {
            setDeleteRegNoValue('');
            setDeleteNotFoundMsg('');
            setIsDeletePromptOpen(true);
        }
    };

    // ---- WITHDRAW ----
    const handleWithdrawRegLookup = async (e) => {
        if (e) e.preventDefault();
        if (!withdrawRegNoValue || !withdrawRegNoValue.trim()) return;
        const query = withdrawRegNoValue.trim();
        setIsLookingUpWithdraw(true);
        setWithdrawNotFoundMsg('');
        try {
            const results = await studentsAPI.search(query);
            const match = results.find(s => String(s.reg_no) === query);
            if (match) {
                setStudentToWithdraw(match);
                setUseCurrentClass(true);
                setManualWithdrawClass('');
                setIsWithdrawRegPromptOpen(false);
                setIsWithdrawDetailsOpen(true);
            } else {
                setWithdrawNotFoundMsg(`No student found with Registration Number "${query}".`);
            }
        } catch (error) {
            setWithdrawNotFoundMsg('An error occurred while searching. Please try again.');
        } finally {
            setIsLookingUpWithdraw(false);
        }
    };

    const handleConfirmWithdraw = async () => {
        if (!studentToWithdraw) return;
        const classOfWithdrawl = useCurrentClass
            ? (studentToWithdraw.class_enrolled || '')
            : manualWithdrawClass.trim();

        if (!classOfWithdrawl) {
            alert('Please enter or select a Class of Withdrawal.');
            return;
        }

        setIsWithdrawing(true);
        try {
            await studentsAPI.withdraw(studentToWithdraw.reg_no, classOfWithdrawl);
            setIsWithdrawDetailsOpen(false);
            setStudentToWithdraw(null);
            setManualWithdrawClass('');
            setUseCurrentClass(true);
            setWithdrawSuccessOpen(true);
            fetchAllStudents();
        } catch (error) {
            alert('Error withdrawing student: ' + error.message);
        } finally {
            setIsWithdrawing(false);
        }
    };

    // ---- PERMANENT DELETE ----
    const handlePromptDelete = async (e) => {
        if (e) e.preventDefault();
        if (!deleteRegNoValue || !deleteRegNoValue.trim()) return;
        const query = deleteRegNoValue.trim();
        setIsLookingUpDelete(true);
        setDeleteNotFoundMsg('');
        try {
            const results = await studentsAPI.search(query);
            const match = results.find(s => String(s.reg_no) === query);
            if (match) {
                setIsDeletePromptOpen(false);
                setDeleteNotFoundMsg('');
                setStudentToDelete(match);
                setIsDeleteConfirmOpen(true);
            } else {
                setDeleteNotFoundMsg(`No student found with Registration Number "${query}".`);
            }
        } catch (error) {
            setDeleteNotFoundMsg('An error occurred while searching. Please try again.');
        } finally {
            setIsLookingUpDelete(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!studentToDelete) return;
        setIsDeleting(true);
        try {
            await studentsAPI.delete(studentToDelete.reg_no);
            setIsDeleteConfirmOpen(false);
            setStudentToDelete(null);
            setDeleteSuccessOpen(true);
            fetchAllStudents();
        } catch (error) {
            alert('Error deleting student: ' + error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    // ---- OTHER ----
    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userEmail');
        navigate('/login');
    };

    const handleExportXLSX = async () => {
        setIsExporting(true);
        try {
            let dataToExport = [];
            if (searchResults.length > 0) {
                dataToExport = searchResults;
            } else {
                dataToExport = selectedClass === 'All Classes'
                    ? allStudents
                    : allStudents.filter(student => student.class_enrolled === selectedClass);
                if (selectedClass !== 'All Classes' && selectedSection !== 'All Sections') {
                    dataToExport = dataToExport.filter(student => student.section === selectedSection);
                }
            }

            if (!dataToExport || dataToExport.length === 0) {
                alert('No students to export matching the current criteria.');
                return;
            }

            const formattedData = dataToExport.map((student) => ({
                'Registration Number': student.reg_no,
                'Student Name': student.student_name || 'N/A',
                'Gender': student.gender || 'N/A',
                'B-Form': student.b_form || 'N/A',
                'Date of Birth': student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A',
                'Admission Date': student.admission_date ? new Date(student.admission_date).toLocaleDateString() : 'N/A',
                "Father/Guardian's Name": student.f_g_name || 'N/A',
                "Father/Guardian's CNIC": student.f_g_cnic || 'N/A',
                "Father/Guardian's Contact": student.f_g_contact || 'N/A',
                'Address': student.address || 'N/A',
                'Class': student.class_enrolled || 'N/A',
                'Section': student.section || 'N/A',
                'Group': student.group || 'N/A',
                'Class of Admission': student.class_of_admission || 'N/A',
                'Caste': student.caste || 'N/A',
                'Monthly Fee': student.monthly_fee != null ? student.monthly_fee : 'N/A',
                'No Fee': student.no_fee || 'N/A',
            }));

            const ws = XLSX.utils.json_to_sheet(formattedData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Students");

            const dateStr = new Date().toISOString().split('T')[0];
            let filename = 'students';
            if (searchResults.length > 0) {
                filename = `Students_Search_Results_${dateStr}`;
            } else if (selectedClass === 'All Classes') {
                filename = `All_Students_${dateStr}`;
            } else {
                let sectionStr = selectedSection !== 'All Sections' ? `_Sec_${selectedSection}` : '';
                let classStr = selectedClass.replace(/\s+/g, '_');
                filename = `Class_${classStr}${sectionStr}_${dateStr}`;
            }
            XLSX.writeFile(wb, `${filename}.xlsx`);
        } catch (error) {
            alert('Error exporting XLSX: ' + error.message);
        } finally {
            setIsExporting(false);
        }
    };

    const getAvailableSections = () => {
        if (selectedClass === 'All Classes') return [];
        const existingSections = allStudents
            .filter(s => s.class_enrolled === selectedClass)
            .map(s => s.section)
            .filter(s => s && s.trim() !== '');
        return [...new Set(existingSections)].sort();
    };

    const availableSections = getAvailableSections();

    let filteredStudents = selectedClass === 'All Classes'
        ? allStudents
        : allStudents.filter(student => student.class_enrolled === selectedClass);

    if (selectedClass !== 'All Classes' && selectedSection !== 'All Sections') {
        filteredStudents = filteredStudents.filter(student => student.section === selectedSection);
    }

    const studentsToRender = searchResults.length > 0 ? searchResults : filteredStudents;

    return (
        <div className="students-container">
            <div className="students-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft size={20} />
                        <span className="back-btn-text">Back to Dashboard</span>
                    </button>
                    <div className="header-content">
                        <h1 className="dashboard-title">Student Directory</h1>
                    </div>
                </div>
                <div className="header-actions">
                    <button onClick={handleLogout} className="logout-btn">
                        <LogOut size={18} />
                        <span className="logout-text">Logout</span>
                    </button>
                </div>
            </div>

            <div className="students-content">
                {/* Search, Export, and Toggle */}
                <div className="search-section">
                    <div className="search-container">
                        <Search className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by registration number or name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => { if (e.key === 'Enter') handleSearch(); }}
                            className="search-input"
                        />
                        <button onClick={handleSearch} className="search-btn" disabled={isSearching}>
                            {isSearching ? 'Searching...' : 'Search'}
                        </button>
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
                                onClick={() => { setRegNoInputValue(''); setUpdateNotFoundMsg(''); setIsRegPromptOpen(true); }}
                                className="action-record-btn update-record-btn"
                                disabled={isLookingUpUpdate}
                            >
                                <Edit2 size={18} />
                                <span>{isLookingUpUpdate ? 'Looking up...' : 'Update Record'}</span>
                            </button>
                            <button
                                onClick={openDeleteTypeModal}
                                className="action-record-btn delete-record-btn"
                            >
                                <Trash2 size={18} />
                                <span>Delete Record</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Class filters */}
                {!isSearching && searchQuery.trim() === '' && (
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
                )}

                {/* Section filters */}
                {!isSearching && searchQuery.trim() === '' && selectedClass !== 'All Classes' && availableSections.length > 0 && (
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

                {/* Students display */}
                {isLoadingStudents && (
                    <div className="results-section">
                        <p className="loading-text">Loading students...</p>
                    </div>
                )}

                {!isLoadingStudents && studentsToRender.length > 0 && (
                    <div className="results-section">
                        <div className="results-header-row">
                            <h2 className="results-title">
                                {searchResults.length > 0
                                    ? `Search Results (${searchResults.length})`
                                    : selectedClass === 'All Classes'
                                        ? `All Students (${filteredStudents.length})`
                                        : `Class: ${selectedClass}${selectedSection !== 'All Sections' ? ` (${selectedSection}) ` : ' '}Students: ${filteredStudents.length}`}
                            </h2>
                            <button onClick={handleExportXLSX} className="export-xlsx-btn" disabled={isExporting}>
                                <Download size={20} />
                                <span>{isExporting ? 'Exporting...' : 'Export XLSX'}</span>
                            </button>
                        </div>

                        {viewMode === 'card' ? (
                            <div className="students-grid">
                                {studentsToRender.map((student) => (
                                    <div key={student.id || student.reg_no} className="student-card">
                                        <div className="student-header-card">
                                            <h3>{student.student_name}</h3>
                                            <span className="reg-badge">{student.reg_no}</span>
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
                                            <p><strong>Class:</strong> {student.class_enrolled || 'N/A'}</p>
                                            <p><strong>Section:</strong> {student.section || 'N/A'}</p>
                                            <p><strong>Group:</strong> {student.group || 'N/A'}</p>
                                            <p><strong>Class of Adm.:</strong> {student.class_of_admission || 'N/A'}</p>
                                            <p><strong>Caste:</strong> {student.caste || 'N/A'}</p>
                                            <p><strong>Monthly Fee:</strong> {student.monthly_fee != null ? student.monthly_fee : 'N/A'}</p>
                                            <p><strong>No Fee:</strong> {student.no_fee || 'N/A'}</p>
                                        </div>
                                        <div className="student-card-actions">
                                            <button onClick={() => handleOpenUpdateModal(student)} className="card-action-btn card-update-btn">
                                                <Edit2 size={15} /> Update
                                            </button>
                                            <button onClick={() => openDeleteTypeModalForStudent(student)} className="card-action-btn card-delete-btn">
                                                <Trash2 size={15} /> Delete
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
                                            <th>Class</th>
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
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentsToRender.map((student) => (
                                            <tr key={student.id || student.reg_no}>
                                                <td><span className="reg-badge">{student.reg_no}</span></td>
                                                <td><strong>{student.student_name || 'N/A'}</strong></td>
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
                                                        <button onClick={() => handleOpenUpdateModal(student)} className="table-action-btn table-update-btn">
                                                            <Edit2 size={13} /> Update
                                                        </button>
                                                        <button onClick={() => openDeleteTypeModalForStudent(student)} className="table-action-btn table-delete-btn">
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

            {/* ===== UPDATE Reg-No Prompt Modal ===== */}
            {isRegPromptOpen && (
                <div className="modal-overlay">
                    <div className="modal-content prompt-modal">
                        <div className="modal-header">
                            <h3>Update Student Record</h3>
                            <button className="modal-close-btn" onClick={() => { setIsRegPromptOpen(false); setUpdateNotFoundMsg(''); }}>
                                <X size={22} />
                            </button>
                        </div>
                        <form onSubmit={handlePromptUpdate}>
                            <div className="form-group modal-form-group">
                                <label>Registration Number</label>
                                <input
                                    type="text"
                                    value={regNoInputValue}
                                    onChange={(e) => { setRegNoInputValue(e.target.value); setUpdateNotFoundMsg(''); }}
                                    required
                                    placeholder="Enter Reg No..."
                                    className="modal-text-input"
                                    autoFocus
                                />
                            </div>
                            {updateNotFoundMsg && (
                                <div className="not-found-alert">
                                    <AlertTriangle size={18} />
                                    <span>{updateNotFoundMsg}</span>
                                </div>
                            )}
                            <div className="modal-footer-btns">
                                <button type="button" className="modal-cancel-btn" onClick={() => { setIsRegPromptOpen(false); setUpdateNotFoundMsg(''); }}>Cancel</button>
                                <button type="submit" className="modal-submit-btn modal-blue-btn" disabled={isLookingUpUpdate}>
                                    {isLookingUpUpdate ? 'Searching...' : 'Find Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== UPDATE Form Modal ===== */}
            {isUpdateModalOpen && selectedStudentForUpdate && (
                <div className="modal-overlay">
                    <div className="modal-content update-form-modal">
                        <div className="modal-header">
                            <h2>Update Student: {selectedStudentForUpdate.reg_no}</h2>
                            <button className="modal-close-btn" onClick={() => setIsUpdateModalOpen(false)}>
                                <X size={22} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateSubmit} className="add-student-form">
                            <div className="form-grid">
                                <div className="form-group"><label>Student Name *</label><input type="text" name="student_name" value={updateFormData.student_name} onChange={handleUpdateInputChange} required className="form-input" /></div>
                                <div className="form-group"><label>Gender *</label>
                                    <select name="gender" value={updateFormData.gender} onChange={handleUpdateInputChange} required className="form-input">
                                        <option value="">Select Gender</option>
                                        <option value="M">M</option>
                                        <option value="F">F</option>
                                    </select>
                                </div>
                                <div className="form-group"><label>B-Form</label><input type="text" name="b_form" value={updateFormData.b_form} onChange={handleUpdateInputChange} className="form-input" /></div>
                                <div className="form-group"><label>Date of Birth</label><input type="date" name="dob" value={updateFormData.dob} onChange={handleUpdateInputChange} className="form-input" /></div>
                                <div className="form-group"><label>Admission Date</label><input type="date" name="admission_date" value={updateFormData.admission_date} onChange={handleUpdateInputChange} className="form-input" /></div>
                                <div className="form-group"><label>Father/Guardian's Name</label><input type="text" name="f_g_name" value={updateFormData.f_g_name} onChange={handleUpdateInputChange} className="form-input" /></div>
                                <div className="form-group"><label>Father/Guardian's CNIC</label><input type="text" name="f_g_cnic" value={updateFormData.f_g_cnic} onChange={handleUpdateInputChange} className="form-input" /></div>
                                <div className="form-group"><label>Father/Guardian's Contact</label><input type="text" name="f_g_contact" value={updateFormData.f_g_contact} onChange={handleUpdateInputChange} className="form-input" /></div>
                                <div className="form-group"><label>Address</label><input type="text" name="address" value={updateFormData.address} onChange={handleUpdateInputChange} className="form-input" /></div>
                                <div className="form-group"><label>Class *</label><input type="text" name="class_enrolled" value={updateFormData.class_enrolled} onChange={handleUpdateInputChange} required className="form-input" /></div>
                                <div className="form-group"><label>Section</label><input type="text" name="section" value={updateFormData.section} onChange={handleUpdateInputChange} className="form-input" /></div>
                                <div className="form-group"><label>Group</label><input type="text" name="group" value={updateFormData.group} onChange={handleUpdateInputChange} className="form-input" /></div>
                                <div className="form-group"><label>Class of Admission</label><input type="text" name="class_of_admission" value={updateFormData.class_of_admission} onChange={handleUpdateInputChange} className="form-input" /></div>
                                <div className="form-group"><label>Caste</label><input type="text" name="caste" value={updateFormData.caste} onChange={handleUpdateInputChange} className="form-input" /></div>
                                <div className="form-group"><label>Monthly Fee</label><input type="number" name="monthly_fee" value={updateFormData.monthly_fee} onChange={handleUpdateInputChange} className="form-input" /></div>
                                <div className="form-group"><label>No Fee</label><input type="text" name="no_fee" value={updateFormData.no_fee} onChange={handleUpdateInputChange} className="form-input" /></div>
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

            {/* ===== DELETE TYPE MODAL ===== */}
            {isDeleteTypeModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content delete-type-modal">
                        <div className="modal-header">
                            <h3>Remove Student Record</h3>
                            <button className="modal-close-btn" onClick={() => setIsDeleteTypeModalOpen(false)}>
                                <X size={22} />
                            </button>
                        </div>
                        <p className="delete-type-subtitle">How would you like to remove this student?</p>
                        <div className="delete-type-options">
                            <button className="delete-type-btn withdraw-type-btn" onClick={handleChooseWithdraw}>
                                <div className="delete-type-icon">
                                    <UserMinus size={32} />
                                </div>
                                <div className="delete-type-text">
                                    <span className="delete-type-title">Withdraw Student</span>
                                    <span className="delete-type-desc">Archive the student record in the withdrawn students list. The record is preserved for future reference.</span>
                                </div>
                            </button>
                            <button className="delete-type-btn permanent-type-btn" onClick={handleChooseDeletePermanently}>
                                <div className="delete-type-icon">
                                    <Trash2 size={32} />
                                </div>
                                <div className="delete-type-text">
                                    <span className="delete-type-title">Delete Permanently</span>
                                    <span className="delete-type-desc">Permanently remove the record from the database. This action cannot be undone.</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== WITHDRAW Reg-No Prompt Modal ===== */}
            {isWithdrawRegPromptOpen && (
                <div className="modal-overlay">
                    <div className="modal-content prompt-modal">
                        <div className="modal-header">
                            <h3>Withdraw Student</h3>
                            <button className="modal-close-btn" onClick={() => { setIsWithdrawRegPromptOpen(false); setWithdrawNotFoundMsg(''); }}>
                                <X size={22} />
                            </button>
                        </div>
                        <form onSubmit={handleWithdrawRegLookup}>
                            <div className="form-group modal-form-group">
                                <label>Registration Number</label>
                                <input
                                    type="text"
                                    value={withdrawRegNoValue}
                                    onChange={(e) => { setWithdrawRegNoValue(e.target.value); setWithdrawNotFoundMsg(''); }}
                                    required
                                    placeholder="Enter Reg No..."
                                    className="modal-text-input"
                                    autoFocus
                                />
                            </div>
                            {withdrawNotFoundMsg && (
                                <div className="not-found-alert">
                                    <AlertTriangle size={18} />
                                    <span>{withdrawNotFoundMsg}</span>
                                </div>
                            )}
                            <div className="modal-footer-btns">
                                <button type="button" className="modal-cancel-btn" onClick={() => { setIsWithdrawRegPromptOpen(false); setWithdrawNotFoundMsg(''); }}>Cancel</button>
                                <button type="submit" className="modal-submit-btn modal-amber-btn" disabled={isLookingUpWithdraw}>
                                    {isLookingUpWithdraw ? 'Searching...' : 'Find Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== WITHDRAW Details Modal ===== */}
            {isWithdrawDetailsOpen && studentToWithdraw && (
                <div className="modal-overlay">
                    <div className="modal-content withdraw-details-modal">
                        <div className="modal-header">
                            <h3>Withdraw Student</h3>
                            <button className="modal-close-btn" onClick={() => { setIsWithdrawDetailsOpen(false); setStudentToWithdraw(null); }}>
                                <X size={22} />
                            </button>
                        </div>

                        <div className="withdraw-warning-banner">
                            <UserMinus size={20} />
                            <span>This student will be moved to the Withdrawn Students archive.</span>
                        </div>

                        {/* Student preview */}
                        <div className="delete-student-preview">
                            <div className="delete-preview-header">
                                <span className="delete-preview-name">{studentToWithdraw.student_name}</span>
                                <span className="reg-badge">{studentToWithdraw.reg_no}</span>
                            </div>
                            <div className="delete-preview-details">
                                <span><strong>Class:</strong> {studentToWithdraw.class_enrolled || 'N/A'}</span>
                                <span><strong>Section:</strong> {studentToWithdraw.section || 'N/A'}</span>
                                <span><strong>Gender:</strong> {studentToWithdraw.gender || 'N/A'}</span>
                                <span><strong>Father/Guardian:</strong> {studentToWithdraw.f_g_name || 'N/A'}</span>
                                <span><strong>Contact:</strong> {studentToWithdraw.f_g_contact || 'N/A'}</span>
                            </div>
                        </div>

                        {/* Class of withdrawal */}
                        <div className="withdraw-class-section">
                            <label className="withdraw-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={useCurrentClass}
                                    onChange={(e) => {
                                        setUseCurrentClass(e.target.checked);
                                        if (e.target.checked) setManualWithdrawClass('');
                                    }}
                                    className="withdraw-checkbox"
                                />
                                <span>Set current class (<strong>{studentToWithdraw.class_enrolled || 'N/A'}</strong>) as Class of Withdrawal</span>
                            </label>

                            {!useCurrentClass && (
                                <div className="form-group modal-form-group" style={{ marginTop: '0.75rem' }}>
                                    <label>Class of Withdrawal</label>
                                    <input
                                        type="text"
                                        value={manualWithdrawClass}
                                        onChange={(e) => setManualWithdrawClass(e.target.value)}
                                        placeholder="Enter class of withdrawal..."
                                        className="modal-text-input"
                                        autoFocus
                                    />
                                </div>
                            )}
                        </div>

                        <div className="modal-footer-btns">
                            <button className="modal-cancel-btn" onClick={() => { setIsWithdrawDetailsOpen(false); setStudentToWithdraw(null); }} disabled={isWithdrawing}>
                                Cancel
                            </button>
                            <button className="modal-submit-btn modal-amber-btn" onClick={handleConfirmWithdraw} disabled={isWithdrawing}>
                                {isWithdrawing ? 'Withdrawing...' : 'Confirm Withdrawal'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== WITHDRAW Success Modal ===== */}
            {withdrawSuccessOpen && (
                <div className="modal-overlay">
                    <div className="modal-content success-modal-centered">
                        <div className="success-icon-wrap amber-icon">
                            <UserMinus size={52} />
                        </div>
                        <h2 className="success-modal-title">Student Withdrawn</h2>
                        <p className="success-modal-desc">The student has been successfully moved to the Withdrawn Students archive.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button
                                onClick={() => { setWithdrawSuccessOpen(false); navigate('/withdrawn'); }}
                                className="modal-submit-btn modal-amber-btn"
                                style={{ width: '100%' }}
                            >
                                View Withdrawn Students
                            </button>
                            <button
                                onClick={() => setWithdrawSuccessOpen(false)}
                                className="modal-cancel-btn"
                                style={{ width: '100%' }}
                            >
                                Back to Students
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== DELETE Reg-No Prompt Modal ===== */}
            {isDeletePromptOpen && (
                <div className="modal-overlay">
                    <div className="modal-content prompt-modal">
                        <div className="modal-header">
                            <h3>Delete Permanently</h3>
                            <button className="modal-close-btn" onClick={() => { setIsDeletePromptOpen(false); setDeleteNotFoundMsg(''); }}>
                                <X size={22} />
                            </button>
                        </div>
                        <form onSubmit={handlePromptDelete}>
                            <div className="form-group modal-form-group">
                                <label>Registration Number</label>
                                <input
                                    type="text"
                                    value={deleteRegNoValue}
                                    onChange={(e) => { setDeleteRegNoValue(e.target.value); setDeleteNotFoundMsg(''); }}
                                    required
                                    placeholder="Enter Reg No to delete..."
                                    className="modal-text-input"
                                    autoFocus
                                />
                            </div>
                            {deleteNotFoundMsg && (
                                <div className="not-found-alert">
                                    <AlertTriangle size={18} />
                                    <span>{deleteNotFoundMsg}</span>
                                </div>
                            )}
                            <div className="modal-footer-btns">
                                <button type="button" className="modal-cancel-btn" onClick={() => { setIsDeletePromptOpen(false); setDeleteNotFoundMsg(''); }}>Cancel</button>
                                <button type="submit" className="modal-submit-btn modal-red-btn" disabled={isLookingUpDelete}>
                                    {isLookingUpDelete ? 'Searching...' : 'Find Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== DELETE Confirmation Modal ===== */}
            {isDeleteConfirmOpen && studentToDelete && (
                <div className="modal-overlay">
                    <div className="modal-content delete-confirm-modal">
                        <div className="modal-header">
                            <h3>Confirm Permanent Deletion</h3>
                            <button className="modal-close-btn" onClick={() => { setIsDeleteConfirmOpen(false); setStudentToDelete(null); }}>
                                <X size={22} />
                            </button>
                        </div>

                        <div className="delete-warning-banner">
                            <AlertTriangle size={20} />
                            <span>This action is permanent and cannot be undone. The record will be removed from all places.</span>
                        </div>

                        {/* Student preview card */}
                        <div className="delete-student-preview">
                            <div className="delete-preview-header">
                                <span className="delete-preview-name">{studentToDelete.student_name}</span>
                                <span className="reg-badge">{studentToDelete.reg_no}</span>
                            </div>
                            <div className="delete-preview-details">
                                <span><strong>Class:</strong> {studentToDelete.class_enrolled || 'N/A'}</span>
                                <span><strong>Section:</strong> {studentToDelete.section || 'N/A'}</span>
                                <span><strong>Gender:</strong> {studentToDelete.gender || 'N/A'}</span>
                                <span><strong>Father/Guardian:</strong> {studentToDelete.f_g_name || 'N/A'}</span>
                                <span><strong>Contact:</strong> {studentToDelete.f_g_contact || 'N/A'}</span>
                            </div>
                        </div>

                        <p className="delete-confirm-question">Are you sure you want to permanently delete this student record?</p>

                        <div className="modal-footer-btns">
                            <button
                                className="modal-cancel-btn"
                                onClick={() => { setIsDeleteConfirmOpen(false); setStudentToDelete(null); }}
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

            {/* ===== DELETE Success Modal ===== */}
            {deleteSuccessOpen && (
                <div className="modal-overlay">
                    <div className="modal-content success-modal-centered">
                        <div className="success-icon-wrap red-icon">
                            <CheckCircle size={52} />
                        </div>
                        <h2 className="success-modal-title">Record Deleted</h2>
                        <p className="success-modal-desc">The student record has been permanently removed from the database.</p>
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
