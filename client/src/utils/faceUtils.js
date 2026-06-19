import * as faceapi from '@vladmandic/face-api';

const MODEL_URL = '/models';

let modelsLoaded = false;

export const loadModels = async () => {
  if (modelsLoaded) return;
  
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),

  ]);
  
  modelsLoaded = true;
};

export const getDetectorOptions = () =>
  new faceapi.TinyFaceDetectorOptions({
    inputSize: 320,
    scoreThreshold: 0.5
  });

export const detectSingleFace = async (videoElement) => {
  return faceapi
    .detectSingleFace(videoElement, getDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();
};

export const detectAllFaces = async (videoElement) => {
  return faceapi
    .detectAllFaces(videoElement, getDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptors();
};

export const buildFaceMatcher = (studentsWithDescriptors) => {
  if (!studentsWithDescriptors?.length) return null;
  
  const validStudents = studentsWithDescriptors.filter(
    s => s.faceDescriptor && s.faceDescriptor.length === 128
  );
  
  if (!validStudents.length) return null;
  
  const labeledDescriptors = validStudents.map(student =>
    new faceapi.LabeledFaceDescriptors(
      student._id,
      [new Float32Array(student.faceDescriptor)]
    )
  );
  
  return new faceapi.FaceMatcher(
    labeledDescriptors,
    0.5
  );
};