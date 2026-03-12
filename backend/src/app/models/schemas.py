from pydantic import BaseModel, Field
from typing import Optional
from datetime import date


class StudentCreate(BaseModel):
    
    #Schema for creating a new student.

    #Database table columns:

    reg_no: int  # primary key, never null
    student_name: str
    gender: str
    b_form: str
    dob: date  # Date format
    admission_date: date  # Date format
    f_g_name: str  # Father's/Guardian's Name
    f_g_cnic: str
    f_g_contact: str  # Father's/Guardian's Contact
    address: str 
    class_enrolled: str  # Class enrolled in (text)
    section: str  # Section (text)
    group: str  # Group (text)
    class_of_admission: str
    caste : str
    monthly_fee: int  # Monthly fee (integer)
    no_fee : str
    blood_group: Optional[str] = None
  
    

    class Config:
        populate_by_name = True
        # Ensures that the field names in the model correspond to the input and output correctly


class StudentResponse(BaseModel):
    
    # Schema for returning student data to the frontend.
    # Uses aliases so the JSON keys match what the React app expects:
    
    reg_no: int  # primary key, never null
    student_name: str
    gender: str
    b_form: str
    dob: date  # Date format
    admission_date: date  # Date format
    f_g_name: str  # Father's/Guardian's Name
    f_g_cnic: str
    f_g_contact: str  # Father's/Guardian's Contact
    address: str 
    class_enrolled: str  # Class enrolled in (text)
    section: str  # Section (text)
    group: str  # Group (text)
    class_of_admission: str
    caste : str
    monthly_fee: int  # Monthly fee (integer)
    no_fee : str
    blood_group: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True


class StudentUpdate(BaseModel):
    """Schema for updating an existing student."""
    student_name: Optional[str] = None
    gender: Optional[str] = None
    b_form: Optional[str] = None
    dob: Optional[date] = None
    admission_date: Optional[date] = None
    f_g_name: Optional[str] = None
    f_g_cnic: Optional[str] = None
    f_g_contact: Optional[str] = None
    address: Optional[str] = None
    class_enrolled: Optional[str] = None
    section: Optional[str] = None
    group: Optional[str] = None
    class_of_admission: Optional[str] = None
    caste: Optional[str] = None
    monthly_fee: Optional[int] = None
    no_fee: Optional[str] = None
    blood_group: Optional[str] = None

    class Config:
        populate_by_name = True


class SearchRequest(BaseModel):
    """Simple search request with a single query string."""
    query: str


class LoginRequest(BaseModel):
    """Request body for login endpoint."""
    email: str
    password: str


class LoginResponse(BaseModel):
    """Response body for login endpoint."""
    success: bool
    message: str
    user: Optional[dict] = None


class WithdrawRequest(BaseModel):
    """Request body for withdrawing a student."""
    class_of_withdrawl: str


# ── Timetable-related schemas ──────────────────────────────────────

class TeacherCreate(BaseModel):
    teacher_name: str
    teacher_fg_name: Optional[str] = None
    dob: Optional[date] = None
    qualification: Optional[str] = None
    joining_date: Optional[date] = None
    teacher_cnic: Optional[str] = None
    teacher_contact: Optional[str] = None
    teacher_address: Optional[str] = None

    class Config:
        populate_by_name = True


class TeacherUpdate(BaseModel):
    teacher_name: Optional[str] = None
    teacher_fg_name: Optional[str] = None
    dob: Optional[date] = None
    qualification: Optional[str] = None
    joining_date: Optional[date] = None
    teacher_cnic: Optional[str] = None
    teacher_contact: Optional[str] = None
    teacher_address: Optional[str] = None

    class Config:
        populate_by_name = True


class TeacherResponse(BaseModel):
    teacher_id: int
    teacher_name: str
    teacher_fg_name: Optional[str] = None
    dob: Optional[date] = None
    qualification: Optional[str] = None
    joining_date: Optional[date] = None
    teacher_cnic: Optional[str] = None
    teacher_contact: Optional[str] = None
    teacher_address: Optional[str] = None

    class Config:
        from_attributes = True


class CourseResponse(BaseModel):
    course_id: int
    course_name: str

    class Config:
        from_attributes = True


class TeacherCourseUpdate(BaseModel):
    """Update subjects a teacher can teach (up to 10) + class range priority."""
    teacher_name: Optional[str] = None
    sub_1: Optional[str] = None
    sub_2: Optional[str] = None
    sub_3: Optional[str] = None
    sub_4: Optional[str] = None
    sub_5: Optional[str] = None
    sub_6: Optional[str] = None
    sub_7: Optional[str] = None
    sub_8: Optional[str] = None
    sub_9: Optional[str] = None
    sub_10: Optional[str] = None
    classes_taught: Optional[str] = None  # e.g. "1-5", "6-10", "1-5,6-10"


class ClassWiseCourseUpdate(BaseModel):
    """Update incharge + subjects for a class (optionally with section)."""
    teacher_id: int  # incharge teacher
    section: Optional[str] = None  # e.g. "A", "B", null if class has no sections
    sub1: Optional[str] = None
    sub2: Optional[str] = None
    sub3: Optional[str] = None
    sub4: Optional[str] = None
    sub5: Optional[str] = None
    sub6: Optional[str] = None
    sub7: Optional[str] = None
    sub8: Optional[str] = None
    sub9: Optional[str] = None
    sub10: Optional[str] = None


class TimeSlotEntry(BaseModel):
    """A single time-slot with its duration text and optional break flag."""
    slots: int
    duration: str        # e.g. "8:00-8:45" or "BREAK"
    is_break: Optional[bool] = False


class TimeSlotsReplace(BaseModel):
    """Replace all time slots at once."""
    time_slots: list[TimeSlotEntry]


class TimetableCellUpdate(BaseModel):
    """Update a single cell in the generated timetable."""
    class_id: int
    slot: int
    teacher_id: Optional[int] = None
    subject: Optional[str] = None
    section: Optional[str] = None
