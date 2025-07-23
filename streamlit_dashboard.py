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

# Add src to path
sys.path.append('src')
from services.mitre_cache import MITRECache

# Page configuration
st.set_page_config(
    page_title="MITRE CTI Dashboard",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .metric-card {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 4px solid #1f77b4;
    }
    .apt-card {
        background-color: #ffffff;
        padding: 1rem;
        border-radius: 0.5rem;
        border: 1px solid #e0e0e0;
        margin: 0.5rem 0;
    }
    .technique-used {
        color: #28a745;
        font-weight: bold;
    }
    .technique-unused {
        color: #dc3545;
        font-weight: bold;
    }
</style>
""", unsafe_allow_html=True)

@st.cache_data
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

def get_technique_stats(apt_groups):
    """Calculate technique usage statistics."""
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

def main():
    # Header
    st.title("🛡️ MITRE CTI Dashboard")
    st.markdown("Interactive dashboard for MITRE ATT&CK data from APT groups")
    
    # Load data
    with st.spinner("Loading MITRE cache data..."):
        apt_groups = load_cache_data()
    
    if not apt_groups:
        st.error("Failed to load MITRE cache data")
        return
    
    # Sidebar
    st.sidebar.header("📊 Dashboard Controls")
    
    # Overview metrics
    st.header("📈 Overview")
    
    col1, col2, col3, col4 = st.columns(4)
    
    total_groups = len(apt_groups)
    total_techniques = sum(len(group.technique_table_data) for group in apt_groups.values())
    total_software = sum(len(group.software_data) for group in apt_groups.values())
    
    # Calculate used techniques
    used_main_techniques = 0
    used_subtechniques = 0
    
    for group in apt_groups.values():
        for technique in group.technique_table_data:
            if technique.get('technique_used', False):
                used_main_techniques += 1
            for subtechnique in technique.get('subtechniques', []):
                if subtechnique.get('technique_used', False):
                    used_subtechniques += 1
    
    with col1:
        st.metric("APT Groups", total_groups)
    with col2:
        st.metric("Total Techniques", total_techniques)
    with col3:
        st.metric("Used Main Techniques", used_main_techniques)
    with col4:
        st.metric("Software Tools", total_software)
    
    # Technique usage analysis
    st.header("🎯 Technique Usage Analysis")
    
    technique_counts, technique_names, apt_technique_map = get_technique_stats(apt_groups)
    
    if technique_counts:
        # Top techniques chart
        top_techniques = technique_counts.most_common(15)
        
        df_top = pd.DataFrame([
            {
                'Technique ID': tech_id,
                'Technique Name': technique_names.get(tech_id, tech_id)[:50] + "..." if len(technique_names.get(tech_id, tech_id)) > 50 else technique_names.get(tech_id, tech_id),
                'APT Groups Count': count,
                'Full Name': technique_names.get(tech_id, tech_id)
            }
            for tech_id, count in top_techniques
        ])
        
        fig_top = px.bar(
            df_top, 
            x='APT Groups Count', 
            y='Technique Name',
            title='Top 15 Most Used MITRE Techniques',
            orientation='h',
            hover_data=['Technique ID', 'Full Name']
        )
        fig_top.update_layout(height=600, yaxis={'categoryorder': 'total ascending'})
        st.plotly_chart(fig_top, use_container_width=True)
    
    # APT Group Analysis
    st.header("🏛️ APT Group Analysis")
    
    # Group selection
    group_names = sorted([f"{group.name} ({group_id})" for group_id, group in apt_groups.items()])
    selected_group = st.sidebar.selectbox("Select APT Group", group_names)
    
    if selected_group:
        # Extract group ID
        group_id = selected_group.split('(')[-1].strip(')')
        group = apt_groups[group_id]
        
        # Group details
        col1, col2 = st.columns([2, 1])
        
        with col1:
            st.subheader(f"📋 {group.name} ({group_id})")
            st.write(f"**Created:** {group.created}")
            st.write(f"**Modified:** {group.modified}")
            st.write(f"**Version:** {group.version}")
            
            if group.aliases_list:
                st.write(f"**Aliases:** {', '.join(group.aliases_list)}")
            
            with st.expander("Description"):
                st.write(group.description)
        
        with col2:
            st.metric("Techniques", len(group.technique_table_data))
            st.metric("Software", len(group.software_data))
            st.metric("Campaigns", len(group.campaign_data))
        
        # Techniques used by this group
        st.subheader("🎯 Techniques Used")
        
        techniques_data = []
        for technique in group.technique_table_data:
            main_used = technique.get('technique_used', False)
            
            techniques_data.append({
                'ID': technique.get('id', 'Unknown'),
                'Name': technique.get('name', 'Unknown'),
                'Type': 'Main Technique',
                'Used': '✅ Yes' if main_used else '❌ No',
                'Description': technique.get('descr', '')[:100] + "..." if technique.get('descr', '') else 'No description'
            })
            
            # Add subtechniques
            for subtechnique in technique.get('subtechniques', []):
                sub_used = subtechnique.get('technique_used', False)
                techniques_data.append({
                    'ID': f"{technique.get('id', '')}.{subtechnique.get('id', '')}",
                    'Name': f"└─ {subtechnique.get('name', 'Unknown')}",
                    'Type': 'Subtechnique',
                    'Used': '✅ Yes' if sub_used else '❌ No',
                    'Description': subtechnique.get('descr', '')[:100] + "..." if subtechnique.get('descr', '') else 'No description'
                })
        
        if techniques_data:
            df_techniques = pd.DataFrame(techniques_data)
            
            # Filter options
            show_used_only = st.checkbox("Show only used techniques", value=True)
            if show_used_only:
                df_techniques = df_techniques[df_techniques['Used'] == '✅ Yes']
            
            st.dataframe(
                df_techniques,
                use_container_width=True,
                hide_index=True,
                column_config={
                    'Used': st.column_config.TextColumn('Used', width='small'),
                    'Type': st.column_config.TextColumn('Type', width='small'),
                    'Description': st.column_config.TextColumn('Description', width='large')
                }
            )
        
        # Software used by this group
        if group.software_data:
            st.subheader("🛠️ Software & Tools")
            
            software_data = []
            for software in group.software_data:
                software_data.append({
                    'ID': software.get('id', 'Unknown'),
                    'Name': software.get('name', 'Unknown'),
                    'Description': software.get('descr', 'No description'),
                    'Techniques Count': len(software.get('techniques', []))
                })
            
            df_software = pd.DataFrame(software_data)
            st.dataframe(df_software, use_container_width=True, hide_index=True)
    
    # Search functionality
    st.header("🔍 Search & Analysis")
    
    search_term = st.text_input("Search for techniques, APT groups, or software:")
    
    if search_term:
        search_results = []
        search_lower = search_term.lower()
        
        for group_id, group in apt_groups.items():
            # Search in group name and aliases
            if (search_lower in group.name.lower() or 
                any(search_lower in alias.lower() for alias in group.aliases_list)):
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
                            'Details': technique.get('descr', '')[:100] + "..." if technique.get('descr', '') else ''
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
                                'Details': subtechnique.get('descr', '')[:100] + "..." if subtechnique.get('descr', '') else ''
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
        
        if search_results:
            st.write(f"Found {len(search_results)} results:")
            df_search = pd.DataFrame(search_results)
            st.dataframe(df_search, use_container_width=True, hide_index=True)
        else:
            st.info("No results found")
    
    # Statistics
    st.header("📊 Advanced Analytics")
    
    # Technique distribution
    col1, col2 = st.columns(2)
    
    with col1:
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
            orientation='h'
        )
        fig_group.update_layout(height=500, yaxis={'categoryorder': 'total ascending'})
        st.plotly_chart(fig_group, use_container_width=True)
    
    with col2:
        # Software distribution
        software_counts = Counter()
        for group in apt_groups.values():
            for software in group.software_data:
                software_counts[software.get('name', 'Unknown')] += 1
        
        if software_counts:
            top_software = software_counts.most_common(10)
            df_software = pd.DataFrame(top_software, columns=['Software', 'APT Groups Count'])
            
            fig_software = px.pie(
                df_software,
                values='APT Groups Count',
                names='Software',
                title='Top 10 Most Used Software/Tools'
            )
            st.plotly_chart(fig_software, use_container_width=True)
    
    # Footer
    st.markdown("---")
    st.markdown("*Dashboard powered by Streamlit | Data from MITRE ATT&CK Framework*")

if __name__ == "__main__":
    main()