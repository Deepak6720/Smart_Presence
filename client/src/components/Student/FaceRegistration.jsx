import { useState, useEffect, useRef, useCallback } from "react";
import * as faceapi from "@vladmandic/face-api";
import axiosInstance from "../../utils/axiosInstance";
import { loadModels } from "../../utils/faceUtils";
import { Scan, Camera, CheckCircle, AlertCircle, X } from "lucide-react";
import toast from "react-hot-toast";

const FaceRegistration = () => {
  const [status, setStatus] = useState("checking");
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [faceReady, setFaceReady] = useState(false);
  const [guidance, setGuidance] = useState("");
  const [saving, setSaving] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const bestDescriptorRef = useRef(null);

  useEffect(() => {
    axiosInstance
      .get("/api/users/face-status")
      .then((res) => {
        setAlreadyRegistered(res.data.registered);
        setStatus("idle");
      })
      .catch(() => setStatus("idle"));
  }, []);

  useEffect(() => {
    return () => {
      stopEverything();
    };
  }, []);

  const stopEverything = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setFaceReady(false);
    bestDescriptorRef.current = null;
  }, []);

  const startRegistration = async () => {
    setStatus("loading");
    setGuidance("Loading AI models...");

    try {
      await loadModels();
      setGuidance("Requesting camera access...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });

      streamRef.current = stream;

      setStatus("detecting");
      await new Promise((resolve) => setTimeout(resolve, 100));
      const video = videoRef.current;
      if (!video) {
        return;
      }

      video.muted = true; 
      video.playsInline = true; 
      video.srcObject = stream;

      await new Promise((resolve) => {
        if (video.readyState >= 1) return resolve();
        video.onloadedmetadata = resolve;
        video.onloadeddata = resolve;
        setTimeout(resolve, 4000); 
      });

      try {
        await video.play();
      } catch (e) {
        console.warn("play() failed:", e.message);
        setTimeout(() => video.play().catch(() => {}), 500);
      }

      if (canvasRef.current) {
        canvasRef.current.width = video.videoWidth || 640;
        canvasRef.current.height = video.videoHeight || 480;
      }

      setStatus("detecting");
      setGuidance("Position your face in the frame...");

      intervalRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;

        try {
          const detection = await faceapi
            .detectSingleFace(
              videoRef.current,
              new faceapi.TinyFaceDetectorOptions({
                inputSize: 320,
                scoreThreshold: 0.4,
              })
            )
            .withFaceLandmarks()
            .withFaceDescriptor();

          const canvas = canvasRef.current;
          if (canvas && videoRef.current) {
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (detection) {
              const box = detection.detection.box;
              const score = detection.detection.score;
              const color = score > 0.75 ? "#10B981" : "#F59E0B";

              ctx.strokeStyle = color;
              ctx.lineWidth = 3;
              ctx.strokeRect(box.x, box.y, box.width, box.height);

              if (score > 0.7) {
                bestDescriptorRef.current = detection.descriptor;
              }
            }
          }

          if (!detection) {
            setFaceReady(false);
            setGuidance("No face detected — look directly at the camera");
          } else {
            const score = detection.detection.score;
            if (score > 0.75) {
              setFaceReady(true);
              setGuidance("✓ Face detected clearly — click Capture Face");
            } else if (score > 0.5) {
              setFaceReady(false);
              setGuidance("Adjust position — move closer or improve lighting");
            } else {
              setFaceReady(false);
              setGuidance(
                "Ensure your face is clearly visible with good lighting"
              );
            }
          }
        } catch (err) {
          console.error("Detection frame error:", err);
        }
      }, 300);
    } catch (error) {
      stopEverything();
      if (error.name === "NotAllowedError") {
        setGuidance(
          "Camera permission denied. Allow camera access in browser settings and try again."
        );
        toast.error("Camera permission denied");
      } else if (error.name === "NotFoundError") {
        setGuidance("No camera found. Please connect a camera and try again.");
        toast.error("No camera found");
      } else {
        setGuidance(`Camera error: ${error.message}`);
        toast.error("Failed to start camera");
      }
      setStatus("error");
    }
  };

  const captureFace = async () => {
    if (!bestDescriptorRef.current) {
      return toast.error("No face detected — look at the camera first");
    }

    setSaving(true);

    try {

      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: 0.5,
          })
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection || detection.detection.score < 0.65) {
        toast.error("Face not clearly visible at capture moment — try again");
        setSaving(false);
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      if (descriptor.length !== 128) {
        throw new Error("Unexpected descriptor length: " + descriptor.length);
      }

      await axiosInstance.put("/api/users/face-descriptor", { descriptor });

      stopEverything();
      setStatus("success");
      setAlreadyRegistered(true);
      toast.success(
        "Face registered! Your teacher can now recognize you automatically."
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to save face data. Try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const resetToIdle = () => {
    stopEverything();
    setStatus("idle");
    setGuidance("");
  };

  if (status === "checking") {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Face Registration</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          One-time setup for automatic AI attendance marking
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-800 mb-2">How it works</p>
        <div className="grid grid-cols-3 gap-2 text-xs text-blue-700">
          <div className="text-center">
            <div className="text-2xl mb-1">📸</div>
            <p>Register face once (30 seconds)</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🤖</div>
            <p>AI stores your face fingerprint</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">✅</div>
            <p>Teacher's camera marks you present</p>
          </div>
        </div>
      </div>

      {status === "idle" && (
        <div
          className={`rounded-xl p-5 border ${
            alreadyRegistered
              ? "bg-green-50 border-green-200"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                alreadyRegistered ? "bg-green-100" : "bg-gray-100"
              }`}
            >
              {alreadyRegistered ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <Scan className="w-6 h-6 text-gray-500" />
              )}
            </div>
            <div className="flex-1">
              <h3
                className={`font-semibold ${
                  alreadyRegistered ? "text-green-800" : "text-gray-900"
                }`}
              >
                {alreadyRegistered
                  ? "Face Already Registered ✓"
                  : "Face Not Registered"}
              </h3>
              <p
                className={`text-sm mt-1 ${
                  alreadyRegistered ? "text-green-600" : "text-gray-500"
                }`}
              >
                {alreadyRegistered
                  ? "Your teacher's webcam will recognize you during face attendance"
                  : "Register your face so teachers can mark your attendance automatically"}
              </p>
              <button
                onClick={startRegistration}
                className={`mt-4 px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                  alreadyRegistered
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {alreadyRegistered
                  ? "🔄 Re-register Face"
                  : "📸 Start Face Registration"}
              </button>
            </div>
          </div>
        </div>
      )}

      {status === "loading" && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-medium">{guidance}</p>
          <p className="text-xs text-gray-400 mt-2">
            AI models are ~7MB — first load takes 15-20 seconds, then cached for
            future
          </p>
        </div>
      )}

      {status === "detecting" && (
        <div className="space-y-4">
          <div
            className="relative bg-black rounded-xl overflow-hidden"
            style={{ aspectRatio: "4/3" }}
          >
            <video
              ref={videoRef}
              playsInline
              className="w-full h-full"
              style={{
                display: "block",
                objectFit: "cover",
                width: "100%",
                height: "100%",
              }}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />

            <div
              className={`absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                faceReady ? "bg-green-500 text-white" : "bg-black/60 text-white"
              }`}
            >
              {guidance}
            </div>
          </div>

          <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  faceReady ? "bg-green-500 animate-pulse" : "bg-gray-300"
                }`}
              />
              <span className="text-sm text-gray-600">
                {faceReady ? "Face clearly visible — ready" : "Detecting..."}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={resetToIdle}
                className="text-xs border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button
                onClick={captureFace}
                disabled={!faceReady || saving}
                className="text-sm bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                {saving ? "Saving..." : "Capture Face"}
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-800 mb-2">
              Tips for best accuracy
            </p>
            <div className="grid grid-cols-2 gap-1">
              {[
                "Face the camera directly — no side angles",
                "Good, even lighting — avoid strong backlight",
                "Keep face centered and visible",
                "Remove sunglasses, caps, or face coverings",
              ].map((tip) => (
                <p key={tip} className="text-xs text-amber-700">
                  • {tip}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {status === "success" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-green-800 mb-2">
            Face Registered!
          </h3>
          <p className="text-sm text-green-600 mb-4 max-w-sm mx-auto">
            Your 128-point face descriptor is saved. When your teacher opens
            face attendance, you'll be recognized automatically.
          </p>
          <button
            onClick={() => setStatus("idle")}
            className="text-sm text-green-700 border border-green-300 px-4 py-2 rounded-lg hover:bg-green-100"
          >
            Back to registration status
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-red-700 mb-4">{guidance}</p>
          <button
            onClick={resetToIdle}
            className="text-sm bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default FaceRegistration;
