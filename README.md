# Michigan Lead Service Line Replacement Dashboard

An interactive data visualization tracking lead service line replacement progress across Michigan water systems (2021-2024).

**A collaboration between [Planet Detroit](https://planetdetroit.org) and [Safe Water Engineering](https://safewaterengineering.com)**

## Live Demo

View the dashboard at: [https://leadservicelines.planetdetroit.org](https://leadservicelines.planetdetroit.org)

## Overview

This dashboard visualizes data from Michigan's Department of Environment, Great Lakes, and Energy (EGLE) showing:
* **580,030** total lead service lines requiring replacement
* **69,891** lines replaced (12% progress) from 2021-2024
* **3.9 million** Michigan residents served by systems with known lead lines
* **138% increase** in replacement rates from 2021 to 2024

## Key Features

### 📊 Dashboard Overview
* Animated statistics and progress tracking
* Interactive charts showing annual replacement trends
* Service line composition breakdown by material type
* Population exposure metrics
* Real-time progress bar animations

### 🔍 Search Systems
* Search by water system name or PWSID
* Filter systems with lead action level exceedances
* Filter systems with **LCR exceedances since 2018** (Michigan's Lead and Copper Rule revision year)
* Sort by name, lead lines, population, or compliance progress
* Detailed system cards displaying:
  - Population served
  - Known lead lines, GPCL (Galvanized Previously Connected to Lead), and unknown materials
  - Lines replaced and replacement progress
  - **Regulatory compliance status** (Compliant ≥20%, Not in compliance <20%)
  - Lead action level exceedance history

### 📋 Rankings
* View systems by:
  - Most lead lines
  - Best replacement progress
  - Systems needing attention (worst progress)
  - Most unknown material lines
* Interactive sortable table
* Top 3 rankings highlighted
* Compliance status indicators
* Warning badges for systems with lead action level exceedances

### ⚠️ Data Gaps
* Analysis of the 315,372 service lines with unknown materials
* Impact assessment on replacement progress tracking
* Call to action for mandatory material identification

## Technology Stack

* **React** - UI framework
* **Recharts** - Data visualization library
* **CSS3** - Styling and responsive design
* **PapaParse** - CSV data processing
* **GitHub Pages** - Hosting and deployment

## Data Source & Methodology

### Source Data
Michigan Department of Environment, Great Lakes, and Energy (EGLE):
* Community Drinking Supply Monitoring Inventory (CDSMI)
* Lead Service Line Replacement Reports (2021-2024)
* Lead Action Level Exceedance data

### Data Processing & Calculations

**Replacement progress percentages and compliance determinations are calculated by Planet Detroit** based on EGLE-reported data:

* **Total to Replace** = Lead lines + GPCL (Galvanized Previously Connected to Lead) + Unknown material lines
* **% Replaced** = (Lines Replaced / Total to Replace) × 100
* **Compliance Status**: 
  - **Compliant**: ≥20% replacement progress (meets regulatory requirement)
  - **Not in compliance**: <20% replacement progress

The dashboard uses raw data from EGLE's official reports, with replacement percentages and compliance assessments calculated by Planet Detroit to provide comprehensive analysis of statewide progress toward eliminating lead service lines.

### Regulatory Context

* **20% Compliance Threshold**: Michigan's regulatory framework establishes 20% replacement progress as a key benchmark for water system compliance
* **Lead and Copper Rule (LCR)**: Revised in 2018 to strengthen protections and accelerate lead service line replacement
* **Action Level Exceedances**: Water systems that exceed the lead action level (15 parts per billion) face additional monitoring and replacement requirements

## Installation & Development

### Prerequisites
* Node.js (v14 or higher)
* npm
* Git

### Setup

```bash
# Clone the repository
git clone https://github.com/Planet-Detroit/lead-dashboard.git
cd lead-dashboard

# Install dependencies
npm install

# Run development server
npm start
```

The app will open at `http://localhost:3000`

### Data Updates

To update the dashboard with new EGLE data:

1. **Replace** `lead-data.csv` with updated CSV file from EGLE
2. **Run** the conversion script:
   ```bash
   node scripts/convertCsv.js
   ```
3. **Review** the generated `src/data/waterSystemsData.js`
4. **Test** locally:
   ```bash
   npm start
   ```
5. **Deploy**: Push to `main` — GitHub Actions will build and deploy automatically.

### Build for Production

```bash
npm run build
```

### Deployment

Deploys are **automatic** via GitHub Actions. Every push to `main` triggers a build and deploys to GitHub Pages at [leadservicelines.planetdetroit.org](https://leadservicelines.planetdetroit.org).

The workflow is defined in `.github/workflows/deploy.yml`. You can also trigger a deploy manually from the Actions tab on GitHub.

## Project Structure

```
michigan-lead-dashboard/
├── public/
│   ├── planet-detroit-logo.png        # Organization logo
│   ├── safe-water-engineering-logo.png # Partner logo
│   ├── index.html
│   └── favicon.ico
├── scripts/
│   └── convertCsv.js                  # CSV to JSON converter
├── src/
│   ├── components/
│   │   ├── Dashboard.js               # Overview tab component
│   │   ├── Dashboard.css              # Overview styles
│   │   ├── WaterSystemDirectory.js    # Search systems tab
│   │   ├── WaterSystemDirectory.css   # Search styles
│   │   ├── RankingTable.js            # Rankings tab
│   │   ├── RankingTable.css           # Rankings styles
│   │   ├── UnknownMaterialsAlert.js   # Data gaps tab
│   │   └── UnknownMaterialsAlert.css  # Data gaps styles
│   ├── data/
│   │   └── waterSystemsData.js        # Processed EGLE data
│   ├── App.js                         # Main app component
│   ├── App.css                        # Global styles
│   └── index.js                       # React entry point
├── lead-data.csv                      # Source data from EGLE
├── package.json                       # Dependencies and scripts
└── README.md
```

## Data Fields Tracked

For each water system, the dashboard displays:

* **PWSID** - Public Water System ID (unique identifier)
* **Supply Name** - Water system name
* **Population Served** - Residents served (2025 estimates)
* **Lead in CDSMI** - Known lead service lines
* **GPCL in CDSMI** - Galvanized Previously Connected to Lead lines
* **Unknown in CDSMI** - Lines with unknown material composition
* **Total to Replace** - Sum of lead + GPCL + unknown lines
* **Grand Total of Lead Service Lines Replaced** - Lines replaced (2021-2024)
* **% Replaced to Date** - Calculated replacement progress (by Planet Detroit)
* **Most Recent Lead Action Level Exceedance** - Year of most recent exceedance (if any)

## Key Insights from the Data

* **Scale of Challenge**: Over half a million service lines need replacement statewide
* **Progress Acceleration**: Replacement rates more than doubled from 2021 to 2024, showing increasing momentum
* **Population Impact**: 52.8% of Michigan's population is served by water systems with known lead lines
* **Unknown Materials**: 315,372 service lines still need material identification - representing a critical data gap
* **Compliance Landscape**: The 20% replacement threshold provides a clear benchmark for evaluating system progress
* **LCR Impact**: Michigan's 2018 Lead and Copper Rule revision established stricter requirements driving replacement efforts

## Embedding

To embed this dashboard on a website, use an iframe:

```html
<iframe 
  src="https://leadservicelines.planetdetroit.org" 
  width="100%" 
  height="1600" 
  frameborder="0" 
  style="border: none;">
</iframe>
```

## Browser Compatibility

* Chrome (recommended)
* Firefox
* Safari
* Edge
* Mobile browsers (responsive design)

## Contributing

This project is maintained by Planet Detroit. For questions, suggestions, or data corrections:

* **Issues**: [GitHub Issues](https://github.com/Planet-Detroit/lead-dashboard/issues)
* **Email**: [Contact Planet Detroit](https://planetdetroit.org/contact)

## License

* **Data**: Public domain (provided by Michigan EGLE)
* **Code**: Available for reuse with attribution to Planet Detroit
* **Analysis**: Replacement calculations and compliance assessments © 2025 Planet Detroit

## Acknowledgments

* **Data Source**: Michigan Department of Environment, Great Lakes, and Energy (EGLE)
* **Data Analysis & Calculations**: Planet Detroit
* **Engineering Partnership**: Safe Water Engineering
* **Dashboard Development**: Planet Detroit
* **Community Support**: Michigan environmental advocacy organizations

## Updates & Version History

### November 2024
* ✅ Added system search and rankings functionality
* ✅ Implemented compliance-based progress categories (≥20% compliant / <20% not in compliance)
* ✅ Added LCR exceedance filtering (systems exceeding lead action level since 2018 revision)
* ✅ Enhanced data processing to use calculated replacement percentages
* ✅ Added partner logos and branding
* ✅ Improved data gap analysis and visualization
* ✅ Mobile-responsive design improvements

### Initial Release - 2024
* 📊 Overview dashboard with statewide statistics
* 📈 Annual replacement trend visualization
* 🥧 Service line composition analysis
* 👥 Population exposure metrics

## Contact

**Planet Detroit**
* Website: [planetdetroit.org](https://planetdetroit.org)
* Follow us for updates on Michigan environmental issues

**Safe Water Engineering**
* Website: [safewaterengineering.com](https://safewaterengineering.com)

---

*Built with ❤️ by Planet Detroit for public information and advocacy*

*Last updated: May 2026*
