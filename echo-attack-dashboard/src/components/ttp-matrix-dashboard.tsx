'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { APTGroup } from '@/types/mitre';
import { parseMitreLinks, MitreLink } from '@/lib/mitre-links';
import { 
  Target, 
  Shield, 
  Search, 
  Filter,
  Eye,
  BarChart3,
  Users,
  CheckCircle,
  XCircle,
  Activity,
  Zap,
  Globe,
  Lock,
  Cpu,
  Database,
  Network,
  FileText,
  AlertTriangle,
  X
} from 'lucide-react';

interface TTPMatrixDashboardProps {
  aptGroups: { [key: string]: APTGroup };
}

interface TacticInfo {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface TechniqueWithGroups {
  id: string;
  name: string;
  description: string;
  tactic: string;
  usedByGroups: Array<{
    groupId: string;
    groupName: string;
    used: boolean;
  }>;
  totalGroups: number;
  activeGroups: number;
}

const MITRE_TACTICS: TacticInfo[] = [
  { id: 'TA0001', name: 'Initial Access', description: 'Techniques used to gain initial access', icon: Globe, color: 'text-red-400' },
  { id: 'TA0002', name: 'Execution', description: 'Techniques that result in execution of code', icon: Zap, color: 'text-orange-400' },
  { id: 'TA0003', name: 'Persistence', description: 'Techniques to maintain presence', icon: Lock, color: 'text-yellow-400' },
  { id: 'TA0004', name: 'Privilege Escalation', description: 'Techniques to gain higher privileges', icon: AlertTriangle, color: 'text-amber-400' },
  { id: 'TA0005', name: 'Defense Evasion', description: 'Techniques to avoid detection', icon: Shield, color: 'text-lime-400' },
  { id: 'TA0006', name: 'Credential Access', description: 'Techniques to steal credentials', icon: Lock, color: 'text-green-400' },
  { id: 'TA0007', name: 'Discovery', description: 'Techniques to gain knowledge', icon: Search, color: 'text-teal-400' },
  { id: 'TA0008', name: 'Lateral Movement', description: 'Techniques to move through environment', icon: Network, color: 'text-cyan-400' },
  { id: 'TA0009', name: 'Collection', description: 'Techniques to gather information', icon: Database, color: 'text-sky-400' },
  { id: 'TA0010', name: 'Command and Control', description: 'Techniques to communicate with systems', icon: Cpu, color: 'text-blue-400' },
  { id: 'TA0011', name: 'Exfiltration', description: 'Techniques to steal data', icon: FileText, color: 'text-indigo-400' },
  { id: 'TA0040', name: 'Impact', description: 'Techniques to manipulate or destroy systems', icon: AlertTriangle, color: 'text-purple-400' },
];

export default function TTPMatrixDashboard({ aptGroups }: TTPMatrixDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTactic, setSelectedTactic] = useState<string>('all');
  const [selectedTechnique, setSelectedTechnique] = useState<TechniqueWithGroups | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // Extract all techniques with their usage information
  const allTechniques = useMemo(() => {
    const techniqueMap = new Map<string, TechniqueWithGroups>();

    Object.values(aptGroups).forEach(group => {
      group.technique_table_data.forEach(technique => {
        // Main technique
        if (!techniqueMap.has(technique.id)) {
          techniqueMap.set(technique.id, {
            id: technique.id,
            name: technique.name,
            description: technique.descr || '',
            tactic: getTacticFromTechniqueId(technique.id),
            usedByGroups: [],
            totalGroups: 0,
            activeGroups: 0
          });
        }

        const techData = techniqueMap.get(technique.id)!;
        techData.usedByGroups.push({
          groupId: group.attack_id,
          groupName: group.name,
          used: technique.technique_used
        });
        techData.totalGroups++;
        if (technique.technique_used) {
          techData.activeGroups++;
        }

        // Sub-techniques
        technique.subtechniques.forEach(subtechnique => {
          const subId = `${technique.id}.${subtechnique.id}`;
          if (!techniqueMap.has(subId)) {
            techniqueMap.set(subId, {
              id: subId,
              name: subtechnique.name,
              description: subtechnique.descr || '',
              tactic: getTacticFromTechniqueId(technique.id),
              usedByGroups: [],
              totalGroups: 0,
              activeGroups: 0
            });
          }

          const subTechData = techniqueMap.get(subId)!;
          subTechData.usedByGroups.push({
            groupId: group.attack_id,
            groupName: group.name,
            used: subtechnique.technique_used
          });
          subTechData.totalGroups++;
          if (subtechnique.technique_used) {
            subTechData.activeGroups++;
          }
        });
      });
    });

    return Array.from(techniqueMap.values());
  }, [aptGroups]);

