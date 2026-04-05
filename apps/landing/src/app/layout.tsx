import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Radar — Unified React Native Developer Tools",
  description:
    "One tool to replace React DevTools, Flipper, and Reactotron. Console, network, components, profiler, and performance — unified.",
  openGraph: {
    title: "Radar — Unified React Native Developer Tools",
    description:
      "One tool to replace React DevTools, Flipper, and Reactotron. Console, network, components, profiler, and performance — unified.",
    type: "website",
  },
};

const RootLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-bg-base text-text-primary font-ui antialiased">
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
