import '../legal.css';
import '../themes.css';
import { origin } from '../../lib/seo.mjs';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Geist, Geist_Mono } from 'next/font/google';
import { Header } from '../../components/header';
import { Footer } from '../../components/footer';
import { copy } from '../../lib/copy.mjs';
import '../globals.css';
const sans = Geist({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });
export const metadata = {
  metadataBase: new URL(origin),
  applicationName: 'Pulse Marketplace',
  title: { default: 'Pulse Marketplace', template: '%s · Pulse Marketplace' },
  description: 'Open-source modules for your self-hosted Pulse infrastructure.',
  robots: { index: false, follow: false },
  icons: { icon: '/assets/favicon.svg' },
};
const themeScript =
  "try{const t=localStorage.getItem('pulse-market.theme.v1');document.documentElement.dataset.theme=t==='light'?'light':'dark'}catch{}";
export default async function Layout({ children, params }) {
  const { lang } = await params;
  if (!['ru', 'en'].includes(lang)) notFound();
  return (
    <html
      lang={lang}
      data-theme="dark"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          {copy[lang].skip}
        </a>
        <Suspense fallback={null}>
          <Header lang={lang} preview={false} />
        </Suspense>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <div className="page-container">
          <Footer lang={lang} />
        </div>
      </body>
    </html>
  );
}
