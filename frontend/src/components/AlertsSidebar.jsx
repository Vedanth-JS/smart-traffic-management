import React from 'react';
import { AlertCircle, Clock, MapPin } from 'lucide-react';

const AlertsSidebar = ({ intersections = [] }) => {
  // Generate mock alerts based on density
  const highDensityIntersections = intersections.filter(i => 
    i?.lanes?.some(l => l.density > 0.75)
  );

  return (
    <div className="glass-panel h-full flex flex-col space-y-4">
      <h3 className="font-display text-neon-red text-sm tracking-widest uppercase flex items-center">
        <AlertCircle className="w-4 h-4 mr-2" /> Live Alerts
      </h3>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-800">
        {highDensityIntersections.length > 0 ? (
          highDensityIntersections.map(i => (
            <div key={i.id} className="bg-red-900 bg-opacity-20 border-l-2 border-neon-red p-3 rounded-r">
               <div className="flex justify-between items-start mb-1">
                 <span className="text-[10px] font-bold text-neon-red uppercase">Heavy Congestion</span>
                 <span className="text-[10px] text-gray-500">Just Now</span>
               </div>
               <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                    className={`h-full transition-all duration-1000 ${
                        (i?.lanes?.reduce((acc, l) => acc + l.density, 0) / (i?.lanes?.length || 1)) > 0.7 ? 'bg-neon-red shadow-[0_0_5px_#ff3131]' : 
                        (i?.lanes?.reduce((acc, l) => acc + l.density, 0) / (i?.lanes?.length || 1)) > 0.4 ? 'bg-neon-amber' : 'bg-neon-green'
                    }`}
                    style={{ width: `${((i?.lanes?.reduce((acc, l) => acc + l.density, 0) / (i?.lanes?.length || 1)) || 0) * 100}%` }}
                />
            </div>
               <div className="text-xs font-bold flex items-center">
                 <MapPin className="w-3 h-3 mr-1 text-gray-400" /> {i.name}
               </div>
               <div className="text-[10px] text-gray-400 mt-1">
                 Traffic density exceeds 0.75 on main lanes. AI optimizing throughput.
               </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 opacity-50">
             <Shield className="w-8 h-8 mb-2" />
             <div className="text-[10px] uppercase font-bold">Grid Secure</div>
             <div className="text-[10px]">No major incidents</div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
         <div className="text-[10px] text-gray-500 flex items-center">
           <Clock className="w-3 h-3 mr-1" /> LATEST UPDATE: {new Date().toLocaleTimeString()}
         </div>
      </div>
    </div>
  );
};

export default AlertsSidebar;
