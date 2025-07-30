'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  Shield, 
  BarChart3, 
  Target, 
  Search, 
  TrendingUp,
  Globe,
  Zap,
  Activity,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigationItems = [
  { id: 'overview', label: '📈 Overview', icon: BarChart3, description: 'Threat Intelligence Overview' },
  { id: 'apt-analysis', label: '🏛️ APT Groups', icon: Shield, description: 'Advanced Persistent Threats' },
  { id: 'ttp-matrix', label: '🎯 TTP Matrix', icon: Target, description: 'Tactics, Techniques & Procedures' },
  { id: 'analytics', label: '📊 Analytics', icon: TrendingUp, description: 'Advanced Analytics' },
  { id: 'search', label: '🔍 Search', icon: Search, description: 'Threat Intelligence Search' },
  { id: 'about', label: 'ℹ️ About', icon: Info, description: 'About This Dashboard' },
];

export default function DashboardLayout({ children, activeTab, onTabChange }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    // Set initial time and update every minute
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  const SidebarContent = ({ isCollapsed = false }: { isCollapsed?: boolean }) => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 border-b border-border">
        <div className="relative">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        {!isCollapsed && (
          <div>
            <h1 className="text-xl font-bold text-foreground font-sans">
              MITRE CTI Dashboard
            </h1>
            <p className="text-xs text-muted-foreground">
              Threat Intelligence Platform
            </p>
          </div>
        )}
      </div>

      {/* System Status */}
      {!isCollapsed && (
        <div className="p-4 border-b border-border">
          <div className="hacker-card p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">System Status</span>
              <div className="flex items-center gap-2">
                <Activity className="h-3 w-3 text-primary" />
                <span className="text-primary font-medium">Online</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Threat Level</span>
              <span className="text-orange-400 font-medium">Elevated</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Last Updated</span>
              <span className="text-primary font-medium">
                {currentTime || '--:--:--'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start gap-3'} h-14 transition-all duration-300 rounded-lg ${
                isActive 
                  ? 'bg-primary/20 border border-primary/30 text-primary' 
                  : 'hover:bg-secondary/80 hover:text-foreground'
              }`}
              onClick={() => {
                onTabChange(item.id);
                setSidebarOpen(false);
              }}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4" />
              {!isCollapsed && (
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </div>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Globe className="h-3 w-3" />
            <span className="font-medium">Global Threat Network</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Cpu className="h-3 w-3" />
            <span className="font-medium">AI Analysis Engine</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className={`hidden md:flex ${sidebarCollapsed ? 'md:w-20' : 'md:w-80'} md:flex-col border-r border-border bg-card/50 backdrop-blur-lg transition-all duration-300`}>
        <div className="relative h-full">
          <SidebarContent isCollapsed={sidebarCollapsed} />
          {/* Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute -right-3 top-6 h-6 w-6 rounded-full bg-background border border-border shadow-md z-10"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-4 left-4 z-50 neon-border"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0 bg-card/95 backdrop-blur-lg">
          <SidebarContent isCollapsed={false} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          {/* Header Bar */}
          <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="md:hidden">
                  <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="border border-border">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                  </Sheet>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {navigationItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Real-time threat intelligence analysis
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                  <Zap className="h-3 w-3 text-primary" />
                  <span className="font-medium">Live Data Feed</span>
                </div>
                <Button variant="outline" size="sm" className="border-primary/30 bg-primary/10">
                  <Activity className="h-3 w-3 mr-2 text-primary" />
                  <span className="font-medium">Monitoring</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}