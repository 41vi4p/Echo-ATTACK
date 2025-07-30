import { APTGroup, OverviewMetrics, TechniqueUsage, TechniqueCounts, TechniqueNames } from '@/types/mitre';
import fs from 'fs';
import path from 'path';

export class MITREDataLoader {
  private aptGroups: { [key: string]: APTGroup } = {};
  private dataLoaded = false;

  async loadAPTGroups(): Promise<{ [key: string]: APTGroup }> {
    if (this.dataLoaded) {
      return this.aptGroups;
    }

    const dataDir = path.join(process.cwd(), 'data');
    
    try {
      const files = fs.readdirSync(dataDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      for (const file of jsonFiles) {
        const filePath = path.join(dataDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const groupData: APTGroup = JSON.parse(fileContent);
        
        // Initialize optional arrays if they don't exist
        if (!groupData.software_data) groupData.software_data = [];
        if (!groupData.campaign_data) groupData.campaign_data = [];
        
        this.aptGroups[groupData.attack_id] = groupData;
      }

      this.dataLoaded = true;
      return this.aptGroups;
    } catch (error) {
      console.error('Error loading APT group data:', error);
      return {};
    }
  }

  calculateOverviewMetrics(aptGroups: { [key: string]: APTGroup }): OverviewMetrics {
    const totalGroups = Object.keys(aptGroups).length;
    let totalTechniques = 0;
    let totalSoftware = 0;
    let usedMainTechniques = 0;
    let usedSubtechniques = 0;
    let totalCampaigns = 0;

    const tacticsUsed = new Set<string>();
    const allTechniques = new Set<string>();

    Object.values(aptGroups).forEach(group => {
      totalTechniques += group.technique_table_data.length;
      totalSoftware += group.software_data?.length || 0;
      totalCampaigns += group.campaign_data?.length || 0;

      group.technique_table_data.forEach(technique => {
        const techId = technique.id;
        if (techId) {
          allTechniques.add(techId);
        }

        if (technique.technique_used) {
          usedMainTechniques++;
          if (techId && !techId.includes('.')) {
            const tactic = techId.substring(0, 2);
            tacticsUsed.add(tactic);
          }
        }

        technique.subtechniques.forEach(subtechnique => {
          if (subtechnique.technique_used) {
            usedSubtechniques++;
          }
        });
      });
    });

    return {
      total_groups: totalGroups,
      total_techniques: totalTechniques,
      total_software: totalSoftware,
      used_main_techniques: usedMainTechniques,
      used_subtechniques: usedSubtechniques,
      total_campaigns: totalCampaigns,
      unique_techniques: allTechniques.size,
      tactics_covered: tacticsUsed.size
    };
  }

  createTTPMatrix(aptGroups: { [key: string]: APTGroup }): {
    allTechniques: TechniqueNames;
    aptUsage: TechniqueUsage;
  } {
    const allTechniques: TechniqueNames = {};
    const aptUsage: TechniqueUsage = {};

    // First pass: collect all techniques and their names
    Object.values(aptGroups).forEach(group => {
      aptUsage[group.name] = {};
      
      group.technique_table_data.forEach(technique => {
        const techId = technique.id;
        const techName = technique.name || 'Unknown';
        
        if (techId) {
          allTechniques[techId] = techName;
          aptUsage[group.name][techId] = technique.technique_used;
          
          // Add subtechniques
          technique.subtechniques.forEach(subtechnique => {
            const subId = `${techId}.${subtechnique.id}`;
            const subName = subtechnique.name || 'Unknown';
            
            if (subtechnique.id) {
              allTechniques[subId] = subName;
              aptUsage[group.name][subId] = subtechnique.technique_used;
            }
          });
        }
      });
    });

    return { allTechniques, aptUsage };
  }

  getTechniqueStats(aptGroups: { [key: string]: APTGroup }): {
    techniqueCounts: TechniqueCounts;
    techniqueNames: TechniqueNames;
  } {
    const techniqueCounts: TechniqueCounts = {};
    const techniqueNames: TechniqueNames = {};

    Object.values(aptGroups).forEach(group => {
      group.technique_table_data.forEach(technique => {
        const techId = technique.id;
        
        if (techId) {
          techniqueNames[techId] = technique.name || 'Unknown';
          
          if (technique.technique_used) {
            techniqueCounts[techId] = (techniqueCounts[techId] || 0) + 1;
          }
          
          // Add subtechniques
          technique.subtechniques.forEach(subtechnique => {
            const subId = `${techId}.${subtechnique.id}`;
            
            if (subtechnique.id) {
              techniqueNames[subId] = subtechnique.name || 'Unknown';
              
              if (subtechnique.technique_used) {
                techniqueCounts[subId] = (techniqueCounts[subId] || 0) + 1;
              }
            }
          });
        }
      });
    });

    return { techniqueCounts, techniqueNames };
  }
}

// Singleton instance
export const mitreLoader = new MITREDataLoader();