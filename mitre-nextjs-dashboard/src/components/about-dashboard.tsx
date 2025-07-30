'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Info,
  Shield,
  Code,
  Zap,
  Users,
  ExternalLink,
  Heart,
  Star,
  Cpu,
  Globe,
  Mail,
  AlertTriangle
} from 'lucide-react';

export default function AboutDashboard() {
  const version = "1.0.1";
  
  const developers = [
    {
      name: "David Porathur",
      github: "https://github.com/davidporathur", // Replace with actual GitHub URL
      linkedin: "https://linkedin.com/in/davidporathur", // Replace with actual LinkedIn URL
      email: "david.porathur@example.com" // Replace with actual email
    },
    {
      name: "Vanessa Rodrigues",
      github: "https://github.com/vanessarodrigues", // Replace with actual GitHub URL
      linkedin: "https://linkedin.com/in/vanessarodrigues", // Replace with actual LinkedIn URL
      email: "vanessa.rodrigues@example.com" // Replace with actual email
    }
  ];
  
  const techStack = [
    { name: "Next.js 15", description: "React framework with App Router", icon: Code },
    { name: "TypeScript", description: "Type-safe JavaScript", icon: Zap },
    { name: "shadcn/ui", description: "Modern UI component library", icon: Cpu },
    { name: "Tailwind CSS", description: "Utility-first CSS framework", icon: Star },
    { name: "Chart.js", description: "Interactive data visualizations", icon: Shield },
    { name: "Lucide React", description: "Beautiful icon library", icon: Heart },
  ];

  const features = [
    { name: "Interactive Dashboard", description: "Real-time threat intelligence overview" },
    { name: "APT Groups Analysis", description: "Comprehensive threat actor profiling" },
    { name: "Universal Search", description: "Search across all MITRE ATT&CK data" },
    { name: "Professional UI", description: "Modern, futuristic blue theme" },
    { name: "MITRE Integration", description: "Direct links to MITRE ATT&CK framework" },
    { name: "Responsive Design", description: "Works on desktop and mobile devices" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="hacker-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              About MITRE ATT&CK Dashboard
            </h1>
            <p className="text-muted-foreground">
              Modern threat intelligence platform for defensive security analysis
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-2">
              <Info className="h-4 w-4 mr-2" />
              Version {version}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Overview */}
        <Card className="hacker-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Project Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              This dashboard is a modern Next.js application that provides comprehensive analysis of 
              MITRE ATT&CK framework data. Originally converted from a Streamlit application, it offers 
              an intuitive interface for threat intelligence professionals and security researchers.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The platform focuses on defensive security analysis, providing tools for understanding 
              Advanced Persistent Threat (APT) groups, their techniques, tactics, procedures, and 
              the software tools they employ.
            </p>
            <div className="pt-4">
              <h4 className="font-semibold text-foreground mb-2">Purpose</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Threat intelligence analysis and research</li>
                <li>• Security awareness and education</li>
                <li>• Defensive planning and preparation</li>
                <li>• APT group behavior analysis</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Key Features */}
        <Card className="hacker-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Key Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-secondary/20 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">{feature.name}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technology Stack */}
      <Card className="hacker-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            Technology Stack
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {techStack.map((tech, index) => {
              const Icon = tech.icon;
              return (
                <div key={index} className="p-4 bg-secondary/30 rounded-lg border border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold text-foreground">{tech.name}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{tech.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Development Team */}
      <Card className="hacker-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Development Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {developers.map((developer, index) => (
              <div key={index} className="p-4 bg-secondary/30 rounded-lg border border-border">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">{developer.name}</h3>
                </div>
                
                <div className="flex justify-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href={developer.github} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      GitHub
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href={developer.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      LinkedIn
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Repository Information */}
      <Card className="hacker-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-primary" />
            Repository
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-foreground mb-2">Source Code</h4>
            <p className="text-sm text-muted-foreground mb-3">
              This project is open source and available on GitHub. Feel free to explore the code, 
              report issues, or contribute to the development.
            </p>
            <Button variant="default" asChild>
              <a 
                href="https://github.com/davidporathur/mitre-nextjs-dashboard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View on GitHub
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">Contributing</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>• Fork the repository</p>
              <p>• Create a feature branch</p>
              <p>• Make your changes</p>
              <p>• Submit a pull request</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">Issues & Support</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Found a bug or have a feature request? Please use the GitHub issue tracker.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://github.com/davidporathur/mitre-nextjs-dashboard/issues" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Report Issue
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Credits & Attribution */}
        <Card className="hacker-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Credits & Attribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-foreground mb-2">MITRE ATT&CK Framework</h4>
              <p className="text-sm text-muted-foreground mb-2">
                This dashboard utilizes data from the MITRE ATT&CK framework, a globally-accessible 
                knowledge base of adversary tactics and techniques.
              </p>
              <Button variant="outline" size="sm" asChild>
                <a 
                  href="https://attack.mitre.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Globe className="h-4 w-4" />
                  Visit MITRE ATT&CK
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-2">Development</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Developed as a modern replacement for Streamlit-based threat intelligence dashboards, 
                focusing on user experience and performance.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">Open Source Libraries</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• React ecosystem and Next.js framework</p>
                <p>• Radix UI primitives for accessibility</p>
                <p>• Tailwind CSS for styling</p>
                <p>• Chart.js for data visualization</p>
                <p>• Lucide React for iconography</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data & Disclaimer */}
        <Card className="hacker-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Data & Disclaimer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Data Source</h4>
              <p className="text-sm text-muted-foreground">
                All threat intelligence data is sourced from the official MITRE ATT&CK framework. 
                The data is used for educational and defensive security purposes only.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">Security Notice</h4>
              <p className="text-sm text-muted-foreground">
                This dashboard is designed exclusively for defensive security analysis. It provides 
                tools for understanding threats, not for conducting malicious activities.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">Data Accuracy</h4>
              <p className="text-sm text-muted-foreground">
                While every effort is made to ensure data accuracy, threat intelligence information 
                evolves rapidly. Always verify critical information with official MITRE sources.
              </p>
            </div>

            <div className="pt-2">
              <Badge variant="outline" className="text-xs">
                Educational Use Only
              </Badge>
              <Badge variant="outline" className="text-xs ml-2">
                Defensive Security
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Version Information */}
      <Card className="hacker-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Version Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">v{version}</div>
              <div className="text-sm text-muted-foreground">Current Version</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">Next.js 15</div>
              <div className="text-sm text-muted-foreground">Framework Version</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">TypeScript</div>
              <div className="text-sm text-muted-foreground">Language</div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-secondary/20 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground text-center">
              Built with modern web technologies for optimal performance and user experience. 
              See VERSION_CHANGELOG.md for detailed release notes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}