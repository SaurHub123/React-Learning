import { useState } from "react";

export default function StateExample() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h2>useState Example</h2>
      <p>Count: {count}</p>
      <button className="btn" onClick={() => setCount(count + 1)}>
        Increase
      </button>
    </div>
  );
}
