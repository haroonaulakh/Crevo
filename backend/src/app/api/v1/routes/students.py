from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List

from src.app.db.database import get_supabase_client
from src.app.models.schemas import StudentCreate, SearchRequest, StudentUpdate, WithdrawRequest


router = APIRouter()


def format_student_response(student: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format raw Supabase row from `students` table into the structure
    expected by the frontend.
    """
    # Use reg_no as a stable identifier (no separate id column in table)
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
    }


@router.get("/")
async def get_all_students() -> List[Dict[str, Any]]:
    """Return all students from the `students` table."""
    try:
        supabase = get_supabase_client()

        result = supabase.table("students").select("*").execute()

        if not getattr(result, "data", None):
            return []

        return [format_student_response(row) for row in result.data]
    except Exception as e:
        error_msg = str(e)
        print(f"Error fetching students: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Error fetching students: {error_msg}")


@router.post("/search/name")
async def search_students_by_name(search_request: SearchRequest) -> List[Dict[str, Any]]:
    """
    Search students by first name or last name (case-insensitive, partial match).
    """
    try:
        supabase = get_supabase_client()
        query = search_request.query.strip()

        if not query:
            return []

        results: List[Dict[str, Any]] = []
        existing_keys = set()

        # Search in first name
        try:
            fname_result = supabase.table("students").select("*").ilike("student_name", f"%{query}%").execute()
            if fname_result.data:
                for student in fname_result.data:
                    key = student.get("reg_no") or str(student)
                    if key not in existing_keys:
                        results.append(student)
                        existing_keys.add(key)
        except Exception as e:
            print(f"Error in student_name search: {e}")

        return [format_student_response(row) for row in results]
    except Exception as e:
        error_msg = str(e)
        print(f"Error searching students by name: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Error searching students by name: {error_msg}")


@router.post("/search")
async def search_students(search_request: SearchRequest) -> List[Dict[str, Any]]:
    """
    Search students by registration number (exact / partial) OR by name.
    """
    try:
        supabase = get_supabase_client()
        query = search_request.query.strip()

        if not query:
            return []

        results: List[Dict[str, Any]] = []
        existing_keys = set()

        # If numeric, try exact reg_no match first
        if query.isdigit():
            try:
                query_num = int(query)
                exact_result = supabase.table("students").select("*").eq("reg_no", query_num).execute()
                if exact_result.data:
                    for student in exact_result.data:
                        key = student.get("reg_no") or str(student)
                        if key not in existing_keys:
                            results.append(student)
                            existing_keys.add(key)
            except Exception as e:
                print(f"Error in exact reg_no search: {e}")

        # Name search (first and last name, case-insensitive partial)
        for field in ("student_name", "gender"):
            try:
                name_result = supabase.table("students").select("*").ilike(field, f"%{query}%").execute()
                if name_result.data:
                    for student in name_result.data:
                        key = student.get("reg_no") or str(student)
                        if key not in existing_keys:
                            results.append(student)
                            existing_keys.add(key)
            except Exception as e:
                print(f"Error in {field} search: {e}")

        # If numeric and still no results, try partial match on reg_no as text
        if query.isdigit() and not results:
            try:
                all_result = supabase.table("students").select("*").execute()
                if all_result.data:
                    query_str = str(query)
                    for student in all_result.data:
                        reg_val = str(student.get("reg_no", ""))
                        if query_str in reg_val:
                            key = student.get("reg_no") or str(student)
                            if key not in existing_keys:
                                results.append(student)
                                existing_keys.add(key)
            except Exception as e:
                print(f"Error in partial reg_no search: {e}")

        return [format_student_response(row) for row in results]
    except Exception as e:
        error_msg = str(e)
        print(f"Error searching students: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Error searching students: {error_msg}")


@router.post("/")
async def add_student(student: StudentCreate) -> Dict[str, Any]:
    """Add a new student to the database."""
    try:
        supabase = get_supabase_client()

        # Convert Pydantic model to dict, using aliases for column names
        # Use mode='json' to properly serialize date objects
        data = student.model_dump(mode='json', exclude_unset=True, by_alias=True)

        # Ensure numeric fields are ints
        int_fields = ["reg_no", "monthly_fee"]
        for field in int_fields:
            if field in data and data[field] is not None:
                try:
                    data[field] = int(data[field])
                except (ValueError, TypeError):
                    # If conversion fails, drop the field to let DB defaults/constraints handle it
                    data.pop(field, None)

        result = supabase.table("students").insert(data).execute()

        if not getattr(result, "data", None):
            raise HTTPException(status_code=500, detail="Failed to add student")

        return format_student_response(result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        print(f"Error adding student: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Error adding student: {error_msg}")


@router.get("/{reg_no}")
async def get_student_by_reg_no(reg_no: int) -> Dict[str, Any]:
    """Get a single student by registration number (primary key)."""
    try:
        supabase = get_supabase_client()

        result = supabase.table("students").select("*").eq("reg_no", reg_no).execute()

        if not getattr(result, "data", None):
            raise HTTPException(status_code=404, detail="Student not found")

        return format_student_response(result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        print(f"Error fetching student: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Error fetching student: {error_msg}")


@router.put("/{reg_no}")
async def update_student(reg_no: int, student_update: StudentUpdate) -> Dict[str, Any]:
    """Update an existing student by registration number."""
    try:
        supabase = get_supabase_client()

        # Convert Pydantic model to dict, drop unchanged/unset fields
        update_data = student_update.model_dump(mode='json', exclude_unset=True, by_alias=True)
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields provided to update")

        # Ensure numeric fields are ints
        if "monthly_fee" in update_data and update_data["monthly_fee"] is not None:
            try:
                update_data["monthly_fee"] = int(update_data["monthly_fee"])
            except (ValueError, TypeError):
                update_data.pop("monthly_fee", None)

        result = supabase.table("students").update(update_data).eq("reg_no", reg_no).execute()

        if not getattr(result, "data", None) or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Student not found or no changes made")

        return format_student_response(result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        print(f"Error updating student: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Error updating student: {error_msg}")



@router.delete("/{reg_no}")
async def delete_student_permanently(reg_no: int) -> Dict[str, Any]:
    """Permanently delete a student from the students table only."""
    try:
        supabase = get_supabase_client()

        # Verify student exists first
        check = supabase.table("students").select("reg_no").eq("reg_no", reg_no).execute()
        if not getattr(check, "data", None) or len(check.data) == 0:
            raise HTTPException(status_code=404, detail="Student not found")

        supabase.table("students").delete().eq("reg_no", reg_no).execute()

        return {"success": True, "message": f"Student {reg_no} permanently deleted."}
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        print(f"Error permanently deleting student: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Error deleting student: {error_msg}")


@router.post("/{reg_no}/withdraw")
async def withdraw_student(reg_no: int, withdraw_request: WithdrawRequest) -> Dict[str, Any]:
    """Copy student to students_withdrawn with class_of_withdrawal, then remove from students."""
    try:
        supabase = get_supabase_client()

        # Fetch the student
        result = supabase.table("students").select("*").eq("reg_no", reg_no).execute()
        if not getattr(result, "data", None) or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Student not found")

        student_data = result.data[0]

        # Build withdrawn record – add class_of_withdrawl
        withdrawn_data = {**student_data, "class_of_withdrawl": withdraw_request.class_of_withdrawl}

        # Insert into students_withdrawn
        insert_result = supabase.table("students_withdrawn").insert(withdrawn_data).execute()
        if not getattr(insert_result, "data", None):
            raise HTTPException(status_code=500, detail="Failed to insert student into withdrawn table")

        # Delete from students
        supabase.table("students").delete().eq("reg_no", reg_no).execute()

        return {"success": True, "message": f"Student {reg_no} withdrawn successfully."}
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        print(f"Error withdrawing student: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Error withdrawing student: {error_msg}")
