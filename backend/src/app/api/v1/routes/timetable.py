"""
Timetable-generator API routes.

Tables used:
  - teachers            (teacher_id PK, teacher_name, …)
  - courses_offered     (course_id PK, course_name)
  - teacher_courses     (teacher_id PK/FK, teacher_name, sub_1 … sub_10, classes_taught)
  - class_wise_courses  (class_id, section, sub1 … sub10, teacher_id FK – incharge)
  - time_slots          (slots int8, duration text)
  - students            (class_enrolled, section – used to discover class+section combos)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from src.app.db.database import get_supabase_client
from src.app.models.schemas import (
    TeacherCreate,
    TeacherUpdate,
    TeacherCourseUpdate,
    ClassWiseCourseUpdate,
    TimeSlotsReplace,
    TimetableCellUpdate,
)

router = APIRouter()


# ── helpers ────────────────────────────────────────────────────────

def _sb():
    return get_supabase_client()


def _subjects_from_row(row: dict, prefix: str = "sub_", count: int = 10) -> list[str]:
    """Extract non-empty subject values from a row."""
    subs = []
    for i in range(1, count + 1):
        val = row.get(f"{prefix}{i}") or row.get(f"{prefix.rstrip('_')}{i}")
        if val and val.strip():
            subs.append(val.strip())
    return subs


def _parse_class_number(class_str: str) -> int:
    """Extract numeric class from string like '1', '10', 'Class 1', etc."""
    import re
    m = re.search(r'\d+', str(class_str))
    return int(m.group()) if m else 0


def _teacher_in_range(class_num: int, range_str: str) -> bool:
    """Check if a class number falls in a range like '1-5' or '6-8'."""
    if not range_str:
        return True
    try:
        parts = range_str.split("-")
        lo, hi = int(parts[0]), int(parts[1])
        return lo <= class_num <= hi
    except (ValueError, IndexError):
        return True


# ── Teachers ───────────────────────────────────────────────────────

@router.get("/teachers")
def list_teachers():
    res = _sb().table("teachers").select("*").execute()
    return res.data


@router.post("/teachers")
def add_teacher(body: TeacherCreate):
    payload = {k: v for k, v in body.model_dump().items() if v is not None}
    # Convert date objects to ISO strings for Supabase
    for key in ("dob", "joining_date"):
        if key in payload and payload[key] is not None:
            payload[key] = str(payload[key])
    res = _sb().table("teachers").insert(payload).execute()
    if res.data:
        return res.data[0]
    raise HTTPException(status_code=500, detail="Failed to add teacher")


@router.put("/teachers/{teacher_id}")
def update_teacher(teacher_id: int, body: TeacherUpdate):
    payload = {k: v for k, v in body.model_dump().items() if v is not None}
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")
    # Convert date objects to ISO strings for Supabase
    for key in ("dob", "joining_date"):
        if key in payload and payload[key] is not None:
            payload[key] = str(payload[key])
    res = (
        _sb().table("teachers")
        .update(payload)
        .eq("teacher_id", teacher_id)
        .execute()
    )
    if res.data:
        return res.data[0]
    raise HTTPException(status_code=404, detail="Teacher not found")


@router.delete("/teachers/{teacher_id}")
def delete_teacher(teacher_id: int):
    res = (
        _sb().table("teachers")
        .delete()
        .eq("teacher_id", teacher_id)
        .execute()
    )
    if res.data:
        return {"message": "Teacher deleted successfully", "teacher_id": teacher_id}
    raise HTTPException(status_code=404, detail="Teacher not found")


# ── Courses offered ───────────────────────────────────────────────

@router.get("/courses")
def list_courses():
    res = _sb().table("courses_offered").select("*").execute()
    return res.data


# ── Class Sections (from students table) ──────────────────────────

@router.get("/class-sections")
def list_class_sections():
    res = _sb().table("students").select("class_enrolled, section").execute()
    rows = res.data or []
    seen = set()
    result = []
    for r in rows:
        ce = str(r.get("class_enrolled", "")).strip()
        sec = str(r.get("section", "")).strip()
        key = (ce, sec)
        if key not in seen and ce:
            seen.add(key)
            result.append({"class_enrolled": ce, "section": sec})
    result.sort(key=lambda x: (_parse_class_number(x["class_enrolled"]), x["section"]))
    return result


# ── Teacher courses ───────────────────────────────────────────────

@router.get("/teacher-courses")
def list_teacher_courses():
    res = _sb().table("teacher_courses").select("*").execute()
    return res.data


@router.put("/teacher-courses/{teacher_id}")
def update_teacher_courses(teacher_id: int, body: TeacherCourseUpdate):
    payload = {k: v for k, v in body.model_dump().items() if v is not None}
    existing = (
        _sb().table("teacher_courses")
        .select("teacher_id")
        .eq("teacher_id", teacher_id)
        .execute()
    )
    if existing.data:
        res = (
            _sb().table("teacher_courses")
            .update(payload)
            .eq("teacher_id", teacher_id)
            .execute()
        )
    else:
        payload["teacher_id"] = teacher_id
        res = _sb().table("teacher_courses").insert(payload).execute()
    return res.data


# ── Class-wise courses ────────────────────────────────────────────

@router.get("/class-courses")
def list_class_courses():
    res = _sb().table("class_wise_courses").select("*").execute()
    return res.data


@router.put("/class-courses/{class_id}")
def update_class_courses(class_id: int, body: ClassWiseCourseUpdate):
    payload = body.model_dump()
    section = payload.get("section") or None
    query = _sb().table("class_wise_courses").select("class_id").eq("class_id", class_id)
    if section:
        query = query.eq("section", section)
    else:
        query = query.is_("section", "null")
    existing = query.execute()
    if existing.data:
        update_q = _sb().table("class_wise_courses").update(payload).eq("class_id", class_id)
        if section:
            update_q = update_q.eq("section", section)
        else:
            update_q = update_q.is_("section", "null")
        res = update_q.execute()
    else:
        payload["class_id"] = class_id
        res = _sb().table("class_wise_courses").insert(payload).execute()
    return res.data


# ── Time slots ────────────────────────────────────────────────────

@router.get("/time-slots")
def list_time_slots():
    res = _sb().table("time_slots").select("*").order("slots").execute()
    return res.data


@router.post("/time-slots")
def replace_time_slots(body: TimeSlotsReplace):
    sb = _sb()
    existing = sb.table("time_slots").select("slots").execute()
    if existing.data:
        for row in existing.data:
            sb.table("time_slots").delete().eq("slots", row["slots"]).execute()
    rows = [{"slots": ts.slots, "duration": ts.duration} for ts in body.time_slots]
    if rows:
        res = sb.table("time_slots").insert(rows).execute()
        return res.data
    return []


# ── Fixed Assignment schema ───────────────────────────────────────

class FixedAssignment(BaseModel):
    class_id: str          # e.g. "1", "10"
    section: Optional[str] = None
    subject: str
    teacher_id: int


class GenerateRequest(BaseModel):
    fixed_assignments: list[FixedAssignment] = []


# ── Timetable generation ─────────────────────────────────────────

@router.post("/generate")
def generate_timetable(body: GenerateRequest = GenerateRequest()):
    """
    Generate a conflict-free timetable with:
    - Section support
    - Teacher class-range priority
    - Fixed teacher-subject-class assignments
    - Unfilled slot fallback
    - Teacher workload tracking
    """
    sb = _sb()

    # Fetch data
    class_courses = sb.table("class_wise_courses").select("*").execute().data or []
    teacher_courses_rows = sb.table("teacher_courses").select("*").execute().data or []
    teachers_rows = sb.table("teachers").select("*").execute().data or []
    time_slots = sb.table("time_slots").select("*").order("slots").execute().data or []
    students_res = sb.table("students").select("class_enrolled, section").execute()
    student_rows = students_res.data or []

    if not class_courses or not time_slots:
        raise HTTPException(
            status_code=400,
            detail="Class courses or time slots data is missing. Configure them first.",
        )

    # ── Build class+section list ──
    seen_cs = set()
    class_section_list = []
    for sr in student_rows:
        ce = str(sr.get("class_enrolled", "")).strip()
        sec = str(sr.get("section", "")).strip()
        if not ce:
            continue
        key = (ce, sec)
        if key not in seen_cs:
            seen_cs.add(key)
            class_section_list.append({"class": ce, "section": sec})
    class_section_list.sort(key=lambda x: (_parse_class_number(x["class"]), x["section"]))

    if not class_section_list:
        for row in class_courses:
            cid = row["class_id"]
            sec = row.get("section") or ""
            key = (str(cid), sec)
            if key not in seen_cs:
                seen_cs.add(key)
                class_section_list.append({"class": str(cid), "section": sec})
        class_section_list.sort(key=lambda x: (_parse_class_number(x["class"]), x["section"]))

    # Build lookup maps
    teacher_map = {t["teacher_id"]: t["teacher_name"] for t in teachers_rows}

    teacher_subjects: dict[int, set[str]] = {}
    teacher_class_ranges: dict[int, list[str]] = {}
    for row in teacher_courses_rows:
        tid = row["teacher_id"]
        subs = set()
        for i in range(1, 11):
            val = row.get(f"sub_{i}")
            if val and val.strip():
                subs.add(val.strip())
        teacher_subjects[tid] = subs
        ct = row.get("classes_taught") or ""
        if ct.strip():
            ranges = [r.strip() for r in ct.split(",") if r.strip()]
            teacher_class_ranges[tid] = ranges
        else:
            teacher_class_ranges[tid] = []

    class_info: dict[tuple, dict] = {}
    for row in class_courses:
        cid = str(row["class_id"])
        sec = str(row.get("section") or "").strip()
        incharge = row.get("teacher_id")
        subs = []
        for i in range(1, 11):
            val = row.get(f"sub{i}")
            if val and val.strip():
                subs.append(val.strip())
        class_info[(cid, sec)] = {"incharge": incharge, "subjects": subs}

    for cs in class_section_list:
        key = (cs["class"], cs["section"])
        if key not in class_info:
            base_key = (cs["class"], "")
            if base_key in class_info:
                class_info[key] = {
                    "incharge": class_info[base_key]["incharge"],
                    "subjects": list(class_info[base_key]["subjects"]),
                }
            else:
                cnum = _parse_class_number(cs["class"])
                for k, v in class_info.items():
                    if _parse_class_number(k[0]) == cnum and not k[1]:
                        class_info[key] = {
                            "incharge": v["incharge"],
                            "subjects": list(v["subjects"]),
                        }
                        break

    # Break slots
    break_slots = set()
    slot_duration = {}
    for ts in time_slots:
        slot_duration[ts["slots"]] = ts["duration"]
        dur = (ts.get("duration") or "").strip().upper()
        if "BREAK" in dur:
            break_slots.add(ts["slots"])

    sorted_slots = sorted(slot_duration.keys())

    # ── Parse fixed assignments ──────────────────────────────────
    # Group fixed assignments by class key
    # fixed_by_class[(class_str, section)] = [ { subject, teacher_id }, ... ]
    fixed_by_class: dict[tuple, list[dict]] = {}
    for fa in body.fixed_assignments:
        ck = (str(fa.class_id).strip(), (fa.section or "").strip())
        if ck not in fixed_by_class:
            fixed_by_class[ck] = []
        fixed_by_class[ck].append({
            "subject": fa.subject,
            "teacher_id": fa.teacher_id,
        })

    # ── Greedy assignment ────────────────────────────────────────

    timetable: dict[tuple, dict[int, tuple]] = {
        (cs["class"], cs["section"]): {} for cs in class_section_list
    }
    class_keys = [(cs["class"], cs["section"]) for cs in class_section_list]

    for slot in sorted_slots:
        if slot in break_slots:
            for ck in class_keys:
                timetable[ck][slot] = (None, "BREAK")
            continue

        used_teachers_in_slot: set[int] = set()

        for ck in class_keys:
            info = class_info.get(ck, {"incharge": None, "subjects": []})
            class_subs = info["subjects"]
            class_num = _parse_class_number(ck[0])
            assigned = False

            # Slot 1 → incharge
            if slot == sorted_slots[0] and info["incharge"]:
                tid = info["incharge"]
                if tid not in used_teachers_in_slot:
                    incharge_subs = teacher_subjects.get(tid, set())
                    common = [s for s in class_subs if s in incharge_subs]
                    subj = common[0] if common else (class_subs[0] if class_subs else "")
                    timetable[ck][slot] = (tid, subj)
                    used_teachers_in_slot.add(tid)
                    continue

            # Already-assigned subjects in this class
            assigned_subjects = [
                timetable[ck][s][1]
                for s in timetable[ck]
                if timetable[ck][s][1] and timetable[ck][s][1] != "BREAK"
            ]

            # Sort class subjects by least-assigned first
            sub_priority = sorted(
                class_subs,
                key=lambda s: assigned_subjects.count(s),
            )

            # ── Check fixed assignments for this class ──
            fixed_list = fixed_by_class.get(ck, [])
            fixed_subs_remaining = []
            for fa in fixed_list:
                # Count how many times this fixed subject has been assigned
                assigned_count = assigned_subjects.count(fa["subject"])
                # Check how many times total the subject appears in fixed_list
                total_fixed = len([f for f in fixed_list if f["subject"] == fa["subject"]])
                # It needs at least total_fixed assignments
                if assigned_count < total_fixed:
                    fixed_subs_remaining.append(fa)

            # Try fixed assignments first
            for fa in fixed_subs_remaining:
                if fa["teacher_id"] not in used_teachers_in_slot:
                    timetable[ck][slot] = (fa["teacher_id"], fa["subject"])
                    used_teachers_in_slot.add(fa["teacher_id"])
                    assigned = True
                    # Remove this from remaining so it's not reused
                    fixed_subs_remaining.remove(fa)
                    break

            if assigned:
                continue

            # Teacher priority sort
            def teacher_sort_key(tid):
                ranges = teacher_class_ranges.get(tid, [])
                if not ranges:
                    return 1
                for idx, r in enumerate(ranges):
                    if _teacher_in_range(class_num, r):
                        return idx
                return 999

            # Normal assignment with priority
            for subj in sub_priority:
                # Skip subjects that are fixed to specific teachers (prefer allocating those later)
                fixed_subjects_set = {fa["subject"] for fa in fixed_list}
                # Check if this subject has fixed-only teachers AND has already been minimally covered
                # Only skip if there are unfixed subjects available
                candidates = [
                    tid
                    for tid, subs in teacher_subjects.items()
                    if subj in subs and tid not in used_teachers_in_slot
                ]
                # If this subject is fixed, prefer the fixed teacher
                fixed_teacher_for_sub = [
                    fa["teacher_id"] for fa in fixed_list if fa["subject"] == subj
                ]
                if fixed_teacher_for_sub:
                    # Prioritize the fixed teacher
                    fixed_available = [
                        t for t in fixed_teacher_for_sub if t not in used_teachers_in_slot
                    ]
                    if fixed_available:
                        chosen = fixed_available[0]
                        timetable[ck][slot] = (chosen, subj)
                        used_teachers_in_slot.add(chosen)
                        assigned = True
                        break

                candidates.sort(key=teacher_sort_key)
                if candidates:
                    chosen = candidates[0]
                    timetable[ck][slot] = (chosen, subj)
                    used_teachers_in_slot.add(chosen)
                    assigned = True
                    break

            if not assigned:
                for subj in class_subs:
                    candidates = [
                        tid
                        for tid, subs in teacher_subjects.items()
                        if subj in subs and tid not in used_teachers_in_slot
                    ]
                    candidates.sort(key=teacher_sort_key)
                    if candidates:
                        timetable[ck][slot] = (candidates[0], subj)
                        used_teachers_in_slot.add(candidates[0])
                        assigned = True
                        break

            if not assigned:
                chosen_subj = sub_priority[0] if sub_priority else ""
                timetable[ck][slot] = (None, chosen_subj)

    # ── Build teacher workload ────────────────────────────────────
    teacher_workload: dict[int, list[dict]] = {}
    for ck in class_keys:
        for slot in sorted_slots:
            tid, subj = timetable[ck].get(slot, (None, ""))
            if tid and subj and subj != "BREAK":
                if tid not in teacher_workload:
                    teacher_workload[tid] = []
                teacher_workload[tid].append({
                    "class": ck[0],
                    "section": ck[1],
                    "subject": subj,
                    "slot": slot,
                })

    # ── Build response ────────────────────────────────────────────
    result = []
    for ck in class_keys:
        for slot in sorted_slots:
            tid, subj = timetable[ck].get(slot, (None, ""))
            result.append({
                "class_id": _parse_class_number(ck[0]),
                "class_name": ck[0],
                "section": ck[1],
                "slot": slot,
                "duration": slot_duration.get(slot, ""),
                "teacher_id": tid,
                "teacher_name": teacher_map.get(tid, "") if tid else "",
                "subject": subj,
                "is_break": slot in break_slots,
                "needs_teacher": tid is None and subj != "" and subj != "BREAK",
            })

    all_teacher_ids = set(teacher_subjects.keys())
    free_per_slot: dict[int, list] = {}
    for slot in sorted_slots:
        if slot in break_slots:
            free_per_slot[slot] = []
            continue
        used = set()
        for ck in class_keys:
            entry = timetable[ck].get(slot, (None,))
            if entry[0] is not None:
                used.add(entry[0])
        free = [
            {"teacher_id": tid, "teacher_name": teacher_map.get(tid, "")}
            for tid in sorted(all_teacher_ids - used)
        ]
        free_per_slot[slot] = free

    classes_list = [
        {"class": cs["class"], "section": cs["section"],
         "label": f"Class {cs['class']}" + (f" ({cs['section']})" if cs["section"] else "")}
        for cs in class_section_list
    ]

    workload_summary = []
    for tid, lectures in teacher_workload.items():
        workload_summary.append({
            "teacher_id": tid,
            "teacher_name": teacher_map.get(tid, ""),
            "total_lectures": len(lectures),
            "lectures": lectures,
        })
    workload_summary.sort(key=lambda x: x["teacher_name"])

    return {
        "timetable": result,
        "free_teachers": free_per_slot,
        "slots": [
            {"slot": s, "duration": slot_duration[s], "is_break": s in break_slots}
            for s in sorted_slots
        ],
        "classes": classes_list,
        "teacher_workload": workload_summary,
    }
