import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DiseaseItem, ScreenType } from '../types';
import { diagnoseImage } from '../lib/diagnosis';
import {
  X, Image as ImageIcon, Zap, ZapOff, SwitchCamera,
  AlertCircle, RefreshCw, ChevronRight, Check,
  FlaskConical, Leaf, RotateCcw, Loader2,
} from 'lucide-react';

interface ScanCameraProps {
  setScreen: (screen: ScreenType) => void;
  onDiagnose: (disease: DiseaseItem) => void;
  userId?: string | null;
}

type ScanPhase = 'idle' | 'scanning' | 'done' | 'error';
type CameraState = 'requesting' | 'active' | 'denied' | 'unsupported';

// Scan step messages shown while AI runs
const SCAN_STEPS = [
  'Detecting leaf structure…',
  'Analysing chlorophyll patterns…',
  'Cross-referencing disease database…',
  'Generating diagnosis report…',
];

// Severity badge colors
const SEVERITY_COLOR: Record<string, string> = {
  High:   'bg-red-500/90 text-white',
  Medium: 'bg-amber-400/90 text-[#191c1b]',
  Low:    'bg-green-500/90 text-white',
};

export const ScanCamera: React.FC<ScanCameraProps> = ({ setScreen, onDiagnose, userId }) => {
  // ── Camera state ────────────────────────────────────────────────────────────
  const [cameraState, setCameraState]   = useState<CameraState>('requesting');
  const [cameraError, setCameraError]   = useState('');
  const [facingMode, setFacingMode]     = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn]           = useState(false);
  const [hasTorch, setHasTorch]         = useState(false);

  // ── Image / capture state ───────────────────────────────────────────────────
  const [uploadedImage, setUploadedImage]   = useState<string | null>(null);
  const [capturedFrame, setCapturedFrame]   = useState<string | null>(null);

  // ── Scan flow state ─────────────────────────────────────────────────────────
  const [phase, setPhase]               = useState<ScanPhase>('idle');
  const [stepIdx, setStepIdx]           = useState(0);
  const [progress, setProgress]         = useState(0);   // 0-100
  const [result, setResult]             = useState<DiseaseItem | null>(null);
  const [scanError, setScanError]       = useState('');

  // ── Shutter flash ───────────────────────────────────────────────────────────
  const [shutterFlash, setShutterFlash] = useState(false);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stepTimers  = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ── Stop stream ─────────────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  // ── Start camera ────────────────────────────────────────────────────────────
  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    stopStream();
    setCameraState('requesting');
    setCameraError('');

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('unsupported');
      setCameraError('Camera API not supported in this browser.');
      return;
    }

    const tryStart = async (constraints: MediaStreamConstraints) => {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      // Check torch support
      const track = stream.getVideoTracks()[0];
      const caps = track?.getCapabilities?.() as Record<string, unknown> | undefined;
      setHasTorch(!!caps?.torch);
      setCameraState('active');
    };

    try {
      await tryStart({ video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
    } catch {
      try {
        await tryStart({ video: true, audio: false });
      } catch (err: unknown) {
        setCameraState('denied');
        setCameraError((err as Error)?.message ?? 'Camera access denied.');
      }
    }
  }, [stopStream]);

  // Start on mount / when facing changes (unless showing an upload)
  useEffect(() => {
    if (!uploadedImage) startCamera(facingMode);
    return stopStream;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedImage, facingMode]);

  // ── Toggle torch ────────────────────────────────────────────────────────────
  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await (track as unknown as { applyConstraints(c: unknown): Promise<void> })
        .applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch { /* torch not available */ }
  }, [torchOn]);

  // ── Grab snapshot from video ─────────────────────────────────────────────────
  const grabFrame = useCallback((): string | null => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.92);
  }, []);

  // ── Clear step timers ────────────────────────────────────────────────────────
  const clearStepTimers = () => {
    stepTimers.current.forEach(clearTimeout);
    stepTimers.current = [];
  };

  // ── Main scan trigger ────────────────────────────────────────────────────────
  const handleScan = useCallback(async () => {
    if (phase === 'scanning') return;

    // Shutter flash
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 180);

    // Capture frame
    let imageData: string | null = null;
    if (uploadedImage) {
      imageData = uploadedImage;
      setCapturedFrame(uploadedImage);
    } else {
      imageData = grabFrame();
      if (imageData) setCapturedFrame(imageData);
    }

    if (!imageData) {
      setScanError('Could not capture image. Try uploading a photo instead.');
      setPhase('error');
      return;
    }

    // ── Animate scan steps ────────────────────────────────────────────────────
    setPhase('scanning');
    setResult(null);
    setScanError('');
    setStepIdx(0);
    setProgress(0);

    clearStepTimers();

    // Step text advances every ~700 ms
    SCAN_STEPS.forEach((_, i) => {
      if (i === 0) return;
      const t = setTimeout(() => setStepIdx(i), i * 700);
      stepTimers.current.push(t);
    });

    // Progress bar fills over ~2.8 s
    let p = 0;
    const progressInterval = setInterval(() => {
      p = Math.min(p + 2, 90);   // ramp to 90% while waiting
      setProgress(p);
    }, 60);

    try {
      const { disease } = await diagnoseImage(imageData, userId ?? 'anonymous');
      clearInterval(progressInterval);
      clearStepTimers();
      setProgress(100);
      setTimeout(() => {
        setResult(disease);
        setPhase('done');
      }, 300);
    } catch (err) {
      clearInterval(progressInterval);
      clearStepTimers();
      setScanError((err as Error)?.message ?? 'Diagnosis failed. Please try again.');
      setPhase('error');
    }
  }, [phase, uploadedImage, grabFrame, userId]);

  // ── File upload ──────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      stopStream();
      setUploadedImage(ev.target?.result as string);
      setPhase('idle');
      setResult(null);
      setCapturedFrame(null);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  // ── Reset to live camera ─────────────────────────────────────────────────────
  const resetToLive = () => {
    setUploadedImage(null);
    setCapturedFrame(null);
    setPhase('idle');
    setResult(null);
    setScanError('');
    setProgress(0);
    startCamera(facingMode);
  };

  // ── Navigate to full diagnosis detail ────────────────────────────────────────
  const handleViewDiagnosis = () => {
    if (!result) return;
    onDiagnose(result);
    setScreen('diagnosis');
  };

  // ── Active image source ──────────────────────────────────────────────────────
  const activeImageSrc = phase === 'done' && capturedFrame
    ? capturedFrame
    : uploadedImage ?? null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden select-none touch-none">
      {/* Hidden helpers */}
      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      {/* ── Shutter flash ─────────────────────────────────────────────── */}
      {shutterFlash && (
        <div className="absolute inset-0 z-[60] bg-white pointer-events-none animate-[fade-out_0.18s_ease-out_forwards]" />
      )}

      {/* ════════════════════════════════════════════════════════════════
          CAMERA / IMAGE VIEWPORT  (full screen background)
          ════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 bg-black">
        {/* Live video — always mounted so stream doesn't restart unnecessarily */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover ${activeImageSrc || phase === 'done' ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        />

        {/* Uploaded / captured image overlay */}
        {activeImageSrc && (
          <img
            src={activeImageSrc}
            alt="Scan target"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Camera requesting state */}
        {!uploadedImage && cameraState === 'requesting' && (
          <div className="absolute inset-0 bg-[#0a0f08] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-white/70">
              <Loader2 className="w-8 h-8 animate-spin text-[#8ba870]" />
              <p className="text-sm font-medium">Starting camera…</p>
            </div>
          </div>
        )}

        {/* Camera denied / unsupported state */}
        {!uploadedImage && (cameraState === 'denied' || cameraState === 'unsupported') && (
          <div className="absolute inset-0 bg-[#0a0f08] flex items-center justify-center p-6">
            <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 max-w-xs w-full text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <p className="font-bold text-white text-base">Camera Unavailable</p>
                <p className="text-xs text-white/60 mt-1 leading-relaxed">
                  {cameraError || 'Allow camera access in browser settings, or upload a photo.'}
                </p>
              </div>
              <button
                onClick={() => startCamera(facingMode)}
                className="w-full py-3 bg-[#4c6635] hover:bg-[#3d5229] text-white rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 bg-white/10 hover:bg-white/15 text-white rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <ImageIcon className="w-4 h-4" /> Upload Photo
              </button>
            </div>
          </div>
        )}

        {/* Subtle dark vignette around edges */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.55)_100%)] pointer-events-none" />
      </div>

      {/* ════════════════════════════════════════════════════════════════
          TOP BAR
          ════════════════════════════════════════════════════════════════ */}
      <header className="relative z-20 flex items-center justify-between px-4 pt-12 pb-4 bg-gradient-to-b from-black/70 to-transparent">
        {/* Close */}
        <button
          onClick={() => setScreen('home')}
          className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title pill */}
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/15 rounded-full px-4 py-2">
          <Leaf className="w-4 h-4 text-[#8ba870]" />
          <span className="text-white text-sm font-bold tracking-wide">Plant Scanner</span>
          {!uploadedImage && cameraState === 'active' && (
            <span className="w-2 h-2 rounded-full bg-[#52ff00] animate-pulse" />
          )}
        </div>

        {/* Torch (only when live camera active and torch supported) */}
        {!uploadedImage && cameraState === 'active' && hasTorch ? (
          <button
            onClick={toggleTorch}
            className={`w-10 h-10 rounded-full backdrop-blur-md border border-white/15 flex items-center justify-center active:scale-90 transition-all cursor-pointer ${
              torchOn ? 'bg-[#cdecae] text-[#191c1b]' : 'bg-black/50 text-white'
            }`}
          >
            {torchOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
          </button>
        ) : (
          <div className="w-10" />
        )}
      </header>

      {/* ════════════════════════════════════════════════════════════════
          VIEWFINDER  (the scanning frame)
          ════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8">
        {/* The frame itself */}
        <div className="relative w-full max-w-[300px] aspect-[3/4]">

          {/* Dark surround outside the frame */}
          <div className="absolute inset-0 rounded-[28px] shadow-[0_0_0_9999px_rgba(0,0,0,0.48)] pointer-events-none" />

          {/* Frame border */}
          <div className={`absolute inset-0 rounded-[28px] border-2 transition-colors duration-500 ${
            phase === 'scanning' ? 'border-[#cdecae]/80' :
            phase === 'done'     ? 'border-[#52ff00]/90' :
            phase === 'error'    ? 'border-red-400/80'   :
                                   'border-white/25'
          }`} />

          {/* Corner reticles */}
          {(['tl','tr','bl','br'] as const).map(c => (
            <div
              key={c}
              className={`absolute w-7 h-7 animate-corner-glow ${
                phase === 'done' ? 'border-[#52ff00]' : 'border-[#cdecae]'
              } ${c === 'tl' ? 'top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-[28px]' :
                  c === 'tr' ? 'top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-[28px]' :
                  c === 'bl' ? 'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-[28px]' :
                               'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-[28px]'}`}
            />
          ))}

          {/* ── Scan line (only while scanning) ──────────────────────── */}
          {phase === 'scanning' && (
            <div className="absolute inset-0 overflow-hidden rounded-[28px] pointer-events-none">
              <div className="absolute left-0 right-0 h-[3px] animate-scan-fast
                bg-gradient-to-r from-transparent via-[#cdecae] to-transparent
                shadow-[0_0_18px_4px_rgba(205,236,174,0.7)]" />
            </div>
          )}

          {/* ── Done: checkmark overlay ───────────────────────────────── */}
          {phase === 'done' && (
            <div className="absolute inset-0 rounded-[28px] flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-[#52ff00]/20 border-2 border-[#52ff00] flex items-center justify-center animate-fade-in-up">
                <Check className="w-8 h-8 text-[#52ff00]" strokeWidth={3} />
              </div>
            </div>
          )}

          {/* ── Error overlay ─────────────────────────────────────────── */}
          {phase === 'error' && (
            <div className="absolute inset-0 rounded-[28px] flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center animate-fade-in-up">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>
          )}

          {/* ── Idle: floating hint ───────────────────────────────────── */}
          {phase === 'idle' && (cameraState === 'active' || uploadedImage) && (
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-5 pointer-events-none">
              <div className="bg-black/50 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/15">
                <p className="text-[11px] text-white/80 font-medium tracking-wide">
                  Centre the leaf · tap scan
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Progress bar (while scanning) ──────────────────────────── */}
        {phase === 'scanning' && (
          <div className="mt-6 w-full max-w-[300px] space-y-2 animate-fade-in-up">
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#8ba870] to-[#cdecae] rounded-full transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-xs text-white/70 font-medium">
              {SCAN_STEPS[stepIdx]}
            </p>
          </div>
        )}

        {/* ── Error text ──────────────────────────────────────────────── */}
        {phase === 'error' && (
          <div className="mt-5 bg-red-900/50 backdrop-blur-md rounded-2xl px-4 py-3 max-w-[300px] w-full animate-fade-in-up">
            <p className="text-xs text-red-300 text-center leading-relaxed">{scanError}</p>
            <button
              onClick={resetToLive}
              className="mt-2 w-full text-xs text-white/70 underline underline-offset-2 cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          RESULT CARD  (slides up after scan completes)
          ════════════════════════════════════════════════════════════════ */}
      {phase === 'done' && result && (
        <div className="relative z-20 animate-result-slide-up">
          <div className="bg-[#0f1a0c]/95 backdrop-blur-xl border-t border-white/10 rounded-t-[32px] px-5 pt-5 pb-8">
            {/* Drag handle */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

            {/* Result row */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/10">
                <img
                  src={capturedFrame ?? result.image}
                  alt={result.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SEVERITY_COLOR[result.severity] ?? 'bg-white/20 text-white'}`}>
                    {result.severity} Risk
                  </span>
                  <span className="text-[10px] font-semibold text-[#cdecae]">
                    {result.confidenceScore ?? 92}% match
                  </span>
                </div>
                <h3 className="font-bold text-white text-base leading-tight truncate">{result.name}</h3>
                <p className="text-xs text-white/55 truncate mt-0.5">{result.commonName}</p>
              </div>
            </div>

            {/* Top cause */}
            {result.causes[0] && (
              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-start gap-3 mb-4">
                <FlaskConical className="w-4 h-4 text-[#8ba870] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white/80">{result.causes[0].title}</p>
                  <p className="text-[11px] text-white/50 mt-0.5 leading-relaxed">{result.causes[0].subtitle}</p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={resetToLive}
                className="flex-1 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-95"
              >
                <RotateCcw className="w-4 h-4" /> Scan Again
              </button>
              <button
                onClick={handleViewDiagnosis}
                className="flex-[2] py-3.5 rounded-2xl bg-[#4c6635] hover:bg-[#3d5229] text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-95 shadow-lg shadow-[#4c6635]/40"
              >
                View Full Report <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          BOTTOM CONTROL BAR  (hidden when result is shown)
          ════════════════════════════════════════════════════════════════ */}
      {phase !== 'done' && (
        <footer className="relative z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-6 pb-10 px-8">
          <div className="flex items-center justify-between max-w-sm mx-auto">

            {/* ── Gallery button ──────────────────────────────────────── */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/15 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all cursor-pointer"
                aria-label="Upload from gallery"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <span className="text-[10px] text-white/60 font-medium">Gallery</span>
            </div>

            {/* ── Shutter button ──────────────────────────────────────── */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={handleScan}
                disabled={phase === 'scanning' || (cameraState !== 'active' && !uploadedImage)}
                aria-label="Scan plant"
                className={`relative w-[76px] h-[76px] rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer
                  ${phase === 'scanning'
                    ? 'scale-95 cursor-not-allowed'
                    : 'active:scale-90 hover:scale-105'
                  }`}
              >
                {/* Outer ring */}
                <div className={`absolute inset-0 rounded-full border-[3px] transition-colors duration-300 ${
                  phase === 'scanning' ? 'border-[#cdecae]/60' : 'border-white/60'
                }`} />

                {/* Ripple when scanning */}
                {phase === 'scanning' && (
                  <>
                    <div className="absolute inset-[-8px] rounded-full border border-[#cdecae]/30 animate-ripple" />
                    <div className="absolute inset-[-16px] rounded-full border border-[#cdecae]/15 animate-ripple" style={{ animationDelay: '0.4s' }} />
                  </>
                )}

                {/* Inner disc */}
                <div className={`w-[60px] h-[60px] rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
                  phase === 'scanning'
                    ? 'bg-[#8ba870] scale-90'
                    : 'bg-white hover:bg-[#f0f0f0]'
                }`}>
                  {phase === 'scanning'
                    ? <Loader2 className="w-7 h-7 animate-spin text-white" />
                    : <Leaf className="w-7 h-7 text-[#4c6635]" />
                  }
                </div>
              </button>
              <span className={`text-[11px] font-semibold transition-colors ${
                phase === 'scanning' ? 'text-[#cdecae]' : 'text-white/80'
              }`}>
                {phase === 'scanning' ? 'Analysing…' : 'Scan'}
              </span>
            </div>

            {/* ── Flip / Reset button ─────────────────────────────────── */}
            <div className="flex flex-col items-center gap-1.5">
              {uploadedImage ? (
                <button
                  onClick={resetToLive}
                  className="w-12 h-12 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/15 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all cursor-pointer"
                  aria-label="Back to live camera"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => setFacingMode(f => f === 'environment' ? 'user' : 'environment')}
                  className="w-12 h-12 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/15 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all cursor-pointer"
                  aria-label="Flip camera"
                >
                  <SwitchCamera className="w-5 h-5" />
                </button>
              )}
              <span className="text-[10px] text-white/60 font-medium">
                {uploadedImage ? 'Live' : 'Flip'}
              </span>
            </div>

          </div>

          {/* Upload mode label */}
          {uploadedImage && (
            <div className="mt-3 flex justify-center">
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-3 py-1">
                <ImageIcon className="w-3 h-3 text-[#8ba870]" />
                <span className="text-[10px] text-white/70 font-medium">Photo uploaded — tap Scan to analyse</span>
              </div>
            </div>
          )}
        </footer>
      )}
    </div>
  );
};
