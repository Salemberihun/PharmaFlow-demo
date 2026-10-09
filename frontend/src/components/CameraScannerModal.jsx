import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, AlertCircle, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';

export default function CameraScannerModal({ isOpen, onClose, onScan }) {
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [scannedFeedback, setScannedFeedback] = useState(false);
  
  const scannerRef = useRef(null);
  const isStoppingRef = useRef(false);
  const scannedRef = useRef(false);
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onScanRef.current = onScan;
    onCloseRef.current = onClose;
  }, [onScan, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    scannedRef.current = false;
    setScannedFeedback(false);
    setError('');

    let scannerInstance = null;
    const elementId = 'barcode-camera-viewfinder';

    const initializeCamera = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          setError('No camera detected on this device.');
          return;
        }

        setCameras(devices);
        // Prefer back/environment camera if available
        const backCamera = devices.find(
          (d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('environment') ||
            d.label.toLowerCase().includes('rear')
        );
        const activeDeviceId = backCamera ? backCamera.id : devices[0].id;
        setSelectedCameraId(activeDeviceId);

        scannerInstance = new Html5Qrcode(elementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.DATA_MATRIX,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });
        scannerRef.current = scannerInstance;

        const config = {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const edge = Math.floor(minEdge * 0.75);
            return { width: edge, height: edge };
          },
          aspectRatio: 1.0,
        };

        await scannerInstance.start(
          activeDeviceId,
          config,
          (decodedText) => {
            if (scannedRef.current || isStoppingRef.current) return;
            scannedRef.current = true;
            setScannedFeedback(true);

            // Brief pause to show visual feedback before closing
            setTimeout(async () => {
              try {
                if (scannerRef.current && scannerRef.current.isScanning) {
                  isStoppingRef.current = true;
                  await scannerRef.current.stop();
                  scannerRef.current.clear();
                }
              } catch (e) {
                console.warn('Error stopping scanner:', e);
              } finally {
                isStoppingRef.current = false;
                if (onScanRef.current) onScanRef.current(decodedText);
                if (onCloseRef.current) onCloseRef.current();
              }
            }, 400);
          },
          () => {
            // Frame decode error - ignore
          }
        );

        setScanning(true);

        // Check torch capability
        try {
          const capabilities = scannerInstance.getRunningTrackCapabilities();
          if (capabilities && capabilities.torch) {
            setHasTorch(true);
          }
        } catch {
          setHasTorch(false);
        }
      } catch (err) {
        console.error('Camera initialization error:', err);
        setError(
          err.message ||
            'Could not start camera. Please verify camera permissions.'
        );
      }
    };

    // Slight delay to ensure DOM element is mounted
    const timer = setTimeout(() => {
      initializeCamera();
    }, 150);

    return () => {
      clearTimeout(timer);
      const scanner = scannerRef.current;
      if (scanner && scanner.isScanning) {
        isStoppingRef.current = true;
        scanner
          .stop()
          .then(() => {
            scanner.clear();
          })
          .catch((e) => console.warn('Scanner cleanup error:', e))
          .finally(() => {
            isStoppingRef.current = false;
            scannerRef.current = null;
          });
      }
    };
  }, [isOpen]);

  const handleCameraChange = async (newDeviceId) => {
    setSelectedCameraId(newDeviceId);
    const scanner = scannerRef.current;
    if (!scanner) return;

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      setScanning(false);

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const edge = Math.floor(minEdge * 0.75);
          return { width: edge, height: edge };
        },
        aspectRatio: 1.0,
      };

      await scanner.start(
        newDeviceId,
        config,
        (decodedText) => {
          if (scannedRef.current || isStoppingRef.current) return;
          scannedRef.current = true;
          setScannedFeedback(true);

          setTimeout(async () => {
            try {
              if (scannerRef.current && scannerRef.current.isScanning) {
                isStoppingRef.current = true;
                await scannerRef.current.stop();
                scannerRef.current.clear();
              }
            } catch (e) {
              console.warn('Error stopping scanner:', e);
            } finally {
              isStoppingRef.current = false;
              if (onScanRef.current) onScanRef.current(decodedText);
              if (onCloseRef.current) onCloseRef.current();
            }
          }, 400);
        },
        () => {}
      );
      setScanning(true);
    } catch (err) {
      setError('Failed to switch camera: ' + (err.message || 'Unknown error'));
    }
  };

  const toggleTorch = async () => {
    const scanner = scannerRef.current;
    if (!scanner || !hasTorch) return;
    try {
      await scanner.applyVideoConstraints({
        advanced: [{ torch: !torchOn }],
      });
      setTorchOn(!torchOn);
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Scan Barcode / 2D GS1</h3>
              <p className="text-[11px] text-slate-500">Align barcode or DataMatrix within target</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Container */}
        <div className="relative bg-slate-950 flex items-center justify-center min-h-[320px] overflow-hidden">
          <div id="barcode-camera-viewfinder" className="w-full h-full min-h-[320px]" />

          {/* Reticle Guide Overlay */}
          {!error && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-56 h-56 border-2 border-teal-400/80 rounded-xl shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]">
                {/* Corner markers */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-teal-400 rounded-tl-sm"></div>
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-teal-400 rounded-tr-sm"></div>
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-teal-400 rounded-bl-sm"></div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-teal-400 rounded-br-sm"></div>

                {/* Animated Scan Line */}
                <div className="w-full h-0.5 bg-linear-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_8px_#2dd4bf] animate-bounce absolute top-1/2 -translate-y-1/2"></div>
              </div>
            </div>
          )}

          {/* Success Flash Overlay */}
          {scannedFeedback && (
            <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center backdrop-blur-2xs transition-all">
              <div className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 animate-scale" />
                <span>Barcode Scanned!</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center text-white">
              <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
              <p className="text-sm font-semibold mb-1">Camera Unavailable</p>
              <p className="text-xs text-slate-300 max-w-xs mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
              >
                Close Scanner
              </button>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          {cameras.length > 1 ? (
            <div className="flex items-center gap-1.5 text-slate-600">
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCameraId}
                onChange={(e) => handleCameraChange(e.target.value)}
                className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Camera ${c.id.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="text-slate-500 text-[11px]">
              {scanning ? 'Camera active · scanning for 1D/2D barcodes' : 'Starting camera...'}
            </div>
          )}

          <div className="flex items-center gap-2">
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                  torchOn
                    ? 'bg-amber-100 border-amber-300 text-amber-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                title="Toggle Flashlight"
              >
                <Zap className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
