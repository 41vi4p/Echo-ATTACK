'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { APTGroup, OverviewMetrics } from '@/types/mitre';
import { 
  Shield, 
  Target, 
  Zap, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Activity,
  Database,
  Globe,
  Cpu
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface OverviewDashboardProps {
  aptGroups: { [key: string]: APTGroup };
  metrics: OverviewMetrics;
}

export default function OverviewDashboard({ aptGroups, metrics }: OverviewDashboardProps) {
  const [animatedMetrics, setAnimatedMetrics] = useState({
    total_groups: 0,
    unique_techniques: 0,
    used_main_techniques: 0,
    total_software: 0,
  });

  // Animate counters on mount
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    const targets = {
      total_groups: metrics.total_groups,
      unique_techniques: metrics.unique_techniques,
      used_main_techniques: metrics.used_main_techniques,
      total_software: metrics.total_software,
    };

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);

      setAnimatedMetrics({
        total_groups: Math.floor(targets.total_groups * easeOutProgress),
        unique_techniques: Math.floor(targets.unique_techniques * easeOutProgress),
        used_main_techniques: Math.floor(targets.used_main_techniques * easeOutProgress),
        total_software: Math.floor(targets.total_software * easeOutProgress),
      });

      if (step >= steps) {
        clearInterval(timer);
        setAnimatedMetrics(targets);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [metrics]);

  // Prepare top techniques data
  const topTechniques = Object.values(aptGroups)
    .flatMap(group => group.technique_table_data.filter(t => t.technique_used))
    .reduce((acc, technique) => {
      acc[technique.id] = {
        name: technique.name,
        count: (acc[technique.id]?.count || 0) + 1
      };
      return acc;
    }, {} as Record<string, { name: string; count: number }>);

  const topTechniquesArray = Object.entries(topTechniques)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 10);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'rgb(96, 165, 250)',
          font: {
            family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: 'rgb(148, 163, 184)',
        bodyColor: 'rgb(203, 213, 225)',
        borderColor: 'rgb(96, 165, 250)',
        borderWidth: 1,
        cornerRadius: 8,
      }
    },
    scales: {
      x: {
        ticks: {
          color: 'rgb(148, 163, 184)',
          font: {
            family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            size: 11
          }
        },
        grid: {
          color: 'rgba(96, 165, 250, 0.1)'
        }
      },
      y: {
        ticks: {
          color: 'rgb(148, 163, 184)',
          font: {
            family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            size: 11
          }
        },
        grid: {
          color: 'rgba(96, 165, 250, 0.1)'
        }
      }
    }
  };

  const topTechniquesChart = {
    labels: topTechniquesArray.map(([id, data]) => `${id}: ${data.name.slice(0, 20)}...`),
    datasets: [
      {
        label: 'Usage Count',
        data: topTechniquesArray.map(([, data]) => data.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',  // Blue
          'rgba(16, 185, 129, 0.8)',  // Emerald
          'rgba(245, 158, 11, 0.8)',  // Amber
          'rgba(239, 68, 68, 0.8)',   // Red
          'rgba(139, 92, 246, 0.8)',  // Violet
          'rgba(236, 72, 153, 0.8)',  // Pink
          'rgba(6, 182, 212, 0.8)',   // Cyan
          'rgba(34, 197, 94, 0.8)',   // Green
          'rgba(251, 146, 60, 0.8)',  // Orange
          'rgba(168, 85, 247, 0.8)',  // Purple
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(6, 182, 212, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(251, 146, 60, 1)',
          'rgba(168, 85, 247, 1)',
        ],
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  const coverageData = {
    labels: ['Used Techniques', 'Unused Techniques'],
    datasets: [
      {
        data: [metrics.used_main_techniques, metrics.unique_techniques - metrics.used_main_techniques],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',   // Green for used
          'rgba(239, 68, 68, 0.8)',   // Red for unused
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 3,
        hoverBackgroundColor: [
          'rgba(34, 197, 94, 0.9)',
          'rgba(239, 68, 68, 0.9)',
        ],
        hoverBorderWidth: 4,
      },
    ],
  };

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    description, 
    animatedValue,
    suffix = ""
  }: {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    description: string;
    animatedValue?: number;
    suffix?: string;
  }) => (
    <Card className="hacker-card hover:shadow-xl transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3 p-3 sm:p-6">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</CardTitle>
        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${color} flex-shrink-0`} />
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0">
        <div className={`text-xl sm:text-2xl lg:text-3xl font-bold ${color} mb-1 sm:mb-2`}>
          {animatedValue !== undefined ? animatedValue : value}{suffix}
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
          {description}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* System Status Header */}
      <div className="hacker-card p-4 sm:p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2 leading-tight">
              ECHO ATT&CK Intelligence Platform
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
              Advanced Persistent Threat Analysis & Real-time Monitoring
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 flex-shrink-0">
            <Badge variant="destructive" className="px-3 py-2 text-sm">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Active Threats: </span>{metrics.total_groups}
            </Badge>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-primary">
              <Globe className="h-4 w-4" />
              <span className="font-medium">Global Monitoring</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="APT GROUPS"
          value={metrics.total_groups}
          animatedValue={animatedMetrics.total_groups}
          icon={Shield}
          color="text-primary"
          description="Active threat actors identified"
        />
        <MetricCard
          title="TECHNIQUES"
          value={metrics.unique_techniques}
          animatedValue={animatedMetrics.unique_techniques}
          icon={Target}
          color="text-yellow-400"
          description="Unique attack vectors mapped"
        />
        <MetricCard
          title="ACTIVE TTPS"
          value={metrics.used_main_techniques}
          animatedValue={animatedMetrics.used_main_techniques}
          icon={Zap}
          color="text-red-400"
          description="Techniques currently in use"
        />
        <MetricCard
          title="MALWARE TOOLS"
          value={metrics.total_software}
          animatedValue={animatedMetrics.total_software}
          icon={Database}
          color="text-purple-400"
          description="Software & tools catalogued"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="SUB-TECHNIQUES"
          value={metrics.used_subtechniques}
          icon={Activity}
          color="text-blue-400"
          description="Detailed attack methods"
        />
        <MetricCard
          title="CAMPAIGNS"
          value={metrics.total_campaigns}
          icon={Users}
          color="text-green-400"
          description="Documented operations"
        />
        <MetricCard
          title="COVERAGE"
          value={Math.round((metrics.used_main_techniques / metrics.unique_techniques) * 100)}
          icon={TrendingUp}
          color="text-orange-400"
          description="Technique utilization rate"
          suffix="%"
        />
        <MetricCard
          title="TACTICS"
          value={metrics.tactics_covered}
          icon={Cpu}
          color="text-cyan-400"
          description="MITRE ATT&CK tactics mapped"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Top Techniques Chart */}
        <Card className="hacker-card">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl font-semibold text-foreground">
              Top Attack Techniques
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="chart-container h-64 sm:h-80">
              <Bar data={topTechniquesChart} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Technique Coverage Chart */}
        <Card className="hacker-card">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl font-semibold text-foreground">
              Technique Coverage
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="chart-container h-64 sm:h-80 flex items-center justify-center">
              <Doughnut 
                data={coverageData} 
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: {
                      ...chartOptions.plugins.legend,
                      position: 'bottom' as const,
                    }
                  }
                }} 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="hacker-card">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Threat Intelligence Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {Object.values(aptGroups).slice(0, 5).map((group) => (
              <div key={group.attack_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg bg-secondary/30 border border-border hover:bg-secondary/50 transition-colors gap-2 sm:gap-0">
                <div className="flex items-center gap-3 min-w-0">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{group.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      <span className="font-mono">{group.attack_id}</span> • {group.technique_table_data.filter(t => t.technique_used).length} active techniques
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="px-2 py-1 text-xs self-start sm:self-center">
                  {group.modified}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}