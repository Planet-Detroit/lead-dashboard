import React, { useState, useEffect } from 'react';
import About from './components/About';
import Dashboard from './components/Dashboard';
import WaterSystemDirectory from './components/WaterSystemDirectory';
import RankingTable from './components/RankingTable';
import LeadLineMap from './components/LeadLineMap';
import EmbedMap from './components/EmbedMap';
import './App.css';

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = 'G-13120361886';

// Initialize Google Analytics
const initGA = () => {
  // Load gtag.js script
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID);
};

// Track page/tab views
const trackPageView = (pageName) => {
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_title: pageName,
      page_path: `/${pageName.toLowerCase().replace(' ', '-')}`
    });
  }
};

function App() {
  const [activeTab, setActiveTab] = useState('map');

  // Initialize GA on mount
  useEffect(() => {
    initGA();
  }, []);

  // Track tab changes
  useEffect(() => {
    const tabNames = {
      map: 'Map',
      dashboard: 'Overview',
      directory: 'Search Systems',
      ranking: 'Rankings',
      about: 'About'
    };
    trackPageView(tabNames[activeTab] || activeTab);
  }, [activeTab]);

  // Check if this is an embed route
  const isEmbed = window.location.hash === '#embed' || 
                  window.location.search.includes('embed=true');
  
  // If embed route, render only the embed map (no header/footer)
  if (isEmbed) {
    return <EmbedMap />;
  }

  const tabs = [
    { id: 'map', label: 'Map', icon: '🗺️' },
    { id: 'dashboard', label: 'Overview', icon: '📊' },
    { id: 'directory', label: 'Search Systems', icon: '🔍' },
    { id: 'ranking', label: 'Rankings', icon: '📋' },
    { id: 'about', label: 'About', icon: 'ℹ️' }
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
            <img src={process.env.PUBLIC_URL + "/planet-detroit-logo.png"} alt="Planet Detroit" className="header-logo" />
          </a>
          <a 
            href="https://safewaterengineering.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="logo-link"
          >
              <img src={process.env.PUBLIC_URL + "/safe-water-engineering-logo.png"} alt="Safe Water Engineering" className="header-logo" />
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
        {activeTab === 'map' && <LeadLineMap />}
      </main>

      <footer className="app-footer">
        {/* Tips Callout */}
        <div className="footer-tips-callout">
          <span className="tips-icon">💡</span>
          <h3>Have questions? We want to hear from you!</h3>
          <p>
            Send your questions or tips to{' '}
            <a href="mailto:connect@planetdetroit.org">connect@planetdetroit.org</a>
          </p>
          <p className="tips-secondary">
            📬 We're especially interested in hearing about communications you've received 
            from your water utility about lead service lines.
          </p>
        </div>
        
        <p>Data source: Michigan EGLE Community Drinking Supply Monitoring Inventory (CDSMI) and Lead Service Line Replacement Reports</p>
        <p>© 2025 Planet Detroit | Last updated: December 2025</p>
      </footer>
    </div>
  );
}

export default App;
