import { useState, useCallback } from "react";

export default function CallbackExample() {
  const [count, setCount] = useState(0);

  const notify = useCallback(() => {
    console.log("Button clicked!");
  }, []);

  return (
    <div>
      <h2>useCallback Example</h2>
      <p>Count: {count}</p>
      <button className="btn" onClick={() => setCount(count + 1)}>
        Increase
      </button>

      <button className="btn" onClick={notify}>
        Call Function
      </button>
    </div>
  );
}
