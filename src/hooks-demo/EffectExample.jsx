import { useState, useEffect } from "react";

export default function EffectExample() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log("Count updated:", count);
  }, [count]);

  return (
    <div>
      <h2>useEffect Example</h2>
      <p>Count: {count}</p>
      <button className="btn" onClick={() => setCount(count + 1)}>
        Click Me
      </button>
    </div>
  );
}