  // Filter techniques based on search and filters
  const filteredTechniques = useMemo(() => {
    return allTechniques.filter(technique => {
      const matchesSearch = technique.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           technique.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           technique.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTactic = selectedTactic === 'all' || technique.tactic === selectedTactic;
      const matchesActive = !showActiveOnly || technique.activeGroups > 0;

      return matchesSearch && matchesTactic && matchesActive;
    });
  }, [allTechniques, searchTerm, selectedTactic, showActiveOnly]);

  // Group techniques by tactic
  const techniquesByTactic = useMemo(() => {
    const grouped = new Map<string, TechniqueWithGroups[]>();
    
    filteredTechniques.forEach(technique => {
      const tactic = technique.tactic;
      if (!grouped.has(tactic)) {
        grouped.set(tactic, []);
      }
      grouped.get(tactic)!.push(technique);
    });

    return grouped;
  }, [filteredTechniques]);

  // Generate tactic statistics (always use all techniques, not filtered)
  const tacticStats = useMemo(() => {
    const allTechniquesByTactic = new Map<string, TechniqueWithGroups[]>();
    
    allTechniques.forEach(technique => {
      const tactic = technique.tactic;
      if (!allTechniquesByTactic.has(tactic)) {
        allTechniquesByTactic.set(tactic, []);
      }
      allTechniquesByTactic.get(tactic)!.push(technique);
    });

    return MITRE_TACTICS.map(tactic => {
      const techniques = allTechniquesByTactic.get(tactic.name) || [];
      const totalTechniques = techniques.length;
      const activeTechniques = techniques.filter(t => t.activeGroups > 0).length;
      
      return {
        ...tactic,
        totalTechniques,
        activeTechniques,
        coverage: totalTechniques > 0 ? Math.round((activeTechniques / totalTechniques) * 100) : 0
      };
    });
  }, [allTechniques]);

  function getTacticFromTechniqueId(techniqueId: string): string {
    // This is a simplified mapping - in a real implementation, you'd have a proper mapping
    const tacticMappings: { [key: string]: string } = {
      'T1566': 'Initial Access', 'T1078': 'Initial Access', 'T1190': 'Initial Access',
      'T1059': 'Execution', 'T1053': 'Execution', 'T1204': 'Execution',
      'T1547': 'Persistence', 'T1543': 'Persistence', 'T1136': 'Persistence',
      'T1055': 'Privilege Escalation', 'T1134': 'Privilege Escalation',
      'T1027': 'Defense Evasion', 'T1036': 'Defense Evasion', 'T1070': 'Defense Evasion',
      'T1003': 'Credential Access', 'T1110': 'Credential Access', 'T1552': 'Credential Access',
      'T1087': 'Discovery', 'T1083': 'Discovery', 'T1057': 'Discovery',
      'T1021': 'Lateral Movement', 'T1210': 'Lateral Movement', 'T1550': 'Lateral Movement',
      'T1005': 'Collection', 'T1039': 'Collection', 'T1113': 'Collection',
      'T1071': 'Command and Control', 'T1090': 'Command and Control', 'T1573': 'Command and Control',
      'T1041': 'Exfiltration', 'T1048': 'Exfiltration', 'T1567': 'Exfiltration',
      'T1485': 'Impact', 'T1486': 'Impact', 'T1490': 'Impact'
    };

    // Extract base technique ID (remove sub-technique part)
    const baseId = techniqueId.split('.')[0];
    return tacticMappings[baseId] || 'Discovery'; // Default fallback
  }

