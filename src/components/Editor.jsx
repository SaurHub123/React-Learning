// import { useEffect, useRef, useState, useMemo } from "react";
// import { Stage, Layer, Image as KonvaImage, Line, Rect } from "react-konva";

// export default function Editor() {
//   //File name
//   const [fileName, setFileName] = useState("");
//   // Page title
//   useEffect(() => {
//     document.title = "Emplitech • Editor";
//   }, []);

//   const stageRef = useRef(null);
//   const [stageSize, setStageSize] = useState({ width: 1024, height: 640 });

//   // Background image
//   const [bgImage, setBgImage] = useState(null); // HTMLImageElement
//   const [bgDims, setBgDims] = useState({ w: 1024, h: 640 });

//   // --- History for Undo/Redo ---
//   // history: Array of "lines" snapshots; each snapshot is an array of line objects
//   const [history, setHistory] = useState([[]]);
//   const [historyIndex, setHistoryIndex] = useState(0);
//   const lines = useMemo(() => history[historyIndex] ?? [], [history, historyIndex]);
//   const canUndo = historyIndex > 0;
//   const canRedo = historyIndex < history.length - 1;

//   // Draft line while dragging
//   const [draft, setDraft] = useState(null);
//   const [drawing, setDrawing] = useState(false);

//   // UI options
//   const [strokeWidth, setStrokeWidth] = useState(2);

//   // make stage follow image size
//   useEffect(() => {
//     setStageSize({ width: bgDims.w, height: bgDims.h });
//   }, [bgDims]);

//   const fitWithin = (w, h, maxW = 1400, maxH = 800) => {
//     const r = Math.min(maxW / w, maxH / h, 1);
//     return { w: Math.round(w * r), h: Math.round(h * r) };
//   };

//   // Centering helper
//   const wrapperStyle = useMemo(
//     () => ({ width: stageSize.width }),
//     [stageSize.width]
//   );

//   const handleUpload = (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const url = URL.createObjectURL(file);
//     const img = new window.Image();
//     img.onload = () => {
//       const fitted = fitWithin(img.width, img.height);
//       setBgImage(img);
//       setBgDims({ w: fitted.w, h: fitted.h });

//       // reflect file in URL query
//       setFileName(file.name);
//       const params = new URLSearchParams(window.location.search);
//       params.set("image", file.name);
//       const newUrl = `${window.location.pathname}?${params.toString()}`;
//       window.history.replaceState({}, "", newUrl);
//     };
//     img.src = url;
//   };

//   const getPointer = () => {
//     const pos = stageRef.current.getPointerPosition();
//     const x = Math.max(0, Math.min(stageSize.width, pos.x));
//     const y = Math.max(0, Math.min(stageSize.height, pos.y));
//     return { x, y };
//   };

//   // ---- Drawing handlers ----
//   const onPointerDown = (e) => {
//     // left click or touch
//     if (e.evt.button !== undefined && e.evt.button !== 0) return;
//     const { x, y } = getPointer();
//     setDrawing(true);
//     setDraft([x, y, x, y]); // start == end initially
//   };

//   const onPointerMove = () => {
//     if (!drawing || !draft) return;
//     const { x, y } = getPointer();
//     setDraft((d) => [d[0], d[1], x, y]); // update end only
//   };

//   const onPointerUp = () => {
//     if (!drawing || !draft) return;
//     // finalize a new line
//     const newLine = { points: draft, strokeWidth };
//     const nextSnapshot = [...lines, newLine];

//     // push snapshot to history (truncate redo branch first)
//     setHistory((prev) => [...prev.slice(0, historyIndex + 1), nextSnapshot]);
//     setHistoryIndex((i) => i + 1);

//     setDraft(null);
//     setDrawing(false);
//   };

//   // ---- Edit actions ----
//   const clearLines = () => {
//     // add an empty snapshot (also clears redo branch)
//     if (lines.length === 0) return;
//     setHistory((prev) => [...prev.slice(0, historyIndex + 1), []]);
//     setHistoryIndex((i) => i + 1);
//   };

//   const undo = () => {
//     if (!canUndo) return;
//     setHistoryIndex((i) => i - 1);
//   };

//   const redo = () => {
//     if (!canRedo) return;
//     setHistoryIndex((i) => i + 1);
//   };

