import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LOOPVYBZ - Caribbean News",
  description: "Caribbean News - Short Video Feed",
  themeColor: "#E31937",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  icons: {
    icon: "/favicon.svg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LOOPVYBZ",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then((reg) => console.log('SW registered'))
                  .catch((err) => console.log('SW error:', err));
              });
            }
          `
        }} />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: "#FFFFFF", overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
