import React, { useState, useEffect } from 'react';
import { getIntersections, socket } from './api';
import CityGrid from './components/CityGrid';
import TrafficCharts from './components/TrafficCharts';
import ControlPanel from './components/ControlPanel';
import AlertsSidebar from './components/AlertsSidebar';
import { Activity, Zap, Cpu } from 'lucide-react';

function App() {
  const [intersections, setIntersections] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [stats, setStats] = useState([]);

  useEffect(() => {
    // Initial fetch
    getIntersections().then(res => {
      setIntersections(res.data);
      updateStats(res.data);
    });

    // Socket listener
    socket.on('trafficData', (data) => {
      setIntersections(data);
      updateStats(data);
    });

    return () => socket.off('trafficData');
  }, []);

  const updateStats = (data) => {
    const newStats = data.map(i => ({
      name: i.id,
      avgDensity: i.lanes.reduce((acc, l) => acc + l.density, 0) / i.lanes.length,
      totalVehicles: i.lanes.reduce((acc, l) => acc + l.vehicleCount, 0)
    }));
    setStats(newStats);
  };

  const selectedIntersection = intersections.find(i => i.id === selectedId);

  return (
    <div className="h-screen w-screen flex flex-col p-4 space-y-4 max-h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between glass-panel py-2 px-6">
        <div className="flex items-center space-x-3">
           <Zap className="w-6 h-6 text-neon-green" />
           <div>
             <h1 className="text-xl font-display text-white tracking-widest uppercase">SmartTraffic-AI</h1>
             <div className="text-[10px] text-neon-cyan opacity-80 flex items-center">
               <Activity className="w-3 h-3 mr-1" /> SYSTEM STATUS: NOMINAL • NODE-01 ACTIVE
             </div>
           </div>
        </div>
        
        <div className="flex items-center space-x-6">
           <div className="text-right">
             <div className="text-[10px] text-gray-500 uppercase">Average Network Load</div>
             <div className="text-sm font-display text-neon-green">{(stats.reduce((acc, s) => acc + s.avgDensity, 0) / (stats.length || 1) * 100).toFixed(1)}%</div>
           </div>
           <div className="w-10 h-10 rounded-full border border-neon-cyan flex items-center justify-center">
             <Cpu className="w-5 h-5 text-neon-cyan" />
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex space-x-4 overflow-hidden">
        {/* Left: Charts */}
        <div className="w-1/4">
          <TrafficCharts stats={stats} />
        </div>

        {/* Center: City Map */}
        <div className="flex-1 overflow-hidden relative">
          <CityGrid 
            intersections={intersections} 
            onSelect={(i) => setSelectedId(i.id)} 
          />
        </div>

        {/* Right: Controls & Alerts */}
        <div className="w-1/4 flex flex-col space-y-4">
          <div className="flex-1">
            <ControlPanel selectedIntersection={selectedIntersection} />
          </div>
          <div className="flex-1">
            <AlertsSidebar intersections={intersections} />
          </div>
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="glass-panel py-1 px-4 flex justify-between items-center text-[10px] text-gray-500 uppercase tracking-widest">
         <div>&copy; 2026 NEXUS CITY OPERATIONS • SECURE CHANNEL UP</div>
         <div className="flex items-center space-x-4">
           <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-neon-green mr-1" /> SERVER OK</span>
           <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-neon-cyan mr-1" /> SOCKET CONNECTED</span>
         </div>
      </footer>
    </div>
  );
}

export default App;
