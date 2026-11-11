import React from 'react';
import {
  Code2,
  BookOpen,
  PenTool,
  GraduationCap,
  Calendar,
  Sparkles,
  Folder,
  Layers,
  FileCode,
  Compass,
  Cpu,
  Bot,
  Terminal,
  Workflow,
  Search,
  CheckCircle,
  HelpCircle,
  Briefcase,
  Zap,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Code2,
  BookOpen,
  PenTool,
  GraduationCap,
  Calendar,
  Sparkles,
  Folder,
  Layers,
  FileCode,
  Compass,
  Cpu,
  Bot,
  Terminal,
  Workflow,
  Search,
  CheckCircle,
  HelpCircle,
  Briefcase,
  Zap,
};

export const AVAILABLE_ICONS = [
  'Code2',
  'BookOpen',
  'PenTool',
  'GraduationCap',
  'Calendar',
  'Sparkles',
  'Layers',
  'FileCode',
  'Briefcase',
  'Cpu',
  'Bot',
  'Terminal',
  'Workflow',
  'Zap',
];

export function CategoryIcon({
  name,
  className = 'w-5 h-5',
}: {
  name?: string;
  className?: string;
}) {
  const IconComponent = (name && ICON_MAP[name]) ? ICON_MAP[name] : Folder;
  return <IconComponent className={className} />;
}
