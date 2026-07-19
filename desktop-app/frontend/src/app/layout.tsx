import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ahnara/ThemeProvider";
import { NicheProvider } from "@/components/ahnara/NicheContext";
import { AuthProvider } from "@/components/ahnara/AuthContext";
import { LocationProvider } from "@/components/ahnara/LocationContext";
import UpdatePrompt from "@/components/ahnara/UpdatePrompt";

// Local system-font fallbacks for offline sandbox compilation support
const dmSans = { variable: "font-dm-sans" };
const jetbrains = { variable: "font-jetbrains" };
const ibmPlexSans = { variable: "font-ibm-plex-sans" };

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
                <UpdatePrompt />
              </LocationProvider>
            </NicheProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
