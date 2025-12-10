import { useRef } from "react";

export default function RefExample() {
  const inputRef = useRef();

  function focusInput() {
    inputRef.current.focus();
  }

  return (
    <div>
      <h2>useRef Example</h2>
      <input ref={inputRef} type="text" className="border p-2" />
      <button className="btn" onClick={focusInput}>Focus Input</button>
    </div>
  );
}