  const TechniqueCard = ({ technique }: { technique: TechniqueWithGroups }) => {
    const usagePercentage = technique.totalGroups > 0 ? 
      Math.round((technique.activeGroups / technique.totalGroups) * 100) : 0;

    return (
      <Dialog>
        <DialogTrigger asChild>
          <div className="p-3 bg-secondary/30 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer group">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {technique.name}
                </h4>
                <p className="text-xs text-muted-foreground font-mono mt-1">{technique.id}</p>
              </div>
              <Eye className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={technique.activeGroups > 0 ? "default" : "secondary"} className="text-xs">
                  {technique.activeGroups}/{technique.totalGroups} groups
                </Badge>
                {technique.activeGroups > 0 && (
                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30">
                    {usagePercentage}% usage
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {technique.name} - Detailed Analysis
            </DialogTitle>
          </DialogHeader>
          <TechniqueDetailView technique={technique} />
        </DialogContent>
      </Dialog>
    );
  };

  const TechniqueDetailView = ({ technique }: { technique: TechniqueWithGroups }) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
        <Target className="h-6 w-6 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">{technique.name}</h3>
          <p className="text-sm text-muted-foreground font-mono">
            <MitreLink id={technique.id} type="technique">
              {technique.id}
            </MitreLink>
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">APT Usage</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="hacker-card">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground leading-relaxed">
                {parseMitreLinks(technique.description || 'No description available')}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <Card className="hacker-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{technique.totalGroups}</div>
                <div className="text-xs text-muted-foreground">Total Groups</div>
              </CardContent>
            </Card>
            <Card className="hacker-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{technique.activeGroups}</div>
                <div className="text-xs text-muted-foreground">Active Usage</div>
              </CardContent>
            </Card>
            <Card className="hacker-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {technique.totalGroups > 0 ? Math.round((technique.activeGroups / technique.totalGroups) * 100) : 0}%
                </div>
                <div className="text-xs text-muted-foreground">Usage Rate</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card className="hacker-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                APT Group Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {technique.usedByGroups.map((group, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-secondary/20 rounded">
                      <div>
                        <MitreLink id={group.groupId} type="group" className="font-medium">
                          {group.groupName}
                        </MitreLink>
                        <p className="text-xs text-muted-foreground font-mono">{group.groupId}</p>
                      </div>
                      {group.used ? (
                        <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="hacker-card">
              <CardHeader>
                <CardTitle>Usage Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Active Groups</span>
                    <span className="font-medium text-green-400">{technique.activeGroups}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Inactive Groups</span>
                    <span className="font-medium text-muted-foreground">
                      {technique.totalGroups - technique.activeGroups}
                    </span>
                  </div>
                  <div className="w-full bg-secondary/50 rounded-full h-2">
                    <div 
                      className="bg-green-400 h-2 rounded-full" 
                      style={{ 
                        width: `${technique.totalGroups > 0 ? (technique.activeGroups / technique.totalGroups) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hacker-card">
              <CardHeader>
                <CardTitle>Technique Classification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{technique.tactic}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This technique belongs to the {technique.tactic} tactic in the MITRE ATT&CK framework.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="hacker-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              TTP Matrix Analysis
            </h1>
            <p className="text-muted-foreground">
              Comprehensive view of Tactics, Techniques, and Procedures across APT groups
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-2">
              <Target className="h-4 w-4 mr-2" />
              {filteredTechniques.length} Techniques
            </Badge>
          </div>
        </div>
      </div>

      {/* Controls */}
      <Card className="hacker-card">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search techniques by name, ID, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary/50 border-border"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Tactic:</span>
                <div className="flex gap-1 flex-wrap">
                  <Button
                    variant={selectedTactic === 'all' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTactic('all')}
                  >
                    All Tactics
                  </Button>
                  {MITRE_TACTICS.slice(0, 6).map((tactic) => (
                    <Button
                      key={tactic.id}
                      variant={selectedTactic === tactic.name ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTactic(tactic.name)}
                      className="text-xs"
                    >
                      {tactic.name}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                variant={showActiveOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowActiveOnly(!showActiveOnly)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Active Only
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tactic Overview */}
      <Card className="hacker-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Tactic Coverage Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {tacticStats.map((tactic) => {
              const Icon = tactic.icon;
              return (
                <div
                  key={tactic.id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedTactic === tactic.name
                      ? 'bg-primary/20 border-primary/30'
                      : 'bg-secondary/30 border-border hover:bg-secondary/50'
                  }`}
                  onClick={() => setSelectedTactic(selectedTactic === tactic.name ? 'all' : tactic.name)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-4 w-4 ${tactic.color}`} />
                    <span className="font-medium text-xs">{tactic.name}</span>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">
                      {tactic.activeTechniques}/{tactic.totalTechniques}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {tactic.coverage}% coverage
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Techniques Matrix */}
      {selectedTactic === 'all' ? (
        // Show all tactics with their techniques
        <div className="space-y-6">
          {MITRE_TACTICS.map((tactic) => {
            const techniques = techniquesByTactic.get(tactic.name) || [];
            if (techniques.length === 0) return null;

            const Icon = tactic.icon;
            return (
              <Card key={tactic.id} className="hacker-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${tactic.color}`} />
                    {tactic.name} ({techniques.length} techniques)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {techniques.map((technique) => (
                      <TechniqueCard key={technique.id} technique={technique} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // Show selected tactic techniques
        <Card className="hacker-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {selectedTactic} Techniques ({filteredTechniques.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTechniques.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTechniques.map((technique) => (
                  <TechniqueCard key={technique.id} technique={technique} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No techniques found</h3>
                <p>Try adjusting your search terms or filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}