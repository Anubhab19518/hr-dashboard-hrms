'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ComponentType,
  type ChangeEvent,
} from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/atoms/card';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import {
  Camera,
  User,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Check,
  CheckCircle2,
  AlertCircle,
  Upload,
} from '@/components/atoms/icons';
import { EmployeeService } from '../services/employee.service';
import type {
  FaceImageType,
  FaceProfile,
  FaceProfileResponse,
  FaceRegistrationSessionResponse,
} from '../types/employee.types';

interface EmployeeBiometricsTabProps {
  employeeId: string;
}

interface AngleConfig {
  key: FaceImageType;
  label: string;
  instruction: string;
  Icon: ComponentType<{ size?: number; style?: React.CSSProperties }>;
}

const ANGLES: readonly AngleConfig[] = [
  { key: 'FRONT', label: 'Center Front', instruction: 'Look directly into the camera', Icon: User },
  {
    key: 'LEFT',
    label: 'Turn Left',
    instruction: 'Slowly rotate your head 45° to the left',
    Icon: ArrowLeft,
  },
  {
    key: 'RIGHT',
    label: 'Turn Right',
    instruction: 'Slowly rotate your head 45° to the right',
    Icon: ArrowRight,
  },
  { key: 'UP', label: 'Tilt Up', instruction: 'Slightly tilt your chin upwards', Icon: ArrowUp },
  {
    key: 'DOWN',
    label: 'Tilt Down',
    instruction: 'Slightly tilt your chin downwards',
    Icon: ArrowDown,
  },
];

