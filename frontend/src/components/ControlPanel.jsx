import React from 'react';
import { Settings, Shield, AlertTriangle } from 'lucide-react';
import { updateSignal } from '../api';

const ControlPanel = ({ selectedIntersection }) => {
  if (!selectedIntersection) {
    return (
      <div className="glass-panel h-full flex items-center justify-center text-gray-500 text-sm italic">
        Select an intersection to view control details
      </div>
    );
  }

  const handleOverride = async (phase) => {
    try {
      await updateSignal({
        intersectionId: selectedIntersection.id,
        phase: phase,
        duration: 45
      });
    } catch (err) {
      console.error('Manual Override Failed:', err);
    }
  };

  return (
    <div className="glass-panel h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-neon-cyan text-sm tracking-widest uppercase flex items-center">
            <Settings className="w-4 h-4 mr-2" /> Traffic Control
        </h3>
        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
          selectedIntersection.status === 'override' ? 'bg-neon-amber text-black' : 'bg-neon-green text-black'
        }`}>
          {selectedIntersection.status}
        </span>
      </div>

      <div className="space-y-4">
        <div className="bg-black bg-opacity-40 p-3 rounded border border-gray-800">
           <div className="text-xs text-gray-400 mb-1">AI Recommendation</div>
           <div className="text-sm font-bold text-neon-green">
             {selectedIntersection.signalData.recommendation?.phase} for {Math.round(selectedIntersection.signalData.recommendation?.duration)}s
           </div>
           <div className="text-[10px] text-gray-500 mt-1 italic">
             "{selectedIntersection.signalData.recommendation?.reason}"
           </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => handleOverride('NORTH_SOUTH')}
            className={`p-3 rounded border ${selectedIntersection.signalData.currentPhase === 'NORTH_SOUTH' ? 'border-neon-green text-neon-green' : 'border-gray-700 text-gray-500'} transition-all`}
          >
            <div className="text-xs font-bold">MANUAL</div>
            <div className="text-[10px]">N-S GREEN</div>
          </button>
          <button 
            onClick={() => handleOverride('EAST_WEST')}
            className={`p-3 rounded border ${selectedIntersection.signalData.currentPhase === 'EAST_WEST' ? 'border-neon-amber text-neon-amber' : 'border-gray-700 text-gray-500'} transition-all`}
          >
            <div className="text-xs font-bold">MANUAL</div>
            <div className="text-[10px]">E-W GREEN</div>
          </button>
        </div>

        <div className="pt-4 border-t border-gray-800">
           <div className="flex items-center text-xs text-neon-red font-bold mb-2">
             <AlertTriangle className="w-3 h-3 mr-1" /> ACTIVE INCIDENTS
           </div>
           <div className="text-[10px] text-gray-400">
             Detection threshold: 0.8 density for 30s
           </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
