import Sidebar from '@/components/Sidebar';
import AIChatWidget from '@/components/AIChatWidget';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
      <AIChatWidget />
    </div>
  );
}
