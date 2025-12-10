import { useReducer } from "react";

function reducer(state, action) {
  switch (action.type) {
    case "increment":
      return { count: state.count + 1 };
    case "decrement":
      return { count: state.count - 1 };
    default:
      return state;
  }
}

export default function ReducerExample() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });

  return (
    <div>
      <h2>useReducer Example</h2>
      <p>Count: {state.count}</p>

      <button className="btn" onClick={() => dispatch({ type: "increment" })}>
        +
      </button>
      <button className="btn" onClick={() => dispatch({ type: "decrement" })}>
        -
      </button>
    </div>
  );
}
