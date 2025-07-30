import { ExternalLink } from 'lucide-react';

export function parseMitreLinks(text: string): React.ReactNode {
  if (!text) return text;

  // Regex to match MITRE ATT&CK links in the format [Group Name](https://attack.mitre.org/groups/G0001)
  const linkRegex = /\[([^\]]+)\]\((https:\/\/attack\.mitre\.org\/[^)]+)\)/g;
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add the clickable link
    const linkText = match[1];
    const url = match[2];
    
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-primary hover:text-primary/80 underline decoration-primary/30 hover:decoration-primary/60 transition-colors"
      >
        {linkText}
        <ExternalLink className="h-3 w-3" />
      </a>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 1 ? <>{parts}</> : text;
}

export function getMitreGroupUrl(groupId: string): string {
  return `https://attack.mitre.org/groups/${groupId}`;
}

export function getMitreTechniqueUrl(techniqueId: string): string {
  return `https://attack.mitre.org/techniques/${techniqueId}`;
}

export function getMitreSoftwareUrl(softwareId: string): string {
  return `https://attack.mitre.org/software/${softwareId}`;
}

export function MitreLink({ 
  id, 
  type, 
  children,
  className = ""
}: { 
  id: string; 
  type: 'group' | 'technique' | 'software';
  children: React.ReactNode;
  className?: string;
}) {
  const getUrl = () => {
    switch (type) {
      case 'group': return getMitreGroupUrl(id);
      case 'technique': return getMitreTechniqueUrl(id);
      case 'software': return getMitreSoftwareUrl(id);
      default: return '#';
    }
  };

  return (
    <a
      href={getUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-primary hover:text-primary/80 underline decoration-primary/30 hover:decoration-primary/60 transition-colors ${className}`}
    >
      {children}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}