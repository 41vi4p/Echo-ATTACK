'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { APTGroup } from '@/types/mitre';
import { 
  Search, 
  Shield, 
  Target, 
  Database, 
  Filter,
  X
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="hacker-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Threat Intelligence Search
            </h1>
            <p className="text-muted-foreground">
              Search across APT groups, techniques, and software tools
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-2">
              <Search className="h-4 w-4 mr-2" />
              {searchResults.length} Results
            </Badge>
          </div>
        </div>
      </div>

      {/* Search Interface */}
      <Card className="hacker-card">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for APT groups, techniques, or software..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-lg h-12 bg-secondary/50 border-border"
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

            {/* Type Filters */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground mr-2">Filter by type:</span>
              {[
                { key: 'group', label: 'APT Groups', icon: Shield },
                { key: 'technique', label: 'Techniques', icon: Target },
                { key: 'software', label: 'Software', icon: Database },
              ].map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant={selectedTypes.includes(key) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleType(key)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              ))}
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
                    <div 
                      key={index} 
                      className="p-4 bg-secondary/30 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 ${color} flex-shrink-0 mt-1`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground mb-1">
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
                          </div>
                        </div>
                      </div>
                    </div>
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