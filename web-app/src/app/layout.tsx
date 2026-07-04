import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ahnara/ThemeProvider";
import { NicheProvider } from "@/components/ahnara/NicheContext";
import { AuthProvider } from "@/components/ahnara/AuthContext";
import { LocationProvider } from "@/components/ahnara/LocationContext";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
});

export const metadata: Metadata = {
  title: "AntiFakeNG — Verified Genuine, Every Time",
  description: "A multi-tenant product authenticity and counterfeit-detection platform for manufacturers. Verify products in under a minute with no app download.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${jetbrains.variable} ${ibmPlexSans.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <NicheProvider>
              <LocationProvider>
                {children}
              </LocationProvider>
            </NicheProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
