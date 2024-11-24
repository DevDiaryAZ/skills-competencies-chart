import React from 'react';
import CircularGraph from './CircularGraph.jsx';

export const App = () => {
  return (
      <main>
        <div className="wrapper">
          <h2>Круговая диаграмма связей</h2>
          <CircularGraph />
        </div>
      </main>
  );
};
