import React, { useState } from 'react';
import CounterCard from './CounterCard';
import LabGrid from './LabGrid';
import Product from './Product';

function App() {
  const [count, setCount] = useState(10);
  const [cond, setCond] = useState(true);

  function increaser() {
    setCount(prev => {
      const newCount = prev + 1;
      setCond(newCount % 2 === 0);
      return newCount;
    });
  }

  return (
    <div className="w-full min-h-screen bg-zinc-900 text-white p-6 space-y-6">

      

      {/* AI Lab Members */}
      <LabGrid />
      <CounterCard 
        count={count} 
        cond={cond} 
        increaser={increaser}
      />
      {/* Example existing prop */}
      <Product naam={cond} />

    </div>
  );
}

export default App;
