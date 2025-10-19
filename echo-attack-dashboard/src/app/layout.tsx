import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ECHO ATT&CK - Threat Intelligence Platform",
  description: "Advanced threat intelligence platform for MITRE ATT&CK framework analysis and defensive security research",
  keywords: "cybersecurity, MITRE ATT&CK, threat intelligence, APT groups, ECHO ATT&CK, defensive security",
  authors: [{ name: "David Porathur & Vanessa Rodrigues", url: "https://github.com/41vi4p/Echo-ATTACK" }],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛡️</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="overflow-x-hidden min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
