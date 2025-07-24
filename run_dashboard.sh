#!/bin/bash
# Script to create a venv, install requirements, and run the Streamlit dashboard

echo "🚀 Starting MITRE CTI Dashboard Setup..."

# Define the virtual environment directory
VENV_DIR="venv"

# Check if the virtual environment directory exists
if [ ! -d "$VENV_DIR" ]; then
    echo "🐍 Creating Python virtual environment..."
    python3 -m venv "$VENV_DIR"
    if [ $? -ne 0 ]; then
        echo "❌ Failed to create virtual environment. Please ensure python3 and venv are installed."
        exit 1
    fi
fi

# Activate the virtual environment
source "$VENV_DIR/bin/activate"

echo "✅ Virtual environment activated."

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