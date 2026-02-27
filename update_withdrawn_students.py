import re

def update_withdrawn_students():
    with open('c:/Users/DELL/Desktop/Crevo/Crevo/frontend/src/pages/WithdrawnStudents.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add blood_group to EMPTY_FORM
    content = content.replace(
        "no_fee: '',\n    class_of_withdrawl: '',",
        "no_fee: '',\n    class_of_withdrawl: '',\n    blood_group: '',"
    )

    # 2. Add blood_group to Formatted Data Export (XLSX)
    content = content.replace(
        "'Class of Withdrawal': student.class_of_withdrawl || 'N/A',",
        "'Class of Withdrawal': student.class_of_withdrawl || 'N/A',\n                'Blood Group': student.blood_group || 'N/A',"
    )

    # 3. Add blood_group to Card View
    content = content.replace(
        "<p><strong>Class of With.:</strong> {student.class_of_withdrawl || 'N/A'}</p>",
        "<p><strong>Class of With.:</strong> {student.class_of_withdrawl || 'N/A'}</p>\n                                            <p><strong>Blood Group:</strong> {student.blood_group || 'N/A'}</p>"
    )

    # 4. Add blood_group to Table Header & Body
    content = content.replace(
        "<th>Class Withdrawn</th>",
        "<th>Class Withdrawn</th>\n                                            <th>Blood Grp</th>"
    )
    content = content.replace(
        "<td>{student.class_of_withdrawl || 'N/A'}</td>",
        "<td>{student.class_of_withdrawl || 'N/A'}</td>\n                                                <td>{student.blood_group || 'N/A'}</td>"
    )

    # 5. Overwrite the Add Form Grid
    form_grid_replacement = '''<div className="add-form-grid">
                                {/* Row 1 */}
                                <div className="form-group">
                                    <label>Reg. No. *</label>
                                    <input type="number" name="reg_no" value={addForm.reg_no} onChange={handleAddFormChange} placeholder="e.g. 101" />
                                </div>
                                <div className="form-group">
                                    <label>Student Name *</label>
                                    <input type="text" name="student_name" value={addForm.student_name} onChange={handleAddFormChange} placeholder="Full name" />
                                </div>
                                <div className="form-group">
                                    <div className="label-row">
                                        <label>Gender</label>
                                    </div>
                                    <select name="gender" value={addForm.gender} onChange={handleAddFormChange}>
                                        <option value="">Select</option>
                                        <option value="M">Male</option>
                                        <option value="F">Female</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <div className="label-row">
                                        <label>B-Form</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={addForm.b_form === 'N/A'} onChange={(e) => setAddForm(prev => ({ ...prev, b_form: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                                    </div>
                                    <input type="text" name="b_form" value={addForm.b_form} onChange={handleAddFormChange} placeholder="B-Form number" disabled={addForm.b_form === 'N/A'} />
                                </div>

                                {/* Row 2 */}
                                <div className="form-group">
                                    <label>DOB</label>
                                    <input type="date" name="dob" value={addForm.dob} onChange={handleAddFormChange} />
                                </div>
                                <div className="form-group">
                                    <label>Admission Date</label>
                                    <input type="date" name="admission_date" value={addForm.admission_date} onChange={handleAddFormChange} />
                                </div>
                                <div className="form-group">
                                    <div className="label-row">
                                        <label>Blood Group</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={addForm.blood_group === 'N/A'} onChange={(e) => setAddForm(prev => ({ ...prev, blood_group: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                                    </div>
                                    <select name="blood_group" value={addForm.blood_group} onChange={handleAddFormChange} disabled={addForm.blood_group === 'N/A'}>
                                        <option value="">Select</option>
                                        <option value="A+">A+</option><option value="A-">A-</option>
                                        <option value="B+">B+</option><option value="B-">B-</option>
                                        <option value="O+">O+</option><option value="O-">O-</option>
                                        <option value="AB+">AB+</option><option value="AB-">AB-</option>
                                        <option value="N/A">N/A</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <div className="label-row">
                                        <label>Father's Name</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={addForm.f_g_name === 'N/A'} onChange={(e) => setAddForm(prev => ({ ...prev, f_g_name: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                                    </div>
                                    <input type="text" name="f_g_name" value={addForm.f_g_name} onChange={handleAddFormChange} placeholder="Father/Guardian Name" disabled={addForm.f_g_name === 'N/A'} />
                                </div>

                                {/* Row 3 */}
                                <div className="form-group">
                                    <div className="label-row">
                                        <label>Father's CNIC</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={addForm.f_g_cnic === 'N/A'} onChange={(e) => setAddForm(prev => ({ ...prev, f_g_cnic: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                                    </div>
                                    <input type="text" name="f_g_cnic" value={addForm.f_g_cnic} onChange={handleAddFormChange} placeholder="00000-0000000-0" disabled={addForm.f_g_cnic === 'N/A'} />
                                </div>
                                <div className="form-group">
                                    <div className="label-row">
                                        <label>Contact</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={addForm.f_g_contact === 'N/A'} onChange={(e) => setAddForm(prev => ({ ...prev, f_g_contact: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                                    </div>
                                    <input type="text" name="f_g_contact" value={addForm.f_g_contact} onChange={handleAddFormChange} placeholder="Phone number" disabled={addForm.f_g_contact === 'N/A'} />
                                </div>
                                <div className="form-group add-form-wide">
                                    <div className="label-row">
                                        <label>Address</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={addForm.address === 'N/A'} onChange={(e) => setAddForm(prev => ({ ...prev, address: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                                    </div>
                                    <input type="text" name="address" value={addForm.address} onChange={handleAddFormChange} placeholder="Home address" disabled={addForm.address === 'N/A'} />
                                </div>

                                {/* Row 4 */}
                                <div className="form-group">
                                    <label>Enrolled Class</label>
                                    <select name="class_enrolled" value={addForm.class_enrolled} onChange={handleAddFormChange}>
                                        <option value="">Select</option>
                                        {['PG', 'Nur', 'Prep', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <div className="label-row">
                                        <label>Section</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={addForm.section === 'N/A'} onChange={(e) => setAddForm(prev => ({ ...prev, section: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                                    </div>
                                    <input type="text" name="section" value={addForm.section} onChange={handleAddFormChange} placeholder="A, B, etc." list="section-suggestions" disabled={addForm.section === 'N/A'} />
                                    <datalist id="section-suggestions">
                                        {availableSectionsForAdd.map(sec => <option key={sec} value={sec} />)}
                                    </datalist>
                                </div>
                                <div className="form-group">
                                    <div className="label-row">
                                        <label>Group</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={addForm.group === 'N/A'} onChange={(e) => setAddForm(prev => ({ ...prev, group: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                                    </div>
                                    <input type="text" name="group" value={addForm.group} onChange={handleAddFormChange} placeholder="Science/Arts" disabled={addForm.group === 'N/A'} />
                                </div>

                                {/* Row 5 */}
                                <div className="form-group">
                                    <div className="label-row">
                                        <label>Class of Adm.</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={addForm.class_of_admission === 'N/A'} onChange={(e) => setAddForm(prev => ({ ...prev, class_of_admission: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                                    </div>
                                    <select name="class_of_admission" value={addForm.class_of_admission} onChange={handleAddFormChange} disabled={addForm.class_of_admission === 'N/A'}>
                                        <option value="">Select</option>
                                        {['PG', 'Nur', 'Prep', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(c => <option key={c} value={c}>{c}</option>)}
                                        <option value="N/A">N/A</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <div className="label-row">
                                        <label>Caste</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={addForm.caste === 'N/A'} onChange={(e) => setAddForm(prev => ({ ...prev, caste: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                                    </div>
                                    <input type="text" name="caste" value={addForm.caste} onChange={handleAddFormChange} placeholder="Caste" disabled={addForm.caste === 'N/A'} />
                                </div>
                                <div className="form-group">
                                    <label>Class of With.</label>
                                    <select name="class_of_withdrawl" value={addForm.class_of_withdrawl} onChange={handleAddFormChange}>
                                        <option value="">Select</option>
                                        {['PG', 'Nur', 'Prep', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                {/* Row 6 */}
                                <div className="form-group">
                                    <label>Monthly Fee</label>
                                    <input type="number" name="monthly_fee" value={addForm.monthly_fee} onChange={handleAddFormChange} placeholder="0" />
                                </div>
                                <div className="form-group">
                                    <label>No Fee</label>
                                    <select name="no_fee" value={addForm.no_fee} onChange={handleAddFormChange}>
                                        <option value="">Select</option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>
                            </div>'''

    match = re.search(r'<div className="add-form-grid">.*?</div>\s*<div className="add-form-actions">', content, re.DOTALL)
    if match:
        original_grid = content[match.start():content.find('<div className="add-form-actions">', match.start())]
        content = content.replace(original_grid, form_grid_replacement + '\n                            ')

    with open('c:/Users/DELL/Desktop/Crevo/Crevo/frontend/src/pages/WithdrawnStudents.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

update_withdrawn_students()
