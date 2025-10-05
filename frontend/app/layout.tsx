import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FengShui.ai - AI-Powered Feng Shui Analysis",
  description: "Transform your space with AI-powered feng shui analysis. Upload a photo of your room and receive personalized insights, recommendations, and a 3D model based on ancient feng shui principles.",
  keywords: ["feng shui", "interior design", "AI analysis", "room analysis", "home design", "space optimization"],
  authors: [{ name: "FengShui.ai Team" }],
  creator: "FengShui.ai",
  publisher: "FengShui.ai",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),

  // Favicon and app icons
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'icon',
        url: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        rel: 'icon',
        url: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },

  // Web app manifest
  manifest: '/site.webmanifest',

  // Open Graph metadata for social sharing
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'FengShui.ai - AI-Powered Feng Shui Analysis',
    description: 'Transform your space with AI-powered feng shui analysis and personalized recommendations',
    siteName: 'FengShui.ai',
  },

  // Twitter card metadata
  twitter: {
    card: 'summary_large_image',
    title: 'FengShui.ai - AI-Powered Feng Shui Analysis',
    description: 'Transform your space with AI-powered feng shui analysis and personalized recommendations',
  },

  // Theme color for mobile browsers
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#9DBF9E' },
    { media: '(prefers-color-scheme: dark)', color: '#9DBF9E' },
  ],

  // Viewport settings
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
