import './style.css'

export const metadata = {
  title: 'Sunflower Helper',
  description: 'Private Sunflower Land planner & optimizer',
}

export const viewport = {
  themeColor: '#f7c948',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f7c948" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" href="/icon-192.svg" type="image/svg+xml" />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(function(){});
          }
        `}} />
      </body>
    </html>
  )
}
