import { Layers, Network, Database, Terminal, ArrowRightLeft, FileCode, BoxSelect } from 'lucide-react'

export const CATEGORIES = [
  { id: 'all', label: 'All Topics', icon: <Layers size={14} className="text-foreground" /> },
  { id: 'algorithms', label: 'Algorithms', icon: <Network size={14} className="text-[#ffa116]" /> },
  { id: 'database', label: 'Database', icon: <Database size={14} className="text-blue-500" /> },
  { id: 'shell', label: 'Shell', icon: <Terminal size={14} className="text-green-500" /> },
  { id: 'concurrency', label: 'Concurrency', icon: <ArrowRightLeft size={14} className="text-purple-500" /> },
  { id: 'javascript', label: 'JavaScript', icon: <FileCode size={14} className="text-yellow-400" /> },
  { id: 'pandas', label: 'pandas', icon: <BoxSelect size={14} className="text-[#ab68ff]" /> },
]