//   const downloadPNG = () => {
//     if (!stageRef.current) return;
//     const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
//     const link = document.createElement("a");
//     const baseName = fileName.replace(/\.[^/.]+$/, "");
//     link.download = `${baseName}-annotation.png`;
//     link.href = uri;
//     console.log(link.download)
//     document.body.appendChild(link);
//     link.click();
//     link.remove();
//   };

//   // Subtle checkerboard when no image (nice “interactive” feel)
//   const Checkerboard = () => (
//     <Rect
//       x={0}
//       y={0}
//       width={stageSize.width}
//       height={stageSize.height}
//       fillPatternImage={makeChecker()}
//       listening={false}
//     />
//   );

//   function makeChecker() {
//     const size = 40;
//     const c = document.createElement("canvas");
//     c.width = size;
//     c.height = size;
//     const ctx = c.getContext("2d");
//     ctx.fillStyle = "#f3f4f6"; // gray-100
//     ctx.fillRect(0, 0, size, size);
//     ctx.fillStyle = "#e5e7eb"; // gray-200
//     ctx.fillRect(0, 0, size / 2, size / 2);
//     ctx.fillRect(size / 2, size / 2, size / 2, size / 2);
//     const img = new Image();
//     img.src = c.toDataURL();
//     return img;
//   }

//   return (
//     <div className="min-h-screen bg-white">
//       {/* Top bar */}
//       <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
//         <div className="mx-auto max-w-[1400px] px-6 py-4 flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <a href="/" className="text-xl font-semibold text-slate-900">Emplitech</a>
//             <span className="text-slate-400">/</span>
//             <span className="text-slate-600">Editor</span>
//           </div>

//           <div className="flex items-center gap-3">
//             <label className="px-3 py-2 rounded-lg border bg-slate-50 hover:bg-slate-100 cursor-pointer">
//               <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
//               Upload Image
//             </label>

//             <div className="flex items-center gap-2">
//               <span className="text-sm text-slate-600">Line width</span>
//               <select
//                 className="border rounded-lg px-2 py-1 bg-white"
//                 value={strokeWidth}
//                 onChange={(e) => setStrokeWidth(Number(e.target.value))}
//               >
//                 <option value={2}>2</option>
//                 <option value={3}>3</option>
//                 <option value={4}>4</option>
//                 <option value={6}>6</option>
//               </select>
//             </div>

//             <button
//               onClick={clearLines}
//               className="px-3 py-2 rounded-lg border bg-white hover:bg-slate-50"
//               title="Remove all lines"
//               disabled={lines.length === 0}
//             >
//               Clear
//             </button>

//             <button
//               onClick={undo}
//               className={`px-3 py-2 rounded-lg border ${canUndo ? "bg-white hover:bg-slate-50" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
//               title="Undo"
//               disabled={!canUndo}
//             >
//               Undo
//             </button>

//             <button
//               onClick={redo}
//               className={`px-3 py-2 rounded-lg border ${canRedo ? "bg-white hover:bg-slate-50" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
//               title="Redo"
//               disabled={!canRedo}
//             >
//               Redo
//             </button>

//             <button
//               onClick={downloadPNG}
//               className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow"
//               title="Download image with lines"
//             >
//               Download PNG
//             </button>
//           </div>
//         </div>
//       </header>

//       {/* Main canvas area — centered for desktop */}
//       <main className="mx-auto max-w-[1400px] px-6 py-8">
//         <div className="w-full flex justify-center">
//           <div
//             className={`border rounded-xl shadow-lg overflow-auto bg-white ${drawing ? "cursor-crosshair" : "cursor-default"}`}
//             style={wrapperStyle}
//           >
//             <Stage
//               ref={stageRef}
//               width={stageSize.width}
//               height={stageSize.height}
//               onMouseDown={onPointerDown}
//               onMouseMove={onPointerMove}
//               onMouseUp={onPointerUp}
//               onTouchStart={onPointerDown}
//               onTouchMove={onPointerMove}
//               onTouchEnd={onPointerUp}
//             >
//               <Layer listening={false}>
//                 {!bgImage && <Checkerboard />}
//                 {bgImage && (
//                   <KonvaImage
//                     image={bgImage}
//                     width={bgDims.w}
//                     height={bgDims.h}
//                   />
//                 )}
//               </Layer>

