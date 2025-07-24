# 🛡️ MITRE CTI Dashboard

**Comprehensive Interactive Dashboard for MITRE ATT&CK Data Analysis**

*Advanced Persistent Threat (APT) Groups, Techniques, Tactics & Procedures Analysis*

## 🌟 Features

### 🎨 **Default Dark Mode**
- Professional dark theme optimized for cybersecurity analysis
- Eye-friendly color scheme for extended analysis sessions
- Theme toggle available for user preference

### 📈 **Comprehensive Overview**
- **APT Groups Statistics** - Total groups analyzed and their activity levels
- **Technique Coverage** - Unique techniques identified and actively used
- **Software Tools Analysis** - Malware and tools used by threat actors
- **MITRE ATT&CK Tactics Coverage** - Complete tactic-by-tactic breakdown

### 🏛️ **APT Group Analysis**
- **Detailed Group Profiles** - Complete information including aliases, creation dates, and descriptions
- **Technique Mapping** - All techniques and sub-techniques used by each group
- **Software Arsenal** - Tools and malware associated with each APT group
- **Campaign Analysis** - Historical campaigns and operations

### 🎯 **TTP Matrix (Tactics, Techniques & Procedures)**
- **Interactive Heatmap** - Visual representation of technique usage across APT groups
- **Detailed Matrix Table** - Comprehensive technique-by-group usage matrix
- **Summary Analytics** - Coverage percentages and maturity level assessments
- **Filterable Views** - Filter by main techniques, sub-techniques, or used techniques only
- **Maturity Levels**:
  - 🔴 **Advanced** (80%+ coverage)
  - 🟠 **Intermediate** (60-79% coverage)
  - 🟡 **Developing** (40-59% coverage)
  - 🔵 **Basic** (20-39% coverage)
  - ⚪ **Limited** (<20% coverage)

### 📊 **Advanced Analytics**
- **Technique Popularity Analysis** - Most commonly used techniques across all APT groups
- **Usage Trends** - Patterns and trends in technique adoption
- **Software Distribution** - Most prevalent tools and malware
- **Group Comparison** - Side-by-side analysis of APT group capabilities

### 🔍 **Advanced Search**
- **Multi-type Search** - Search across APT groups, techniques, and software
- **Categorized Results** - Results organized by type (APT Groups, Techniques, Sub-techniques, Software)
- **Contextual Information** - Detailed context for each search result

## 🚀 Getting Started

### Prerequisites
```bash
pip install streamlit pandas plotly asyncio
```

### Running the Dashboard
```bash
streamlit run streamlit_dashboard.py
```

### Navigation
The dashboard features a sidebar navigation with five main sections:

1. **📈 Overview** - High-level statistics and metrics
2. **🏛️ APT Analysis** - Detailed group-by-group analysis
3. **🎯 TTP Matrix** - Interactive technique mapping
4. **📊 Advanced Analytics** - Trends and patterns
5. **🔍 Search** - Search and discovery tools

## 📊 Data Structure

The dashboard expects MITRE cache data with the following structure:
- APT groups with technique tables
- Technique usage indicators
- Sub-technique mappings
- Software and tool associations
- Campaign data

## 🎨 Customization

### Theme Options
- **Dark Mode** (Default) - Professional cybersecurity analysis theme
- **Light Mode** - Traditional light theme for presentations

### Matrix Display Formats
- **Heatmap** - Visual heat map representation
- **Detailed Table** - Complete technique-by-group matrix
- **Summary Table** - High-level coverage statistics

## 🔧 Technical Features

### Performance Optimizations
- **Caching** - Streamlit cache decorators for improved performance
- **Lazy Loading** - Data loaded only when needed
- **Efficient Processing** - Optimized data structures and algorithms

### Responsive Design
- **Wide Layout** - Optimized for large displays and multiple monitors
- **Mobile Friendly** - Responsive design for various screen sizes
- **Scalable Components** - Charts and tables adapt to container size

## 📈 Use Cases

### 🎯 **Threat Intelligence Analysis**
- Analyze APT group capabilities and technique preferences
- Identify gaps in defensive coverage
- Track evolution of threat actor TTPs

### 🛡️ **Security Operations**
- Map observed techniques to known APT groups
- Assess threat sophistication levels
- Plan defensive countermeasures

### 📊 **Research & Reporting**
- Generate comprehensive threat intelligence reports
- Visualize technique adoption trends
- Compare APT group capabilities

### 🎓 **Education & Training**
- Understand MITRE ATT&CK framework structure
- Learn about APT group methodologies
- Practice threat intelligence analysis

## 🔄 Data Updates

The dashboard automatically loads the latest MITRE cache data. For manual updates:
1. Update the underlying MITRE cache
2. Restart the dashboard
3. Clear browser cache if needed

## 🤝 Contributing

To contribute to this project:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🛡️ Security Note

This dashboard is designed for cybersecurity professionals and researchers. The data displayed represents known threat actor techniques and should be used responsibly for defensive purposes only.

---

**Built with ❤️ for the Cybersecurity Community**
