import re

def update_students():
    with open('c:/Users/DELL/Desktop/Crevo/Crevo/frontend/src/pages/Students.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add blood_group to updateFormData state
    content = content.replace(
        "monthly_fee: student.monthly_fee != null ? student.monthly_fee : '',\n            no_fee: student.no_fee || '',",
        "monthly_fee: student.monthly_fee != null ? student.monthly_fee : '',\n            no_fee: student.no_fee || '',\n            blood_group: student.blood_group || '',"
    )

    # 2. Add blood_group to Export
    content = content.replace(
        "'No Fee': student.no_fee || 'N/A',",
        "'No Fee': student.no_fee || 'N/A',\n                'Blood Group': student.blood_group || 'N/A',"
    )

    # 3. Add blood_group to Card View
    content = content.replace(
        "<p><strong>No Fee:</strong> {student.no_fee || 'N/A'}</p>",
        "<p><strong>No Fee:</strong> {student.no_fee || 'N/A'}</p>\n                                            <p><strong>Blood Group:</strong> {student.blood_group || 'N/A'}</p>"
    )

    # 4. Add blood_group to Table Header & Body
    content = content.replace(
        "<th>No Fee</th>",
        "<th>No Fee</th>\n                                            <th>Blood Grp</th>"
    )
    content = content.replace(
        "<td>{student.no_fee || 'N/A'}</td>",
        "<td>{student.no_fee || 'N/A'}</td>\n                                                <td>{student.blood_group || 'N/A'}</td>"
    )

    # 5. Replace Form Grid for update form
    form_grid_replacement = '''<div className="form-grid">
                                <div className="form-group"><label>Student Name *</label><input type="text" name="student_name" value={updateFormData.student_name} onChange={handleUpdateInputChange} required className="form-input" /></div>
                                <div className="form-group">
                                    <div className="label-row"><label>Gender *</label></div>
                                    <select name="gender" value={updateFormData.gender} onChange={handleUpdateInputChange} required className="form-input">
                                        <option value="">Select Gender</option>
                                        <option value="M">Male</option>
                                        <option value="F">Female</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <div className="label-row">
                                        <label>B-Form</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={updateFormData.b_form === 'N/A'} onChange={(e) => setUpdateFormData(prev => ({...prev, b_form: e.target.checked ? 'N/A' : ''}))} /> N/A</label>
                                    </div>
                                    <input type="text" name="b_form" value={updateFormData.b_form} onChange={handleUpdateInputChange} className="form-input" disabled={updateFormData.b_form === 'N/A'} />
                                </div>
                                <div className="form-group"><label>Date of Birth</label><input type="date" name="dob" value={updateFormData.dob ? updateFormData.dob.substring(0,10) : ''} onChange={handleUpdateInputChange} className="form-input" /></div>
                                <div className="form-group"><label>Admission Date</label><input type="date" name="admission_date" value={updateFormData.admission_date ? updateFormData.admission_date.substring(0,10) : ''} onChange={handleUpdateInputChange} className="form-input" /></div>
                                <div className="form-group">
                                    <div className="label-row">
                                        <label>Blood Group</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={updateFormData.blood_group === 'N/A'} onChange={(e) => setUpdateFormData(prev => ({...prev, blood_group: e.target.checked ? 'N/A' : ''}))} /> N/A</label>
                                    </div>
                                    <select name="blood_group" value={updateFormData.blood_group} onChange={handleUpdateInputChange} className="form-input" disabled={updateFormData.blood_group === 'N/A'}>
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
                                        <label>Father/Guardian's Name</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={updateFormData.f_g_name === 'N/A'} onChange={(e) => setUpdateFormData(prev => ({...prev, f_g_name: e.target.checked ? 'N/A' : ''}))} /> N/A</label>
                                    </div>
                                    <input type="text" name="f_g_name" value={updateFormData.f_g_name} onChange={handleUpdateInputChange} className="form-input" disabled={updateFormData.f_g_name === 'N/A'} />
                                </div>
                                <div className="form-group">
                                    <div className="label-row">
                                        <label>Father/Guardian's CNIC</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={updateFormData.f_g_cnic === 'N/A'} onChange={(e) => setUpdateFormData(prev => ({...prev, f_g_cnic: e.target.checked ? 'N/A' : ''}))} /> N/A</label>
                                    </div>
                                    <input type="text" name="f_g_cnic" value={updateFormData.f_g_cnic} onChange={handleUpdateInputChange} className="form-input" disabled={updateFormData.f_g_cnic === 'N/A'} />
                                </div>
                                <div className="form-group">
                                    <div className="label-row">
                                        <label>Father/Guardian's Contact</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={updateFormData.f_g_contact === 'N/A'} onChange={(e) => setUpdateFormData(prev => ({...prev, f_g_contact: e.target.checked ? 'N/A' : ''}))} /> N/A</label>
                                    </div>
                                    <input type="text" name="f_g_contact" value={updateFormData.f_g_contact} onChange={handleUpdateInputChange} className="form-input" disabled={updateFormData.f_g_contact === 'N/A'} />
                                </div>
                                <div className="form-group form-group-wide">
                                    <div className="label-row">
                                        <label>Address</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={updateFormData.address === 'N/A'} onChange={(e) => setUpdateFormData(prev => ({...prev, address: e.target.checked ? 'N/A' : ''}))} /> N/A</label>
                                    </div>
                                    <input type="text" name="address" value={updateFormData.address} onChange={handleUpdateInputChange} className="form-input" disabled={updateFormData.address === 'N/A'} />
                                </div>
                                <div className="form-group">
                                    <label>Class *</label>
                                    <select name="class_enrolled" value={updateFormData.class_enrolled} onChange={handleUpdateInputChange} required className="form-input">
                                        <option value="">Select</option>
                                        {['PG', 'Nur', 'Prep', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <div className="label-row">
                                        <label>Section</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={updateFormData.section === 'N/A'} onChange={(e) => setUpdateFormData(prev => ({...prev, section: e.target.checked ? 'N/A' : ''}))} /> N/A</label>
                                    </div>
                                    <input type="text" name="section" value={updateFormData.section} onChange={handleUpdateInputChange} className="form-input" disabled={updateFormData.section === 'N/A'} />
                                </div>
                                <div className="form-group">
                                    <div className="label-row">
                                        <label>Group</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={updateFormData.group === 'N/A'} onChange={(e) => setUpdateFormData(prev => ({...prev, group: e.target.checked ? 'N/A' : ''}))} /> N/A</label>
                                    </div>
                                    <input type="text" name="group" value={updateFormData.group} onChange={handleUpdateInputChange} className="form-input" disabled={updateFormData.group === 'N/A'} />
                                </div>
                                <div className="form-group">
                                    <div className="label-row">
                                        <label>Class of Admission</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={updateFormData.class_of_admission === 'N/A'} onChange={(e) => setUpdateFormData(prev => ({...prev, class_of_admission: e.target.checked ? 'N/A' : ''}))} /> N/A</label>
                                    </div>
                                    <select name="class_of_admission" value={updateFormData.class_of_admission} onChange={handleUpdateInputChange} className="form-input" disabled={updateFormData.class_of_admission === 'N/A'}>
                                        <option value="">Select</option>
                                        {['PG', 'Nur', 'Prep', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(c => <option key={c} value={c}>{c}</option>)}
                                        <option value="N/A">N/A</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <div className="label-row">
                                        <label>Caste</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={updateFormData.caste === 'N/A'} onChange={(e) => setUpdateFormData(prev => ({...prev, caste: e.target.checked ? 'N/A' : ''}))} /> N/A</label>
                                    </div>
                                    <input type="text" name="caste" value={updateFormData.caste} onChange={handleUpdateInputChange} className="form-input" disabled={updateFormData.caste === 'N/A'} />
                                </div>
                                <div className="form-group"><label>Monthly Fee</label><input type="number" name="monthly_fee" value={updateFormData.monthly_fee} onChange={handleUpdateInputChange} className="form-input" /></div>
                                <div className="form-group">
                                    <label>No Fee</label>
                                    <select name="no_fee" value={updateFormData.no_fee} onChange={handleUpdateInputChange} className="form-input">
                                        <option value="">Select</option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>
                            </div>'''

    match = re.search(r'<div className="form-grid">.*?</div>\s*<div className="modal-footer-btns"', content, re.DOTALL)
    if match:
        original_grid = content[match.start():content.find('<div className="modal-footer-btns"', match.start())]
        content = content.replace(original_grid, form_grid_replacement + '\n                            ')
    
    with open('c:/Users/DELL/Desktop/Crevo/Crevo/frontend/src/pages/Students.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

update_students()
