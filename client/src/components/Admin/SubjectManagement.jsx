import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { BookOpen, Plus, Trash2, UserCheck, Users, X } from "lucide-react";
import toast from "react-hot-toast";
import LoadingSkeleton from "../UI/LoadingSkeleton";
import EmptyState from "../UI/EmptyState";

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [newSubject, setNewSubject] = useState({
    name: "",
    code: "",
    semester: "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [subjectsRes, teachersRes, studentsRes] = await Promise.all([
        axiosInstance.get("/api/subjects"),
        axiosInstance.get("/api/users?role=teacher"),
        axiosInstance.get("/api/users?role=student"),
      ]);
      setSubjects(subjectsRes.data.subjects);
      setTeachers(teachersRes.data.users);
      setStudents(studentsRes.data.users);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post("/api/subjects", newSubject);
      setSubjects((prev) => [res.data.subject, ...prev]);
      setNewSubject({ name: "", code: "", semester: "" });
      setModal(null);
      toast.success("Subject created!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create subject");
    }
  };

  const handleAssignTeacher = async (subjectId, teacherId) => {
    try {
      const res = await axiosInstance.put(
        `/api/subjects/${subjectId}/assign-teacher`,
        { teacherId }
      );
      setSubjects((prev) =>
        prev.map((s) => (s._id === subjectId ? res.data.subject : s))
      );
      toast.success("Teacher assigned!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to assign teacher");
    }
  };

  const handleEnrollment = async (subjectId, studentIds) => {
    try {
      const res = await axiosInstance.put(`/api/subjects/${subjectId}/enroll`, {
        studentIds,
      });
      setSubjects((prev) =>
        prev.map((s) => (s._id === subjectId ? res.data.subject : s))
      );
      toast.success("Enrollment updated!");
      setModal(null);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update enrollment"
      );
    }
  };

  const handleDelete = async (subjectId) => {
    try {
      await axiosInstance.delete(`/api/subjects/${subjectId}`);
      setSubjects((prev) => prev.filter((s) => s._id !== subjectId));
      toast.success("Subject deleted");
      setDeleteConfirm(null);
    } catch (error) {
      toast.error("Failed to delete subject");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton type="stats" />
        <LoadingSkeleton type="table" rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Subject Management
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Create subjects, assign teachers, enroll students
          </p>
        </div>
        <button
          onClick={() => setModal("add")}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      {subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects yet"
          description="Create your first subject to get started"
          action={{ label: "Add Subject", onClick: () => setModal("add") }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map((subject) => (
            <div
              key={subject._id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-md">
                      {subject.code}
                    </span>
                    {subject.semester && (
                      <span className="text-xs text-gray-400">
                        {subject.semester}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    {subject.name}
                  </h3>
                </div>

                {deleteConfirm === subject._id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDelete(subject._id)}
                      className="text-xs bg-red-600 text-white px-2 py-1 rounded"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="text-xs border text-gray-600 px-2 py-1 rounded"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(subject._id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="mb-3">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1">
                  <UserCheck className="w-3 h-3" /> Teacher
                </label>
                <select
                  value={subject.teacher?._id || ""}
                  onChange={(e) =>
                    handleAssignTeacher(subject._id, e.target.value)
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Assign Teacher —</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {subject.students?.length || 0} student
                  {subject.students?.length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => {
                    setSelectedSubject(subject);
                    setModal("enroll");
                  }}
                  className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Manage Students
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === "add" && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Subject</h2>
              <button onClick={() => setModal(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Name
                </label>
                <input
                  value={newSubject.name}
                  onChange={(e) =>
                    setNewSubject({ ...newSubject, name: e.target.value })
                  }
                  placeholder="Data Structures & Algorithms"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Code
                </label>
                <input
                  value={newSubject.code}
                  onChange={(e) =>
                    setNewSubject({
                      ...newSubject,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="CS301"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester (optional)
                </label>
                <input
                  value={newSubject.semester}
                  onChange={(e) =>
                    setNewSubject({ ...newSubject, semester: e.target.value })
                  }
                  placeholder="Semester 3"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setModal(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSubject}
                  disabled={!newSubject.name || !newSubject.code}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Create Subject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal === "enroll" && selectedSubject && (
        <EnrollModal
          subject={selectedSubject}
          allStudents={students}
          onClose={() => {
            setModal(null);
            setSelectedSubject(null);
          }}
          onSave={handleEnrollment}
        />
      )}
    </div>
  );
};

const EnrollModal = ({ subject, allStudents, onClose, onSave }) => {
  const [selected, setSelected] = useState(
    subject.students?.map((s) => s._id) || []
  );

  const toggleStudent = (studentId) => {
    setSelected((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Enroll Students</h2>
            <p className="text-sm text-gray-500">
              {subject.name} — {selected.length} selected
            </p>
          </div>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {allStudents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No students in the system yet
            </p>
          ) : (
            allStudents.map((student) => (
              <label
                key={student._id}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(student._id)}
                  onChange={() => toggleStudent(student._id)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                  {student.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {student.name}
                  </p>
                  <p className="text-xs text-gray-400">{student.email}</p>
                </div>
              </label>
            ))
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200 mt-4">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(subject._id, selected)}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Save Enrollment
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubjectManagement;
