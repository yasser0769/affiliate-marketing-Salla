import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Salla Partners App',
  description: 'Dashboard for external product buttons on Salla products'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
