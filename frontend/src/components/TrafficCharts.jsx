import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const TrafficCharts = ({ stats }) => {
  return (
    <div className="glass-panel h-full flex flex-col space-y-4">
      <h3 className="font-display text-neon-cyan text-sm tracking-widest uppercase">System Analytics</h3>
      
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="name" stroke="#666" fontSize={10} tick={false} />
            <YAxis stroke="#666" fontSize={10} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#151520', border: '1px solid #0ff' }}
              itemStyle={{ color: '#0ff' }}
            />
            <Bar dataKey="avgDensity" fill="#39ff14" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={stats}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="name" stroke="#666" fontSize={10} tick={false} />
            <YAxis stroke="#666" fontSize={10} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#151520', border: '1px solid #0ff' }}
            />
            <Line type="monotone" dataKey="totalVehicles" stroke="#00ffff" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrafficCharts;
