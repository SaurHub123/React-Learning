import React, { useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Rect, Text as KonvaText } from "react-konva";

// Same fitting caps used by Editor for uploaded images
const MAX_W = 1400;
const MAX_H = 800;
function fitWithin(w, h, maxW = MAX_W, maxH = MAX_H) {
  const r = Math.min(maxW / w, maxH / h, 1);
  return { w: Math.round(w * r), h: Math.round(h * r) };
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

const palette = [
  "#2563eb", "#16a34a", "#ef4444", "#f59e0b", "#8b5cf6",
  "#06b6d4", "#dc2626", "#10b981", "#eab308", "#f97316",
];

export default function AnnotationViewer() {
  useEffect(() => {
    document.title = "Emplitech • Annotation Viewer";
  }, []);

  const stageRef = useRef(null);
  const [bgImage, setBgImage] = useState(null);             // HTMLImageElement
  const [imageFileName, setImageFileName] = useState("");   // uploaded image's filename (for COCO comparison)
  const [stageSize, setStageSize] = useState({ w: 1024, h: 640 }); // canvas size

  // Drawables
  const [lines, setLines] = useState([]); // {points,color,strokeWidth,label}
  const [rects, setRects] = useState([]); // {x,y,w,h,color,label}
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [categoryMap, setCategoryMap] = useState({}); // COCO id -> name
  const [showBoxes, setShowBoxes] = useState(true); 


  const wrapperStyle = useMemo(() => ({ width: stageSize.w }), [stageSize.w]);

  // === Upload Image (use same fitWithin as Editor) ===
  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = await loadImage(url);
    setBgImage(img);
    setImageFileName(file.name);

    const fitted = fitWithin(img.width, img.height);
    setStageSize({ w: fitted.w, h: fitted.h });

    // Clear drawings when image changes
    setLines([]);
    setRects([]);
  };

  // === Parse COCO ===
  const parseCOCO = (coco) => {
    const newLines = [];
    const newRects = [];

    // Categories map
    const cmap = {};
    if (Array.isArray(coco.categories)) {
      coco.categories.forEach((c) => {
        cmap[c.id] = c.name ?? `class_${c.id}`;
      });
    }

    // Adopt EXACT canvas size from COCO (no fitting)
    if (Array.isArray(coco.images) && coco.images[0]) {
      const im = coco.images[0];
      if (Number.isFinite(im.width) && Number.isFinite(im.height)) {
        setStageSize({ w: im.width, h: im.height });
      }
    }

    const anns = Array.isArray(coco.annotations) ? coco.annotations : [];
    anns.forEach((a) => {
      const cat = a.category_id ?? 0;
      const color = palette[Math.abs(cat) % palette.length];
      const label = cmap[cat] ?? `class_${cat}`;

      // segmentation: [[x1,y1,x2,y2,...], ...]
      if (Array.isArray(a.segmentation) && a.segmentation.length > 0) {
        const seg = a.segmentation[0];
        if (Array.isArray(seg) && seg.length >= 4) {
          newLines.push({ points: seg, color, strokeWidth, label });
        }
      }

      // bbox: [x,y,w,h]
      if (Array.isArray(a.bbox) && a.bbox.length === 4) {
        const [x, y, w, h] = a.bbox;
        newRects.push({ x, y, w, h, color, label });
      }
    });

    setCategoryMap(cmap);
    setLines(newLines);
    setRects(newRects);
  };

  const handleUploadCOCO = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const coco = JSON.parse(text);

      // Compare uploaded image filename (if available) with COCO's file_name
      const cocoImage = Array.isArray(coco.images) && coco.images[0] ? coco.images[0] : null;
      const cocoFileName = cocoImage?.file_name || "";

      if (imageFileName) {
        if (cocoFileName) {
          if (cocoFileName === imageFileName) {
            alert(`✔ File name matches: ${imageFileName}`);
          } else {
            alert(`⚠ File name mismatch.\nUploaded: ${imageFileName}\nCOCO:    ${cocoFileName}`);
          }
        } else {
          alert("⚠ COCO JSON has no images[0].file_name to compare.");
        }
      } else if (cocoFileName) {
        alert(`ℹ COCO expects image: ${cocoFileName}. You haven't uploaded an image yet.`);
      }

      parseCOCO(coco);
    } catch (err) {
      alert("Invalid COCO JSON.");
      console.error(err);
    } finally {
      e.target.value = "";
    }
  };

  

  // === Parse YOLO (normalized to current fitted stage size) ===
  // Supports:
  //  1) bbox: class xc yc w h
  //  2) polyline: class x1 y1 x2 y2 ... (pairs)
  const parseYOLO = (txt, W, H) => {
    const newLines = [];
    const newRects = [];

    const rows = txt.split(/\r?\n/).map((r) => r.trim()).filter(Boolean);
    rows.forEach((row) => {
      const parts = row.split(/\s+/);
      if (parts.length < 5) return; // need class + 4 nums at least
      const cls = Number(parts[0]);
      const nums = parts.slice(1).map(Number);
      const color = palette[Math.abs(cls) % palette.length];
      const label = `class_${cls}`;

      if (nums.length === 4) {
        // bbox xc yc w h (normalized)
        const [xc, yc, w, h] = nums;
        const pxW = w * W;
        const pxH = h * H;
        const x = xc * W - pxW / 2;
        const y = yc * H - pxH / 2;
        newRects.push({ x, y, w: pxW, h: pxH, color, label });
      } else if (nums.length % 2 === 0) {
        // polyline
        const pts = [];
        for (let i = 0; i < nums.length; i += 2) {
          pts.push(nums[i] * W, nums[i + 1] * H);
        }
        newLines.push({ points: pts, color, strokeWidth, label });
      }
    });

    setLines(newLines);
    setRects(newRects);
  };

  const handleUploadYOLO = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      parseYOLO(text, stageSize.w, stageSize.h);
    } catch (err) {
      alert("Invalid YOLO TXT.");
      console.error(err);
    } finally {
      e.target.value = "";
    }
  };

  const clearAll = () => {
    setLines([]);
    setRects([]);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-[1400px] px-6 py-4 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-semibold">Emplitech</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-600">Annotation Viewer</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <label className="px-3 py-2 rounded-lg border bg-slate-50 hover:bg-slate-100 cursor-pointer">
              <input type="file" accept="image/*" onChange={handleUploadImage} className="hidden" />
              Upload Image
            </label>

            <label className="px-3 py-2 rounded-lg border bg-slate-50 hover:bg-slate-100 cursor-pointer">
              <input type="file" accept="application/json" onChange={handleUploadCOCO} className="hidden" />
              Upload COCO JSON
            </label>

            <label className="px-3 py-2 rounded-lg border bg-slate-50 hover:bg-slate-100 cursor-pointer">
              <input type="file" accept=".txt,text/plain" onChange={handleUploadYOLO} className="hidden" />
              Upload YOLO TXT
            </label>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-white">
              <span className="text-sm">Stroke</span>
              <select
                className="border rounded px-2 py-1 bg-white"
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
                onClick={() => setShowBoxes((v) => !v)} className="px-3 py-2 rounded-lg border bg-white hover:bg-slate-50">
                {showBoxes ? "Hide Boxes" : "Show Boxes"}
            </button>


            <button onClick={clearAll} className="px-3 py-2 rounded-lg border bg-white hover:bg-slate-50">
              Clear
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="w-full flex justify-center">
          <div className="border rounded-xl shadow-lg overflow-auto bg-white" style={wrapperStyle}>
            <Stage ref={stageRef} width={stageSize.w} height={stageSize.h}>
              {/* Background image (drawn to the fitted/exact stage size) */}
              <Layer listening={false}>
                {bgImage ? (
                  <KonvaImage image={bgImage} width={stageSize.w} height={stageSize.h} />
                ) : (
                  <Rect x={0} y={0} width={stageSize.w} height={stageSize.h} fill="#f8fafc" />
                )}
              </Layer>

              {/* BBoxes */}
              {/* <Layer listening={false}>
                {rects.map((r, i) => (
                  <React.Fragment key={`rect-${i}`}>
                    <Rect x={r.x} y={r.y} width={r.w} height={r.h} stroke={r.color} strokeWidth={2} />
                    <KonvaText x={r.x + 4} y={r.y + 4} text={r.label ?? "bbox"} fontSize={12} fill={r.color} />
                  </React.Fragment>
                ))}
              </Layer> */}

              {showBoxes && (
  <Layer listening={false}>
    {rects.map((r, i) => (
      <React.Fragment key={`rect-${i}`}>
        <Rect x={r.x} y={r.y} width={r.w} height={r.h} stroke={r.color} strokeWidth={2} />
        <KonvaText x={r.x + 4} y={r.y + 4} text={r.label ?? "bbox"} fontSize={12} fill={r.color} />
      </React.Fragment>
    ))}
  </Layer>
)}


              {/* Segmentation lines/polylines */}
              <Layer listening={false}>
                {lines.map((l, i) => (
                  <Line
                    key={`line-${i}`}
                    points={l.points}
                    stroke={l.color}
                    strokeWidth={l.strokeWidth ?? strokeWidth}
                    lineCap="round"
                    lineJoin="round"
                  />
                ))}
              </Layer>
            </Stage>
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-slate-600">
          <p>
            Upload an image (optional), then upload COCO/YOLO. COCO sets the canvas to its
            exact width×height and checks filename parity with your uploaded image.
          </p>
        </div>
      </main>
    </div>
  );
}
