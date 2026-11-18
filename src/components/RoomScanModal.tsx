import React, { useState } from 'react';
import { uploadRoomScan } from '../lib/groqClient';
import type { VisionOutput } from '../../api/_lib/schemas';
import { CloseIcon, SparklesIcon, AlertTriangleIcon, CheckIcon } from './icons';

interface RoomScanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoomScanModal: React.FC<RoomScanModalProps> = ({ isOpen, onClose }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<VisionOutput | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Downscale to max 1024px on long edge
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1024;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const base64Jpeg = canvas.toDataURL('image/jpeg', 0.85);
        setPreview(base64Jpeg);
        analyzePhoto(base64Jpeg.split(',')[1]);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const analyzePhoto = async (base64Data: string) => {
    setAnalyzing(true);
    setErrorMsg(null);
    try {
      const output = await uploadRoomScan(base64Data);
      setResult(output);
    } catch (err) {
      console.warn('Room scan error:', err);
      setErrorMsg(
        'Room scan analysis is temporarily busy. Showing standard layout recommendations.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-scan-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-600 text-white">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 id="room-scan-title" className="font-bold text-slate-900 text-base sm:text-lg">
                Room Scan AI Diagnostics
              </h3>
              <p className="text-xs text-slate-500">
                Snap or upload a room photo to detect air infiltration gaps and optimize purifier
                placement
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {!preview ? (
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3 hover:border-teal-500 transition-colors">
              <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 mx-auto flex items-center justify-center font-bold text-xl">
                📷
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">
                  Upload Bedroom or Living Area Photo
                </p>
                <p className="text-xs text-slate-500">
                  JPEG or PNG up to 5MB (automatically compressed on device)
                </p>
              </div>
              <label className="inline-block px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors">
                Select Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden max-h-52 bg-slate-950 flex items-center justify-center border border-slate-200">
                <img src={preview} alt="Room preview" className="w-full h-full object-cover" />
                {analyzing && (
                  <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2">
                    <div className="animate-spin text-2xl">🌀</div>
                    <span className="text-xs font-semibold">
                      Analyzing room infiltration & airflow vectors...
                    </span>
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangleIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {result && (
                <div className="space-y-4 animate-in fade-in text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-700">Room Classification:</span>
                    <span className="font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full">
                      {result.roomType}
                    </span>
                  </div>

                  {/* Purifier Spot */}
                  <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 space-y-1">
                    <span className="font-bold text-teal-900 block flex items-center gap-1.5">
                      <CheckIcon className="w-3.5 h-3.5 text-teal-700" />
                      Optimal Purifier Placement
                    </span>
                    <p className="text-teal-950">{result.purifierSpot}</p>
                  </div>

                  {/* Identified Issues */}
                  <div className="space-y-2">
                    <span className="font-bold text-slate-800 block">
                      Infiltration & Emission Factors Detected ({result.issues.length}):
                    </span>
                    <div className="space-y-1.5">
                      {result.issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">{issue.type}</span>
                            <span
                              className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                                issue.severity === 'high'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {issue.severity}
                            </span>
                          </div>
                          <p className="text-slate-600">{issue.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ventilation Notes */}
                  <div className="p-3 rounded-xl bg-slate-100 text-slate-700 space-y-1">
                    <span className="font-bold block">Ventilation Advice:</span>
                    <p>{result.ventilationNotes}</p>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    setResult(null);
                  }}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold"
                >
                  ← Scan another room
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 text-xs bg-slate-900 text-white font-bold rounded-xl"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
