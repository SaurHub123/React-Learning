import { useEffect, useRef, useState, useMemo } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Rect } from "react-konva";

export default function Editor() {
  // Page title
  useEffect(() => {
    document.title = "Emplitech • Editor";
  }, []);

  const stageRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 1024, height: 640 });

  // Background image
  const [bgImage, setBgImage] = useState(null); // HTMLImageElement
  const [bgDims, setBgDims] = useState({ w: 1024, h: 640 });

  // --- History for Undo/Redo ---
  // history: Array of "lines" snapshots; each snapshot is an array of line objects
  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const lines = useMemo(() => history[historyIndex] ?? [], [history, historyIndex]);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Draft line while dragging
  const [draft, setDraft] = useState(null);
  const [drawing, setDrawing] = useState(false);

  // UI options
  const [strokeWidth, setStrokeWidth] = useState(2);

  // make stage follow image size
  useEffect(() => {
    setStageSize({ width: bgDims.w, height: bgDims.h });
  }, [bgDims]);

  const fitWithin = (w, h, maxW = 1400, maxH = 800) => {
    const r = Math.min(maxW / w, maxH / h, 1);
    return { w: Math.round(w * r), h: Math.round(h * r) };
  };

  // Centering helper
  const wrapperStyle = useMemo(
    () => ({ width: stageSize.width }),
    [stageSize.width]
  );

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const fitted = fitWithin(img.width, img.height);
      setBgImage(img);
      setBgDims({ w: fitted.w, h: fitted.h });

      // reflect file in URL query
      const params = new URLSearchParams(window.location.search);
      params.set("image", file.name);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, "", newUrl);
    };
    img.src = url;
  };

  const getPointer = () => {
    const pos = stageRef.current.getPointerPosition();
    const x = Math.max(0, Math.min(stageSize.width, pos.x));
    const y = Math.max(0, Math.min(stageSize.height, pos.y));
    return { x, y };
  };

  // ---- Drawing handlers ----
  const onPointerDown = (e) => {
    // left click or touch
    if (e.evt.button !== undefined && e.evt.button !== 0) return;
    const { x, y } = getPointer();
    setDrawing(true);
    setDraft([x, y, x, y]); // start == end initially
  };

  const onPointerMove = () => {
    if (!drawing || !draft) return;
    const { x, y } = getPointer();
    setDraft((d) => [d[0], d[1], x, y]); // update end only
  };

  const onPointerUp = () => {
    if (!drawing || !draft) return;
    // finalize a new line
    const newLine = { points: draft, strokeWidth };
    const nextSnapshot = [...lines, newLine];

    // push snapshot to history (truncate redo branch first)
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), nextSnapshot]);
    setHistoryIndex((i) => i + 1);

    setDraft(null);
    setDrawing(false);
  };

  // ---- Edit actions ----
  const clearLines = () => {
    // add an empty snapshot (also clears redo branch)
    if (lines.length === 0) return;
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), []]);
    setHistoryIndex((i) => i + 1);
  };

  const undo = () => {
    if (!canUndo) return;
    setHistoryIndex((i) => i - 1);
  };

  const redo = () => {
    if (!canRedo) return;
    setHistoryIndex((i) => i + 1);
  };

  const downloadPNG = () => {
    if (!stageRef.current) return;
    const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = "emplitech-annotation.png";
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Subtle checkerboard when no image (nice “interactive” feel)
  const Checkerboard = () => (
    <Rect
      x={0}
      y={0}
      width={stageSize.width}
      height={stageSize.height}
      fillPatternImage={makeChecker()}
      listening={false}
    />
  );

  function makeChecker() {
    const size = 40;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#f3f4f6"; // gray-100
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#e5e7eb"; // gray-200
    ctx.fillRect(0, 0, size / 2, size / 2);
    ctx.fillRect(size / 2, size / 2, size / 2, size / 2);
    const img = new Image();
    img.src = c.toDataURL();
    return img;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-[1400px] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-xl font-semibold text-slate-900">Emplitech</a>
            <span className="text-slate-400">/</span>
            <span className="text-slate-600">Editor</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="px-3 py-2 rounded-lg border bg-slate-50 hover:bg-slate-100 cursor-pointer">
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              Upload Image
            </label>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Line width</span>
              <select
                className="border rounded-lg px-2 py-1 bg-white"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
              >
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={6}>6</option>
              </select>
            </div>

            <button
              onClick={clearLines}
              className="px-3 py-2 rounded-lg border bg-white hover:bg-slate-50"
              title="Remove all lines"
              disabled={lines.length === 0}
            >
              Clear
            </button>

            <button
              onClick={undo}
              className={`px-3 py-2 rounded-lg border ${canUndo ? "bg-white hover:bg-slate-50" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
              title="Undo"
              disabled={!canUndo}
            >
              Undo
            </button>

            <button
              onClick={redo}
              className={`px-3 py-2 rounded-lg border ${canRedo ? "bg-white hover:bg-slate-50" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
              title="Redo"
              disabled={!canRedo}
            >
              Redo
            </button>

            <button
              onClick={downloadPNG}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow"
              title="Download image with lines"
            >
              Download PNG
            </button>
          </div>
        </div>
      </header>

      {/* Main canvas area — centered for desktop */}
      <main className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="w-full flex justify-center">
          <div
            className={`border rounded-xl shadow-lg overflow-auto bg-white ${drawing ? "cursor-crosshair" : "cursor-default"}`}
            style={wrapperStyle}
          >
            <Stage
              ref={stageRef}
              width={stageSize.width}
              height={stageSize.height}
              onMouseDown={onPointerDown}
              onMouseMove={onPointerMove}
              onMouseUp={onPointerUp}
              onTouchStart={onPointerDown}
              onTouchMove={onPointerMove}
              onTouchEnd={onPointerUp}
            >
              <Layer listening={false}>
                {!bgImage && <Checkerboard />}
                {bgImage && (
                  <KonvaImage
                    image={bgImage}
                    width={bgDims.w}
                    height={bgDims.h}
                  />
                )}
              </Layer>

              <Layer listening={false}>
                {/* Final lines from current history snapshot */}
                {lines.map((l, i) => (
                  <Line
                    key={i}
                    points={l.points}
                    stroke="#0f172a"
                    strokeWidth={l.strokeWidth}
                    lineCap="round"
                  />
                ))}

                {/* Draft preview */}
                {draft && (
                  <Line
                    points={draft}
                    stroke="#0f172a"
                    strokeWidth={strokeWidth}
                    lineCap="round"
                    dash={[8, 6]}
                  />
                )}
              </Layer>
            </Stage>
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          Click, drag, release to draw straight lines. Use Undo/Redo to step through edits. Image stays centered on desktop.
        </p>
      </main>
    </div>
  );
}




// import { useEffect, useRef, useState } from "react";

// export default function Editor() {
//   // Set page title on this route
//   useEffect(() => {
//     document.title = "Emplitech • Editor";
//   }, []);

//   const canvasRef = useRef(null);
//   const containerRef = useRef(null);
//   const imgRef = useRef(null);

//   // Lines as [{x1,y1,x2,y2}]
//   const [lines, setLines] = useState([]);
//   const [isDrawing, setIsDrawing] = useState(false);
//   const [start, setStart] = useState(null);
//   const [current, setCurrent] = useState(null); // preview point while dragging
//   const [bgSize, setBgSize] = useState({ w: 800, h: 500 }); // default size if no image

//   // Handle high-DPI crispness
//   const setupCanvas = () => {
//     const canvas = canvasRef.current;
//     const dpr = window.devicePixelRatio || 1;
//     const width = bgSize.w;
//     const height = bgSize.h;

//     canvas.style.width = `${width}px`;
//     canvas.style.height = `${height}px`;
//     canvas.width = Math.floor(width * dpr);
//     canvas.height = Math.floor(height * dpr);

//     const ctx = canvas.getContext("2d");
//     ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
//   };

//   // Redraw everything
//   const draw = () => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");

//     // Clear
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     // Draw background image (if any)
//     if (imgRef.current) {
//       ctx.drawImage(imgRef.current, 0, 0, bgSize.w, bgSize.h);
//     } else {
//       // fallback background
//       ctx.fillStyle = "#f8fafc";
//       ctx.fillRect(0, 0, bgSize.w, bgSize.h);
//     }

//     // Draw finalized lines
//     ctx.lineWidth = 2;
//     ctx.strokeStyle = "#0f172a";
//     ctx.lineCap = "round";
//     lines.forEach(({ x1, y1, x2, y2 }) => {
//       ctx.beginPath();
//       ctx.moveTo(x1, y1);
//       ctx.lineTo(x2, y2);
//       ctx.stroke();
//     });

//     // Draw preview line
//     if (isDrawing && start && current) {
//       ctx.setLineDash([6, 4]);
//       ctx.beginPath();
//       ctx.moveTo(start.x, start.y);
//       ctx.lineTo(current.x, current.y);
//       ctx.stroke();
//       ctx.setLineDash([]);
//     }
//   };

//   useEffect(() => {
//     setupCanvas();
//     draw();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [bgSize]);

//   useEffect(() => {
//     draw();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [lines, isDrawing, start, current]);

//   // Convert pointer coords to canvas coords
//   const getPos = (e) => {
//     const rect = canvasRef.current.getBoundingClientRect();
//     return {
//       x: e.clientX - rect.left,
//       y: e.clientY - rect.top,
//     };
//   };

//   const handlePointerDown = (e) => {
//     const pos = getPos(e);
//     setStart(pos);
//     setCurrent(pos);
//     setIsDrawing(true);
//   };

//   const handlePointerMove = (e) => {
//     if (!isDrawing) return;
//     setCurrent(getPos(e));
//   };

//   const handlePointerUp = () => {
//     if (isDrawing && start && current) {
//       setLines((prev) => [...prev, { x1: start.x, y1: start.y, x2: current.x, y2: current.y }]);
//     }
//     setIsDrawing(false);
//     setStart(null);
//     setCurrent(null);
//   };

//   const handleUpload = (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const url = URL.createObjectURL(file);
//     const img = new Image();
//     img.onload = () => {
//       imgRef.current = img;

//       // Fit image within a max frame, preserving aspect ratio
//       const MAX_W = 1000;
//       const MAX_H = 700;
//       let w = img.width;
//       let h = img.height;
//       const ratio = Math.min(MAX_W / w, MAX_H / h, 1);
//       w = Math.round(w * ratio);
//       h = Math.round(h * ratio);

//       setBgSize({ w, h });
//       setupCanvas();
//       draw();
//       // update URL to indicate an image is loaded (optional)
//       const params = new URLSearchParams(window.location.search);
//       params.set("image", file.name);
//       const newUrl = `${window.location.pathname}?${params.toString()}`;
//       window.history.replaceState({}, "", newUrl);
//     };
//     img.src = url;
//   };

//   const clearLines = () => setLines([]);

//   return (
//     <div ref={containerRef} className="min-h-screen p-4 flex flex-col gap-4">
//       <header className="flex items-center justify-between">
//         <h2 className="text-2xl font-semibold">Canvas Editor</h2>
//         <a href="/" className="text-blue-600 hover:underline">Back to Home</a>
//       </header>

//       <div className="flex items-center gap-3">
//         <label className="px-3 py-2 bg-gray-100 rounded border cursor-pointer hover:bg-gray-200">
//           <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
//           Upload Image
//         </label>
//         <button
//           onClick={clearLines}
//           className="px-3 py-2 rounded bg-rose-600 text-white hover:bg-rose-700"
//         >
//           Clear Lines
//         </button>
//         <span className="text-gray-500">Tip: Click, drag, release to draw a straight line.</span>
//       </div>

//       <div
//         className="border rounded shadow overflow-hidden max-w-full"
//         style={{ width: bgSize.w }}
//       >
//         <canvas
//           ref={canvasRef}
//           className="touch-none select-none block"
//           onPointerDown={handlePointerDown}
//           onPointerMove={handlePointerMove}
//           onPointerUp={handlePointerUp}
//           onPointerLeave={handlePointerUp}
//         />
//       </div>
//     </div>
//   );
// }
