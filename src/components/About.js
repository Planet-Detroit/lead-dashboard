import React from 'react';
import './About.css';

function About() {
  return (
    <div className="about-container">
      <div className="about-card">
        <h1>About This Dashboard</h1>
        
        <p className="intro">
          This dashboard tracks Michigan's progress identifying and replacing lead service lines—the pipes that connect water mains to homes and buildings. Lead exposure through drinking water poses serious health risks, particularly for children.
        </p>
        
        <section className="about-section">
          <h2>Regulatory Context</h2>
          <p>
            Michigan revised its Lead and Copper Rule in 2018, requiring all community water systems to inventory their service line materials and replace lead lines. The new sampling protocol took effect in 2019. The federal Lead and Copper Rule Improvements (2024) mandates full replacement nationwide by 2037.
          </p>
          <p>
            <strong>Action Level Exceedances:</strong> Water systems that exceed the lead action level (15 parts per billion from 2019–2024; 10 parts per billion starting in 2025) face additional monitoring, public communication, and accelerated replacement requirements.
          </p>
        </section>
        
        <section className="about-section">
          <h2>Key Terms</h2>
          <dl className="definitions">
            <dt>Lead Service Line (LSL)</dt>
            <dd>A pipe made of lead connecting the water main to a building</dd>
            
            <dt>Galvanized Requiring Replacement (GPCL)</dt>
            <dd>Galvanized pipes that were or may have been connected to lead; must be replaced</dd>
            
            <dt>Unknown Material</dt>
            <dd>Lines that haven't been inspected or verified; must be identified</dd>
            
            <dt>Total to Identify and/or Replace</dt>
            <dd>The sum of known lead lines, GPCL, and unknown material lines</dd>
            
            <dt>Compliant</dt>
            <dd>Systems that have replaced at least 20% of required lines annually</dd>
            
            <dt>% Replaced</dt>
            <dd>(Lines Replaced ÷ (Lines Replaced + Total to Identify and/or Replace)) × 100</dd>
          </dl>
        </section>
        
        <section className="about-section">
          <h2>Data Sources</h2>
          <p>
            Michigan EGLE Community Drinking Water Supply Monitoring Inventory and Lead Service Line Replacement Reports, covering 1,383 water systems.
          </p>
          <ul className="data-dates">
            <li>Inventory data published by EGLE, March 2025</li>
            <li>Replacement data published by EGLE, August 2025</li>
          </ul>
        </section>
        
        <section className="about-section support-section">
          <h2>Support This Work</h2>
          <p>
            <a href="https://donorbox.org/planet-detroit-drinking-water-reporting-fund" target="_blank" rel="noopener noreferrer">
              Donate to Planet Detroit's Drinking Water Reporting Fund
            </a> to support continued reporting on water quality and environmental health in Michigan.
          </p>
        </section>
      </div>
    </div>
  );
}

export default About;
