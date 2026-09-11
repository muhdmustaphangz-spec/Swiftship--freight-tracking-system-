import { useRef, useEffect, useState } from 'react';
import SignaturePad from 'signature_pad';

export default function SignatureCapture({ onCapture, onCancel }) {
  const canvasRef = useRef(null);
  const padRef = useRef(null);
  const [empty, setEmpty] = useState(true);
  const [canUndo, setCanUndo] = useState(false);
  const strokesRef = useRef([]); // history of completed strokes, for undo

  useEffect(() => {
    const canvas = canvasRef.current;
    const resize = () => {
      const data = padRef.current?.toData(); // preserve strokes across resize (e.g. orientation change)
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext('2d').scale(ratio, ratio);
      padRef.current?.clear();
      if (data && data.length > 0) padRef.current.fromData(data);
    };
    padRef.current = new SignaturePad(canvas, { penColor: '#0f1720', minWidth: 1, maxWidth: 2.5 });
    padRef.current.addEventListener('endStroke', () => {
      strokesRef.current = padRef.current.toData();
      setEmpty(padRef.current.isEmpty());
      setCanUndo(strokesRef.current.length > 0);
    });
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const clear = () => {
    padRef.current.clear();
    strokesRef.current = [];
    setEmpty(true);
    setCanUndo(false);
  };

  const undo = () => {
    const data = padRef.current.toData();
    if (!data || data.length === 0) return;
    data.pop(); // drop the most recent stroke only
    padRef.current.fromData(data);
    strokesRef.current = data;
    setEmpty(data.length === 0);
    setCanUndo(data.length > 0);
  };

  const save = () => {
    if (padRef.current.isEmpty()) return;
    const dataUrl = padRef.current.toDataURL('image/png');
    onCapture(dataUrl);
  };

  return (
    <div>
      <div className="border-2 border-dashed border-ink-300 rounded-md bg-ink-50 mb-3">
        <canvas ref={canvasRef} className="w-full h-48 sm:h-40 touch-none cursor-crosshair" />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button" onClick={save} disabled={empty}
          className="bg-signal-green hover:opacity-90 text-white text-sm font-medium rounded-md px-4 py-2 transition-opacity duration-200 ease-standard disabled:opacity-40"
        >
          Save signature
        </button>
        <button
          type="button" onClick={undo} disabled={!canUndo}
          className="text-sm border border-ink-200 rounded-md px-4 py-2 hover:border-ink-300 disabled:opacity-40 disabled:hover:border-ink-200"
        >
          Undo
        </button>
        <button type="button" onClick={clear} disabled={empty} className="text-sm border border-ink-200 rounded-md px-4 py-2 hover:border-ink-300 disabled:opacity-40 disabled:hover:border-ink-200">
          Clear
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-sm text-ink-500 px-4 py-2 hover:text-ink-800">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
