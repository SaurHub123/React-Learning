import { useMemo, useState } from "react";

function heavyCalculation(num) {
  console.log("Calculating...");
  for (let i = 0; i < 1e7; i++) {}
  return num * 2;
}

export default function MemoExample() {
  const [number, setNumber] = useState(1);

  const double = useMemo(() => heavyCalculation(number), [number]);

  return (
    <div>
      <h2>useMemo Example</h2>
      <input
        type="number"
        value={number}
        onChange={(e) => setNumber(Number(e.target.value))}
        className="border p-2"
      />
      <p>Result: {double}</p>
    </div>
  );
}
