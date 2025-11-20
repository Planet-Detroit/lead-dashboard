import React, { useState, useEffect } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

function Dashboard() {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [animatedReplaced, setAnimatedReplaced] = useState(0);
  
  const totalToReplace = 580030;
  const totalReplaced = 69891;
  const actualProgress = 12.0;
  
  const yearlyData = [
    { year: '2021', replacements: 10316 },
    { year: '2022', replacements: 16379 },
    { year: '2023', replacements: 18675 },
    { year: '2024', replacements: 24521 }
  ];
  
  const compositionData = [
    { name: 'Known Lead Lines', value: 203050, color: '#dc2626' },
    { name: 'Galvanized (GPCL)', value: 61608, color: '#ea580c' },
    { name: 'Unknown Material', value: 315372, color: '#ca8a04' },
    { name: 'Non-Lead', value: 2026676, color: '#16a34a' }
  ];
  
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep++;
      const progress = (currentStep / steps);
      setAnimatedProgress(actualProgress * progress);
      setAnimatedReplaced(Math.floor(totalReplaced * progress));
      
      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, stepDuration);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="container">
      <div className="card">
        <div className="stats-grid">
          <div className="stat-card red">
            <div className="stat-label">TOTAL TO IDENTIFY AND/OR REPLACE</div>
            <div className="stat-value">{totalToReplace.toLocaleString()}</div>
            <div className="stat-desc">service lines</div>
          </div>
          
          <div className="stat-card blue">
            <div className="stat-label">REPLACED TO DATE</div>
            <div className="stat-value">{animatedReplaced.toLocaleString()}</div>
            <div className="stat-desc">lines removed (2021-2024)</div>
          </div>
          
          <div className="stat-card green">
            <div className="stat-label">PROGRESS</div>
            <div className="stat-value">{animatedProgress.toFixed(1)}%</div>
            <div className="stat-desc">complete</div>
          </div>
        </div>
        
        <div className="progress-section">
          <div className="progress-header">
            <span className="progress-label">Overall Replacement Progress</span>
            <span className="progress-text">{animatedReplaced.toLocaleString()} of {totalToReplace.toLocaleString()}</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${animatedProgress}%` }}>
              {animatedProgress > 8 && (
                <span className="progress-bar-text">{animatedProgress.toFixed(1)}%</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Annual Replacement Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                  formatter={(value) => [value.toLocaleString() + ' lines', 'Replaced']}
                />
                <Line 
                  type="monotone" 
                  dataKey="replacements" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="insight-box green">
              <strong>138% increase</strong> from 2021 to 2024 – progress is accelerating!
            </div>
          </div>
          
          <div className="chart-card">
            <h3>Service Line Composition</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={compositionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {compositionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => value.toLocaleString() + ' lines'}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="insight-box yellow">
              <strong>315,372 lines of unknown material</strong> still need testing
            </div>
          </div>
        </div>
        
        <div className="footer">
          Data source: Michigan EGLE Community Drinking Supply Monitoring Inventory (CDSMI) and Lead Service Line Replacement Reports
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
