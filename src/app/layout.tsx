import type { Metadata } from "next";
import "./globals.css";
import SWRProvider from "@/components/providers/SWRProvider";

export const metadata: Metadata = {
  title: "AI Chat - Claude Chatbot",
  description: "A simple and intuitive AI chatbot powered by Anthropic Claude API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <SWRProvider>
          {children}
        </SWRProvider>
      </body>
    </html>
  );
}
