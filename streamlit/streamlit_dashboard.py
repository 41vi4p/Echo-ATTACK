#!/usr/bin/env python3
"""
Streamlit Dashboard for MITRE Cache Data Visualization
Displays APT groups, techniques, and analytics from the cached MITRE data.
"""

import streamlit as st
import asyncio
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import sys
from pathlib import Path
from collections import Counter, defaultdict
import json

from streamlit.mitre_cache import MITRECache

# Page configuration
st.set_page_config(
    page_title="MITRE CTI Dashboard",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Set default light mode
if 'theme' not in st.session_state:
    st.session_state.theme = "Light"

# Custom CSS themes
def get_dark_theme():
    return """
    <style>
        /* Root variables for consistent theming */
        :root {
            --bg-primary: #0c0c0c;
            --bg-secondary: #1a1a1a;
            --bg-tertiary: #2d2d2d;
            --bg-card: #1e1e1e;
            --text-primary: #ffffff;
            --text-secondary: #b0b0b0;
            --text-muted: #808080;
            --border-color: #404040;
            --accent-color: #1f77b4;
            --success-color: #28a745;
            --danger-color: #dc3545;
            --warning-color: #ffc107;
            --info-color: #17a2b8;
        }
        
        /* Main app background */
        .stApp, .main .block-container, .css-1d391kg {
            background-color: var(--bg-primary) !important;
            color: var(--text-primary) !important;
        }
        
        /* Sidebar styling */
        section[data-testid="stSidebar"] {
            background-color: var(--bg-secondary) !important;
            border-right: 1px solid var(--border-color) !important;
        }
        
        /* Headers and text */
        h1, h2, h3, h4, h5, h6, p, span, div, label, 
        .stMarkdown, .markdown-text-container,
        [data-testid="metric-container"], .metric-container {
            color: var(--text-primary) !important;
        }
        
        /* Input elements */
        .stTextInput input, .stTextArea textarea, .stSelectbox select,
        [data-baseweb="select"], [data-baseweb="input"],
        .stRadio label, .stCheckbox label {
            background-color: var(--bg-tertiary) !important;
            color: var(--text-primary) !important;
            border: 1px solid var(--border-color) !important;
        }
        
        /* Buttons */
        .stButton button {
            background-color: var(--bg-tertiary) !important;
            color: var(--text-primary) !important;
            border: 1px solid var(--border-color) !important;
        }
        
        /* Dataframes and tables */
        .stDataFrame, [data-testid="dataframe"], 
        .dataframe, table, .ag-theme-streamlit {
            background-color: var(--bg-card) !important;
            color: var(--text-primary) !important;
            border: 1px solid var(--border-color) !important;
        }
        
        /* Table headers */
        .stDataFrame th, [data-testid="dataframe"] th,
        .ag-header-cell, .ag-header-cell-label {
            background-color: var(--bg-tertiary) !important;
            color: var(--text-primary) !important;
            border-bottom: 1px solid var(--border-color) !important;
        }
        
        /* Table cells */
        .stDataFrame td, [data-testid="dataframe"] td,
        .ag-cell {
            background-color: var(--bg-card) !important;
            color: var(--text-primary) !important;
            border-bottom: 1px solid var(--border-color) !important;
        }
        
        /* Metrics */
        [data-testid="metric-container"] {
            background-color: var(--bg-card) !important;
            border: 1px solid var(--border-color) !important;
            border-radius: 0.5rem;
            padding: 1rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        /* Expanders */
        .streamlit-expanderHeader {
            background-color: var(--bg-tertiary) !important;
            color: var(--text-primary) !important;
            border: 1px solid var(--border-color) !important;
        }
        
        /* Matrix table specific styling */
        .matrix-table {
            background-color: var(--bg-card) !important;
            border: 1px solid var(--border-color) !important;
            border-radius: 0.5rem;
        }
        
        .matrix-cell-used {
            background-color: var(--success-color) !important;
            color: white !important;
            text-align: center;
            font-weight: bold;
        }
        
        .matrix-cell-unused {
            background-color: var(--bg-tertiary) !important;
            color: var(--text-muted) !important;
            text-align: center;
        }
        
        /* Technique status colors */
        .technique-used { color: var(--success-color) !important; font-weight: bold; }
        .technique-unused { color: var(--danger-color) !important; font-weight: bold; }
        
        /* Cards */
        .custom-card {
            background-color: var(--bg-card) !important;
            border: 1px solid var(--border-color) !important;
            border-radius: 0.5rem;
            padding: 1rem;
            margin: 0.5rem 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        /* Scrollbars */
        ::-webkit-scrollbar {
            background: var(--bg-secondary);
            width: 8px;
        }
        ::-webkit-scrollbar-thumb {
            background: var(--border-color);
            border-radius: 4px;
        }
        
        /* Info/success/error messages */
        .stInfo, .stSuccess, .stError, .stWarning {
            background-color: var(--bg-tertiary) !important;
            color: var(--text-primary) !important;
            border: 1px solid var(--border-color) !important;
        }
        
        /* Spinner */
        .stSpinner {
            color: var(--text-primary) !important;
        }
        
        /* Select boxes */
        .stSelectbox > div > div {
            background-color: var(--bg-tertiary) !important;
            color: var(--text-primary) !important;
        }
        
        /* Radio buttons */
        .stRadio > div {
            background-color: var(--bg-card) !important;
            border-radius: 0.5rem;
            padding: 0.5rem;
        }
    </style>
    """

def get_light_theme():
    return """
    <style>
        :root {
            --bg-primary: #ffffff;
            --bg-secondary: #f8f9fa;
            --text-primary: #000000;
            --accent-color: #1f77b4;
        }
        
        .technique-used { color: #28a745; font-weight: bold; }
        .technique-unused { color: #dc3545; font-weight: bold; }
    </style>
    """



@st.cache_data(ttl=300)  # Cache for 5 minutes
def load_cache_data():
    """Load MITRE cache data with caching."""
    async def _load():
        cache = MITRECache()
        return await cache.load_mitre_data()
    
    # Run async function
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(_load())
    finally:
        loop.close()

@st.cache_data
def calculate_overview_metrics(apt_groups):
    """Calculate comprehensive overview metrics."""
    total_groups = len(apt_groups)
    total_techniques = 0
    total_software = 0
    used_main_techniques = 0
    used_subtechniques = 0
    total_campaigns = 0
    
    # MITRE ATT&CK Tactics
    tactics_used = set()
    all_techniques = set()
    
    for group in apt_groups.values():
        total_techniques += len(group.technique_table_data)
        total_software += len(group.software_data)
        total_campaigns += len(getattr(group, 'campaign_data', []))
        
        for technique in group.technique_table_data:
            tech_id = technique.get('id')
            if tech_id:
                all_techniques.add(tech_id)
            
            if technique.get('technique_used', False):
                used_main_techniques += 1
                # Extract tactic from technique (first part of technique ID)
                if tech_id and '.' not in tech_id:  # Main technique
                    tactic = tech_id.split('.')[0] if '.' in tech_id else tech_id[:2]
                    tactics_used.add(tactic)
                    
            for subtechnique in technique.get('subtechniques', []):
                if subtechnique.get('technique_used', False):
                    used_subtechniques += 1
    
    return {
        'total_groups': total_groups,
        'total_techniques': total_techniques,
        'total_software': total_software,
        'used_main_techniques': used_main_techniques,
        'used_subtechniques': used_subtechniques,
        'total_campaigns': total_campaigns,
        'unique_techniques': len(all_techniques),
        'tactics_covered': len(tactics_used)
    }

@st.cache_data
def create_ttp_matrix(apt_groups):
    """Create TTP (Tactics, Techniques, Procedures) matrix for APT groups."""
    # Get all unique techniques
    all_techniques = {}
    apt_usage = {}
    
    # First pass: collect all techniques and their names
    for group_id, group in apt_groups.items():
        apt_usage[group.name] = {}
        for technique in group.technique_table_data:
            tech_id = technique.get('id')
            tech_name = technique.get('name', 'Unknown')
            
            if tech_id:
                all_techniques[tech_id] = tech_name
                apt_usage[group.name][tech_id] = technique.get('technique_used', False)
                
                # Add subtechniques
                for subtechnique in technique.get('subtechniques', []):
                    sub_id = subtechnique.get('id')
                    sub_name = subtechnique.get('name', 'Unknown')
                    
                    if sub_id:
                        full_sub_id = f"{tech_id}.{sub_id}"
                        all_techniques[full_sub_id] = f"{tech_name}: {sub_name}"
                        apt_usage[group.name][full_sub_id] = subtechnique.get('technique_used', False)
    
    return all_techniques, apt_usage

@st.cache_data
def create_technique_coverage_stats(apt_groups):
    """Create detailed technique coverage statistics."""
    technique_stats = {}
    tactic_coverage = {}
    
    # MITRE ATT&CK Tactics mapping
    tactics_map = {
        'TA0001': 'Initial Access',
        'TA0002': 'Execution', 
        'TA0003': 'Persistence',
        'TA0004': 'Privilege Escalation',
        'TA0005': 'Defense Evasion',
        'TA0006': 'Credential Access',
        'TA0007': 'Discovery',
        'TA0008': 'Lateral Movement',
        'TA0009': 'Collection',
        'TA0010': 'Exfiltration',
        'TA0011': 'Command and Control',
        'TA0040': 'Impact'
    }
    
    for group_id, group in apt_groups.items():
        for technique in group.technique_table_data:
            tech_id = technique.get('id', '')
            tech_name = technique.get('name', 'Unknown')
            
            if tech_id and technique.get('technique_used', False):
                if tech_id not in technique_stats:
                    technique_stats[tech_id] = {
                        'name': tech_name,
                        'used_by': [],
                        'count': 0
                    }
                
                technique_stats[tech_id]['used_by'].append(group.name)
                technique_stats[tech_id]['count'] += 1
                
                # Map to tactic (simplified mapping based on technique ID)
                tactic_id = f"TA{tech_id[1:5]}" if tech_id.startswith('T') else None
                if tactic_id in tactics_map:
                    tactic_name = tactics_map[tactic_id]
                    if tactic_name not in tactic_coverage:
                        tactic_coverage[tactic_name] = set()
                    tactic_coverage[tactic_name].add(tech_id)
    
    return technique_stats, tactic_coverage, tactics_map

@st.cache_data
def get_technique_stats(apt_groups):
    """Calculate technique usage statistics efficiently."""
    technique_counts = Counter()
    technique_names = {}
    apt_technique_map = defaultdict(set)
    
    for group_id, group in apt_groups.items():
        for technique in group.technique_table_data:
            tech_id = technique.get('id')
            tech_name = technique.get('name', 'Unknown')
            
            if tech_id:
                technique_names[tech_id] = tech_name
                
                if technique.get('technique_used', False):
                    technique_counts[tech_id] += 1
                    apt_technique_map[tech_id].add(group.name)
                
                # Count subtechniques
                for subtechnique in technique.get('subtechniques', []):
                    sub_id = subtechnique.get('id')
                    sub_name = subtechnique.get('name', 'Unknown')
                    
                    if sub_id and subtechnique.get('technique_used', False):
                        full_sub_id = f"{tech_id}.{sub_id}"
                        technique_names[full_sub_id] = f"{tech_name}: {sub_name}"
                        technique_counts[full_sub_id] += 1
                        apt_technique_map[full_sub_id].add(group.name)
    
    return technique_counts, technique_names, apt_technique_map

def create_top_techniques_chart(technique_counts, technique_names, plotly_template):
    """Create the top techniques bar chart."""
    if not technique_counts:
        return None
        
    top_techniques = technique_counts.most_common(15)
    
    df_top = pd.DataFrame([
        {
            'Technique ID': tech_id,
            'Technique Name': (technique_names.get(tech_id, tech_id)[:50] + "..." 
                             if len(technique_names.get(tech_id, tech_id)) > 50 
                             else technique_names.get(tech_id, tech_id)),
            'APT Groups Count': count,
            'Full Name': technique_names.get(tech_id, tech_id)
        }
        for tech_id, count in top_techniques
    ])
    
    fig = px.bar(
        df_top, 
        x='APT Groups Count', 
        y='Technique Name',
        title='Top 15 Most Used MITRE Techniques',
        orientation='h',
        hover_data=['Technique ID', 'Full Name'],
        template=plotly_template
    )
    fig.update_layout(height=600, yaxis={'categoryorder': 'total ascending'})
    return fig

def show_overview(apt_groups, plotly_template):
    """Display comprehensive overview page."""
    st.header("📈 MITRE ATT&CK Overview")
    
    # Calculate metrics
    metrics = calculate_overview_metrics(apt_groups)
    
    # Main metrics row
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown("""
        <div class="custom-card">
            <h3>🏛️ APT Groups</h3>
            <h2 style="color: #1f77b4;">{}</h2>
            <p>Active Groups Analyzed</p>
        </div>
        """.format(metrics['total_groups']), unsafe_allow_html=True)
    
    with col2:
        st.markdown("""
        <div class="custom-card">
            <h3>🎯 Techniques</h3>
            <h2 style="color: #28a745;">{}</h2>
            <p>Unique Techniques Identified</p>
        </div>
        """.format(metrics['unique_techniques']), unsafe_allow_html=True)
    
    with col3:
        st.markdown("""
        <div class="custom-card">
            <h3>⚔️ Active TTPs</h3>
            <h2 style="color: #ffc107;">{}</h2>
            <p>Techniques in Use</p>
        </div>
        """.format(metrics['used_main_techniques']), unsafe_allow_html=True)
    
    with col4:
        st.markdown("""
        <div class="custom-card">
            <h3>🛠️ Software Tools</h3>
            <h2 style="color: #dc3545;">{}</h2>
            <p>Malware & Tools</p>
        </div>
        """.format(metrics['total_software']), unsafe_allow_html=True)
    
    # Secondary metrics row
    st.markdown("---")
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("📋 Total Techniques", metrics['total_techniques'])
    with col2:
        st.metric("🔧 Sub-techniques Used", metrics['used_subtechniques'])
    with col3:
        st.metric("🎭 Campaigns", metrics['total_campaigns'])
    with col4:
        coverage_pct = round((metrics['used_main_techniques'] / metrics['unique_techniques']) * 100, 1)
        st.metric("📊 Coverage %", f"{coverage_pct}%")
    
    # Technique usage analysis
    st.markdown("---")
    st.subheader("🎯 Top Techniques Analysis")
    
    technique_counts, technique_names, apt_technique_map = get_technique_stats(apt_groups)
    
    # Top techniques chart
    fig_top = create_top_techniques_chart(technique_counts, technique_names, plotly_template)
    if fig_top:
        st.plotly_chart(fig_top, use_container_width=True)
    
    # Technique coverage by tactic
    st.markdown("---")
    st.subheader("🏹 MITRE ATT&CK Tactics Coverage")
    
    technique_stats, tactic_coverage, tactics_map = create_technique_coverage_stats(apt_groups)
    
    # Display tactic coverage
    tactic_cols = st.columns(3)
    for i, (tactic, techniques) in enumerate(tactic_coverage.items()):
        with tactic_cols[i % 3]:
            st.markdown(f"""
            <div class="custom-card">
                <h4>{tactic}</h4>
                <h3 style="color: #28a745;">{len(techniques)}</h3>
                <p>Techniques</p>
            </div>
            """, unsafe_allow_html=True)

def show_apt_analysis(apt_groups, plotly_template):
    """Display APT group analysis page."""
    st.header("🏛️ APT Group Analysis")
    
    # Group selection
    group_names = sorted([f"{group.name} ({group_id})" for group_id, group in apt_groups.items()])
    selected_group = st.selectbox("🎯 Select APT Group for Analysis", group_names)
    
    if selected_group:
        # Extract group ID
        group_id = selected_group.split('(')[-1].strip(')')
        group = apt_groups[group_id]
        
        # Group header
        st.markdown(f"""
        <div class="custom-card">
            <h2>📋 {group.name} ({group_id})</h2>
            <p><strong>Created:</strong> {group.created}</p>
            <p><strong>Modified:</strong> {group.modified}</p>
            <p><strong>Version:</strong> {group.version}</p>
        </div>
        """, unsafe_allow_html=True)
        
        # Group metrics
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("🎯 Techniques", len(group.technique_table_data))
        with col2:
            st.metric("🛠️ Software", len(group.software_data))
        with col3:
            campaigns_count = len(getattr(group, 'campaign_data', []))
            st.metric("🎭 Campaigns", campaigns_count)
        
        # Aliases
        if hasattr(group, 'aliases_list') and group.aliases_list:
            st.markdown(f"**🎭 Aliases:** {', '.join(group.aliases_list)}")
        
        # Description
        with st.expander("📄 Description"):
            st.write(group.description)
        
        # Techniques analysis
        st.markdown("---")
        st.subheader("🎯 Techniques Analysis")
        
        df_techniques = create_techniques_dataframe(group)
        
        if df_techniques is not None and not df_techniques.empty:
            # Filter options
            col1, col2 = st.columns(2)
            with col1:
                show_used_only = st.checkbox("✅ Show only used techniques", value=True)
            with col2:
                technique_type = st.selectbox("📂 Filter by type", ["All", "Main Technique", "Subtechnique"])
            
            # Apply filters
            filtered_df = df_techniques.copy()
            if show_used_only:
                filtered_df = filtered_df[filtered_df['Used'] == '✅ Yes']
            if technique_type != "All":
                filtered_df = filtered_df[filtered_df['Type'] == technique_type]
            
            st.markdown(f"**📊 Showing {len(filtered_df)} of {len(df_techniques)} techniques**")
            
            st.dataframe(
                filtered_df,
                use_container_width=True,
                hide_index=True,
                column_config={
                    'Used': st.column_config.TextColumn('Used', width='small'),
                    'Type': st.column_config.TextColumn('Type', width='medium'),
                    'Description': st.column_config.TextColumn('Description', width='large')
                }
            )
        
        # Software analysis
        if group.software_data:
            st.markdown("---")
            st.subheader("🛠️ Software & Tools Analysis")
            
            software_data = []
            for software in group.software_data:
                software_data.append({
                    'ID': software.get('id', 'Unknown'),
                    'Name': software.get('name', 'Unknown'),
                    'Type': software.get('type', 'Unknown'),
                    'Description': software.get('descr', 'No description')[:150] + "...",
                    'Techniques': len(software.get('techniques', []))
                })
            
            df_software = pd.DataFrame(software_data)
            st.dataframe(df_software, use_container_width=True, hide_index=True)

def show_ttp_matrix(apt_groups):
    """Display TTP (Tactics, Techniques, Procedures) matrix."""
    st.header("🎯 TTP Matrix Analysis")
    st.markdown("**Comprehensive Tactics, Techniques & Procedures Matrix for APT Groups**")
    
    # Create matrix data
    all_techniques, apt_usage = create_ttp_matrix(apt_groups)
    
    # Matrix configuration
    col1, col2 = st.columns([1, 3])
    
    with col1:
        st.subheader("🔧 Matrix Controls")
        
        # Filters
        selected_groups = st.multiselect(
            "🏛️ Select APT Groups",
            list(apt_usage.keys()),
            default=list(apt_usage.keys())[:10]  # Show first 10 by default
        )
        
        technique_filter = st.selectbox(
            "🎯 Technique Filter",
            ["All Techniques", "Used Only", "Main Techniques Only", "Sub-techniques Only"]
        )
        
        display_format = st.radio(
            "📊 Display Format",
            ["Heatmap", "Detailed Table", "Summary Table"]
        )
    
    with col2:
        if not selected_groups:
            st.warning("⚠️ Please select at least one APT group to display the matrix.")
            return
        
        # Filter techniques based on selection
        filtered_techniques = {}
        for tech_id, tech_name in all_techniques.items():
            include = True
            
            if technique_filter == "Used Only":
                # Check if any selected group uses this technique
                used = any(apt_usage.get(group, {}).get(tech_id, False) for group in selected_groups)
                include = used
            elif technique_filter == "Main Techniques Only":
                include = '.' not in tech_id
            elif technique_filter == "Sub-techniques Only":
                include = '.' in tech_id
            
            if include:
                filtered_techniques[tech_id] = tech_name
        
        st.markdown(f"**📊 Matrix: {len(selected_groups)} Groups × {len(filtered_techniques)} Techniques**")
        
        if display_format == "Heatmap":
            show_ttp_heatmap(selected_groups, filtered_techniques, apt_usage)
        elif display_format == "Detailed Table":
            show_ttp_detailed_table(selected_groups, filtered_techniques, apt_usage)
        else:
            show_ttp_summary_table(selected_groups, filtered_techniques, apt_usage)

def show_ttp_heatmap(selected_groups, filtered_techniques, apt_usage):
    """Display TTP matrix as an enhanced graphical heatmap."""
    if not filtered_techniques:
        st.info("No techniques match the current filter criteria.")
        return
    
    # Create matrix data for heatmap
    matrix_data = []
    technique_labels = list(filtered_techniques.keys())
    technique_names = list(filtered_techniques.values())
    
    # Prepare hover text with technique names
    hover_text = []
    
    for group in selected_groups:
        row_data = []
        hover_row = []
        for tech_id, tech_name in filtered_techniques.items():
            used = apt_usage.get(group, {}).get(tech_id, False)
            row_data.append(1 if used else 0)
            
            # Create detailed hover text
            status = "✅ Used" if used else "❌ Not Used"
            hover_info = f"<b>{group}</b><br>{tech_id}: {tech_name[:50]}{'...' if len(tech_name) > 50 else ''}<br>{status}"
            hover_row.append(hover_info)
        
        matrix_data.append(row_data)
        hover_text.append(hover_row)
    
    # Create enhanced heatmap with better styling
    fig = go.Figure(data=go.Heatmap(
        z=matrix_data,
        x=technique_labels,
        y=selected_groups,
        text=hover_text,
        texttemplate="",
        hovertemplate="%{text}<extra></extra>",
        colorscale=[
            [0, "#ff0000"],      # Red for not used
            [0.5, '#ffc107'],    # Yellow for transition
            [1, '#28a745']       # Green for used
        ],
        showscale=True,
        colorbar=dict(
            title=dict(text="<b>Technique Usage</b>", side="right"),
            tickvals=[0, 0.5, 1],
            ticktext=["❌ Not Used", "⚠️ Partial", "✅ Used"],
            thickness=15,
            len=0.7,
            bgcolor="rgba(255,255,255,0.8)",
            bordercolor="rgba(0,0,0,0.2)",
            borderwidth=1
        ),
        zmid=0.5  # Set middle value for better color scaling
    ))
    
    # Enhanced layout with better styling
    fig.update_layout(
        title={
            'text': "🔥 <b>TTP Usage Heatmap Matrix</b><br><sub>Interactive Tactics, Techniques & Procedures Analysis</sub>",
            'x': 0.5,
            'xanchor': 'center',
            'font': {'size': 18, 'color': '#2c3e50'}
        },
        xaxis={
            'title': "<b>📊 MITRE ATT&CK Techniques</b>",
            'tickangle': 45,
            'tickfont': {'size': 10},
            'showgrid': True,
            'gridcolor': 'rgba(128,128,128,0.2)',
            'side': 'bottom'
        },
        yaxis={
            'title': "<b>🏛️ APT Groups</b>",
            'tickfont': {'size': 11},
            'showgrid': True,
            'gridcolor': 'rgba(128,128,128,0.2)',
            'autorange': 'reversed'  # Show first group at top
        },
        height=max(500, len(selected_groups) * 35 + 200),
        width=max(800, len(technique_labels) * 25 + 300),
        font={'family': 'Arial, sans-serif'},
        plot_bgcolor='rgba(248,249,250,0.8)',
        paper_bgcolor='white',
        margin=dict(l=150, r=100, t=100, b=150)
    )
    
    # Add grid lines for better readability
    fig.update_xaxes(showline=True, linewidth=1, linecolor='rgba(0,0,0,0.3)')
    fig.update_yaxes(showline=True, linewidth=1, linecolor='rgba(0,0,0,0.3)')
    
    st.plotly_chart(fig, use_container_width=True)
    
    # Add interactive technique details
    st.markdown("---")
    st.subheader("🔍 Interactive Technique Explorer")
    
    # Technique selection for detailed view
    selected_technique = st.selectbox(
        "Select a technique for detailed analysis:",
        options=list(filtered_techniques.keys()),
        format_func=lambda x: f"{x}: {filtered_techniques[x][:60]}{'...' if len(filtered_techniques[x]) > 60 else ''}"
    )
    
    if selected_technique:
        technique_name = filtered_techniques[selected_technique]
        st.markdown(f"### 📋 **{selected_technique}**: {technique_name}")
        
        # Show which groups use this technique
        using_groups = [group for group in selected_groups 
                       if apt_usage.get(group, {}).get(selected_technique, False)]
        not_using_groups = [group for group in selected_groups 
                           if not apt_usage.get(group, {}).get(selected_technique, False)]
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("#### ✅ **Groups Using This Technique:**")
            if using_groups:
                for group in using_groups:
                    st.markdown(f"- 🏛️ **{group}**")
            else:
                st.markdown("*No groups in current selection use this technique*")
        
        with col2:
            st.markdown("#### ❌ **Groups Not Using This Technique:**")
            if not_using_groups:
                for group in not_using_groups:
                    st.markdown(f"- 🏛️ {group}")
            else:
                st.markdown("*All selected groups use this technique*")
        
        # Usage statistics for this technique
        usage_rate = (len(using_groups) / len(selected_groups)) * 100 if selected_groups else 0
        st.markdown(f"**📊 Usage Rate:** {usage_rate:.1f}% ({len(using_groups)}/{len(selected_groups)} groups)")
    
    # Add summary statistics below the heatmap
    st.markdown("---")
    col1, col2, col3 = st.columns(3)
    
    # Calculate summary stats
    total_cells = len(selected_groups) * len(filtered_techniques)
    used_cells = sum(sum(row) for row in matrix_data)
    coverage_percentage = (used_cells / total_cells) * 100 if total_cells > 0 else 0
    
    with col1:
        st.metric(
            "📊 Total Matrix Coverage", 
            f"{coverage_percentage:.1f}%",
            f"{used_cells}/{total_cells} combinations"
        )
    
    with col2:
        # Most active group
        group_activity = [sum(row) for row in matrix_data]
        most_active_idx = group_activity.index(max(group_activity)) if group_activity else 0
        most_active_group = selected_groups[most_active_idx] if selected_groups else "None"
        st.metric(
            "🥇 Most Active Group", 
            most_active_group,
            f"{max(group_activity) if group_activity else 0} techniques"
        )
    
    with col3:
        # Most used technique
        if matrix_data:
            technique_usage = [sum(matrix_data[i][j] for i in range(len(matrix_data))) 
                             for j in range(len(technique_labels))]
            if technique_usage:
                most_used_idx = technique_usage.index(max(technique_usage))
                most_used_tech = technique_labels[most_used_idx]
                st.metric(
                    "🎯 Most Used Technique", 
                    most_used_tech,
                    f"{max(technique_usage)} groups"
                )

def show_ttp_detailed_table(selected_groups, filtered_techniques, apt_usage):
    """Display detailed TTP matrix table."""
    if not filtered_techniques:
        st.info("No techniques match the current filter criteria.")
        return
    
    # Create detailed table
    table_data = []
    
    for tech_id, tech_name in filtered_techniques.items():
        row = {
            'Technique ID': tech_id,
            'Technique Name': tech_name[:50] + "..." if len(tech_name) > 50 else tech_name,
            'Type': 'Sub-technique' if '.' in tech_id else 'Main Technique'
        }
        
        # Add usage for each group
        used_by = []
        for group in selected_groups:
            used = apt_usage.get(group, {}).get(tech_id, False)
            row[f"{group}"] = "✅" if used else "❌"
            if used:
                used_by.append(group)
        
        row['Used By Count'] = len(used_by)
        row['Coverage %'] = f"{(len(used_by)/len(selected_groups)*100):.1f}%"
        
        table_data.append(row)
    
    df_matrix = pd.DataFrame(table_data)
    
    # Sort by usage count
    df_matrix = df_matrix.sort_values('Used By Count', ascending=False)
    
    st.dataframe(
        df_matrix,
        use_container_width=True,
        hide_index=True,
        column_config={
            'Technique ID': st.column_config.TextColumn('ID', width='small'),
            'Type': st.column_config.TextColumn('Type', width='small'),
            'Used By Count': st.column_config.NumberColumn('Count', width='small'),
            'Coverage %': st.column_config.TextColumn('Coverage', width='small')
        }
    )

def show_ttp_summary_table(selected_groups, filtered_techniques, apt_usage):
    """Display summary TTP matrix table."""
    if not filtered_techniques:
        st.info("No techniques match the current filter criteria.")
        return
    
    # Create summary statistics
    summary_data = []
    
    for group in selected_groups:
        used_count = sum(1 for tech_id in filtered_techniques.keys() 
                        if apt_usage.get(group, {}).get(tech_id, False))
        
        coverage_pct = (used_count / len(filtered_techniques)) * 100 if filtered_techniques else 0
        
        summary_data.append({
            'APT Group': group,
            'Techniques Used': used_count,
            'Total Available': len(filtered_techniques),
            'Coverage %': f"{coverage_pct:.1f}%",
            'Maturity Level': get_maturity_level(coverage_pct)
        })
    
    df_summary = pd.DataFrame(summary_data)
    df_summary = df_summary.sort_values('Techniques Used', ascending=False)
    
    st.dataframe(
        df_summary,
        use_container_width=True,
        hide_index=True,
        column_config={
            'Techniques Used': st.column_config.NumberColumn('Used', width='small'),
            'Total Available': st.column_config.NumberColumn('Available', width='small'),
            'Coverage %': st.column_config.TextColumn('Coverage', width='small'),
            'Maturity Level': st.column_config.TextColumn('Level', width='medium')
        }
    )

def get_maturity_level(coverage_pct):
    """Determine APT maturity level based on technique coverage."""
    if coverage_pct >= 80:
        return "🔴 Advanced"
    elif coverage_pct >= 60:
        return "🟠 Intermediate"
    elif coverage_pct >= 40:
        return "🟡 Developing"
    elif coverage_pct >= 20:
        return "🔵 Basic"
    else:
        return "⚪ Limited"

def show_advanced_analytics(apt_groups, plotly_template):
    """Display advanced analytics page."""
    st.header("📊 Advanced Analytics")
    
    # Create analytics charts
    fig_group, fig_software = create_analytics_charts(apt_groups, plotly_template)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.plotly_chart(fig_group, use_container_width=True)
    
    with col2:
        if fig_software:
            st.plotly_chart(fig_software, use_container_width=True)
        else:
            st.info("No software data available for visualization.")
    
    # Additional analytics
    st.markdown("---")
    show_technique_trends(apt_groups, plotly_template)

def show_technique_trends(apt_groups, plotly_template):
    """Show technique usage trends and patterns."""
    st.subheader("📈 Technique Usage Trends")
    
    technique_counts, technique_names, apt_technique_map = get_technique_stats(apt_groups)
    
    if technique_counts:
        # Create trend analysis
        trend_data = []
        for tech_id, count in technique_counts.most_common(20):
            trend_data.append({
                'Technique': technique_names.get(tech_id, tech_id)[:30] + "...",
                'APT Groups': count,
                'Popularity': 'High' if count >= 5 else 'Medium' if count >= 3 else 'Low'
            })
        
        df_trends = pd.DataFrame(trend_data)
        
        fig = px.scatter(
            df_trends,
            x='APT Groups',
            y='Technique',
            color='Popularity',
            size='APT Groups',
            title='Technique Popularity Analysis',
            template=plotly_template
        )
        
        st.plotly_chart(fig, use_container_width=True)

def show_search(apt_groups):
    """Display search functionality."""
    st.header("🔍 Search & Analysis")
    
    search_term = st.text_input("🔎 Search for techniques, APT groups, or software:")
    
    if search_term:
        with st.spinner("🔄 Searching..."):
            search_results = perform_search(apt_groups, search_term)
        
        if search_results:
            st.success(f"✅ Found {len(search_results)} results for '{search_term}'")
            
            # Group results by type
            result_types = {}
            for result in search_results:
                result_type = result['Type']
                if result_type not in result_types:
                    result_types[result_type] = []
                result_types[result_type].append(result)
            
            # Display results by type
            for result_type, results in result_types.items():
                with st.expander(f"📂 {result_type} ({len(results)} results)"):
                    df_results = pd.DataFrame(results)
                    st.dataframe(df_results, use_container_width=True, hide_index=True)
        else:
            st.info(f"❌ No results found for '{search_term}'")

def perform_search(apt_groups, search_term):
    """Perform search across APT groups, techniques, and software."""
    search_results = []
    search_lower = search_term.lower()
    
    for group_id, group in apt_groups.items():
        # Search in group name and aliases
        if (search_lower in group.name.lower() or 
            any(search_lower in alias.lower() for alias in getattr(group, 'aliases_list', []))):
            search_results.append({
                'Type': 'APT Group',
                'Name': group.name,
                'ID': group_id,
                'Match': 'Group name/alias',
                'Details': f"Techniques: {len(group.technique_table_data)}, Software: {len(group.software_data)}"
            })
        
        # Search in techniques
        for technique in group.technique_table_data:
            if (search_lower in technique.get('name', '').lower() or 
                search_lower in technique.get('id', '').lower()):
                if technique.get('technique_used', False):
                    search_results.append({
                        'Type': 'Technique',
                        'Name': technique.get('name', 'Unknown'),
                        'ID': technique.get('id', 'Unknown'),
                        'Match': f'Used by {group.name}',
                        'Details': (technique.get('descr', '')[:100] + "..." 
                                  if technique.get('descr', '') else '')
                    })
            
            # Search in subtechniques
            for subtechnique in technique.get('subtechniques', []):
                if (search_lower in subtechnique.get('name', '').lower() or 
                    search_lower in subtechnique.get('id', '').lower()):
                    if subtechnique.get('technique_used', False):
                        search_results.append({
                            'Type': 'Subtechnique',
                            'Name': subtechnique.get('name', 'Unknown'),
                            'ID': f"{technique.get('id', '')}.{subtechnique.get('id', '')}",
                            'Match': f'Used by {group.name}',
                            'Details': (subtechnique.get('descr', '')[:100] + "..." 
                                      if subtechnique.get('descr', '') else '')
                        })
        
        # Search in software
        for software in group.software_data:
            if (search_lower in software.get('name', '').lower() or 
                search_lower in software.get('id', '').lower()):
                search_results.append({
                    'Type': 'Software',
                    'Name': software.get('name', 'Unknown'),
                    'ID': software.get('id', 'Unknown'),
                    'Match': f'Used by {group.name}',
                    'Details': f"Associated with {len(software.get('techniques', []))} techniques"
                })
    
    return search_results

@st.cache_data
def create_analytics_charts(apt_groups, plotly_template):
    """Create analytics charts for APT groups and software."""
    # APT groups by technique count
    group_technique_counts = [
        (group.name, len([t for t in group.technique_table_data if t.get('technique_used', False)]))
        for group in apt_groups.values()
    ]
    group_technique_counts.sort(key=lambda x: x[1], reverse=True)
    
    df_group_tech = pd.DataFrame(
        group_technique_counts[:15], 
        columns=['APT Group', 'Used Techniques Count']
    )
    
    fig_group = px.bar(
        df_group_tech,
        x='Used Techniques Count',
        y='APT Group',
        title='Top 15 APT Groups by Technique Usage',
        orientation='h',
        template=plotly_template
    )
    fig_group.update_layout(height=500, yaxis={'categoryorder': 'total ascending'})
    
    # Software distribution
    software_counts = Counter()
    for group in apt_groups.values():
        for software in group.software_data:
            software_counts[software.get('name', 'Unknown')] += 1
    
    fig_software = None
    if software_counts:
        top_software = software_counts.most_common(10)
        df_software = pd.DataFrame(top_software, columns=['Software', 'APT Groups Count'])
        
        fig_software = px.pie(
            df_software,
            values='APT Groups Count',
            names='Software',
            title='Top 10 Most Used Software/Tools',
            template=plotly_template
        )
    
    return fig_group, fig_software

def create_techniques_dataframe(group):
    """Create techniques dataframe for a specific group."""
    techniques_data = []
    
    for technique in group.technique_table_data:
        main_used = technique.get('technique_used', False)
        
        techniques_data.append({
            'ID': technique.get('id', 'Unknown'),
            'Name': technique.get('name', 'Unknown'),
            'Type': 'Main Technique',
            'Used': '✅ Yes' if main_used else '❌ No',
            'Description': (technique.get('descr', '')[:100] + "..." 
                          if technique.get('descr', '') else 'No description')
        })
        
        # Add subtechniques
        for subtechnique in technique.get('subtechniques', []):
            sub_used = subtechnique.get('technique_used', False)
            techniques_data.append({
                'ID': f"{technique.get('id', '')}.{subtechnique.get('id', '')}",
                'Name': f"└─ {subtechnique.get('name', 'Unknown')}",
                'Type': 'Subtechnique',
                'Used': '✅ Yes' if sub_used else '❌ No',
                'Description': (subtechnique.get('descr', '')[:100] + "..." 
                              if subtechnique.get('descr', '') else 'No description')
            })
    
    return pd.DataFrame(techniques_data) if techniques_data else None

def main():
    # Apply default light theme
    st.markdown(get_light_theme(), unsafe_allow_html=True)
    
    # Header
    st.title("🛡️ MITRE CTI Dashboard")
    st.markdown("**Comprehensive Interactive Dashboard for MITRE ATT&CK Data Analysis**")
    st.markdown("*Advanced Persistent Threat (APT) Groups, Techniques, Tactics & Procedures Analysis*")
    
    # Load data
    with st.spinner("🔄 Loading MITRE cache data..."):
        apt_groups = load_cache_data()
    
    if not apt_groups:
        st.error("❌ Failed to load MITRE cache data")
        return
    
    st.sidebar.header("📊 Dashboard Controls")
    
    # Theme toggle (keeping for user preference)
    theme = st.sidebar.radio("🎨 Select Theme", ["Light", "Dark"], index=0)
    plotly_template = "plotly_dark" if theme == "Dark" else "plotly"
    
    if theme == "Dark":
        st.markdown(get_dark_theme(), unsafe_allow_html=True)
    
    # Navigation
    st.sidebar.markdown("---")
    page = st.sidebar.selectbox(
        "📑 Navigate to",
        ["📈 Overview", "🏛️ APT Analysis", "🎯 TTP Matrix", "📊 Advanced Analytics", "🔍 Search"]
    )
    
    if page == "📈 Overview":
        show_overview(apt_groups, plotly_template)
    elif page == "🏛️ APT Analysis":
        show_apt_analysis(apt_groups, plotly_template)
    elif page == "🎯 TTP Matrix":
        show_ttp_matrix(apt_groups)
    elif page == "📊 Advanced Analytics":
        show_advanced_analytics(apt_groups, plotly_template)
    elif page == "🔍 Search":
        show_search(apt_groups)
    
    # Footer
    st.markdown("---")
    st.markdown("""
    <div style='text-align: center; color: #808080; padding: 20px;'>
        <p>🛡️ <strong>MITRE CTI Dashboard</strong> | 
        📊 Data from MITRE ATT&CK Framework | 
        🔥 Powered by Streamlit</p>
        <p>Advanced Persistent Threat Intelligence & Analysis Platform</p>
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()