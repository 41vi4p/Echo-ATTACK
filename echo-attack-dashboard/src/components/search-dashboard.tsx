'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { APTGroup } from '@/types/mitre';
import { parseMitreLinks, MitreLink } from '@/lib/mitre-links';
import { 
  Search, 
  Shield, 
  Target, 
  Database, 
  Filter,
  X,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface SearchDashboardProps {
  aptGroups: { [key: string]: APTGroup };
}

interface SearchResult {
  type: 'group' | 'technique' | 'software';
  id: string;
  name: string;
  description: string;
  groupName?: string;
  groupId?: string;
  used?: boolean;
}

export default function SearchDashboard({ aptGroups }: SearchDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['group', 'technique', 'software']);

  // Get detailed information for a search result
  const getDetailedInfo = (result: SearchResult) => {
    const group = Object.values(aptGroups).find(g => g.attack_id === result.groupId || g.name === result.name);
    
    if (result.type === 'group' && group) {
      return {
        group,
        technique: null,
        software: null
      };
    }
    
    if (result.type === 'technique' && group) {
      const technique = group.technique_table_data.find(t => 
        t.id === result.id || 
        t.subtechniques.some(st => `${t.id}.${st.id}` === result.id)
      );
      const subTechnique = technique?.subtechniques.find(st => `${technique.id}.${st.id}` === result.id);
      
      return {
        group,
        technique: subTechnique || technique,
        software: null
      };
    }
    
    if (result.type === 'software' && group) {
      const software = group.software_data?.find(s => s.id === result.id);
      return {
        group,
        technique: null,
        software
      };
    }
    
    return { group, technique: null, software: null };
  };

  // Search across all data
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const results: SearchResult[] = [];
    const term = searchTerm.toLowerCase();

    Object.entries(aptGroups).forEach(([, group]) => {
      // Search in groups
      if (selectedTypes.includes('group')) {
        if (group.name?.toLowerCase().includes(term) ||
            group.attack_id?.toLowerCase().includes(term) ||
            group.descr?.toLowerCase().includes(term)) {
          results.push({
            type: 'group',
            id: group.attack_id,
            name: group.name,
            description: (group.descr || 'No description available').slice(0, 200) + '...',
          });
        }
      }

      // Search in techniques
      if (selectedTypes.includes('technique')) {
        group.technique_table_data.forEach(technique => {
          if (technique.name?.toLowerCase().includes(term) ||
              technique.id?.toLowerCase().includes(term) ||
              technique.descr?.toLowerCase().includes(term)) {
            results.push({
              type: 'technique',
              id: technique.id,
              name: technique.name,
              description: technique.descr?.slice(0, 200) + '...' || 'No description available',
              groupName: group.name,
              groupId: group.attack_id,
              used: technique.technique_used,
            });
          }

          // Search in sub-techniques
          technique.subtechniques.forEach(subtechnique => {
            if (subtechnique.name?.toLowerCase().includes(term) ||
                subtechnique.id?.toLowerCase().includes(term) ||
                subtechnique.descr?.toLowerCase().includes(term)) {
              results.push({
                type: 'technique',
                id: `${technique.id}.${subtechnique.id}`,
                name: subtechnique.name,
                description: (subtechnique.descr || 'No description available').slice(0, 200) + '...',
                groupName: group.name,
                groupId: group.attack_id,
                used: subtechnique.technique_used,
              });
            }
          });
        });
      }

      // Search in software
      if (selectedTypes.includes('software')) {
        group.software_data?.forEach(software => {
          if (software.name?.toLowerCase().includes(term) ||
              software.id?.toLowerCase().includes(term) ||
              software.description?.toLowerCase().includes(term)) {
            results.push({
              type: 'software',
              id: software.id,
              name: software.name,
              description: software.description?.slice(0, 200) + '...' || 'No description available',
              groupName: group.name,
              groupId: group.attack_id,
            });
          }
        });
      }
    });

    return results;
  }, [aptGroups, searchTerm, selectedTypes]);

  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'group': return Shield;
      case 'technique': return Target;
      case 'software': return Database;
      default: return Search;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'group': return 'text-blue-400';
      case 'technique': return 'text-green-400';
      case 'software': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'group': return 'default';
      case 'technique': return 'secondary';
      case 'software': return 'outline';
      default: return 'secondary';
    }
  };

  const DetailedView = ({ result }: { result: SearchResult }) => {
    const details = getDetailedInfo(result);
    const { group, technique, software } = details;

    if (!group) return <div>No detailed information available</div>;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
          {result.type === 'group' && <Shield className="h-6 w-6 text-blue-400" />}
          {result.type === 'technique' && <Target className="h-6 w-6 text-green-400" />}
          {result.type === 'software' && <Database className="h-6 w-6 text-purple-400" />}
          <div>
            <h3 className="text-lg font-semibold">{result.name}</h3>
            <p className="text-sm text-muted-foreground font-mono">{result.id}</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="group">APT Group</TabsTrigger>
            <TabsTrigger value="related">Related Data</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="hacker-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground leading-relaxed">
                  {result.type === 'group' && parseMitreLinks(group.descr || 'No description available')}
                  {result.type === 'technique' && technique && parseMitreLinks(technique.descr || 'No description available')}
                  {result.type === 'software' && software && parseMitreLinks(software.description || 'No description available')}
                </div>
              </CardContent>
            </Card>

            {result.type === 'technique' && technique && (
              <Card className="hacker-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Technique Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {technique.technique_used ? (
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
                    <span className="text-sm text-muted-foreground">
                      Status in {group.name}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="group" className="space-y-4">
            <Card className="hacker-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <MitreLink id={group.attack_id} type="group">
                    {group.name}
                  </MitreLink>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">ID:</span>
                    <span className="ml-2 font-medium font-mono">{group.attack_id}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <span className="ml-2 font-medium">{group.created}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Modified:</span>
                    <span className="ml-2 font-medium">{group.modified}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Version:</span>
                    <span className="ml-2 font-medium">{group.version}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {group.technique_table_data.filter(t => t.technique_used).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Active Techniques</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {group.software_data?.length || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Software Tools</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">
                      {group.campaign_data?.length || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Campaigns</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="related" className="space-y-4">
            {result.type === 'group' && (
              <Card className="hacker-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Top Active Techniques
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {group.technique_table_data
                      .filter(t => t.technique_used)
                      .slice(0, 10)
                      .map((tech, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-secondary/20 rounded">
                          <div>
                            <MitreLink id={tech.id} type="technique" className="font-medium">
                              {tech.name}
                            </MitreLink>
                            <p className="text-xs text-muted-foreground font-mono">{tech.id}</p>
                          </div>
                          <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                            Active
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {(result.type === 'technique' || result.type === 'software') && (
              <Card className="hacker-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Other APT Groups Using This {result.type === 'technique' ? 'Technique' : 'Software'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {Object.values(aptGroups)
                      .filter(g => {
                        if (result.type === 'technique') {
                          return g.technique_table_data.some(t => 
                            (t.id === result.id && t.technique_used) ||
                            t.subtechniques.some(st => `${t.id}.${st.id}` === result.id && st.technique_used)
                          );
                        } else if (result.type === 'software') {
                          return g.software_data?.some(s => s.id === result.id);
                        }
                        return false;
                      })
                      .slice(0, 10)
                      .map((relatedGroup, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-secondary/20 rounded">
                          <div>
                            <MitreLink id={relatedGroup.attack_id} type="group" className="font-medium">
                              {relatedGroup.name}
                            </MitreLink>
                            <p className="text-xs text-muted-foreground font-mono">{relatedGroup.attack_id}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="hacker-card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Threat Intelligence Search
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Search across APT groups, techniques, and software tools
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="secondary" className="px-3 py-2 text-sm">
              <Search className="h-4 w-4 mr-2" />
              {searchResults.length} Results
            </Badge>
          </div>
        </div>
      </div>

      {/* Search Interface */}
      <Card className="hacker-card">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for APT groups, techniques, or software..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm sm:text-base lg:text-lg h-10 sm:h-12 bg-secondary/50 border-border"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              )}
            </div>

            {/* Type Filters */}
            <div className="space-y-3">
              <span className="text-sm font-medium text-muted-foreground">Filter by type:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'group', label: 'APT Groups', shortLabel: 'Groups', icon: Shield },
                  { key: 'technique', label: 'Techniques', shortLabel: 'Techniques', icon: Target },
                  { key: 'software', label: 'Software', shortLabel: 'Software', icon: Database },
                ].map(({ key, label, shortLabel, icon: Icon }) => (
                  <Button
                    key={key}
                    variant={selectedTypes.includes(key) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleType(key)}
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{shortLabel}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchTerm && (
        <Card className="hacker-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Search Results ({searchResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {searchResults.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {searchResults.map((result, index) => {
                  const Icon = getTypeIcon(result.type);
                  const color = getTypeColor(result.type);
                  
                  return (
                    <Dialog key={index}>
                      <DialogTrigger asChild>
                        <div 
                          className="p-4 bg-secondary/30 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-start gap-3">
                            <Icon className={`h-5 w-5 ${color} flex-shrink-0 mt-1`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                                    {result.name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                    {result.description}
                                  </p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant={getTypeBadgeVariant(result.type)}>
                                      {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                                    </Badge>
                                    <Badge variant="outline" className="font-mono text-xs">
                                      {result.id}
                                    </Badge>
                                    {result.groupName && (
                                      <Badge variant="secondary" className="text-xs">
                                        {result.groupName}
                                      </Badge>
                                    )}
                                    {result.used !== undefined && (
                                      <Badge 
                                        variant={result.used ? "default" : "secondary"}
                                        className={result.used ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
                                      >
                                        {result.used ? "Active" : "Inactive"}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <Eye className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Icon className={`h-5 w-5 ${color}`} />
                            {result.name} - Detailed Information
                          </DialogTitle>
                        </DialogHeader>
                        <DetailedView result={result} />
                      </DialogContent>
                    </Dialog>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p>Try adjusting your search terms or filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      {!searchTerm && (
        <Card className="hacker-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Search Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <h4 className="font-medium">APT Groups</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Search by group name, ID (G0001), or description to find specific threat actors
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-400" />
                  <h4 className="font-medium">Techniques</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Find attack techniques by name, MITRE ID (T1055), or description
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-purple-400" />
                  <h4 className="font-medium">Software</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Search for malware, tools, and software used by threat actors
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}