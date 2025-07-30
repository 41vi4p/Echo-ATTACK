# ECHO ATT&CK

[![Version](https://img.shields.io/badge/version-1.0.4-blue.svg)](https://github.com/41vi4p/Echo-ATTACK/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/41vi4p/Echo-ATTACK/blob/main/LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-61DAFB.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC.svg)](https://tailwindcss.com/)
[![MITRE ATT&CK](https://img.shields.io/badge/MITRE_ATT%26CK-Framework-red.svg)](https://attack.mitre.org/)
[![Security](https://img.shields.io/badge/Security-Defensive_Only-green.svg)](#-security)
[![Contributors](https://img.shields.io/badge/Contributors-2-orange.svg)](#-development-team)
[![Issues](https://img.shields.io/github/issues/41vi4p/Echo-ATTACK.svg)](https://github.com/41vi4p/Echo-ATTACK/issues)
[![Stars](https://img.shields.io/github/stars/41vi4p/Echo-ATTACK.svg?style=social)](https://github.com/41vi4p/Echo-ATTACK/stargazers)

A modern, interactive threat intelligence platform built with Next.js, providing comprehensive analysis of MITRE ATT&CK framework data including APT groups, techniques, and software tools.

## 📋 Table of Contents

- [🚀 Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📦 Installation](#-installation)
- [🏗️ Project Structure](#️-project-structure)
- [🎯 Key Components](#-key-components)
- [🎨 Theme & Styling](#-theme--styling)
- [📊 Data Format](#-data-format)
- [🚀 Build & Deployment](#-build--deployment)
- [🔧 Configuration](#-configuration)
- [📈 Version History](#-version-history)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🔒 Security](#-security)
- [👥 Development Team](#-development-team)  
- [📞 Support](#-support)

## 🚀 Features

- **Interactive Dashboard**: Real-time threat intelligence overview with key metrics and visualizations
- **APT Groups Analysis**: Detailed analysis of Advanced Persistent Threat groups with searchable interface
- **Comprehensive Search**: Search across APT groups, techniques, and software with interactive detailed views
- **Professional UI**: Modern, futuristic blue theme with responsive design
- **MITRE Integration**: Clickable MITRE ATT&CK links opening in new tabs
- **Data Visualizations**: Multi-colored charts and graphs using Chart.js
- **Collapsible Sidebar**: Clean navigation with expandable/collapsible sidebar

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI Library**: shadcn/ui components
- **Styling**: Tailwind CSS v4
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Lucide React
- **Data Source**: MITRE ATT&CK framework

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/41vi4p/Echo-ATTACK.git
   cd Echo-ATTACK
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles and theme
│   └── page.tsx          # Main page component
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── dashboard-layout.tsx
│   ├── overview-dashboard.tsx
│   ├── apt-groups-dashboard.tsx
│   └── search-dashboard.tsx
├── lib/                  # Utility libraries
│   └── mitre-links.tsx   # MITRE link parsing utilities
├── types/                # TypeScript type definitions
│   └── mitre.ts         # MITRE data types
└── data/                # Static data files
    └── mitre_data.json  # MITRE ATT&CK data
```

## 🎯 Key Components

### Dashboard Layout
- Collapsible sidebar navigation
- Professional blue theme
- Real-time system status display
- Responsive design for desktop and mobile

### Overview Dashboard
- Key threat intelligence metrics
- Interactive charts and visualizations
- APT group statistics
- Technique coverage analysis

### APT Groups Dashboard
- Searchable list of APT groups
- Detailed group information with tabs
- Technique usage statistics
- Software tools and campaigns data

### Search Dashboard
- Universal search across all data types
- Interactive search results with modal dialogs
- Detailed information views with tabs
- Related data and cross-references

## 🎨 Theme & Styling

ECHO ATT&CK features a professional futuristic blue theme using:
- **Primary Colors**: Various shades of blue using oklch color space
- **Typography**: Modern font stack with terminal-style elements
- **Effects**: Subtle animations and hover states
- **Layout**: Clean, card-based design with proper spacing

## 📊 Data Format

The application expects MITRE ATT&CK data in JSON format with the following structure:
- APT Groups with attack IDs, names, descriptions
- Technique tables with usage status
- Software data with descriptions and types
- Campaign information with timelines

## 🚀 Build & Deployment

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Production Build
The application builds to static files and can be deployed on any hosting platform supporting Next.js.

## 🔧 Configuration

### Environment Variables
No environment variables required for basic functionality.

### Customization
- **Theme**: Modify colors in `src/app/globals.css`
- **Data**: Replace `src/data/mitre_data.json` with updated MITRE data
- **Components**: Extend or modify dashboard components as needed

## 📈 Version History

See [VERSION_CHANGELOG.md](./VERSION_CHANGELOG.md) for detailed version history and changes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔒 Security

ECHO ATT&CK is designed for defensive security analysis only. It provides tools for:
- Threat intelligence analysis
- Security research and education
- Defensive planning and preparation

## 👥 Development Team

**ECHO ATT&CK** is developed and maintained by:

- **[David Porathur](https://github.com/41vi4p)** 
- **[Vanessa Rodrigues](https://github.com/Vanessa-Rodrigues-156)**

### 🤝 Get Involved
- 🐛 [Report Issues](https://github.com/41vi4p/Echo-ATTACK/issues)
- 💡 [Request Features](https://github.com/41vi4p/Echo-ATTACK/issues/new)
- 🔧 [Contribute Code](https://github.com/41vi4p/Echo-ATTACK/pulls)
- ⭐ [Star the Repository](https://github.com/41vi4p/Echo-ATTACK/stargazers)

## 📞 Support

For issues, questions, or contributions, please use the GitHub repository's issue tracker.
