import { useContext } from "react";
import { ThemeContext } from "./ThemeContext";

export default function ContextExample() {
  const theme = useContext(ThemeContext);

  return (
    <div>
      <h2>useContext Example</h2>
      <p>Theme: {theme}</p>
    </div>
  );
}
