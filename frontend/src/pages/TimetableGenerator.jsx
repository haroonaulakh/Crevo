import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, Check, Clock, Calendar, Users, BookOpen, Zap, X, ChevronDown, ChevronUp, Trash2, Plus, RefreshCw, Download, AlertTriangle, BarChart3, ArrowLeftRight, Lock } from 'lucide-react';
import { timetableAPI } from '../services/api';
import * as XLSX from 'xlsx';
import './TimetableGenerator.css';

const STEP_LABELS = ['Teacher Courses', 'Class Configuration', 'Time Slots', 'Generated Timetable'];
const STEP_ICONS = [BookOpen, Users, Clock, Calendar];
const CLASS_RANGES = ['1-5', '6-8', '9-10'];

export default function TimetableGenerator() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Data
    const [teachers, setTeachers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [teacherCourses, setTeacherCourses] = useState([]);
    const [classCourses, setClassCourses] = useState({});
    const [timeSlots, setTimeSlots] = useState([]);
    const [numSlots, setNumSlots] = useState(6);
    const [confirmDeleteSlots, setConfirmDeleteSlots] = useState(false);
    const [classSections, setClassSections] = useState([]);
    const [fixedAssignments, setFixedAssignments] = useState([]); // [{ class_id, section, subject, teacher_id }]

    // Timetable
    const [timetableData, setTimetableData] = useState(null);
    const [editingCell, setEditingCell] = useState(null);
    const [subjectEditCell, setSubjectEditCell] = useState(null);
    const [showWorkload, setShowWorkload] = useState(false);
    const [expandedClasses, setExpandedClasses] = useState({});
    const [swapCell, setSwapCell] = useState(null); // { classId, section, slot, mode: 'both'|'teacher'|'subject' }
    const [swapModePicker, setSwapModePicker] = useState(null); // cellKey for which mode picker is open

    // Show message
    const flash = useCallback((text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }, []);

    // ── Load data ────────────────────────────────────────────────
    useEffect(() => { loadInitialData(); }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [t, c, tc, cc, ts, cs] = await Promise.all([
                timetableAPI.getTeachers(),
                timetableAPI.getCourses(),
                timetableAPI.getTeacherCourses(),
                timetableAPI.getClassCourses(),
                timetableAPI.getTimeSlots(),
                timetableAPI.getClassSections(),
            ]);
            setTeachers(t || []);
            setCourses(c || []);
            setTeacherCourses(tc || []);
            // Build classCourses map keyed by "classId-section"
            const ccMap = {};
            (cc || []).forEach(row => {
                const key = row.section ? `${row.class_id}-${row.section}` : `${row.class_id}`;
                ccMap[key] = row;
            });
            setClassCourses(ccMap);
            // Time slots
            if (ts && ts.length > 0) {
                setTimeSlots(ts.map(s => ({
                    slots: s.slots,
                    duration: s.duration || '',
                    is_break: (s.duration || '').toUpperCase().includes('BREAK'),
                })));
                setNumSlots(ts.length);
            }
            setClassSections(cs || []);
        } catch (err) {
            flash('Error loading data: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // ── Derived: group class sections ────────────────────────────
    const groupedClasses = useMemo(() => {
        const groups = {};
        classSections.forEach(cs => {
            const cls = cs.class_enrolled;
            if (!groups[cls]) groups[cls] = [];
            if (cs.section) groups[cls].push(cs.section);
        });
        // Sort sections and deduplicate
        Object.keys(groups).forEach(cls => {
            groups[cls] = [...new Set(groups[cls])].sort();
        });
        return groups;
    }, [classSections]);

    const sortedClassNumbers = useMemo(() => {
        return Object.keys(groupedClasses).sort((a, b) => {
            const na = parseInt(a) || 0, nb = parseInt(b) || 0;
            return na - nb;
        });
    }, [groupedClasses]);

    // ── Helpers ──────────────────────────────────────────────────

    const getTeacherSubjects = (teacherId) => {
        const row = teacherCourses.find(r => r.teacher_id === teacherId);
        if (!row) return [];
        const subs = [];
        for (let i = 1; i <= 10; i++) {
            const v = row[`sub_${i}`];
            if (v && v.trim()) subs.push(v.trim());
        }
        return subs;
    };

    const getTeacherClassRanges = (teacherId) => {
        const row = teacherCourses.find(r => r.teacher_id === teacherId);
        if (!row) return [];
        const ct = row.classes_taught || '';
        if (!ct.trim()) return [];
        return ct.split(',').map(r => r.trim()).filter(Boolean);
    };

    const getClassSubjects = (classKey) => {
        const row = classCourses[classKey];
        if (!row) return [];
        const subs = [];
        for (let i = 1; i <= 10; i++) {
            const v = row[`sub${i}`];
            if (v && v.trim()) subs.push(v.trim());
        }
        return subs;
    };

    const getClassKey = (classNum, section) => {
        return section ? `${classNum}-${section}` : `${classNum}`;
    };

    // ══════════════════════════════════════════════════════════════
    //  STEP 1 – Teacher Courses + Class Range
    // ══════════════════════════════════════════════════════════════

    const handleAddSubjectToTeacher = (teacherId, subject) => {
        setTeacherCourses(prev => {
            const copy = [...prev];
            let idx = copy.findIndex(r => r.teacher_id === teacherId);
            if (idx === -1) {
                const teacher = teachers.find(t => t.teacher_id === teacherId);
                const newRow = { teacher_id: teacherId, teacher_name: teacher?.teacher_name || '', classes_taught: '' };
                for (let i = 1; i <= 10; i++) newRow[`sub_${i}`] = null;
                copy.push(newRow);
                idx = copy.length - 1;
            }
            for (let i = 1; i <= 10; i++) {
                if (!copy[idx][`sub_${i}`] || !copy[idx][`sub_${i}`].trim()) {
                    copy[idx] = { ...copy[idx], [`sub_${i}`]: subject };
                    break;
                }
            }
            return copy;
        });
    };

    const handleRemoveSubjectFromTeacher = (teacherId, subject) => {
        setTeacherCourses(prev => {
            const copy = [...prev];
            const idx = copy.findIndex(r => r.teacher_id === teacherId);
            if (idx === -1) return copy;
            const subs = [];
            for (let i = 1; i <= 10; i++) {
                const v = copy[idx][`sub_${i}`];
                if (v && v.trim() && v.trim() !== subject) subs.push(v.trim());
            }
            const updated = { ...copy[idx] };
            for (let i = 1; i <= 10; i++) updated[`sub_${i}`] = subs[i - 1] || null;
            copy[idx] = updated;
            return copy;
        });
    };

    const handleToggleClassRange = (teacherId, range) => {
        setTeacherCourses(prev => {
            const copy = [...prev];
            let idx = copy.findIndex(r => r.teacher_id === teacherId);
            if (idx === -1) {
                const teacher = teachers.find(t => t.teacher_id === teacherId);
                const newRow = { teacher_id: teacherId, teacher_name: teacher?.teacher_name || '', classes_taught: '' };
                for (let i = 1; i <= 10; i++) newRow[`sub_${i}`] = null;
                copy.push(newRow);
                idx = copy.length - 1;
            }
            const current = (copy[idx].classes_taught || '').split(',').map(r => r.trim()).filter(Boolean);
            let newRanges;
            if (current.includes(range)) {
                newRanges = current.filter(r => r !== range);
            } else {
                newRanges = [...current, range];
            }
            copy[idx] = { ...copy[idx], classes_taught: newRanges.join(',') };
            return copy;
        });
    };

    const saveTeacherCourses = async (teacherId) => {
        setSaving(true);
        try {
            const row = teacherCourses.find(r => r.teacher_id === teacherId);
            if (!row) return;
            const payload = { teacher_name: row.teacher_name, classes_taught: row.classes_taught || null };
            for (let i = 1; i <= 10; i++) payload[`sub_${i}`] = row[`sub_${i}`] || null;
            await timetableAPI.updateTeacherCourses(teacherId, payload);
            flash('Saved successfully!');
        } catch (err) {
            flash('Error saving: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    // ══════════════════════════════════════════════════════════════
    //  STEP 2 – Class Configuration with Sections
    // ══════════════════════════════════════════════════════════════

    const handleClassInchargeChange = (classKey, teacherId) => {
        const numericClassId = parseInt(classKey.split('-')[0]);
        const section = classKey.includes('-') ? classKey.split('-')[1] : null;
        setClassCourses(prev => ({
            ...prev,
            [classKey]: {
                ...(prev[classKey] || { class_id: numericClassId, section }),
                teacher_id: parseInt(teacherId),
                section,
            },
        }));
    };

    const handleClassSubjectChange = (classNum, subIndex, value) => {
        // Get all sections for this class
        const sections = groupedClasses[classNum] || [];
        setClassCourses(prev => {
            const next = { ...prev };
            if (sections.length > 0) {
                // Update subject for all sections of this class
                sections.forEach(sec => {
                    const key = `${classNum}-${sec}`;
                    next[key] = {
                        ...(next[key] || { class_id: parseInt(classNum), section: sec }),
                        [`sub${subIndex}`]: value || null,
                    };
                });
            }
            // Also update base key
            const baseKey = `${classNum}`;
            next[baseKey] = {
                ...(next[baseKey] || { class_id: parseInt(classNum) }),
                [`sub${subIndex}`]: value || null,
            };
            return next;
        });
    };

    const getSelectedClassSubjects = (classNum, excludeIndex) => {
        // Check any key for this class (subjects are shared)
        const sections = groupedClasses[classNum] || [];
        const key = sections.length > 0 ? `${classNum}-${sections[0]}` : `${classNum}`;
        const row = classCourses[key] || classCourses[`${classNum}`] || {};
        const subs = [];
        for (let i = 1; i <= 10; i++) {
            if (i === excludeIndex) continue;
            const v = row[`sub${i}`];
            if (v && v.trim()) subs.push(v.trim());
        }
        return subs;
    };

    const getClassSubjectValue = (classNum, subIndex) => {
        const sections = groupedClasses[classNum] || [];
        const key = sections.length > 0 ? `${classNum}-${sections[0]}` : `${classNum}`;
        const row = classCourses[key] || classCourses[`${classNum}`] || {};
        return row[`sub${subIndex}`] || '';
    };

    const saveClassCourses = async (classNum) => {
        setSaving(true);
        try {
            const sections = groupedClasses[classNum] || [];
            const numericId = parseInt(classNum);

            if (sections.length > 0) {
                // Save each section separately
                for (const sec of sections) {
                    const key = `${classNum}-${sec}`;
                    const baseKey = `${classNum}`;
                    const row = classCourses[key] || classCourses[baseKey] || {};
                    const payload = {
                        teacher_id: row.teacher_id || 0,
                        section: sec,
                    };
                    for (let i = 1; i <= 10; i++) {
                        payload[`sub${i}`] = row[`sub${i}`] || (classCourses[baseKey] || {})[`sub${i}`] || null;
                    }
                    await timetableAPI.updateClassCourses(numericId, payload);
                }
            } else {
                // No sections – save as before
                const row = classCourses[`${classNum}`] || {};
                const payload = { teacher_id: row.teacher_id || 0, section: null };
                for (let i = 1; i <= 10; i++) payload[`sub${i}`] = row[`sub${i}`] || null;
                await timetableAPI.updateClassCourses(numericId, payload);
            }
            flash(`Class ${classNum} saved!`);
        } catch (err) {
            flash('Error saving: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const toggleExpandClass = (classNum) => {
        setExpandedClasses(prev => ({ ...prev, [classNum]: !prev[classNum] }));
    };

    // ══════════════════════════════════════════════════════════════
    //  STEP 3 – Time Slots
    // ══════════════════════════════════════════════════════════════

    useEffect(() => {
        if (step === 2 && timeSlots.length === 0) generateEmptySlots(numSlots);
    }, [step]);

    const generateEmptySlots = (count) => {
        const slots = [];
        for (let i = 1; i <= count; i++) {
            const existing = timeSlots.find(s => s.slots === i);
            slots.push(existing || { slots: i, duration: '', is_break: false });
        }
        setTimeSlots(slots);
    };

    const handleNumSlotsChange = (val) => {
        const n = Math.max(1, Math.min(15, parseInt(val) || 1));
        setNumSlots(n);
        generateEmptySlots(n);
    };

    const handleSlotDurationChange = (slotNum, field, value) => {
        setTimeSlots(prev => prev.map(s => {
            if (s.slots !== slotNum) return s;
            if (field === 'is_break') return { ...s, is_break: value, duration: value ? 'BREAK' : '' };
            return { ...s, [field]: value };
        }));
    };

    const handleTimeChange = (slotNum, part, value) => {
        setTimeSlots(prev => prev.map(s => {
            if (s.slots !== slotNum || s.is_break) return s;
            const parts = (s.duration || '-').split('-');
            const start = parts[0] || '';
            const end = parts[1] || '';
            const newDuration = part === 'start' ? `${value}-${end}` : `${start}-${value}`;
            return { ...s, duration: newDuration };
        }));
    };

    const saveTimeSlots = async () => {
        if (!confirmDeleteSlots) { flash('Please confirm replacing previous slot data', 'error'); return; }
        setSaving(true);
        try {
            const payload = timeSlots.map(s => ({ slots: s.slots, duration: s.is_break ? 'BREAK' : s.duration, is_break: s.is_break }));
            await timetableAPI.replaceTimeSlots(payload);
            flash('Time slots saved!');
        } catch (err) {
            flash('Error: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    // ══════════════════════════════════════════════════════════════
    //  STEP 4 – Generated Timetable
    // ══════════════════════════════════════════════════════════════

    const generateTimetable = async () => {
        setLoading(true);
        try {
            const data = await timetableAPI.generate(fixedAssignments);
            setTimetableData(data);
            setStep(3);
            flash('Timetable generated!');
        } catch (err) {
            flash('Error: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Teacher workload computed from current timetable state
    const computeWorkload = useCallback(() => {
        if (!timetableData) return [];
        const wl = {};
        timetableData.timetable.forEach(cell => {
            if (cell.teacher_id && cell.subject && cell.subject !== 'BREAK') {
                if (!wl[cell.teacher_id]) {
                    wl[cell.teacher_id] = {
                        teacher_id: cell.teacher_id,
                        teacher_name: cell.teacher_name,
                        total_lectures: 0,
                        lectures: [],
                    };
                }
                wl[cell.teacher_id].total_lectures += 1;
                wl[cell.teacher_id].lectures.push({
                    class: cell.class_name || cell.class_id,
                    section: cell.section || '',
                    subject: cell.subject,
                    slot: cell.slot,
                });
            }
        });
        return Object.values(wl).sort((a, b) => a.teacher_name.localeCompare(b.teacher_name));
    }, [timetableData]);

    const workloadData = useMemo(() => computeWorkload(), [computeWorkload]);

    // Check which teachers have no free slot
    const teachersWithNoFreeSlot = useMemo(() => {
        if (!timetableData) return new Set();
        const slotsArr = timetableData.slots || [];
        const nonBreakSlots = slotsArr.filter(s => !s.is_break).map(s => s.slot);
        const warnings = new Set();
        workloadData.forEach(tw => {
            const teacherSlots = tw.lectures.map(l => l.slot);
            const uniqueSlots = new Set(teacherSlots);
            if (uniqueSlots.size >= nonBreakSlots.length) {
                warnings.add(tw.teacher_id);
            }
        });
        return warnings;
    }, [workloadData, timetableData]);

    // Detect teacher conflicts: same teacher assigned to same slot in multiple classes
    // Returns a Map: "classId-section-slot" -> { conflictTeacherId, conflictTeacherName }
    const conflictMap = useMemo(() => {
        if (!timetableData) return new Map();
        const conflicts = new Map();
        // Group cells by slot
        const slotGroups = {};
        timetableData.timetable.forEach(cell => {
            if (!cell.teacher_id || cell.is_break) return;
            if (!slotGroups[cell.slot]) slotGroups[cell.slot] = [];
            slotGroups[cell.slot].push(cell);
        });
        // Check for duplicates within each slot
        Object.values(slotGroups).forEach(cells => {
            const teacherOccurrences = {};
            cells.forEach(cell => {
                if (!teacherOccurrences[cell.teacher_id]) teacherOccurrences[cell.teacher_id] = [];
                teacherOccurrences[cell.teacher_id].push(cell);
            });
            Object.entries(teacherOccurrences).forEach(([tid, occurrences]) => {
                if (occurrences.length > 1) {
                    occurrences.forEach(cell => {
                        const key = `${cell.class_id}-${cell.section || ''}-${cell.slot}`;
                        conflicts.set(key, {
                            conflictTeacherId: parseInt(tid),
                            conflictTeacherName: cell.teacher_name,
                            conflictCount: occurrences.length,
                        });
                    });
                }
            });
        });
        return conflicts;
    }, [timetableData]);

    // Set of teacher IDs that have at least one conflict
    const conflictingTeachers = useMemo(() => {
        const set = new Set();
        conflictMap.forEach(v => set.add(v.conflictTeacherId));
        return set;
    }, [conflictMap]);

    // Swap / assign teacher in a cell
    const handleTeacherSwap = (classId, section, slot, newTeacherId) => {
        if (!timetableData) return;
        const newTimetable = [...timetableData.timetable];
        const newFree = { ...timetableData.free_teachers };
        const cellIdx = newTimetable.findIndex(c =>
            c.class_id === classId && (c.section || '') === (section || '') && c.slot === slot
        );
        if (cellIdx === -1) return;

        const oldTeacherId = newTimetable[cellIdx].teacher_id;
        const oldTeacherName = newTimetable[cellIdx].teacher_name;
        const conflictIdx = newTimetable.findIndex(c =>
            c.slot === slot && c.teacher_id === newTeacherId &&
            !(c.class_id === classId && (c.section || '') === (section || ''))
        );
        const newTeacher = teachers.find(t => t.teacher_id === newTeacherId);
        const newTeacherName = newTeacher?.teacher_name || '';

        if (conflictIdx !== -1) {
            newTimetable[conflictIdx] = { ...newTimetable[conflictIdx], teacher_id: oldTeacherId, teacher_name: oldTeacherName };
        } else {
            if (oldTeacherId) {
                const freeSlot = newFree[slot] || [];
                newFree[slot] = [...freeSlot, { teacher_id: oldTeacherId, teacher_name: oldTeacherName }];
            }
            if (newFree[slot]) {
                newFree[slot] = newFree[slot].filter(t => t.teacher_id !== newTeacherId);
            }
        }
        newTimetable[cellIdx] = {
            ...newTimetable[cellIdx],
            teacher_id: newTeacherId,
            teacher_name: newTeacherName,
            needs_teacher: false,
        };
        setTimetableData({ ...timetableData, timetable: newTimetable, free_teachers: newFree });
        setEditingCell(null);
    };

    const handleRemoveTeacher = (classId, section, slot) => {
        if (!timetableData) return;
        const newTimetable = [...timetableData.timetable];
        const newFree = { ...timetableData.free_teachers };
        const cellIdx = newTimetable.findIndex(c =>
            c.class_id === classId && (c.section || '') === (section || '') && c.slot === slot
        );
        if (cellIdx === -1) return;
        const oldTeacherId = newTimetable[cellIdx].teacher_id;
        const oldTeacherName = newTimetable[cellIdx].teacher_name;
        if (oldTeacherId) {
            const freeSlot = newFree[slot] || [];
            newFree[slot] = [...freeSlot, { teacher_id: oldTeacherId, teacher_name: oldTeacherName }];
        }
        newTimetable[cellIdx] = {
            ...newTimetable[cellIdx],
            teacher_id: null,
            teacher_name: '',
            needs_teacher: newTimetable[cellIdx].subject && newTimetable[cellIdx].subject !== 'BREAK',
        };
        setTimetableData({ ...timetableData, timetable: newTimetable, free_teachers: newFree });
    };

    const handleSubjectChange = (classId, section, slot, subject) => {
        if (!timetableData) return;
        const newTimetable = timetableData.timetable.map(c =>
            c.class_id === classId && (c.section || '') === (section || '') && c.slot === slot
                ? { ...c, subject }
                : c
        );
        setTimetableData({ ...timetableData, timetable: newTimetable });
        setSubjectEditCell(null);
    };

    // Start swap: user picks a mode then clicks another cell
    const handleStartSwap = (classId, section, slot, mode) => {
        setSwapCell({ classId, section, slot, mode });
        setSwapModePicker(null);
        setEditingCell(null);
        setSubjectEditCell(null);
    };

    // Second click – perform the swap
    const handleSlotSwap = (classId, section, slot) => {
        if (!timetableData || !swapCell) return;

        // Same cell clicked – deselect
        if (swapCell.classId === classId && swapCell.section === section && swapCell.slot === slot) {
            setSwapCell(null);
            return;
        }

        const mode = swapCell.mode || 'both';
        const newTimetable = [...timetableData.timetable];
        const newFree = { ...timetableData.free_teachers };

        const idxA = newTimetable.findIndex(c =>
            c.class_id === swapCell.classId && (c.section || '') === (swapCell.section || '') && c.slot === swapCell.slot
        );
        const idxB = newTimetable.findIndex(c =>
            c.class_id === classId && (c.section || '') === (section || '') && c.slot === slot
        );
        if (idxA === -1 || idxB === -1) { setSwapCell(null); return; }

        const cellA = newTimetable[idxA];
        const cellB = newTimetable[idxB];

        if (mode === 'both') {
            // Swap teacher + subject
            newTimetable[idxA] = {
                ...cellA,
                teacher_id: cellB.teacher_id,
                teacher_name: cellB.teacher_name,
                subject: cellB.subject,
                needs_teacher: cellB.needs_teacher,
            };
            newTimetable[idxB] = {
                ...cellB,
                teacher_id: cellA.teacher_id,
                teacher_name: cellA.teacher_name,
                subject: cellA.subject,
                needs_teacher: cellA.needs_teacher,
            };
        } else if (mode === 'teacher') {
            // Swap only teacher
            newTimetable[idxA] = {
                ...cellA,
                teacher_id: cellB.teacher_id,
                teacher_name: cellB.teacher_name,
                needs_teacher: !cellB.teacher_id && cellA.subject && cellA.subject !== 'BREAK',
            };
            newTimetable[idxB] = {
                ...cellB,
                teacher_id: cellA.teacher_id,
                teacher_name: cellA.teacher_name,
                needs_teacher: !cellA.teacher_id && cellB.subject && cellB.subject !== 'BREAK',
            };
        } else if (mode === 'subject') {
            // Swap only subject
            newTimetable[idxA] = { ...cellA, subject: cellB.subject };
            newTimetable[idxB] = { ...cellB, subject: cellA.subject };
        }

        // Recalculate free teachers for affected slots
        const updateFreeForSlot = (slotNum) => {
            const usedInSlot = new Set(
                newTimetable.filter(c => c.slot === slotNum && c.teacher_id).map(c => c.teacher_id)
            );
            newFree[slotNum] = teachers
                .filter(t => !usedInSlot.has(t.teacher_id))
                .map(t => ({ teacher_id: t.teacher_id, teacher_name: t.teacher_name }));
        };

        updateFreeForSlot(swapCell.slot);
        if (slot !== swapCell.slot) updateFreeForSlot(slot);

        // Check for conflicts after swap
        const findConflicts = (tt) => {
            const conflictSlots = [];
            const slotGroups = {};
            tt.forEach(cell => {
                if (!cell.teacher_id || cell.is_break) return;
                if (!slotGroups[cell.slot]) slotGroups[cell.slot] = [];
                slotGroups[cell.slot].push(cell);
            });
            Object.values(slotGroups).forEach(cells => {
                const seen = {};
                cells.forEach(cell => {
                    if (seen[cell.teacher_id]) {
                        conflictSlots.push(cell);
                        conflictSlots.push(seen[cell.teacher_id]);
                    }
                    seen[cell.teacher_id] = cell;
                });
            });
            return conflictSlots;
        };

        const modeLabel = mode === 'teacher' ? 'Teachers' : mode === 'subject' ? 'Subjects' : 'Slots';
        const newConflicts = findConflicts(newTimetable);
        setTimetableData({ ...timetableData, timetable: newTimetable, free_teachers: newFree });
        setSwapCell(null);
        if (newConflicts.length > 0) {
            const names = [...new Set(newConflicts.map(c => c.teacher_name))].join(', ');
            flash(`${modeLabel} swapped! ⚠️ Conflict: ${names} assigned to same slot in multiple classes`, 'error');
        } else {
            flash(`${modeLabel} swapped successfully!`);
        }
    };

    const getAvailableTeachersForSlot = (slot, classId, section) => {
        if (!timetableData) return [];
        const usedInSlot = new Set(
            timetableData.timetable.filter(c => c.slot === slot && c.teacher_id).map(c => c.teacher_id)
        );
        // All teachers (no filtering by class subjects since user can assign any teacher after initial generation)
        return teachers.map(t => ({
            ...t,
            isFree: !usedInSlot.has(t.teacher_id),
            isCurrentCell: timetableData.timetable.find(c =>
                c.class_id === classId && (c.section || '') === (section || '') && c.slot === slot
            )?.teacher_id === t.teacher_id,
        })).filter(t => !t.isCurrentCell);
    };

    // ── XLSX Export ──────────────────────────────────────────────
    const exportToXLSX = () => {
        if (!timetableData) return;
        const wb = XLSX.utils.book_new();
        const classes = timetableData.classes || [];
        const slots = timetableData.slots || [];

        // ── Timetable Sheet ──
        const titleRow = ['School Timetable'];
        const slotNumRow = ['Class / Section', ...slots.map(s => s.is_break ? 'Break' : `Slot ${s.slot}`)];
        const slotTimeRow = ['', ...slots.map(s => s.is_break ? '☕' : (s.duration || ''))];
        const data = [titleRow, [], slotNumRow, slotTimeRow];

        classes.forEach(cls => {
            const label = cls.label || `Class ${cls.class}${cls.section ? ` (${cls.section})` : ''}`;
            const row = [label];
            slots.forEach(s => {
                const cell = timetableData.timetable.find(c =>
                    String(c.class_name || c.class_id) === String(cls.class) &&
                    (c.section || '') === (cls.section || '') &&
                    c.slot === s.slot
                );
                if (s.is_break) {
                    row.push('BREAK');
                } else if (cell) {
                    const line1 = cell.subject || '';
                    const line2 = cell.teacher_name ? `(${cell.teacher_name})` : '';
                    row.push(line2 ? `${line1}\n${line2}` : line1 || '—');
                } else {
                    row.push('—');
                }
            });
            data.push(row);
        });

        // Free teachers row
        data.push([]);
        const freeRow = ['Free Teachers'];
        slots.forEach(s => {
            if (s.is_break) { freeRow.push(''); return; }
            const free = timetableData.free_teachers[s.slot] || [];
            freeRow.push(free.map(t => t.teacher_name).join(', ') || '—');
        });
        data.push(freeRow);

        const ws = XLSX.utils.aoa_to_sheet(data);

        // Merge title row across all columns
        ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: slots.length } }];

        // Column widths
        ws['!cols'] = [
            { wch: 20 },
            ...slots.map(() => ({ wch: 24 })),
        ];

        // Row heights — taller for data rows
        ws['!rows'] = data.map((_, i) => ({
            hpt: i === 0 ? 36 : i <= 3 ? 22 : 40,
        }));

        XLSX.utils.book_append_sheet(wb, ws, 'Timetable');

        // ── Teacher Workload Sheet ──
        const wlData = [
            ['Teacher Workload Summary'],
            [],
            ['Teacher Name', 'Total Lectures', 'Details (Subject — Class)'],
        ];
        workloadData.forEach(tw => {
            const details = tw.lectures.map(l =>
                `${l.subject} — Class ${l.class}${l.section ? ` (${l.section})` : ''} [Slot ${l.slot}]`
            ).join(', ');
            wlData.push([tw.teacher_name, tw.total_lectures, details]);
        });
        const ws2 = XLSX.utils.aoa_to_sheet(wlData);
        ws2['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
        ws2['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 60 }];
        ws2['!rows'] = wlData.map((_, i) => ({ hpt: i === 0 ? 32 : 24 }));
        XLSX.utils.book_append_sheet(wb, ws2, 'Teacher Workload');

        XLSX.writeFile(wb, 'Timetable.xlsx');
        flash('Timetable exported!');
    };

    // ══════════════════════════════════════════════════════════════
    //  RENDER
    // ══════════════════════════════════════════════════════════════

    if (loading && step === 0 && teachers.length === 0) {
        return (
            <div className="tt-container">
                <div className="tt-loading">
                    <RefreshCw className="tt-spinner" />
                    <p>Loading data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="tt-container">
            {/* Header */}
            <div className="tt-header">
                <button className="tt-back-btn" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>
                <h1 className="tt-title"><Zap size={28} /> Timetable Generator</h1>
            </div>

            {/* Message toast */}
            {message.text && (
                <div className={`tt-toast tt-toast-${message.type}`}>
                    {message.type === 'success' ? <Check size={18} /> : <X size={18} />}
                    {message.text}
                </div>
            )}

            {/* Step indicators */}
            <div className="tt-steps">
                {STEP_LABELS.map((label, i) => {
                    const Icon = STEP_ICONS[i];
                    return (
                        <div key={i} className={`tt-step ${i === step ? 'tt-step-active' : ''} ${i < step ? 'tt-step-done' : ''}`} onClick={() => i < step && setStep(i)}>
                            <div className="tt-step-circle">
                                {i < step ? <Check size={16} /> : <Icon size={16} />}
                            </div>
                            <span className="tt-step-label">{label}</span>
                            {i < STEP_LABELS.length - 1 && <div className="tt-step-line" />}
                        </div>
                    );
                })}
            </div>

            {/* ── STEP 1: Teacher Courses ──────────────────────────── */}
            {step === 0 && (
                <div className="tt-card">
                    <h2 className="tt-card-title"><BookOpen size={22} /> Teacher Courses & Class Range</h2>
                    <p className="tt-card-desc">Assign subjects each teacher teaches and set their class range priority (1-5 and/or 6-10). The first selected range has higher priority.</p>

                    <div className="tt-teacher-list">
                        {teachers.map(teacher => {
                            const subs = getTeacherSubjects(teacher.teacher_id);
                            const ranges = getTeacherClassRanges(teacher.teacher_id);
                            const availableCourses = courses.filter(c => !subs.includes(c.course_name));
                            return (
                                <div key={teacher.teacher_id} className="tt-teacher-row">
                                    <div className="tt-teacher-info">
                                        <span className="tt-teacher-name">{teacher.teacher_name}</span>
                                        <span className="tt-teacher-id">ID: {teacher.teacher_id}</span>
                                    </div>
                                    <div className="tt-teacher-config">
                                        <div className="tt-teacher-subjects">
                                            {subs.map(sub => (
                                                <span key={sub} className="tt-subject-chip">
                                                    {sub}
                                                    <button className="tt-chip-remove" onClick={() => handleRemoveSubjectFromTeacher(teacher.teacher_id, sub)}>
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            ))}
                                            {subs.length < 10 && availableCourses.length > 0 && (
                                                <select className="tt-add-subject-select" value=""
                                                    onChange={(e) => { if (e.target.value) handleAddSubjectToTeacher(teacher.teacher_id, e.target.value); }}
                                                >
                                                    <option value="">+ Add Subject</option>
                                                    {availableCourses.map(c => (
                                                        <option key={c.course_id} value={c.course_name}>{c.course_name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                        <div className="tt-range-selector">
                                            <span className="tt-range-label">Class Range:</span>
                                            {CLASS_RANGES.map(range => (
                                                <button key={range}
                                                    className={`tt-range-btn ${ranges.includes(range) ? 'tt-range-active' : ''} ${ranges.indexOf(range) === 0 && ranges.length > 1 ? 'tt-range-primary' : ''}`}
                                                    onClick={() => handleToggleClassRange(teacher.teacher_id, range)}
                                                >
                                                    {range}
                                                    {ranges.includes(range) && ranges.indexOf(range) === 0 && <span className="tt-priority-badge">Primary</span>}
                                                    {ranges.includes(range) && ranges.indexOf(range) === 1 && <span className="tt-priority-badge tt-priority-secondary">Secondary</span>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button className="tt-save-row-btn" onClick={() => saveTeacherCourses(teacher.teacher_id)} disabled={saving}>
                                        <Save size={14} /> Save
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="tt-nav-buttons">
                        <div />
                        <button className="tt-next-btn" onClick={() => setStep(1)}>
                            Next: Class Configuration <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP 2: Class Configuration ─────────────────────── */}
            {step === 1 && (
                <div className="tt-card">
                    <h2 className="tt-card-title"><Users size={22} /> Class Configuration</h2>
                    <p className="tt-card-desc">
                        Classes and sections are loaded from the students table.
                        Subjects are shared across all sections of a class. Each section has its own incharge.
                    </p>

                    <div className="tt-class-list">
                        {sortedClassNumbers.map(classNum => {
                            const sections = groupedClasses[classNum] || [];
                            const hasSections = sections.length > 0;
                            const isExpanded = expandedClasses[classNum] !== false; // default expanded

                            return (
                                <div key={classNum} className="tt-class-row">
                                    <div className="tt-class-header">
                                        <div className="tt-class-header-left" onClick={() => toggleExpandClass(classNum)}>
                                            <span className="tt-class-badge">Class {classNum}</span>
                                            {hasSections && (
                                                <span className="tt-section-count">{sections.length} sections: {sections.join(', ')}</span>
                                            )}
                                            {hasSections && (isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                                        </div>
                                        <button className="tt-save-row-btn" onClick={() => saveClassCourses(classNum)} disabled={saving}>
                                            <Save size={14} /> Save
                                        </button>
                                    </div>

                                    {isExpanded && (
                                        <>
                                            {/* Subjects – shared across all sections */}
                                            <div className="tt-class-subjects-section">
                                                <span className="tt-subjects-label">Subjects (all sections):</span>
                                                <div className="tt-class-subjects">
                                                    {Array.from({ length: 10 }, (_, i) => i + 1).map(subIdx => {
                                                        const currentVal = getClassSubjectValue(classNum, subIdx);
                                                        const selected = getSelectedClassSubjects(classNum, subIdx);
                                                        const available = courses.filter(c => !selected.includes(c.course_name));
                                                        return (
                                                            <select key={subIdx} value={currentVal}
                                                                onChange={(e) => handleClassSubjectChange(classNum, subIdx, e.target.value)}
                                                                className="tt-class-subject-select"
                                                            >
                                                                <option value="">Sub {subIdx}</option>
                                                                {currentVal && <option value={currentVal}>{currentVal}</option>}
                                                                {available.filter(c => c.course_name !== currentVal).map(c => (
                                                                    <option key={c.course_id} value={c.course_name}>{c.course_name}</option>
                                                                ))}
                                                            </select>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Incharge per section (or single if no sections) */}
                                            <div className="tt-incharge-section">
                                                {hasSections ? sections.map(sec => {
                                                    const key = `${classNum}-${sec}`;
                                                    const row = classCourses[key] || {};
                                                    return (
                                                        <div key={sec} className="tt-section-incharge">
                                                            <span className="tt-section-badge">Section {sec}</span>
                                                            <label>Incharge:</label>
                                                            <select value={row.teacher_id || ''}
                                                                onChange={(e) => handleClassInchargeChange(key, e.target.value)}
                                                                className="tt-incharge-select"
                                                            >
                                                                <option value="">Select Teacher</option>
                                                                {teachers.map(t => (
                                                                    <option key={t.teacher_id} value={t.teacher_id}>{t.teacher_name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    );
                                                }) : (
                                                    <div className="tt-section-incharge">
                                                        <label>Incharge:</label>
                                                        <select value={(classCourses[`${classNum}`] || {}).teacher_id || ''}
                                                            onChange={(e) => handleClassInchargeChange(`${classNum}`, e.target.value)}
                                                            className="tt-incharge-select"
                                                        >
                                                            <option value="">Select Teacher</option>
                                                            {teachers.map(t => (
                                                                <option key={t.teacher_id} value={t.teacher_id}>{t.teacher_name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="tt-nav-buttons">
                        <button className="tt-prev-btn" onClick={() => setStep(0)}>
                            <ArrowLeft size={18} /> Back
                        </button>
                        <button className="tt-next-btn" onClick={() => setStep(2)}>
                            Next: Time Slots <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP 3: Time Slots ──────────────────────────────── */}
            {step === 2 && (
                <div className="tt-card">
                    <h2 className="tt-card-title"><Clock size={22} /> Time Slots</h2>
                    <p className="tt-card-desc">Define the number of periods, their timings, and break slots.</p>

                    <div className="tt-slot-controls">
                        <label className="tt-slot-num-label">
                            Number of Slots:
                            <input type="number" min={1} max={15} value={numSlots}
                                onChange={(e) => handleNumSlotsChange(e.target.value)}
                                className="tt-slot-num-input"
                            />
                        </label>
                    </div>

                    <div className="tt-slots-grid">
                        {timeSlots.map(slot => (
                            <div key={slot.slots} className={`tt-slot-item ${slot.is_break ? 'tt-slot-break' : ''}`}>
                                <div className="tt-slot-header">
                                    <span className="tt-slot-number">Slot {slot.slots}</span>
                                    <label className="tt-break-toggle">
                                        <input type="checkbox" checked={slot.is_break}
                                            onChange={(e) => handleSlotDurationChange(slot.slots, 'is_break', e.target.checked)}
                                        />
                                        Break
                                    </label>
                                </div>
                                {slot.is_break ? (
                                    <div className="tt-break-label">☕ Break Time</div>
                                ) : (
                                    <div className="tt-time-inputs">
                                        <input type="time" value={(slot.duration || '-').split('-')[0] || ''}
                                            onChange={(e) => handleTimeChange(slot.slots, 'start', e.target.value)}
                                            className="tt-time-input"
                                        />
                                        <span className="tt-time-separator">to</span>
                                        <input type="time" value={(slot.duration || '-').split('-')[1] || ''}
                                            onChange={(e) => handleTimeChange(slot.slots, 'end', e.target.value)}
                                            className="tt-time-input"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="tt-confirm-replace">
                        <label className="tt-confirm-checkbox">
                            <input type="checkbox" checked={confirmDeleteSlots}
                                onChange={(e) => setConfirmDeleteSlots(e.target.checked)}
                            />
                            I confirm: delete previous time-slot data and save new slots
                        </label>
                    </div>

                    {/* ── Fixed Assignments ── */}
                    <div className="tt-fixed-section">
                        <div className="tt-fixed-header">
                            <h3 className="tt-fixed-title"><Lock size={18} /> Fixed Teacher Assignments</h3>
                            <p className="tt-fixed-desc">Lock a specific teacher to a subject for a class. These are enforced during generation.</p>
                        </div>
                        {fixedAssignments.map((fa, idx) => (
                            <div key={idx} className="tt-fixed-row">
                                <select value={fa.class_id} onChange={(e) => {
                                    const updated = [...fixedAssignments];
                                    updated[idx] = { ...updated[idx], class_id: e.target.value, section: '' };
                                    setFixedAssignments(updated);
                                }} className="tt-fixed-select">
                                    <option value="">Class</option>
                                    {sortedClassNumbers.map(c => <option key={c} value={c}>Class {c}</option>)}
                                </select>
                                {(groupedClasses[fa.class_id] || []).length > 0 && (
                                    <select value={fa.section || ''} onChange={(e) => {
                                        const updated = [...fixedAssignments];
                                        updated[idx] = { ...updated[idx], section: e.target.value };
                                        setFixedAssignments(updated);
                                    }} className="tt-fixed-select tt-fixed-select-sm">
                                        <option value="">All Sections</option>
                                        {(groupedClasses[fa.class_id] || []).map(s => <option key={s} value={s}>Sec {s}</option>)}
                                    </select>
                                )}
                                <select value={fa.subject} onChange={(e) => {
                                    const updated = [...fixedAssignments];
                                    updated[idx] = { ...updated[idx], subject: e.target.value };
                                    setFixedAssignments(updated);
                                }} className="tt-fixed-select">
                                    <option value="">Subject</option>
                                    {courses.map(c => <option key={c.course_id} value={c.course_name}>{c.course_name}</option>)}
                                </select>
                                <select value={fa.teacher_id || ''} onChange={(e) => {
                                    const updated = [...fixedAssignments];
                                    updated[idx] = { ...updated[idx], teacher_id: parseInt(e.target.value) };
                                    setFixedAssignments(updated);
                                }} className="tt-fixed-select">
                                    <option value="">Teacher</option>
                                    {teachers.map(t => <option key={t.teacher_id} value={t.teacher_id}>{t.teacher_name}</option>)}
                                </select>
                                <button className="tt-fixed-remove" onClick={() => setFixedAssignments(fixedAssignments.filter((_, i) => i !== idx))}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        <button className="tt-fixed-add" onClick={() => setFixedAssignments([...fixedAssignments, { class_id: '', section: '', subject: '', teacher_id: '' }])}>
                            <Plus size={16} /> Add Fixed Assignment
                        </button>
                    </div>

                    <div className="tt-nav-buttons">
                        <button className="tt-prev-btn" onClick={() => setStep(1)}>
                            <ArrowLeft size={18} /> Back
                        </button>
                        <div className="tt-nav-right">
                            <button className="tt-save-btn" onClick={saveTimeSlots} disabled={saving || !confirmDeleteSlots}>
                                <Save size={18} /> Save Slots
                            </button>
                            <button className="tt-generate-btn" onClick={generateTimetable} disabled={loading}>
                                <Zap size={18} /> {loading ? 'Generating...' : 'Generate Timetable'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── STEP 4: Generated Timetable ─────────────────────── */}
            {step === 3 && timetableData && (
                <div className="tt-card tt-card-wide">
                    <div className="tt-timetable-header-row">
                        <div>
                            <h2 className="tt-card-title"><Calendar size={22} /> Generated Timetable</h2>
                            <p className="tt-card-desc">Click a teacher name to swap/assign. Click a subject to change. Click the <strong>Swap</strong> button on a cell, pick what to swap (Teacher / Subject / Both), then click any other cell in the timetable.</p>
                            {swapCell && (
                                <div className="tt-swap-banner">
                                    <ArrowLeftRight size={16} />
                                    <span>Swap <strong>{swapCell.mode === 'teacher' ? 'Teacher' : swapCell.mode === 'subject' ? 'Subject' : 'Both'}</strong>: Click any cell to swap with Class {swapCell.classId}{swapCell.section ? ` (${swapCell.section})` : ''} Slot {swapCell.slot}</span>
                                    <button onClick={() => setSwapCell(null)} className="tt-swap-cancel-btn">Cancel</button>
                                </div>
                            )}
                        </div>
                        <div className="tt-timetable-actions">
                            <button className={`tt-workload-toggle ${showWorkload ? 'tt-workload-active' : ''}`} onClick={() => setShowWorkload(!showWorkload)}>
                                <BarChart3 size={18} /> {showWorkload ? 'Hide' : 'Show'} Workload
                            </button>
                            <button className="tt-export-btn" onClick={exportToXLSX}>
                                <Download size={18} /> Export XLSX
                            </button>
                        </div>
                    </div>

                    <div className="tt-timetable-layout">
                        {/* Timetable Grid */}
                        <div className={`tt-timetable-wrapper ${showWorkload ? 'tt-with-workload' : ''}`}>
                            <table className="tt-timetable">
                                <thead>
                                    <tr>
                                        <th className="tt-th-class">Class</th>
                                        {timetableData.slots.map(s => (
                                            <th key={s.slot} className={s.is_break ? 'tt-th-break' : ''}>
                                                <div className="tt-th-content">
                                                    <span className="tt-th-slot-num">Slot {s.slot}</span>
                                                    <span className="tt-th-duration">{s.is_break ? '☕ Break' : s.duration}</span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(timetableData.classes || []).map(cls => {
                                        const classId = typeof cls.class === 'string' ? parseInt(cls.class) || cls.class : cls.class;
                                        const section = cls.section || '';
                                        const label = cls.label || `Class ${cls.class}${section ? ` (${section})` : ''}`;

                                        return (
                                            <tr key={`${cls.class}-${section}`}>
                                                <td className="tt-td-class">{label}</td>
                                                {timetableData.slots.map(s => {
                                                    const cell = timetableData.timetable.find(c =>
                                                        String(c.class_name || c.class_id) === String(cls.class) &&
                                                        (c.section || '') === section &&
                                                        c.slot === s.slot
                                                    );
                                                    if (s.is_break) {
                                                        return <td key={s.slot} className="tt-td-break">☕</td>;
                                                    }
                                                    const cellKey = `${classId}-${section}-${s.slot}`;
                                                    const isEditing = editingCell === cellKey;
                                                    const isEditingSubject = subjectEditCell === cellKey;
                                                    const needsTeacher = cell?.needs_teacher || (!cell?.teacher_id && cell?.subject && cell?.subject !== 'BREAK');
                                                    const availableTeachers = isEditing ? getAvailableTeachersForSlot(s.slot, classId, section) : [];

                                                    // For class subjects
                                                    const classKey = section ? `${cls.class}-${section}` : `${cls.class}`;
                                                    const classSubs = getClassSubjects(classKey) || getClassSubjects(`${cls.class}`) || [];

                                                    const isSwapSelected = swapCell && swapCell.classId === classId && swapCell.section === section && swapCell.slot === s.slot;
                                                    const isSwapTarget = swapCell && !(swapCell.classId === classId && swapCell.section === section && swapCell.slot === s.slot);
                                                    const isSwapModePickerOpen = swapModePicker === cellKey;
                                                    const cellConflictKey = `${classId}-${section}-${s.slot}`;
                                                    const hasConflict = conflictMap.has(cellConflictKey);

                                                    return (
                                                        <td key={s.slot} className={`tt-td-cell ${needsTeacher ? 'tt-td-needs-teacher' : ''} ${isSwapSelected ? 'tt-td-swap-selected' : ''} ${isSwapTarget ? 'tt-td-swap-target' : ''} ${hasConflict ? 'tt-td-conflict' : ''}`}>
                                                            <div className="tt-cell-content">
                                                                {/* Teacher name */}
                                                                <div className="tt-cell-teacher"
                                                                    onClick={() => setEditingCell(isEditing ? null : cellKey)}
                                                                >
                                                                    {cell?.teacher_name || (
                                                                        needsTeacher
                                                                            ? <span className="tt-assign-prompt">+ Assign</span>
                                                                            : <span className="tt-empty">—</span>
                                                                    )}
                                                                </div>
                                                                {isEditing && (
                                                                    <div className="tt-swap-dropdown">
                                                                        <div className="tt-swap-header">
                                                                            <span>Assign Teacher</span>
                                                                            <button onClick={() => setEditingCell(null)}><X size={14} /></button>
                                                                        </div>
                                                                        {cell?.teacher_id && (
                                                                            <button className="tt-swap-remove" onClick={() => { handleRemoveTeacher(classId, section, s.slot); setEditingCell(null); }}>
                                                                                <Trash2 size={12} /> Remove Current
                                                                            </button>
                                                                        )}
                                                                        {availableTeachers.map(t => {
                                                                            const hasNoFree = teachersWithNoFreeSlot.has(t.teacher_id);
                                                                            return (
                                                                                <button key={t.teacher_id}
                                                                                    className={`tt-swap-option ${t.isFree ? 'tt-swap-free' : 'tt-swap-busy'} ${hasNoFree ? 'tt-swap-warn' : ''}`}
                                                                                    onClick={() => handleTeacherSwap(classId, section, s.slot, t.teacher_id)}
                                                                                >
                                                                                    <span>
                                                                                        {t.teacher_name}
                                                                                        {hasNoFree && <AlertTriangle size={12} className="tt-warn-icon" />}
                                                                                    </span>
                                                                                    <span className="tt-swap-badge">{t.isFree ? 'Free' : 'Swap'}</span>
                                                                                </button>
                                                                            );
                                                                        })}
                                                                        {availableTeachers.length === 0 && <div className="tt-swap-empty">No available teachers</div>}
                                                                    </div>
                                                                )}
                                                                {/* Subject – click to change or swap */}
                                                                <div className={`tt-cell-subject ${isSwapSelected ? 'tt-cell-swap-active' : ''}`}
                                                                    onClick={(e) => {
                                                                        if (swapCell) {
                                                                            handleSlotSwap(classId, section, s.slot);
                                                                        } else {
                                                                            setSubjectEditCell(isEditingSubject ? null : cellKey);
                                                                        }
                                                                    }}
                                                                >
                                                                    {cell?.subject || <span className="tt-empty-sub">no subject</span>}
                                                                </div>
                                                                {/* Swap button with mode picker */}
                                                                {!swapCell && cell?.subject && cell.subject !== 'BREAK' && (
                                                                    <div className="tt-swap-btn-wrap">
                                                                        <button className="tt-swap-slot-btn" title="Swap this slot with another"
                                                                            onClick={(e) => { e.stopPropagation(); setSwapModePicker(isSwapModePickerOpen ? null : cellKey); setEditingCell(null); setSubjectEditCell(null); }}
                                                                        >
                                                                            <ArrowLeftRight size={11} /> Swap
                                                                        </button>
                                                                        {isSwapModePickerOpen && (
                                                                            <div className="tt-swap-mode-picker">
                                                                                <button className="tt-swap-mode-option tt-swap-mode-both" onClick={(e) => { e.stopPropagation(); handleStartSwap(classId, section, s.slot, 'both'); }}>
                                                                                    <ArrowLeftRight size={12} /> Both
                                                                                </button>
                                                                                <button className="tt-swap-mode-option tt-swap-mode-teacher" onClick={(e) => { e.stopPropagation(); handleStartSwap(classId, section, s.slot, 'teacher'); }}>
                                                                                    <Users size={12} /> Teacher Only
                                                                                </button>
                                                                                <button className="tt-swap-mode-option tt-swap-mode-subject" onClick={(e) => { e.stopPropagation(); handleStartSwap(classId, section, s.slot, 'subject'); }}>
                                                                                    <BookOpen size={12} /> Subject Only
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {isEditingSubject && (
                                                                    <div className="tt-subject-dropdown">
                                                                        {classSubs.map(sub => (
                                                                            <button key={sub} className="tt-subject-option"
                                                                                onClick={() => handleSubjectChange(classId, section, s.slot, sub)}
                                                                            >
                                                                                {sub}
                                                                            </button>
                                                                        ))}
                                                                        {classSubs.length === 0 && <div className="tt-swap-empty">No subjects configured</div>}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                    {/* Free teachers row */}
                                    <tr className="tt-free-row">
                                        <td className="tt-td-class tt-td-free-label">Free</td>
                                        {timetableData.slots.map(s => {
                                            const free = timetableData.free_teachers[s.slot] || [];
                                            if (s.is_break) return <td key={s.slot} className="tt-td-break" />;
                                            return (
                                                <td key={s.slot} className="tt-td-free">
                                                    {free.map(t => (
                                                        <span key={t.teacher_id} className="tt-free-chip">{t.teacher_name}</span>
                                                    ))}
                                                    {free.length === 0 && <span className="tt-empty">—</span>}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Teacher Workload Panel */}
                        {showWorkload && (
                            <div className="tt-workload-panel">
                                <div className="tt-workload-header">
                                    <h3><BarChart3 size={18} /> Teacher Workload</h3>
                                    <button onClick={() => setShowWorkload(false)}><X size={16} /></button>
                                </div>
                                <div className="tt-workload-list">
                                    {workloadData.map(tw => {
                                        const hasNoFree = teachersWithNoFreeSlot.has(tw.teacher_id);
                                        const hasConflict = conflictingTeachers.has(tw.teacher_id);
                                        // Find conflicting slots for this teacher
                                        const conflictSlots = [];
                                        if (hasConflict) {
                                            conflictMap.forEach((v, k) => {
                                                if (v.conflictTeacherId === tw.teacher_id) {
                                                    const parts = k.split('-');
                                                    const slot = parts[parts.length - 1];
                                                    if (!conflictSlots.includes(slot)) conflictSlots.push(slot);
                                                }
                                            });
                                        }
                                        return (
                                            <div key={tw.teacher_id} className={`tt-workload-item ${hasNoFree ? 'tt-workload-warn' : ''} ${hasConflict ? 'tt-workload-conflict' : ''}`}>
                                                <div className="tt-workload-teacher-info">
                                                    <span className="tt-workload-name">{tw.teacher_name}</span>
                                                    <span className="tt-workload-count">{tw.total_lectures} lectures</span>
                                                    {hasNoFree && (
                                                        <span className="tt-workload-warning">
                                                            <AlertTriangle size={12} /> No free slot!
                                                        </span>
                                                    )}
                                                    {hasConflict && (
                                                        <span className="tt-workload-conflict-badge">
                                                            <AlertTriangle size={12} /> Conflict in slot {conflictSlots.join(', ')}!
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="tt-workload-lectures">
                                                    {tw.lectures.map((l, idx) => {
                                                        const lectureConflict = hasConflict && conflictSlots.includes(String(l.slot));
                                                        return (
                                                            <span key={idx} className={`tt-workload-lecture-chip ${lectureConflict ? 'tt-workload-lecture-conflict' : ''}`}>
                                                                {l.subject} — Class {l.class}{l.section ? ` (${l.section})` : ''}
                                                                {lectureConflict && ' ⚠️'}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {workloadData.length === 0 && (
                                        <div className="tt-workload-empty">No lectures assigned yet</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="tt-nav-buttons">
                        <button className="tt-prev-btn" onClick={() => setStep(2)}>
                            <ArrowLeft size={18} /> Back to Slots
                        </button>
                        <div className="tt-nav-right">
                            <button className="tt-generate-btn" onClick={generateTimetable} disabled={loading}>
                                <RefreshCw size={18} /> Regenerate
                            </button>
                            <button className="tt-export-btn" onClick={exportToXLSX}>
                                <Download size={18} /> Export XLSX
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
