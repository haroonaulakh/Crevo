from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List

from src.app.db.database import get_supabase_client


router = APIRouter()


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
