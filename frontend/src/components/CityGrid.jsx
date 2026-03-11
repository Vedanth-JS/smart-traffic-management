import React from 'react';
import { motion } from 'framer-motion';

const CityGrid = ({ intersections, onSelect }) => {
  return (
    <div className="relative w-full h-full bg-traffic-bg overflow-hidden p-8">
      {/* Grid Lines */}
      <div className="absolute inset-0 opacity-10" 
           style={{ backgroundImage: 'linear-gradient(#0ff 1px, transparent 1px), linear-gradient(90deg, #0ff 1px, transparent 1px)', backgroundSize: '100px 100px' }}>
      </div>

      <div className="relative grid grid-cols-4 gap-12 max-w-6xl mx-auto">
        {intersections.map((intersection) => (
          <motion.div
            key={intersection.id}
            whileHover={{ scale: 1.05 }}
            onClick={() => onSelect(intersection)}
            className="cursor-pointer glass-panel flex flex-col items-center justify-center space-y-2 min-h-[160px]"
          >
            <div className="text-xs font-display text-neon-cyan uppercase tracking-tighter">{intersection.id}</div>
            <div className="text-sm font-bold text-center truncate w-full">{intersection.name}</div>
            
            {/* Traffic Light Indicator */}
            <div className="flex space-x-2 bg-black bg-opacity-50 p-2 rounded-full border border-gray-700">
               <div className={`w-4 h-4 rounded-full ${intersection.signalData.currentPhase === 'NORTH_SOUTH' ? 'bg-neon-green glow-green' : 'bg-gray-800'}`} />
               <div className={`w-4 h-4 rounded-full ${intersection.signalData.currentPhase === 'EAST_WEST' ? 'bg-neon-amber glow-amber' : 'bg-gray-800'}`} />
            </div>

            {/* Density Bar */}
            <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                    className={`h-full transition-all duration-1000 ${
                        intersection.lanes.reduce((acc, l) => acc + l.density, 0) / 4 > 0.7 ? 'bg-neon-red shadow-[0_0_5px_#ff3131]' : 
                        intersection.lanes.reduce((acc, l) => acc + l.density, 0) / 4 > 0.4 ? 'bg-neon-amber' : 'bg-neon-green'
                    }`}
                    style={{ width: `${(intersection.lanes.reduce((acc, l) => acc + l.density, 0) / 4) * 100}%` }}
                />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CityGrid;
