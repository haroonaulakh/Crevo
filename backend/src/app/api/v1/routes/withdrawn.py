from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from src.app.db.database import get_supabase_client


router = APIRouter()


class WithdrawnStudentCreate(BaseModel):
    """Schema for manually adding a withdrawn student record."""
    reg_no: int
    student_name: str
    gender: Optional[str] = None
    b_form: Optional[str] = None
    dob: Optional[str] = None
    admission_date: Optional[str] = None
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
    class_of_withdrawl: Optional[str] = None


def format_withdrawn_response(student: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format raw Supabase row from `students_withdrawn` table into the structure
    expected by the frontend (same as students + class_of_withdrawl).
    """
    reg_no = student.get("reg_no")

    return {
        "id": reg_no,
        "reg_no": reg_no,
        "student_name": student.get("student_name"),
        "gender": student.get("gender"),
        "b_form": student.get("b_form"),
        "dob": student.get("dob"),
        "admission_date": student.get("admission_date"),
        "f_g_name": student.get("f_g_name"),
        "f_g_cnic": student.get("f_g_cnic"),
        "f_g_contact": student.get("f_g_contact"),
        "address": student.get("address"),
        "class_enrolled": student.get("class_enrolled"),
        "section": student.get("section"),
        "group": student.get("group"),
        "class_of_admission": student.get("class_of_admission"),
        "caste": student.get("caste"),
        "monthly_fee": student.get("monthly_fee"),
        "no_fee": student.get("no_fee"),
        "class_of_withdrawl": student.get("class_of_withdrawl"),
    }


@router.get("")
@router.get("/")
async def get_all_withdrawn_students() -> List[Dict[str, Any]]:
    """Return all students from the `students_withdrawn` table."""
    try:
        supabase = get_supabase_client()

        result = supabase.table("students_withdrawn").select("*").execute()

        if not getattr(result, "data", None):
            return []

        return [format_withdrawn_response(row) for row in result.data]
    except Exception as e:
        error_msg = str(e)
        print(f"Error fetching withdrawn students: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Error fetching withdrawn students: {error_msg}")


@router.post("")
@router.post("/")
async def add_withdrawn_student_manually(student: WithdrawnStudentCreate) -> Dict[str, Any]:
    """Manually add a record to the students_withdrawn table."""
    try:
        supabase = get_supabase_client()

        # Check if reg_no already exists in withdrawn table
        check = supabase.table("students_withdrawn").select("reg_no").eq("reg_no", student.reg_no).execute()
        if getattr(check, "data", None) and len(check.data) > 0:
            raise HTTPException(status_code=409, detail=f"A withdrawn record for reg_no {student.reg_no} already exists.")

        # Build insert data, exclude None values
        data = {k: v for k, v in student.model_dump().items() if v is not None}

        result = supabase.table("students_withdrawn").insert(data).execute()

        if not getattr(result, "data", None):
            raise HTTPException(status_code=500, detail="Failed to add withdrawn student record")

        return format_withdrawn_response(result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        print(f"Error adding withdrawn student: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Error adding withdrawn student: {error_msg}")


@router.delete("/{reg_no}")
async def delete_withdrawn_student(reg_no: int) -> dict:
    """Permanently delete a student from the students_withdrawn table."""
    try:
        supabase = get_supabase_client()

        check = supabase.table("students_withdrawn").select("reg_no").eq("reg_no", reg_no).execute()
        if not getattr(check, "data", None) or len(check.data) == 0:
            raise HTTPException(status_code=404, detail="Withdrawn student not found")

        supabase.table("students_withdrawn").delete().eq("reg_no", reg_no).execute()

        return {"success": True, "message": f"Withdrawn student {reg_no} permanently deleted."}
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        print(f"Error deleting withdrawn student: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Error deleting withdrawn student: {error_msg}")