//               <Layer listening={false}>
//                 {/* Final lines from current history snapshot */}
//                 {lines.map((l, i) => (
//                   <Line
//                     key={i}
//                     points={l.points}
//                     stroke="#0f172a"
//                     strokeWidth={l.strokeWidth}
//                     lineCap="round"
//                   />
//                 ))}

//                 {/* Draft preview */}
//                 {draft && (
//                   <Line
//                     points={draft}
//                     stroke="#0f172a"
//                     strokeWidth={strokeWidth}
//                     lineCap="round"
//                     dash={[8, 6]}
//                   />
//                 )}
//               </Layer>
//             </Stage>
//           </div>
//         </div>

//         <p className="mt-4 text-center text-sm text-slate-500">
//           Click, drag, release to draw straight lines. Use Undo/Redo to step through edits. Image stays centered on desktop.
//         </p>
//       </main>
//     </div>
//   );
// }




import { useEffect, useRef, useState, useMemo } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Rect } from "react-konva";

export default function Editor() {
  //File name
  const [fileName, setFileName] = useState("");
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
      setFileName(file.name);
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

  // ---- Helpers for exporting annotations ----
  const baseName = useMemo(() => fileName.replace(/\.[^/.]+$/, "") || "image", [fileName]);

  const lineToBBox = (pts) => {
    // pts: [x1, y1, x2, y2]
    const xMin = Math.min(pts[0], pts[2]);
    const yMin = Math.min(pts[1], pts[3]);
    const xMax = Math.max(pts[0], pts[2]);
    const yMax = Math.max(pts[1], pts[3]);
    const w = xMax - xMin;
    const h = yMax - yMin;
    return [xMin, yMin, w, h];
  };

  const downloadBlob = (filename, content, mime = "application/octet-stream") => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const saveCOCO = () => {
    // Minimal COCO-style export where each line is an annotation with bbox + segmentation
    const width = bgDims.w;
    const height = bgDims.h;

    const coco = {
      info: { description: "Emplitech line annotations", version: "1.0" },
      images: [
        {
          id: 1,
          file_name: fileName || "image",
          width,
          height,
        },
      ],
      categories: [
        { id: 1, name: "line", supercategory: "annotation" },
      ],
      annotations: [],
    };

    lines.forEach((l, idx) => {
      const bbox = lineToBBox(l.points);
      const area = bbox[2] * bbox[3];
      coco.annotations.push({
        id: idx + 1,
        image_id: 1,
        category_id: 1,
        bbox,
        segmentation: [l.points], // [x1,y1,x2,y2]
        iscrowd: 0,
        area,
      });
    });

    downloadBlob(`${baseName}-annotations-coco.json`, JSON.stringify(coco, null, 2), "application/json");
  };

  const saveYOLO = () => {
    // YOLO bbox format: "class x_center y_center w h" (normalized 0-1)
    // We map each line to its tight bbox and use class 0 (line)
    const W = bgDims.w;
    const H = bgDims.h;

    const linesTxt = lines
      .map((l) => {
        const [x, y, w, h] = lineToBBox(l.points);
        const xc = (x + w / 2) / W;
        const yc = (y + h / 2) / H;
        const wn = w / W;
        const hn = h / H;
        // keep a reasonable precision
        const toFixed = (n) => Number.isFinite(n) ? n.toFixed(6) : "0";
        return `0 ${toFixed(xc)} ${toFixed(yc)} ${toFixed(wn)} ${toFixed(hn)}`;
      })
      .join("\n");

    downloadBlob(`${baseName}.txt`, linesTxt, "text/plain");
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

            {/* New: Save annotations buttons (replaces Download PNG) */}
            <button
              onClick={saveCOCO}
              className={`px-4 py-2 rounded-lg ${lines.length ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
              title="Save annotations in COCO JSON"
              disabled={lines.length === 0}
            >
              Save COCO
            </button>

            <button
              onClick={saveYOLO}
              className={`px-4 py-2 rounded-lg ${lines.length ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
              title="Save annotations in YOLO TXT (bbox)"
              disabled={lines.length === 0}
            >
              Save YOLO
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