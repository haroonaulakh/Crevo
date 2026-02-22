import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut, Download, ArrowLeft, LayoutGrid, Table as TableIcon, Edit2, X } from 'lucide-react';
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
    const [isLookingUpUpdate, setIsLookingUpUpdate] = useState(false);

    const [isRegPromptOpen, setIsRegPromptOpen] = useState(false);
    const [regNoInputValue, setRegNoInputValue] = useState('');

    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedStudentForUpdate, setSelectedStudentForUpdate] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateFormData, setUpdateFormData] = useState({});

    const [selectedClass, setSelectedClass] = useState('All Classes');
    const [selectedSection, setSelectedSection] = useState('All Sections');
    const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'

    const CLASSES = ['All Classes', 'PG', 'Nur', 'Prep', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

    // On mount: check auth and load all students
    useEffect(() => {
        const isAuthenticated = localStorage.getItem('isAuthenticated');

        if (isAuthenticated !== 'true') {
            navigate('/login');
            return;
        }

        fetchAllStudents();
    }, [navigate]);

    // Reset section when class changes
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

    const handlePromptUpdate = async (e) => {
        if (e) e.preventDefault();
        if (!regNoInputValue || !regNoInputValue.trim()) return;

        const query = regNoInputValue.trim();
        setIsLookingUpUpdate(true);
        try {
            const results = await studentsAPI.search(query);
            const match = results.find(s => String(s.reg_no) === query);

            if (match) {
                setIsRegPromptOpen(false); // Close the prompt modal
                handleOpenUpdateModal(match);
            } else {
                alert('No student found with that Registration Number.');
            }
        } catch (error) {
            console.error('Search error:', error);
            alert('Error searching student: ' + error.message);
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
            if (dataToUpdate.monthly_fee === "") dataToUpdate.monthly_fee = null;

            await studentsAPI.update(selectedStudentForUpdate.reg_no, dataToUpdate);
            alert('Student updated successfully');
            setIsUpdateModalOpen(false);
            setSelectedStudentForUpdate(null);
            fetchAllStudents();
        } catch (error) {
            console.error('Update error:', error);
            alert('Error updating student: ' + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateInputChange = (e) => {
        const { name, value } = e.target;
        setUpdateFormData((prev) => ({ ...prev, [name]: value }));
    };

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
            console.error('Error exporting XLSX:', error);
            alert('Error exporting XLSX: ' + error.message);
        } finally {
            setIsExporting(false);
        }
    };

    const getAvailableSections = () => {
        if (selectedClass === 'All Classes') return [];

        // Find all sections from existing students in this class
        const existingSections = allStudents
            .filter(s => s.class_enrolled === selectedClass)
            .map(s => s.section)
            .filter(s => s && s.trim() !== ''); // keep non-empty sections

        // Remove duplicates
        const combined = [...new Set(existingSections)];
        return combined.sort();
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
                        Back to Dashboard
                    </button>
                    <div className="header-content">
                        <h1 className="dashboard-title">Student Directory</h1>
                    </div>
                </div>
                <div className="header-actions">
                    <button onClick={handleLogout} className="logout-btn">
                        <LogOut size={18} />
                        Logout
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
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') handleSearch();
                            }}
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

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => { setRegNoInputValue(''); setIsRegPromptOpen(true); }} className="export-xlsx-btn" disabled={isLookingUpUpdate} style={{ background: '#3182ce' }}>
                                <Edit2 size={20} />
                                {isLookingUpUpdate ? 'Looking up...' : 'Update Record'}
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <h2 className="results-title" style={{ margin: 0 }}>
                                {searchResults.length > 0
                                    ? `Search Results (${searchResults.length})`
                                    : selectedClass === 'All Classes'
                                        ? `All Students (${filteredStudents.length})`
                                        : `Class: ${selectedClass}${selectedSection !== 'All Sections' ? `(${selectedSection}) ` : ' '}Students: ${filteredStudents.length}`}
                            </h2>
                            <button onClick={handleExportXLSX} className="export-xlsx-btn" disabled={isExporting}>
                                <Download size={20} />
                                {isExporting ? 'Exporting...' : 'Export XLSX'}
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
                                        <div className="student-actions" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleOpenUpdateModal(student)} className="update-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: '#e2e8f0', color: '#1a202c', border: 'none', borderRadius: '0.4rem', cursor: 'pointer', fontWeight: 'bold' }}>
                                                <Edit2 size={16} /> Update
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
                                                    <button onClick={() => handleOpenUpdateModal(student)} className="update-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.6rem', background: '#e2e8f0', color: '#1a202c', border: 'none', borderRadius: '0.3rem', cursor: 'pointer', fontWeight: 'bold' }}>
                                                        <Edit2 size={14} /> Update
                                                    </button>
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

            {/* Reg No Prompt Modal */}
            {isRegPromptOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="modal-content" style={{ background: 'white', padding: '2rem', borderRadius: '0.5rem', width: '90%', maxWidth: '400px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, color: '#1a202c' }}>Update Student Record</h3>
                            <button onClick={() => setIsRegPromptOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <form onSubmit={handlePromptUpdate}>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#4a5568' }}>Registration Number</label>
                                <input
                                    type="text"
                                    value={regNoInputValue}
                                    onChange={(e) => setRegNoInputValue(e.target.value)}
                                    required
                                    placeholder="Enter Reg No..."
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e0', fontSize: '1rem' }}
                                    autoFocus
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" onClick={() => setIsRegPromptOpen(false)} style={{ padding: '0.6rem 1.2rem', borderRadius: '0.5rem', border: '1px solid #cbd5e0', background: 'white', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={isLookingUpUpdate} style={{ padding: '0.6rem 1.2rem', borderRadius: '0.5rem', border: 'none', background: '#3182ce', color: 'white', cursor: isLookingUpUpdate ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                                    {isLookingUpUpdate ? 'Searching...' : 'Find Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Update Modal */}
            {isUpdateModalOpen && selectedStudentForUpdate && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="modal-content" style={{ background: 'white', padding: '2rem', borderRadius: '0.5rem', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>Update Student: {selectedStudentForUpdate.reg_no}</h2>
                            <button onClick={() => setIsUpdateModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleUpdateSubmit} className="add-student-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Student Name *</label>
                                    <input type="text" name="student_name" value={updateFormData.student_name} onChange={handleUpdateInputChange} required className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Gender *</label>
                                    <select name="gender" value={updateFormData.gender} onChange={handleUpdateInputChange} required className="form-input">
                                        <option value="">Select Gender</option>
                                        <option value="M">M</option>
                                        <option value="F">F</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>B-Form</label>
                                    <input type="text" name="b_form" value={updateFormData.b_form} onChange={handleUpdateInputChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Date of Birth</label>
                                    <input type="date" name="dob" value={updateFormData.dob} onChange={handleUpdateInputChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Admission Date</label>
                                    <input type="date" name="admission_date" value={updateFormData.admission_date} onChange={handleUpdateInputChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Father/Guardian's Name</label>
                                    <input type="text" name="f_g_name" value={updateFormData.f_g_name} onChange={handleUpdateInputChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Father/Guardian's CNIC</label>
                                    <input type="text" name="f_g_cnic" value={updateFormData.f_g_cnic} onChange={handleUpdateInputChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Father/Guardian's Contact</label>
                                    <input type="text" name="f_g_contact" value={updateFormData.f_g_contact} onChange={handleUpdateInputChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Address</label>
                                    <input type="text" name="address" value={updateFormData.address} onChange={handleUpdateInputChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Class *</label>
                                    <input type="text" name="class_enrolled" value={updateFormData.class_enrolled} onChange={handleUpdateInputChange} required className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Section</label>
                                    <input type="text" name="section" value={updateFormData.section} onChange={handleUpdateInputChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Group</label>
                                    <input type="text" name="group" value={updateFormData.group} onChange={handleUpdateInputChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Class of Admission</label>
                                    <input type="text" name="class_of_admission" value={updateFormData.class_of_admission} onChange={handleUpdateInputChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Caste</label>
                                    <input type="text" name="caste" value={updateFormData.caste} onChange={handleUpdateInputChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Monthly Fee (Number)</label>
                                    <input type="number" name="monthly_fee" value={updateFormData.monthly_fee} onChange={handleUpdateInputChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>No Fee</label>
                                    <input type="text" name="no_fee" value={updateFormData.no_fee} onChange={handleUpdateInputChange} className="form-input" />
                                </div>
                            </div>
                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" onClick={() => setIsUpdateModalOpen(false)} style={{ padding: '0.6rem 1.2rem', borderRadius: '0.5rem', border: '1px solid #cbd5e0', background: 'white', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={isUpdating} style={{ padding: '0.6rem 1.2rem', borderRadius: '0.5rem', border: 'none', background: '#3182ce', color: 'white', cursor: isUpdating ? 'not-allowed' : 'pointer' }}>
                                    {isUpdating ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
