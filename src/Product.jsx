function Product({ naam }) {
  return (
    <div className="mt-4 p-4 bg-zinc-800 text-center rounded-xl">
      <h2 className="text-lg font-semibold">Prop Test:</h2>
      <p className="text-cyan-400">{naam.toString()}</p>
    </div>
  );
}

export default Product;
