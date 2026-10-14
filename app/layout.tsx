import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './tailwind.generated.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ford Yude Canahuati - Portal Cautivo',
  description: 'Sistema de gestión de vCards y códigos QR',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
