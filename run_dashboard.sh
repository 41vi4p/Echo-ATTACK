#!/bin/bash
# Script to install requirements and run the Streamlit dashboard

echo "🚀 Starting MITRE CTI Dashboard Setup..."

# Check if we're in a virtual environment
if [[ "$VIRTUAL_ENV" != "" ]]; then
    echo "✅ Virtual environment detected: $VIRTUAL_ENV"
else
    echo "⚠️  No virtual environment detected. Consider using one."
fi

# Install requirements
echo "📦 Installing dashboard requirements..."
pip install -r dashboard_requirements.txt

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "✅ Requirements installed successfully"
else
    echo "❌ Failed to install requirements"
    exit 1
fi

# Run the dashboard
echo "🎭 Starting Streamlit dashboard..."
echo "📱 Dashboard will be available at: http://localhost:8501"
echo "🛑 Press Ctrl+C to stop the dashboard"
echo ""

streamlit run streamlit_dashboard.py