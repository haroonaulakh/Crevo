from pydantic import BaseModel, Field
from typing import Optional
from datetime import date


class StudentCreate(BaseModel):
    """
    Schema for creating a new student.

    Database table columns:
    - reg_no (int, primary key, not null)
    - student_name (text)
    - gender (text)
    - dob (date)
    - admission_date (date)
    - f_g_name (text)
    - f_g_contact (text)
    - class_enrolled (text)
    - section (text)
    - group (text)
    - monthly_fee (int)
    - fee_due (int)
    """

    reg_no: int  # primary key, never null
    student_name: str
    gender: str
    dob: date  # Date format
    admission_date: date  # Date format
    f_g_name: str  # Father's/Guardian's Name
    f_g_contact: str  # Father's/Guardian's Contact
    class_enrolled: str  # Class enrolled in (text)
    section: str  # Section (text)
    group: str  # Group (text)
    monthly_fee: int  # Monthly fee (integer)

    class Config:
        populate_by_name = True
        # Ensures that the field names in the model correspond to the input and output correctly


class StudentResponse(BaseModel):
    """
    Schema for returning student data to the frontend.

    Uses aliases so the JSON keys match what the React app expects:
    - reg_no: "reg_no"
    - student_name: "student_name"
    - gender: "gender"
    - dob: "dob"
    - admission_date: "admission_date"
    - f_g_name: "f_g_name"
    - f_g_contact: "f_g_contact"
    - class_enrolled: "class_enrolled"
    - section: "section"
    - group: "group"
    - monthly_fee: "monthly_fee"
    """

    reg_no: int  # Primary key, never null
    student_name: str
    gender: str
    dob: date  # Date format
    admission_date: date  # Date format
    f_g_name: str  # Father's/Guardian's Name
    f_g_contact: str  # Father's/Guardian's Contact
    class_enrolled: str  # Class enrolled in (text)
    section: str  # Section (text)
    group: str  # Group (text)
    monthly_fee: int  # Monthly fee (integer)

    class Config:
        from_attributes = True
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
