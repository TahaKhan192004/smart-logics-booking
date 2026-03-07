import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Meeting | Smart Logics Solution",
  description: "Schedule a 30-minute call with Smart Logics Solution",
  icons: {
    icon: "logics logo.png",  // place the file in /public folder
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}