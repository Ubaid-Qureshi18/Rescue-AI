import Sidebar from '@/components/Sidebar';
import AIChatWidget from '@/components/AIChatWidget';
import CommandPalette from '@/components/CommandPalette';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
      <AIChatWidget />
      <CommandPalette />
    </div>
  );
}
