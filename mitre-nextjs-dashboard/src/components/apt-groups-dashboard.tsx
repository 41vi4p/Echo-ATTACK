'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { APTGroup } from '@/types/mitre';
import { parseMitreLinks, MitreLink } from '@/lib/mitre-links';
import { 
  Search, 
  Shield, 
  Target, 
  Database, 
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Filter,
  BarChart3,
  Eye
} from 'lucide-react';

interface APTGroupsDashboardProps {
  aptGroups: { [key: string]: APTGroup };
}

export default function APTGroupsDashboard({ aptGroups }: APTGroupsDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<APTGroup | null>(null);
  const [filterUsedOnly, setFilterUsedOnly] = useState(false);

  // Filter and search APT groups
  const filteredGroups = useMemo(() => {
    return Object.entries(aptGroups).filter(([, group]) => {
      const matchesSearch = group.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           group.attack_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           group.descr?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [aptGroups, searchTerm]);

  // Group statistics
  const groupStats = useMemo(() => {
    if (!selectedGroup) return null;
    
    const usedTechniques = selectedGroup.technique_table_data.filter(t => t.technique_used).length;
    const totalTechniques = selectedGroup.technique_table_data.length;
    const usedSubtechniques = selectedGroup.technique_table_data
      .flatMap(t => t.subtechniques)
      .filter(st => st.technique_used).length;
    const totalSubtechniques = selectedGroup.technique_table_data
      .flatMap(t => t.subtechniques).length;
    
    return {
      usedTechniques,
      totalTechniques,
      usedSubtechniques,
      totalSubtechniques,
      softwareCount: selectedGroup.software_data?.length || 0,
      campaignCount: selectedGroup.campaign_data?.length || 0,
      usageRate: Math.round((usedTechniques / totalTechniques) * 100)
    };
  }, [selectedGroup]);

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }) => (
    <Card className="hacker-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="hacker-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              APT Groups Analysis
            </h1>
            <p className="text-muted-foreground">
              Detailed analysis of Advanced Persistent Threat groups and their tactics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-2">
              <Users className="h-4 w-4 mr-2" />
              {Object.keys(aptGroups).length} Groups
            </Badge>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="hacker-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search APT groups by name, ID, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary/50 border-border"
              />
            </div>
            <Button
              variant={filterUsedOnly ? "default" : "outline"}
              onClick={() => setFilterUsedOnly(!filterUsedOnly)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Active Only
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups List */}
        <div className="lg:col-span-1">
          <Card className="hacker-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                APT Groups ({filteredGroups.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {filteredGroups.map(([groupId, group]) => {
                  const usedTechniques = group.technique_table_data.filter(t => t.technique_used).length;
                  const totalTechniques = group.technique_table_data.length;
                  const isActive = selectedGroup?.attack_id === group.attack_id;
                  
                  return (
                    <div
                      key={groupId}
                      className={`p-4 border-b border-border cursor-pointer transition-colors hover:bg-secondary/50 ${
                        isActive ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                      }`}
                      onClick={() => setSelectedGroup(group)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{group.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{group.attack_id}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {usedTechniques}/{totalTechniques} techniques
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {group.software_data?.length || 0} tools
                            </Badge>
                          </div>
                        </div>
                        <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Group Details */}
        <div className="lg:col-span-2">
          {selectedGroup ? (
            <div className="space-y-6">
              {/* Group Overview */}
              <Card className="hacker-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-6 w-6 text-primary" />
                      <MitreLink id={selectedGroup.attack_id} type="group">
                        {selectedGroup.name}
                      </MitreLink>
                    </CardTitle>
                    <Badge variant="outline" className="px-3 py-1">
                      <MitreLink id={selectedGroup.attack_id} type="group" className="no-underline">
                        {selectedGroup.attack_id}
                      </MitreLink>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-muted-foreground leading-relaxed">
                      {parseMitreLinks(selectedGroup.descr || 'No description available')}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Created:</span>
                        <span className="ml-2 font-medium">{selectedGroup.created}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Modified:</span>
                        <span className="ml-2 font-medium">{selectedGroup.modified}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Version:</span>
                        <span className="ml-2 font-medium">{selectedGroup.version}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              {groupStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Techniques Used"
                    value={`${groupStats.usedTechniques}/${groupStats.totalTechniques}`}
                    subtitle={`${groupStats.usageRate}% coverage`}
                    icon={Target}
                    color="text-blue-400"
                  />
                  <StatCard
                    title="Sub-techniques"
                    value={`${groupStats.usedSubtechniques}/${groupStats.totalSubtechniques}`}
                    subtitle="Active variants"
                    icon={BarChart3}
                    color="text-green-400"
                  />
                  <StatCard
                    title="Software Tools"
                    value={groupStats.softwareCount}
                    subtitle="Malware & tools"
                    icon={Database}
                    color="text-purple-400"
                  />
                  <StatCard
                    title="Campaigns"
                    value={groupStats.campaignCount}
                    subtitle="Operations tracked"
                    icon={Calendar}
                    color="text-orange-400"
                  />
                </div>
              )}

              {/* Detailed Information */}
              <Card className="hacker-card">
                <CardContent className="p-0">
                  <Tabs defaultValue="techniques" className="w-full">
                    <div className="px-6 pt-6">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="techniques">Techniques</TabsTrigger>
                        <TabsTrigger value="software">Software</TabsTrigger>
                        <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="techniques" className="px-6 pb-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Target className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">Attack Techniques</h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Technique</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Sub-techniques</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedGroup.technique_table_data
                                .filter(t => !filterUsedOnly || t.technique_used)
                                .map((technique, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-mono text-sm">
                                    <MitreLink id={technique.id} type="technique">
                                      {technique.id}
                                    </MitreLink>
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{technique.name}</p>
                                      {technique.descr && (
                                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                          {parseMitreLinks(technique.descr.slice(0, 100) + '...')}
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
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
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {technique.subtechniques.filter(st => st.technique_used).length}/
                                      {technique.subtechniques.length}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="software" className="px-6 pb-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Database className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">Software & Tools</h3>
                        </div>
                        {selectedGroup.software_data && selectedGroup.software_data.length > 0 ? (
                          <div className="grid gap-3">
                            {selectedGroup.software_data.map((software, index) => (
                              <div key={index} className="p-4 bg-secondary/30 rounded-lg border border-border">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-semibold">
                                      <MitreLink id={software.id} type="software">
                                        {software.name}
                                      </MitreLink>
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1 font-mono">{software.id}</p>
                                    {software.description && (
                                      <div className="text-sm text-muted-foreground mt-2">
                                        {parseMitreLinks(software.description)}
                                      </div>
                                    )}
                                  </div>
                                  {software.type && (
                                    <Badge variant="outline">{software.type}</Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No software data available for this group</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="campaigns" className="px-6 pb-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Calendar className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">Campaigns & Operations</h3>
                        </div>
                        {selectedGroup.campaign_data && selectedGroup.campaign_data.length > 0 ? (
                          <div className="grid gap-3">
                            {selectedGroup.campaign_data.map((campaign, index) => (
                              <div key={index} className="p-4 bg-secondary/30 rounded-lg border border-border">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-semibold">{campaign.name}</h4>
                                    <p className="text-sm text-muted-foreground mt-1 font-mono">{campaign.id}</p>
                                    {campaign.description && (
                                      <div className="text-sm text-muted-foreground mt-2">
                                        {parseMitreLinks(campaign.description)}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right text-sm text-muted-foreground">
                                    {campaign.start_date && (
                                      <p>Start: {campaign.start_date}</p>
                                    )}
                                    {campaign.end_date && (
                                      <p>End: {campaign.end_date}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No campaign data available for this group</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="hacker-card">
              <CardContent className="p-12 text-center">
                <Shield className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Select an APT Group
                </h3>
                <p className="text-muted-foreground">
                  Choose a group from the list to view detailed information about their techniques, tools, and campaigns.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}