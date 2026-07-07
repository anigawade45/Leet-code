import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import { Toaster } from "sonner";
import { SocketProvider } from "@/providers/SocketProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "LeetCode Clone",
  description: "Practice coding problems, prepare for interviews!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <style>{`
          /* Custom font declarations removed because the font files are not present in public/fonts. */
        `}</style>
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <SocketProvider>
              {children}
              <Toaster richColors closeButton theme="dark" position="top-right" />
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
