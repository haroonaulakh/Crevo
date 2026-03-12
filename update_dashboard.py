import re

def update_dashboard():
    with open('c:/Users/DELL/Desktop/Crevo/Crevo/frontend/src/pages/Dashboard.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add blood_group to newStudent state
    content = content.replace(
        "dob: '',\n    admission_date: '',",
        "dob: '',\n    blood_group: '',\n    admission_date: '',"
    )
    
    # Reset in handleAddStudent
    content = content.replace(
        "dob: '',\n        admission_date: '',",
        "dob: '',\n        blood_group: '',\n        admission_date: '',"
    )

    # 2. Add blood_group to studentData payload
    content = content.replace(
        "dob: newStudent.dob || null,\n        admission_date: newStudent.admission_date || null,",
        "dob: newStudent.dob || null,\n        blood_group: newStudent.blood_group || null,\n        admission_date: newStudent.admission_date || null,"
    )

    # 3. Replace the form-grid
    form_grid_replacement = '''<div className="form-grid">
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
              </div>'''
    
    match = re.search(r'<div className="form-grid">.*?</form>', content, re.DOTALL)
    if match:
        original_grid = content[match.start():content.find('<button type="submit"', match.start())]
        content = content.replace(original_grid, form_grid_replacement + '\n              ')
    
    with open('c:/Users/DELL/Desktop/Crevo/Crevo/frontend/src/pages/Dashboard.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

update_dashboard()
