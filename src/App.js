import React, { useState } from 'react';
import About from './components/About';
import Dashboard from './components/Dashboard';
import WaterSystemDirectory from './components/WaterSystemDirectory';
import RankingTable from './components/RankingTable';
import UnknownMaterialsAlert from './components/UnknownMaterialsAlert';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('about');

  const tabs = [
    { id: 'about', label: 'About', icon: 'ℹ️' },
    { id: 'dashboard', label: 'Overview', icon: '📊' },
    { id: 'directory', label: 'Search Systems', icon: '🔍' },
    { id: 'ranking', label: 'Rankings', icon: '📋' },
    { id: 'unknown', label: 'Data Gaps', icon: '⚠️' }
  ];

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-logos">
          <a 
            href="https://planetdetroit.org" 
            target="_blank" 
            rel="noopener noreferrer"
            className="logo-link"
          >
            <img 
              src="/lead-dashboard/planet-detroit-logo.png" 
              alt="Planet Detroit" 
              className="header-logo"
            />
          </a>
          <a 
            href="https://safewaterengineering.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="logo-link"
          >
            <img 
              src="/lead-dashboard/safe-water-engineering-logo.png" 
              alt="Safe Water Engineering" 
              className="header-logo"
            />
          </a>
        </div>
        <div className="header-content">
          <h1>Michigan Lead Service Line Tracker</h1>
          <p>Comprehensive data on lead service line replacement across Michigan</p>
        </div>
        <a 
          href="https://donorbox.org/planet-detroit-drinking-water-reporting-fund" 
          target="_blank" 
          rel="noopener noreferrer"
          className="donate-button"
        >
          DONATE
        </a>
      </header>

      <nav className="tab-navigation">
        <div className="tab-container">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="app-content">
        {activeTab === 'about' && <About />}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'directory' && <WaterSystemDirectory />}
        {activeTab === 'ranking' && <RankingTable />}
        {activeTab === 'unknown' && <UnknownMaterialsAlert />}
      </main>

      <footer className="app-footer">
        <p>Data source: Michigan EGLE Community Drinking Supply Monitoring Inventory (CDSMI) and Lead Service Line Replacement Reports</p>
        <p>© 2025 Planet Detroit | Last updated: October 2025</p>
      </footer>
    </div>
  );
}

export default App;
