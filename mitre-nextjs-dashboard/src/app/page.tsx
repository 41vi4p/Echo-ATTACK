'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import OverviewDashboard from '@/components/overview-dashboard';
import APTGroupsDashboard from '@/components/apt-groups-dashboard';
import SearchDashboard from '@/components/search-dashboard';
import AboutDashboard from '@/components/about-dashboard';
import TTPMatrixDashboard from '@/components/ttp-matrix-dashboard';
import { APTGroup, OverviewMetrics } from '@/types/mitre';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview');
  const [aptGroups, setAptGroups] = useState<{ [key: string]: APTGroup }>({});
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const response = await fetch('/api/mitre-data');
        
        if (!response.ok) {
          throw new Error(`Failed to load data: ${response.statusText}`);
        }
        
        const data = await response.json();
        setAptGroups(data.aptGroups);
        setMetrics(data.metrics);
      } catch (err) {
        console.error('Error loading MITRE data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <Card className="hacker-card">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium neon-text terminal-font">
                LOADING THREAT INTELLIGENCE...
              </p>
              <p className="text-sm text-muted-foreground terminal-font mt-2">
                Analyzing APT groups and attack vectors
              </p>
              <div className="loading-pulse w-64 h-2 rounded mt-4"></div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-96">
          <Card className="hacker-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                SYSTEM ERROR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground terminal-font">{error}</p>
              <p className="text-xs text-muted-foreground terminal-font mt-2">
                Check system logs for detailed information
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!metrics) {
      return (
        <div className="flex items-center justify-center h-96">
          <Card className="hacker-card">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <AlertTriangle className="h-8 w-8 text-yellow-400 mb-4" />
              <p className="text-lg font-medium neon-text terminal-font">
                NO DATA AVAILABLE
              </p>
              <p className="text-sm text-muted-foreground terminal-font mt-2">
                Unable to load threat intelligence data
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return <OverviewDashboard aptGroups={aptGroups} metrics={metrics} />;
      case 'apt-analysis':
        return <APTGroupsDashboard aptGroups={aptGroups} />;
      case 'ttp-matrix':
        return <TTPMatrixDashboard aptGroups={aptGroups} />;
      case 'analytics':
        return (
          <div className="text-center py-20">
            <Card className="hacker-card max-w-md mx-auto">
              <CardContent className="p-8">
                <p className="text-lg neon-text terminal-font">ANALYTICS MODULE</p>
                <p className="text-muted-foreground terminal-font mt-2">Coming soon...</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'search':
        return <SearchDashboard aptGroups={aptGroups} />;
      case 'about':
        return <AboutDashboard />;
      default:
        return <OverviewDashboard aptGroups={aptGroups} metrics={metrics} />;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
}
