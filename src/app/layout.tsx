import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VaultLua — Protect, license & distribute your Roblox scripts",
  description:
    "VaultLua is a developer infrastructure platform for licensing, protecting and distributing Roblox Lua/Luau scripts. HWID binding, session management, key system, reward links, REST API and analytics.",
  keywords: [
    "VaultLua",
    "Roblox",
    "Lua",
    "Luau",
    "script licensing",
    "HWID",
    "license keys",
    "developer platform",
    "SaaS",
  ],
  authors: [{ name: "VaultLua" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "VaultLua — Script Licensing & Distribution Platform",
    description:
      "Protect, license and distribute your Roblox scripts. HWID binding, sessions, reward links, REST API and analytics.",
    siteName: "VaultLua",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Pre-paint theme script: applies the stored/system theme class before
            first paint to avoid a flash of incorrect theme (FOUC). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('vaultlua-theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var d=t==='dark'||(!t||t==='system')&&m||t!=='light'&&m;if(d){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="vaultlua-theme"
        >
          {children}
          <Toaster />
          <Sonner />
        </ThemeProvider>
      </body>
    </html>
  );
}
