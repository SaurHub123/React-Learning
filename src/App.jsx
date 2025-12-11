import { Routes, Route, Link } from "react-router-dom";
import { useEffect } from "react";
import Editor from "./components/Editor";
import AnnotationViewer from "./components/Viewer";

function Home() {
  useEffect(() => {
    document.title = "Emplitech • Home";
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-bold">Emplitech</h1>
      <p className="text-gray-600">Upload an image and draw straight lines on it.</p>
      <Link
        to="/editor"
        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
      >
        Open Editor
      </Link>
      <Link
        to="/viewer"
        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
      >
        Open Viewer
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/editor" element={<Editor />} />
      <Route path="/viewer" element={<AnnotationViewer />} />
    </Routes>
  );
}
