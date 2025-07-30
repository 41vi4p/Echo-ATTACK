export interface SubTechnique {
  technique_used: boolean;
  domain: string;
  id: string;
  name: string;
  descr: string;
  subtechniques: SubTechnique[];
}

export interface Technique {
  domain: string;
  id: string;
  name: string;
  technique_used: boolean;
  descr?: string;
  subtechniques: SubTechnique[];
}

export interface SoftwareData {
  id: string;
  name: string;
  description?: string;
  type?: string;
}

export interface CampaignData {
  id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
}

export interface APTGroup {
  attack_id: string;
  notes: string | null;
  created: string;
  modified: string;
  name: string;
  version: string;
  descr: string;
  technique_table_data: Technique[];
  software_data?: SoftwareData[];
  campaign_data?: CampaignData[];
}

export interface OverviewMetrics {
  total_groups: number;
  total_techniques: number;
  total_software: number;
  used_main_techniques: number;
  used_subtechniques: number;
  total_campaigns: number;
  unique_techniques: number;
  tactics_covered: number;
}

export interface TechniqueUsage {
  [groupName: string]: {
    [techniqueId: string]: boolean;
  };
}

export interface TechniqueCounts {
  [techniqueId: string]: number;
}

export interface TechniqueNames {
  [techniqueId: string]: string;
}