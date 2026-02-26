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