export function EmployeeBiometricsTab({ employeeId }: EmployeeBiometricsTabProps) {
  const [faceData, setFaceData] = useState<FaceProfileResponse | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isWizardActive, setIsWizardActive] = useState(false);
  const [currentAngleIndex, setCurrentAngleIndex] = useState(0);
  const [session, setSession] = useState<FaceRegistrationSessionResponse | null>(null);
  const [uploadedAngles, setUploadedAngles] = useState<Record<string, boolean>>({});
  const [capturedThumbnails, setCapturedThumbnails] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch biometric face profile status directly from backend
  const fetchProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const data = await EmployeeService.getFaceProfile(employeeId);
      setFaceData(data);
    } catch {
      setFaceData(null);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [employeeId]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  // Derive status states accurately according to backend status field
  const profile =
    faceData?.profile ?? (faceData?.status ? (faceData as unknown as FaceProfile) : null);
  const images = faceData?.images ?? [];

  const isEnrolledAndActive = profile?.status === 'ACTIVE' || profile?.status === 'READY';
  const isPending =
    profile?.status === 'PENDING' ||
    profile?.status === 'IN_PROGRESS' ||
    (!isEnrolledAndActive && images.length > 0);

  // Stop camera media stream cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Attach active camera stream when wizard mounts video element
  useEffect(() => {
    if (isWizardActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => {
        console.warn('Auto play video warning:', err);
      });
    }
  }, [isWizardActive]);

  const startCamera = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to access camera';
      setErrorMessage(`Camera Error: ${message}. You can also choose file upload below.`);
    }
  };

  // 1. Initiate 5-Angle Face Registration Session
  const handleStartEnrollment = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setUploadedAngles({});
    setCapturedThumbnails({});
    setCurrentAngleIndex(0);

    try {
      const sessionData = await EmployeeService.startFaceRegistration({
        employeeId,
        collectionId: 'default-hrms-collection',
      });
      setSession(sessionData);
      setIsWizardActive(true);
      await startCamera();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start registration session';
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper: Find S3 Presigned Upload URL for a given angle
  const getUploadUrlForAngle = (angleKey: FaceImageType): string | undefined => {
    if (session?.urls?.[angleKey]) {
      return session.urls[angleKey];
    }
    const match = session?.images?.find((img) => img.imageType === angleKey);
    return match?.uploadUrl;
  };

  // Upload an image blob directly to AWS S3 via presigned PUT
  const uploadAngleBlobToS3 = async (angleKey: FaceImageType, blob: Blob) => {
    const uploadUrl = getUploadUrlForAngle(angleKey);
    if (!uploadUrl) {
      throw new Error(`Presigned upload URL for angle ${angleKey} not found in session.`);
    }
    await EmployeeService.uploadFaceAngleToS3(uploadUrl, blob);
  };

  // 2. Capture Current Angle from Camera Stream & Upload to S3
  const handleCaptureCurrentAngle = async () => {
    const activeAngle = ANGLES[currentAngleIndex];
    if (!activeAngle) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const width = video?.videoWidth || 640;
      const height = video?.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not initialize canvas graphics context');

      if (video && video.readyState >= 2) {
        // Mirror horizontally for natural selfie view
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, width, height);
      } else {
        // Fallback placeholder frame if video feed isn't ready
        ctx.fillStyle = '#1e1e2d';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#fff';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Biometric Capture: ${activeAngle.label}`, width / 2, height / 2);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedThumbnails((prev) => ({ ...prev, [activeAngle.key]: dataUrl }));

      // Convert canvas to JPEG Blob
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.9),
      );

      if (!blob) throw new Error('Failed to generate image blob from video frame');

      // Direct HTTP PUT to S3 presigned URL
      await uploadAngleBlobToS3(activeAngle.key, blob);

      setUploadedAngles((prev) => ({ ...prev, [activeAngle.key]: true }));

      // Check if all 5 angles completed
      if (currentAngleIndex < ANGLES.length - 1) {
        setCurrentAngleIndex((prev) => prev + 1);
      } else {
        // All 5 angles uploaded successfully to S3 - trigger backend completion & Rekognition indexing
        stopCamera();
        setIsWizardActive(false);

        const sessionId =
          session?.registrationSessionId || (session as unknown as { id?: string })?.id;
        if (sessionId) {
          try {
            await EmployeeService.completeFaceRegistrationSession(employeeId, sessionId);
          } catch (err: unknown) {
            console.warn('Failed to notify backend of session completion:', err);
          }
        }

        setSuccessMessage(
          'Biometric facial enrollment completed successfully! 5 angles uploaded and indexed.',
        );
        await fetchProfile();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error capturing or uploading angle';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Direct File Upload Option (for fallback or pre-taken photos)
  const handleFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const activeAngle = ANGLES[currentAngleIndex];
    if (!activeAngle) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCapturedThumbnails((prev) => ({
            ...prev,
            [activeAngle.key]: String(event.target?.result),
          }));
        }
      };
      reader.readAsDataURL(file);

      // Upload directly to S3
      await uploadAngleBlobToS3(activeAngle.key, file);

      setUploadedAngles((prev) => ({ ...prev, [activeAngle.key]: true }));

      if (currentAngleIndex < ANGLES.length - 1) {
        setCurrentAngleIndex((prev) => prev + 1);
      } else {
        stopCamera();
        setIsWizardActive(false);

        const sessionId =
          session?.registrationSessionId || (session as unknown as { id?: string })?.id;
        if (sessionId) {
          try {
            await EmployeeService.completeFaceRegistrationSession(employeeId, sessionId);
          } catch (err: unknown) {
            console.warn('Failed to notify backend of session completion:', err);
          }
        }

        setSuccessMessage(
          'Biometric facial enrollment completed successfully! 5 angles uploaded and indexed.',
        );
        await fetchProfile();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload photo';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCancelWizard = () => {
    stopCamera();
    setIsWizardActive(false);
    setSession(null);
    setCurrentAngleIndex(0);
    setErrorMessage(null);
  };

  const activeAngle = ANGLES[currentAngleIndex] ?? ANGLES[0]!;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {successMessage && (
        <div
          style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'hsl(var(--color-success) / 0.1)',
            border: '1px solid hsl(var(--color-success) / 0.3)',
            color: 'hsl(var(--color-success))',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'hsl(var(--color-danger) / 0.1)',
            border: '1px solid hsl(var(--color-danger) / 0.3)',
            color: 'hsl(var(--color-danger))',
            fontSize: 'var(--font-size-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Enrollment Card */}
      <Card variant="subtle">
        <CardHeader
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <CardTitle>Facial Recognition Enrollment</CardTitle>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-muted))',
                marginTop: 'var(--space-1)',
              }}
            >
              Capture 5-angle biometric vectors for contact-free kiosk and field attendance
              recognition
            </div>
          </div>
          {!isWizardActive && (
            <Button
              type="button"
              variant={isEnrolledAndActive ? 'secondary' : 'primary'}
              onClick={handleStartEnrollment}
              disabled={isProcessing}
              leftIcon={<Camera size={16} />}
            >
              {isProcessing
                ? 'Connecting...'
                : isPending
                  ? 'Resume Face Enrollment'
                  : isEnrolledAndActive
                    ? 'Re-enroll Face Biometrics'
                    : 'Start Face Enrollment'}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isWizardActive ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {/* 5-Angle Stepper Header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${ANGLES.length}, 1fr)`,
                  gap: 'var(--space-2)',
                }}
              >
                {ANGLES.map((angle, idx) => {
                  const isCompleted = !!uploadedAngles[angle.key];
                  const isCurrent = currentAngleIndex === idx;
                  const AngleIcon = angle.Icon;

                  return (
                    <button
                      key={angle.key}
                      type="button"
                      onClick={() => setCurrentAngleIndex(idx)}
                      style={{
                        padding: 'var(--space-2)',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                        backgroundColor: isCompleted
                          ? 'hsl(var(--color-success) / 0.15)'
                          : isCurrent
                            ? 'hsl(var(--primary-color) / 0.15)'
                            : 'hsl(var(--bg-secondary))',
                        border: `1px solid ${
                          isCompleted
                            ? 'hsl(var(--color-success) / 0.4)'
                            : isCurrent
                              ? 'hsl(var(--primary-color) / 0.4)'
                              : 'hsl(var(--border-subtle))'
                        }`,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 'var(--space-1)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isCompleted
                            ? 'hsl(var(--color-success))'
                            : isCurrent
                              ? 'hsl(var(--primary-color))'
                              : 'hsl(var(--text-muted))',
                        }}
                      >
                        {isCompleted ? <Check size={18} /> : <AngleIcon size={18} />}
                      </div>
                      <div
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 600,
                          color: isCompleted
                            ? 'hsl(var(--color-success))'
                            : isCurrent
                              ? 'hsl(var(--primary-color))'
                              : 'hsl(var(--text-muted))',
                        }}
                      >
                        {angle.label}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Live Camera Viewport */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '560px',
                  margin: '0 auto',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  backgroundColor: '#000',
                  aspectRatio: '4/3',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)', // Selfie mirror
                  }}
                />

                {/* Face Oval Guide Target */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '240px',
                    height: '320px',
                    borderRadius: '50%',
                    border: '3px dashed hsl(var(--primary-color))',
                    pointerEvents: 'none',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                  }}
                />

                {/* Top Instruction Header */}
                <div
                  style={{
                    position: 'absolute',
                    top: 'var(--space-3)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(8px)',
                    padding: 'var(--space-2) var(--space-4)',
                    borderRadius: 'var(--radius-full)',
                    color: '#fff',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    whiteSpace: 'nowrap',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <activeAngle.Icon size={16} />
                  <span>{activeAngle.instruction}</span>
                </div>

                {/* Bottom Step Tag */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 'var(--space-3)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    padding: 'var(--space-1) var(--space-3)',
                    borderRadius: 'var(--radius-full)',
                    color: '#fff',
                    fontSize: 'var(--font-size-xs)',
                  }}
                >
                  Step {currentAngleIndex + 1} of {ANGLES.length} ({activeAngle.label})
                </div>
              </div>

              {/* Captured Thumbnails Gallery */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)' }}>
                {ANGLES.map((angle) => {
                  const thumb = capturedThumbnails[angle.key];
                  const isDone = !!uploadedAngles[angle.key];

                  return (
                    <div
                      key={angle.key}
                      style={{
                        width: '70px',
                        height: '52px',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        border: `2px solid ${isDone ? 'hsl(var(--color-success))' : 'hsl(var(--border-subtle))'}`,
                        backgroundColor: 'hsl(var(--bg-secondary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={angle.label}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>
                          {angle.label}
                        </span>
                      )}
                      {isDone && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            backgroundColor: 'hsl(var(--color-success))',
                            color: '#fff',
                            borderRadius: '50%',
                            width: '14px',
                            height: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '9px',
                          }}
                        >
                          ✓
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Wizard Action Controls */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelWizard}
                  disabled={isProcessing}
                >
                  Cancel Enrollment
                </Button>

                {/* File Upload Option */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileSelected}
                  style={{ display: 'none' }}
                  id="angleFileInput"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  leftIcon={<Upload size={16} />}
                >
                  Upload File
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={handleCaptureCurrentAngle}
                  disabled={isProcessing}
                  style={{ minWidth: '190px' }}
                  leftIcon={
                    currentAngleIndex === ANGLES.length - 1 ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <Camera size={18} />
                    )
                  }
                >
                  {isProcessing
                    ? 'Uploading to S3...'
                    : currentAngleIndex === ANGLES.length - 1
                      ? 'Capture & Finish'
                      : `Capture ${activeAngle.label}`}
                </Button>
              </div>
            </div>
          ) : (
            /* Idle Profile Status Screen */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div
                style={{
                  padding: 'var(--space-6)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'hsl(var(--bg-secondary))',
                  border: '1px solid hsl(var(--border-subtle))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-4)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: isEnrolledAndActive
                        ? 'hsl(var(--color-success) / 0.1)'
                        : isPending
                          ? 'hsl(var(--color-warning) / 0.1)'
                          : 'hsl(var(--primary-color) / 0.1)',
                      color: isEnrolledAndActive
                        ? 'hsl(var(--color-success))'
                        : isPending
                          ? 'hsl(var(--color-warning))'
                          : 'hsl(var(--primary-color))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <User size={24} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                      Facial Biometric Vector Status
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'hsl(var(--text-muted))',
                        marginTop: 'var(--space-1)',
                      }}
                    >
                      {isLoadingProfile
                        ? 'Verifying biometric registration status...'
                        : isEnrolledAndActive
                          ? `Enrolled & verified in AI collection (${profile?.collectionId || profile?.rekognitionCollectionId || 'default-hrms-collection'}).`
                          : isPending
                            ? 'Session initiated. 5-angle face capture is pending upload.'
                            : 'No biometric facial vectors enrolled for this employee.'}
                    </div>
                  </div>
                </div>

                {isLoadingProfile ? (
                  <span
                    style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}
                  >
                    Checking...
                  </span>
                ) : isEnrolledAndActive ? (
                  <Badge variant="success">ENROLLED & ACTIVE</Badge>
                ) : isPending ? (
                  <Badge variant="warning">PENDING ENROLLMENT</Badge>
                ) : (
                  <Badge variant="danger">NOT ENROLLED</Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
