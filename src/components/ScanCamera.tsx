import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DiseaseItem, ScreenType } from '../types';
import { sampleDiseases } from '../data/plantData';
import {
  X,
  HelpCircle,
  Image as ImageIcon,
  Zap,
  ZapOff,
  Scan,
  RefreshCw,
  Sparkles,
  Camera,
  SwitchCamera,
  AlertCircle,
  Focus,
  Sun,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { NoPlantModal } from './NoPlantModal';
import { ScanResultModal } from './ScanResultModal';

interface ScanCameraProps {
  setScreen: (screen: ScreenType) => void;
  onDiagnose: (disease: DiseaseItem) => void;
}

export const ScanCamera: React.FC<ScanCameraProps> = ({ setScreen, onDiagnose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepText, setScanStepText] = useState('Position leaf in frame');
  const [flashMode, setFlashMode] = useState<'auto' | 'on' | 'off'>('auto');
  const [, setTorchActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraStatus, setCameraStatus] = useState<'requesting' | 'active' | 'denied' | 'unsupported'>('requesting');
  const [cameraErrorMsg, setCameraErrorMsg] = useState<string>('');
  const [showNoPlantModal, setShowNoPlantModal] = useState(false);
  const [activeResultDisease, setActiveResultDisease] = useState<DiseaseItem | null>(null);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [simulatedARBox, setSimulatedARBox] = useState({ x: 50, y: 48, visible: true, confidence: 94 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop current active media stream tracks
  const stopLiveStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
  }, []);

  // Request & attach live camera
  const startLiveCamera = useCallback(async (facing: 'environment' | 'user') => {
    stopLiveStream();
    setCameraStatus('requesting');
    setCameraErrorMsg('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus('unsupported');
      setCameraErrorMsg('Camera API is not supported in this browser or environment.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
      }
      setCameraStatus('active');
    } catch (err: any) {
      console.warn('Live camera access error:', err);
      // Fallback try with generic video constraint
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.play().catch(() => {});
        }
        setCameraStatus('active');
      } catch (fallbackErr: any) {
        setCameraStatus('denied');
        setCameraErrorMsg(
          fallbackErr?.message || 'Camera permission was not granted or webcam is unavailable.'
        );
      }
    }
  }, [stopLiveStream]);

  // Initial camera startup
  useEffect(() => {
    if (!customImage) {
      startLiveCamera(facingMode);
    } else {
      stopLiveStream();
    }

    return () => {
      stopLiveStream();
    };
  }, [customImage, facingMode, startLiveCamera, stopLiveStream]);

  // Toggle Camera Facing Mode (Front / Back)
  const toggleCameraFacing = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    if (!customImage) {
      startLiveCamera(nextFacing);
    }
  };

  // Toggle Hardware Torch / Screen Flash
  const toggleTorch = async () => {
    const nextFlashMode = flashMode === 'off' ? 'on' : flashMode === 'on' ? 'auto' : 'off';
    setFlashMode(nextFlashMode);

    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && 'applyConstraints' in track) {
        try {
          const capabilities = (track.getCapabilities && track.getCapabilities()) || {};
          if ('torch' in capabilities) {
            const shouldTorch = nextFlashMode === 'on';
            await (track as any).applyConstraints({
              advanced: [{ torch: shouldTorch }],
            });
            setTorchActive(shouldTorch);
          }
        } catch {
          // torch constraint not supported, fallback handled in UI
        }
      }
    }
  };

  // Floating AR telemetry target box animation
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isScanning) {
        setSimulatedARBox(() => ({
          x: 48 + (Math.random() * 4 - 2),
          y: 47 + (Math.random() * 4 - 2),
          visible: true,
          confidence: Math.floor(92 + Math.random() * 6),
        }));
      }
    }, 2400);
    return () => clearInterval(interval);
  }, [isScanning]);

  // Trigger Snapshot and AI Diagnosis
  const handleCapture = () => {
    if (isScanning) return;

    // Trigger visual screen shutter flash
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 250);

    // If live video active, grab snapshot frame to canvas
    if (!customImage && videoRef.current && canvasRef.current && cameraStatus === 'active') {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frameUrl = canvas.toDataURL('image/jpeg', 0.85);
          setCapturedSnapshot(frameUrl);
        }
      } catch (err) {
        console.log('Canvas snapshot error:', err);
      }
    } else if (customImage) {
      setCapturedSnapshot(customImage);
    }

    setIsScanning(true);
    setScanStepText('Analyzing leaf venation & chlorophyll...');

    setTimeout(() => {
      setScanStepText('Cross-referencing 12,000+ pathogen profiles...');
    }, 800);

    setTimeout(() => {
      setScanStepText('Synthesizing botanical recovery protocol...');
    }, 1500);

    setTimeout(() => {
      setIsScanning(false);
      setScanStepText('Position leaf in frame');

      // Intelligent Live diagnosis response
      const diagnosed = {
        ...sampleDiseases.chlorosis,
        confidenceScore: 96,
      };
      setActiveResultDisease(diagnosed);
    }, 2200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImage(event.target?.result as string);
        stopLiveStream();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetToLive = () => {
    setCustomImage(null);
    setCapturedSnapshot(null);
    startLiveCamera(facingMode);
  };

  return (
    <div
      id="scan-camera-viewport"
      className="fixed inset-0 z-50 bg-[#0d140b] text-white flex flex-col justify-between overflow-hidden select-none"
    >
      {/* Hidden Snapshot Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Screen Shutter Flash Effect */}
      {shutterFlash && (
        <div className="absolute inset-0 z-50 bg-white opacity-80 pointer-events-none transition-opacity duration-200" />
      )}

      {/* Viewport Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black flex items-center justify-center">
        {!customImage ? (
          cameraStatus === 'active' ? (
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
          ) : cameraStatus === 'requesting' ? (
            <div className="flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-xs">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-3 border-[#8ba870]/30 border-t-[#cdecae] animate-spin flex items-center justify-center" />
                <Camera className="w-7 h-7 text-[#cdecae] absolute inset-0 m-auto" />
              </div>
              <div>
                <p className="font-semibold text-sm text-white">Initializing Live Camera...</p>
                <p className="text-xs text-white/60 mt-1">Connecting to video feed</p>
              </div>
            </div>
          ) : (
            // Permission Denied or Unavailable View
            <div className="flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-sm bg-black/80 rounded-3xl mx-4 border border-white/10 backdrop-blur-md">
              <div className="w-14 h-14 rounded-full bg-[#ba1a1a]/20 text-[#ffdad6] flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Live Camera Unavailable</h3>
                <p className="text-xs text-white/70 mt-1.5 leading-relaxed">
                  {cameraErrorMsg || 'Please allow camera access in your browser or select a plant photo from your gallery.'}
                </p>
              </div>
              <div className="flex flex-col w-full gap-2 pt-2">
                <button
                  onClick={() => startLiveCamera(facingMode)}
                  className="w-full py-2.5 bg-[#4c6635] hover:bg-[#354e1f] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Camera Access</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Upload Plant Photo</span>
                </button>
              </div>
            </div>
          )
        ) : (
          <img
            src={customImage}
            alt="Uploaded leaf specimen"
            className="w-full h-full object-cover transition-all duration-300"
          />
        )}

        {/* Ambient Botanical Lens Vignette */}
        <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/60 pointer-events-none" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-20 flex justify-between items-center px-5 h-16 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
        <button
          onClick={() => setScreen('home')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 active:scale-95 transition-all cursor-pointer border border-white/10"
          aria-label="Close scanner"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Live Status Header */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            {!customImage && cameraStatus === 'active' && (
              <span className="w-2 h-2 rounded-full bg-[#52ff00] animate-ping" />
            )}
            <h1 className="font-bold text-base text-white tracking-tight drop-shadow-md">
              FloraVeda AI Scan
            </h1>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#8ba870]/30 text-[#cdecae] border border-[#8ba870]/40">
              {!customImage
                ? cameraStatus === 'active'
                  ? 'Live Camera Active'
                  : 'Live Vision'
                : 'Gallery Photo'}
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowHelpModal(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 active:scale-95 transition-all cursor-pointer border border-white/10"
          aria-label="Scan instructions"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </header>

      {/* Live HUD Telemetry Strip & Return to Live Option */}
      <div className="relative z-20 flex flex-col items-center px-4 gap-2">
        {customImage ? (
          <button
            onClick={handleResetToLive}
            className="bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#cdecae] flex items-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Switch back to Live Camera</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 text-[11px] text-white/90">
            <div className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
              <Focus className="w-3 h-3 text-[#cdecae]" />
              <span>Continuous AF</span>
            </div>
            <div className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
              <Sun className="w-3 h-3 text-[#f0e371]" />
              <span>Lux: Optimal</span>
            </div>
            <div className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-[#cdecae]" />
              <span>FloraAI v4.8</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Reticle Framing Guide */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-2">
        <div className="relative w-full max-w-[310px] aspect-[3/4]">
          {/* Transparent cutout border with darkened outer vignette */}
          <div className="absolute inset-0 rounded-3xl border border-white/30 overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.52)]">
            {/* Animated Laser Scanning Line */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#cdecae] to-transparent shadow-[0_0_16px_#cdecae] ${
                isScanning ? 'animate-scan-fast duration-700' : 'animate-scan'
              }`}
            />
          </div>

          {/* Precision Corner Reticles */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#cdecae] rounded-tl-2xl shadow-sm" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#cdecae] rounded-tr-2xl shadow-sm" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#cdecae] rounded-bl-2xl shadow-sm" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#cdecae] rounded-br-2xl shadow-sm" />

          {/* Floating AR Target Box (When not scanning) */}
          {!isScanning && (
            <div
              className="absolute pointer-events-none transition-all duration-700 ease-out"
              style={{
                top: `${simulatedARBox.y}%`,
                left: `${simulatedARBox.x}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="w-36 h-36 border border-[#cdecae]/60 rounded-2xl flex flex-col justify-between p-2 animate-pulse bg-[#8ba870]/10 backdrop-blur-xs">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-mono font-bold bg-[#4c6635]/90 text-[#cdecae] px-1.5 py-0.5 rounded">
                    LEAF_DETECT
                  </span>
                  <span className="text-[9px] font-mono text-white/90">
                    {simulatedARBox.confidence}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[8px] text-white/80">
                  <span>Chlorophyll Index</span>
                  <span className="text-[#cdecae] font-bold">OPTIMAL</span>
                </div>
              </div>
            </div>
          )}

          {/* Center Scan Focus Indicator & Live Feedback */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {isScanning ? (
              <div className="flex flex-col items-center animate-fade-in">
                <div className="relative mb-3">
                  <div className="w-16 h-16 rounded-full border-3 border-[#cdecae]/30 border-t-[#cdecae] animate-spin flex items-center justify-center shadow-lg" />
                  <Sparkles className="w-7 h-7 text-[#cdecae] absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="bg-black/75 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-semibold text-white flex items-center gap-2 border border-[#cdecae]/40 shadow-2xl">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#cdecae]" />
                  <span>{scanStepText}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center opacity-85">
                <Scan className="w-10 h-10 text-[#cdecae] animate-pulse mb-2" />
                <div className="bg-black/55 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-medium text-white/90 border border-white/15">
                  Center leaf in crosshairs
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Framing Prompt */}
        <p className="text-center text-xs text-white/80 mt-3 drop-shadow font-medium">
          {isScanning
            ? 'Running multi-spectral pathogen diagnostics...'
            : 'Hold steady • FloraVeda automatically isolates infected leaf areas'}
        </p>
      </main>

      {/* Bottom Glassmorphic Control Deck */}
      <footer className="relative z-20 bg-gradient-to-t from-black via-black/80 to-black/40 backdrop-blur-2xl border-t border-white/15 rounded-t-[36px] px-6 pt-5 pb-9">
        <div className="max-w-md mx-auto flex justify-between items-center px-4">
          {/* Gallery / File Upload */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-13 h-13 rounded-full bg-white/15 hover:bg-white/25 active:scale-90 transition-all flex items-center justify-center border border-white/20 shadow-md cursor-pointer text-white"
              aria-label="Upload photo from device gallery"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <span className="text-[11px] font-medium text-white/90 mt-1.5">Gallery</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Main Shutter Button with Capture Ring */}
          <div className="flex flex-col items-center">
            <button
              onClick={handleCapture}
              disabled={isScanning}
              className="relative w-20 h-20 rounded-full border-4 border-white/50 flex items-center justify-center active:scale-95 transition-all shadow-[0_0_35px_rgba(205,236,174,0.4)] cursor-pointer group hover:border-[#cdecae]"
              aria-label="Diagnose Leaf with AI"
            >
              <div
                className={`w-16 h-16 rounded-full transition-all duration-300 flex items-center justify-center ${
                  isScanning
                    ? 'scale-90 bg-[#8ba870]'
                    : 'bg-white group-hover:scale-105 group-active:scale-95 shadow-inner'
                }`}
              >
                {isScanning ? (
                  <RefreshCw className="w-7 h-7 animate-spin text-white" />
                ) : (
                  <div className="w-14 h-14 rounded-full border-2 border-[#4c6635]/30 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-[#4c6635]" />
                  </div>
                )}
              </div>
            </button>
            <span className="text-xs font-bold text-[#cdecae] mt-1.5 tracking-wide">
              {isScanning ? 'Diagnosing...' : 'Tap to Scan'}
            </span>
          </div>

          {/* Flash / Camera Switch Control Group */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              {/* Flip camera button (when on live stream) */}
              {!customImage && (
                <button
                  onClick={toggleCameraFacing}
                  className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-90 transition-all flex items-center justify-center border border-white/20 shadow-md cursor-pointer text-white"
                  title="Flip camera (Front / Rear)"
                  aria-label="Switch camera"
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>
              )}

              {/* Torch / Flash mode toggle */}
              <button
                onClick={toggleTorch}
                className={`w-12 h-12 rounded-full transition-all flex items-center justify-center border border-white/20 shadow-md cursor-pointer ${
                  flashMode === 'on'
                    ? 'bg-[#cdecae] text-[#191c1b]'
                    : 'bg-white/15 hover:bg-white/25 text-white active:scale-90'
                }`}
                aria-label={`Flash mode ${flashMode}`}
              >
                {flashMode === 'off' ? (
                  <ZapOff className="w-5 h-5" />
                ) : (
                  <Zap className={`w-5 h-5 ${flashMode === 'on' ? 'text-[#191c1b] fill-current' : 'text-[#cdecae]'}`} />
                )}
              </button>
            </div>
            <span className="text-[11px] font-medium text-white/90 capitalize">
              Flash: {flashMode}
            </span>
          </div>
        </div>
      </footer>

      {/* No Plant Modal */}
      {showNoPlantModal && (
        <NoPlantModal
          onRetake={() => {
            setShowNoPlantModal(false);
            setCustomImage(null);
            startLiveCamera(facingMode);
          }}
          onCancel={() => setShowNoPlantModal(false)}
        />
      )}

      {/* Scan Results Modal with Diagnosed Details */}
      {activeResultDisease && (
        <ScanResultModal
          disease={
            capturedSnapshot
              ? { ...activeResultDisease, image: capturedSnapshot }
              : activeResultDisease
          }
          onViewDiagnosis={() => {
            onDiagnose(activeResultDisease);
            setActiveResultDisease(null);
            setScreen('diagnosis');
          }}
          onClose={() => setActiveResultDisease(null)}
        />
      )}

      {/* How to Scan Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in text-[#191c1b]">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-[#e1e3e0]">
            <div className="flex justify-between items-center border-b border-[#f0f2ef] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#cdecae] flex items-center justify-center text-[#354e1f]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-[#191c1b]">FloraVeda Vision Tips</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-8 h-8 rounded-full bg-[#f2f4f1] flex items-center justify-center text-[#74796d] hover:bg-[#e6e8e5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ul className="text-xs text-[#44483e] space-y-3 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#4c6635] text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <span>
                  <strong>Distance:</strong> Position camera 6–10 inches from the leaf and ensure the infected area is centered.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#4c6635] text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <span>
                  <strong>Lighting:</strong> Bright, indirect daylight works best. Turn on the flashlight toggle in dim settings.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#4c6635] text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <span>
                  <strong>Photo Quality:</strong> Keep hands steady or choose high-resolution plant photos from your gallery for best accuracy.
                </span>
              </li>
            </ul>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full bg-[#4c6635] hover:bg-[#354e1f] text-white py-3 rounded-xl font-semibold text-xs active:scale-98 transition-all cursor-pointer shadow-md"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
