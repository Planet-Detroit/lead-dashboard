import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';
import ComplianceStatusChart from './ComplianceStatusChart';
import CurrentExceedances from './CurrentExceedances';

/**
 * Overview tab: statewide totals, service line composition, compliance
 * breakdown, and the Current Lead Action Level Exceedances table.
 *
 * The per-system System Trends panel (annual replacement trend + 90th
 * percentile lead levels) moved to the top of the Search Systems tab in
 * Nov 2026 — see WaterSystemDirectory.js.
 *
 * Props:
 *   onViewSystem {function} — optional; called with a base PWSID when a system
 *                             in the exceedances table is clicked. App.js uses
 *                             it to open Search Systems with that system in
 *                             the System Trends panel.
 */
function Dashboard({ onViewSystem }) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [animatedReplaced, setAnimatedReplaced] = useState(0);
  
  const totalToReplace = 580030;
  const totalReplaced = 98253;
  const actualProgress = 16.9;
  
  const compositionData = [
    { name: 'Known Lead Lines', value: 203050, color: '#dc2626' },
    { name: 'Galvanized (GPCL)', value: 61608, color: '#ea580c' },
    { name: 'Unknown Material', value: 315372, color: '#ca8a04' },
    { name: 'Non-Lead', value: 2026676, color: '#16a34a' }
  ];

  const compositionTotal = compositionData.reduce((sum, d) => sum + d.value, 0);
  
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
            <div className="stat-desc">lines removed (2021-2025)</div>
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
          {/* Statewide service line composition (left) + compliance breakdown (right) */}
          <div className="chart-card">
            <h3>Service Line Composition</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={compositionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
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
            <div className="pie-legend">
              {compositionData.map((entry, index) => (
                <div key={index} className="pie-legend-item">
                  <span className="pie-legend-color" style={{ backgroundColor: entry.color }}></span>
                  <span className="pie-legend-label">{entry.name}</span>
                  <span className="pie-legend-value">{entry.value.toLocaleString()}</span>
                  <span className="pie-legend-percent">({((entry.value / compositionTotal) * 100).toFixed(1)}%)</span>
                </div>
              ))}
            </div>
            <div className="insight-box yellow">
              <strong>315,372 lines of unknown material</strong> still need testing
            </div>
          </div>

          {/* Compliance status breakdown */}
          <ComplianceStatusChart />
        </div> {/* end charts-grid */}

        {/* Clicking a system opens it in the System Trends panel on Search Systems */}
        <CurrentExceedances onSelect={onViewSystem} />

        <div className="footer">
          <p>Data source: Michigan EGLE Community Drinking Supply Monitoring Inventory (CDSMI) and Lead Service Line Replacement Reports</p>
          <p style={{ marginTop: '10px' }}>If the water utility you are looking for is not listed here, look them up on the <strong>Search Systems</strong> page.</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
