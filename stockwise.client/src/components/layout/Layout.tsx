import type { ReactNode } from 'react';
import Header from './Header';
import { Toaster } from 'sonner';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-6">
        {children}
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
};

export default Layout; 