// src/app/layout.tsx
import './globals.css';
import Navbar from '@/components/Navbar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
