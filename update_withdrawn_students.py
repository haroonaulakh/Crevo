import re

def update_withdrawn_students():
    with open('c:/Users/DELL/Desktop/Crevo/Crevo/frontend/src/pages/WithdrawnStudents.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    form_grid_replacement = '''<div className="add-form-grid">
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
                                    <div className="label-row">
                                        <label>B-Form</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={addForm.b_form === 'N/A'} onChange={(e) => setAddForm(prev => ({ ...prev, b_form: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                                    </div>
                                    <input type="text" name="b_form" value={addForm.b_form} onChange={handleAddFormChange} placeholder="B-Form number" disabled={addForm.b_form === 'N/A'} />
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
                                        <label>Father/Guardian Name</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={addForm.f_g_name === 'N/A'} onChange={(e) => setAddForm(prev => ({ ...prev, f_g_name: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                                    </div>
                                    <input type="text" name="f_g_name" value={addForm.f_g_name} onChange={handleAddFormChange} placeholder="Guardian name" disabled={addForm.f_g_name === 'N/A'} />
                                </div>
                                <div className="form-group">
                                    <div className="label-row">
                                        <label>Guardian CNIC</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={addForm.f_g_cnic === 'N/A'} onChange={(e) => setAddForm(prev => ({ ...prev, f_g_cnic: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                                    </div>
                                    <input type="text" name="f_g_cnic" value={addForm.f_g_cnic} onChange={handleAddFormChange} placeholder="CNIC number" disabled={addForm.f_g_cnic === 'N/A'} />
                                </div>
                                <div className="form-group">
                                    <div className="label-row">
                                        <label>Guardian Contact</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={addForm.f_g_contact === 'N/A'} onChange={(e) => setAddForm(prev => ({ ...prev, f_g_contact: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                                    </div>
                                    <input type="text" name="f_g_contact" value={addForm.f_g_contact} onChange={handleAddFormChange} placeholder="Phone number" disabled={addForm.f_g_contact === 'N/A'} />
                                </div>
                                <div className="form-group form-group-wide">
                                    <div className="label-row">
                                        <label>Address</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={addForm.address === 'N/A'} onChange={(e) => setAddForm(prev => ({ ...prev, address: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                                    </div>
                                    <input type="text" name="address" value={addForm.address} onChange={handleAddFormChange} placeholder="Full address" disabled={addForm.address === 'N/A'} />
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
                                    <div className="label-row">
                                        <label>Section</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={addForm.section === 'N/A'} onChange={(e) => setAddForm(prev => ({ ...prev, section: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                                    </div>
                                    <input type="text" name="section" value={addForm.section} onChange={handleAddFormChange} placeholder="e.g. A" disabled={addForm.section === 'N/A'} />
                                </div>
                                <div className="form-group">
                                    <div className="label-row">
                                        <label>Group</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={addForm.group === 'N/A'} onChange={(e) => setAddForm(prev => ({ ...prev, group: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                                    </div>
                                    <input type="text" name="group" value={addForm.group} onChange={handleAddFormChange} placeholder="e.g. Science" disabled={addForm.group === 'N/A'} />
                                </div>
                                <div className="form-group">
                                    <div className="label-row">
                                        <label>Class of Admission</label>
                                        <label className="na-checkbox"><input type="checkbox" checked={addForm.class_of_admission === 'N/A'} onChange={(e) => setAddForm(prev => ({ ...prev, class_of_admission: e.target.checked ? 'N/A' : '' }))} /> N/A</label>
                                    </div>
                                    <select name="class_of_admission" value={addForm.class_of_admission} onChange={handleAddFormChange} disabled={addForm.class_of_admission === 'N/A'}>
                                        <option value="">Select</option>
                                        {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
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
                            </div>'''

    start_idx = content.find('<div className="add-form-grid">')
    end_idx = content.find('{addError && (')
    
    if start_idx != -1 and end_idx != -1:
        content = content[:start_idx] + form_grid_replacement + '\n\n                            ' + content[end_idx:]

    with open('c:/Users/DELL/Desktop/Crevo/Crevo/frontend/src/pages/WithdrawnStudents.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

update_withdrawn_students()
