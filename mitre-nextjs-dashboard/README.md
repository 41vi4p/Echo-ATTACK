# ECHO ATT&CK

A modern, interactive threat intelligence platform built with Next.js, providing comprehensive analysis of MITRE ATT&CK framework data including APT groups, techniques, and software tools.

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
   git clone <repository-url>
   cd echo-attack-dashboard
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

## 📞 Support

For issues, questions, or contributions, please use the GitHub repository's issue tracker.