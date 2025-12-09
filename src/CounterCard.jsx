function CounterCard({ count, cond, increaser }) {
  return (
    <div className="w-64 rounded-xl bg-cyan-600 p-6 shadow-xl">
      <h1 className="text-3xl font-bold">{count}</h1>

      <button 
        className="px-4 py-2 mt-3 rounded-full bg-blue-700 hover:bg-blue-800 transition"
        onClick={increaser}
      >
        Click me!
      </button>

      <h4 
        className={`mt-3 text-center rounded-xl p-2 ${
          cond ? "bg-green-600" : "bg-red-600"
        }`}
      >
        {cond ? "TRUE" : "FALSE"}
      </h4>
    </div>
  );
}

export default CounterCard;
