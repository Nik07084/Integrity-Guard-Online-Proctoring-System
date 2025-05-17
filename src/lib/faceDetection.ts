import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import { FilesetResolver, FaceLandmarker, FaceLandmarkerResult, NormalizedLandmark } from '@mediapipe/tasks-vision';
import * as THREE from 'three'; // For matrix decomposition

let landmarker: FaceLandmarker | null = null;
let lastPhoneDetection = 0;
let consecutivePhoneFrames = 0;
let lastFacePosition = { x: 0, y: 0, width: 0, height: 0 };
const PHONE_DETECTION_COOLDOWN = 3000; // Reduced from 5000 to 3000 ms for quicker alerts
const CONSECUTIVE_FRAMES_THRESHOLD = 5; // Reduced from 5 to 3 for faster detection
const MOVEMENT_THRESHOLD = 0.08; // Reduced from 0.15 to 0.08 to catch subtler movements
const POSITION_HISTORY_SIZE = 8; // Slightly reduced for faster responsiveness
const positionHistory: Array<{ y: number; time: number }> = [];

export async function initFaceDetection() {
  await tf.ready();
  await tf.setBackend('webgl');

  if (!landmarker) {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    landmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        // More comprehensive model needed for landmarks, blendshapes, matrix
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
        delegate: "GPU"
      },
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
      runningMode: "VIDEO",
      numFaces: 1 // Optimize for single face detection
    });
    console.log("FaceLandmarker initialized successfully.");
  }

  return landmarker;
}

export function cleanup() {
  if (landmarker) {
    landmarker.close(); // Properly close the landmarker
    landmarker = null;
    console.log("FaceLandmarker cleaned up.");
  }
  lastPhoneDetection = 0;
  consecutivePhoneFrames = 0;
  lastFacePosition = { x: 0, y: 0, width: 0, height: 0 };
  positionHistory.length = 0;
}

// Helper function to estimate head pose from transformation matrix
function estimateHeadPose(matrixData: number[]): { pitch: number; yaw: number; roll: number } | null {
  if (!matrixData || matrixData.length !== 16) {
    return null;
  }
  const matrix = new THREE.Matrix4();
  matrix.fromArray(matrixData);

  const euler = new THREE.Euler();
  // Adjust order based on how MediaPipe matrix is defined, typically 'ZYX' or 'YXZ'
  // Experimentation might be needed. 'YXZ' often works well for head pose.
  euler.setFromRotationMatrix(matrix, 'YXZ');

  // Convert radians to degrees
  const pitch = euler.x * (180 / Math.PI);
  const yaw = euler.y * (180 / Math.PI);
  const roll = euler.z * (180 / Math.PI);

  return { pitch, yaw, roll };
}

// Helper function to infer gaze direction (simplified)
function inferGaze(headPose: { pitch: number; yaw: number; roll: number } | null, landmarks?: NormalizedLandmark[]): string {
    if (!headPose) return "undetected";

    // Simple thresholds based on head pose
    if (headPose.pitch > 20) return "down"; // Looking significantly down
    if (headPose.pitch < -15) return "up";   // Looking up
    if (headPose.yaw > 25) return "right"; // Looking significantly right
    if (headPose.yaw < -25) return "left";  // Looking significantly left

    // TODO: More sophisticated gaze based on eye landmarks (e.g., pupil position relative to eye corners)
    // Requires specific landmark indices for eyes.

    return "center"; // Default assumption
}


export async function detectFace(video: HTMLVideoElement): Promise<{
  faceDetected: boolean;
  multipleFaces: boolean; // Note: FaceLandmarker currently only supports 1 face well with matrix output
  phoneDetected: boolean;
  landmarks: NormalizedLandmark[] | undefined;
  headPose: { pitch: number; yaw: number; roll: number } | null;
  gazeDirection: string;
}> {
  if (!landmarker) {
    console.log("Landmarker not initialized, initializing...");
    await initFaceDetection();
    if (!landmarker) {
       console.error("Failed to initialize landmarker.");
       return { faceDetected: false, multipleFaces: false, phoneDetected: false, landmarks: undefined, headPose: null, gazeDirection: "error" };
    }
  }

  try {
    const startTime = performance.now();
    const results: FaceLandmarkerResult = landmarker.detectForVideo(video, startTime);
    const currentTime = Date.now();

    let phoneDetected = false;
    let faceDetected = results.faceLandmarks && results.faceLandmarks.length > 0;
    let landmarks = faceDetected ? results.faceLandmarks[0] : undefined;
    let headPose: { pitch: number; yaw: number; roll: number } | null = null;
    let gazeDirection: string = "undetected";

    if (faceDetected && results.facialTransformationMatrixes && results.facialTransformationMatrixes.length > 0) {
      headPose = estimateHeadPose(results.facialTransformationMatrixes[0].data);
      gazeDirection = inferGaze(headPose, landmarks);

      // --- Integrate Head Pose into Phone Detection Logic ---
      // Use headPose.pitch as a primary indicator for looking down
      const lookingDownThreshold = 20; // degrees pitch downwards
      const isLookingDown = headPose && headPose.pitch > lookingDownThreshold;

      // Keep some of the previous logic but adapt it or use head pose primarily
      // Example: If head pitch is significantly down, increase suspicion
      if (isLookingDown) {
         consecutivePhoneFrames += 2; // Increase counter faster if looking down
      } else {
         // Add other checks if needed, e.g., extreme yaw/roll, or use blendshapes
         // For now, just use the basic counter logic if not looking down via pitch
         if (/* some other condition based on landmarks/blendshapes? */ false) {
             consecutivePhoneFrames++;
         } else {
             consecutivePhoneFrames = Math.max(0, consecutivePhoneFrames - 1);
         }
      }

      if (consecutivePhoneFrames >= CONSECUTIVE_FRAMES_THRESHOLD) {
        if (currentTime - lastPhoneDetection > PHONE_DETECTION_COOLDOWN) {
          phoneDetected = true;
          lastPhoneDetection = currentTime;
          consecutivePhoneFrames = 0; // Reset after detection
        }
      }
      // --- End Phone Detection Logic Update ---

    } else {
      // No face detected - increase phone suspicion counter (similar to previous logic)
      consecutivePhoneFrames++;
       if (consecutivePhoneFrames >= CONSECUTIVE_FRAMES_THRESHOLD + 2) { // Keep slightly higher threshold for no-face
         if (currentTime - lastPhoneDetection > PHONE_DETECTION_COOLDOWN) {
           phoneDetected = true;
           lastPhoneDetection = currentTime;
           consecutivePhoneFrames = 0;
         }
       }
       gazeDirection = "undetected"; // Ensure gaze is marked undetected
    }


    return {
      faceDetected,
      multipleFaces: results.faceLandmarks ? results.faceLandmarks.length > 1 : false, // Check actual landmark results
      phoneDetected,
      landmarks, // E: Facial Landmarks
      headPose, // F: Head Pose Estimation
      gazeDirection // G: Gaze Estimation (Inferred)
    };
  } catch (error) {
    console.error('Error detecting face landmarks:', error);
    // Ensure landmarker is reset if error occurs during detection
    if (landmarker) {
        landmarker.reset();
    }
    return {
      faceDetected: false,
      multipleFaces: false,
      phoneDetected: false,
      landmarks: undefined,
      headPose: null,
      gazeDirection: "error"
    };
  }
}