import { useState, useEffect, useRef, useCallback } from "react";
import * as faceapi from "@vladmandic/face-api";
import axiosInstance from "../../utils/axiosInstance";
import { loadModels, buildFaceMatcher } from "../../utils/faceUtils";
import {
  Camera,
  CameraOff,
  CheckCircle,
  AlertTriangle,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import EmptyState from "../UI/EmptyState";

const FaceAttendance = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [step, setStep] = useState("setup");
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [recognizedIds, setRecognizedIds] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const faceMatcherRef = useRef(null);
  const studentMapRef = useRef({});

  useEffect(() => {
    axiosInstance
      .get("/api/subjects/mine")
      .then((res) => setSubjects(res.data.subjects))
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, []);

  const startFaceScan = async () => {
    if (!selectedSubjectId) return toast.error("Select a subject first");
    setStep("loading");
    setCameraError("");
    setRecognizedIds(new Set());

    try {
      const res = await axiosInstance.get(
        `/api/users/face-descriptors/${selectedSubjectId}`
      );
      const students = res.data.students;
      setEnrolledStudents(students);
      const map = {};
      students.forEach((s) => {
        map[s._id] = s;
      });
      studentMapRef.current = map;

      const registeredStudents = students.filter((s) => s.hasFaceRegistered);

      if (registeredStudents.length === 0) {
        toast.error("No students in this class have registered their face yet");
        setStep("setup");
        return;
      }
      await loadModels();
      const matcher = buildFaceMatcher(registeredStudents);
      if (!matcher) {
        toast.error("Could not build face matcher");
        setStep("setup");
        return;
      }
      faceMatcherRef.current = matcher;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });

      streamRef.current = stream;

      setStep("scanning");
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!videoRef.current) {
        return;
      }

      videoRef.current.srcObject = stream;

      await new Promise((resolve) => {
        videoRef.current.onloadedmetadata = resolve;
      });

      await videoRef.current.play();

      if (canvasRef.current) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
      }
      intervalRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        if (!faceMatcherRef.current) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        try {
          const detections = await faceapi
            .detectAllFaces(
              videoRef.current,
              new faceapi.TinyFaceDetectorOptions({
                inputSize: 320,
                scoreThreshold: 0.5,
              })
            )
            .withFaceLandmarks()
            .withFaceDescriptors();

          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (detections.length === 0) return;

          const newlyRecognized = new Set();

          detections.forEach((det) => {
            const match = faceMatcherRef.current.findBestMatch(det.descriptor);
            const isRecognized = match.label !== "unknown";
            const student = isRecognized
              ? studentMapRef.current[match.label]
              : null;

            if (isRecognized && student) {
              newlyRecognized.add(match.label);
            }
            const box = det.detection.box;
            const color = isRecognized ? "#10B981" : "#EF4444";

            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeRect(box.x, box.y, box.width, box.height);

            const label = student?.name || "Unknown";
            ctx.font = "bold 14px Arial";
            const textWidth = ctx.measureText(label).width;

            ctx.fillStyle = color;
            ctx.fillRect(box.x, box.y - 28, textWidth + 16, 26);

            ctx.fillStyle = "#FFFFFF";
            ctx.fillText(label, box.x + 8, box.y - 10);

            const conf = `${Math.round((1 - match.distance) * 100)}%`;
            ctx.font = "11px Arial";
            ctx.fillStyle = color + "CC";
            ctx.fillText(conf, box.x + 4, box.y + box.height + 16);
          });

          if (newlyRecognized.size > 0) {
            setRecognizedIds((prev) => {
              const updated = new Set(prev);
              newlyRecognized.forEach((id) => updated.add(id));
              return updated;

            });
          }
        } catch (err) {
          console.error("Face detection error:", err);
        }
      }, 500);

    } catch (error) {
      stopCamera();
      const msg =
        error.name === "NotAllowedError"
          ? "Camera permission denied — allow camera access in browser settings"
          : error.name === "NotFoundError"
          ? "No camera found — please connect a webcam"
          : `Camera error: ${error.message}`;

      setCameraError(msg);
      toast.error("Camera failed to start");
      setStep("setup");
    }
  };

  const stopScanningAndReview = () => {
    stopCamera();
    setStep("setup");
  };

  const submitAttendance = async () => {
    if (!selectedSubjectId || enrolledStudents.length === 0) return;

    setSubmitting(true);

    try {
      const records = enrolledStudents.map((student) => ({
        studentId: student._id,
        status: recognizedIds.has(student._id) ? "present" : "absent",
      }));

      await axiosInstance.post("/api/attendance", {
        subjectId: selectedSubjectId,
        date: selectedDate,
        records,
        markedBy: "face-recognition",
      });

      toast.success(
        `Attendance submitted — ${recognizedIds.size}/${enrolledStudents.length} students present`
      );
      setRecognizedIds(new Set());
      setStep("setup");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to submit attendance"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const studentsWithoutFace = enrolledStudents.filter(
    (s) => !s.hasFaceRegistered
  );
  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Face Recognition Attendance
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          AI identifies enrolled students automatically via webcam
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={step === "scanning" || step === "loading"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            >
              <option value="">— Select Subject —</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              disabled={step === "scanning" || step === "loading"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>
        </div>

        {cameraError && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
            <p className="text-sm text-red-600">⚠️ {cameraError}</p>
          </div>
        )}

        {!isToday && step === "setup" && selectedDate && (
          <p className="mt-2 text-xs text-orange-500">
            ⚠️ Marking attendance for a past date
          </p>
        )}

        <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
          {step === "loading" && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Loading AI models and starting camera...
            </div>
          )}
          {step === "scanning" && (
            <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-600 font-medium">LIVE</span>
              <span className="text-gray-500">— scanning for faces</span>
              <span className="font-bold text-green-600">
                ({recognizedIds.size} recognized)
              </span>
            </div>
          )}
          {step === "setup" && <div />}

          <div className="flex gap-2">
            {step === "setup" && (
              <button
                onClick={startFaceScan}
                disabled={!selectedSubjectId}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                Start Face Scan
              </button>
            )}
            {step === "scanning" && (
              <>
                <button
                  onClick={stopScanningAndReview}
                  className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  <CameraOff className="w-4 h-4" />
                  Stop Camera
                </button>
                <button
                  onClick={submitAttendance}
                  disabled={submitting || enrolledStudents.length === 0}
                  className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {submitting
                    ? "Submitting..."
                    : `Submit (${recognizedIds.size}/${enrolledStudents.length} present)`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {step === "scanning" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div
              className="relative bg-gray-900 rounded-xl overflow-hidden"
              style={{ aspectRatio: "16/9" }}
            >
              <video
                ref={videoRef}
                playsInline
                className="w-full h-full"
                style={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                LIVE
              </div>
            </div>
            <div className="flex items-center gap-6 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />
                Recognized student
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />
                Unknown face
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {recognizedIds.size}
                </p>
                <p className="text-xs text-green-700 font-medium">Recognized</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-gray-500">
                  {enrolledStudents.length - recognizedIds.size}
                </p>
                <p className="text-xs text-gray-500 font-medium">Pending</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-green-50 px-4 py-2 border-b border-green-100">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">
                  Recognized ({recognizedIds.size})
                </p>
              </div>
              {recognizedIds.size === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">
                  No students recognized yet
                </p>
              ) : (
                <div className="divide-y divide-gray-50 max-h-44 overflow-y-auto">
                  {Array.from(recognizedIds).map((id) => {
                    const s = studentMapRef.current[id];
                    return s ? (
                      <div
                        key={id}
                        className="flex items-center gap-2.5 px-4 py-2.5"
                      >
                        <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                          {s.avatar ? (
                            <img
                              src={s.avatar}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            s.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <p className="text-sm text-gray-800 flex-1">{s.name}</p>
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Pending ({enrolledStudents.length - recognizedIds.size})
                </p>
              </div>
              <div className="divide-y divide-gray-50 max-h-44 overflow-y-auto">
                {enrolledStudents
                  .filter((s) => !recognizedIds.has(s._id))
                  .map((student) => (
                    <div
                      key={student._id}
                      className="flex items-center gap-2.5 px-4 py-2.5"
                    >
                      <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {student.name?.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-sm text-gray-400 flex-1">
                        {student.name}
                      </p>
                      {!student.hasFaceRegistered && (
                        <span className="text-xs text-orange-500 font-medium">
                          No face
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {studentsWithoutFace.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                  {studentsWithoutFace.length} student
                  {studentsWithoutFace.length > 1 ? "s have" : " has"} not
                  registered their face — they'll be marked absent. Mark
                  manually if present.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {subjects.length === 0 && step === "setup" && (
        <EmptyState
          icon={Camera}
          title="No subjects assigned"
          description="Ask admin to assign subjects to you before using face attendance"
        />
      )}
    </div>
  );
};

export default FaceAttendance;
