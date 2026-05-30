import type { Metadata, Viewport } from "next";
import "./globals.css";

const TITLE = "AI Supply Chain Map — Del silicio al modelo";
const DESCRIPTION =
  "La cadena de suministro de la IA en 8 capas y ~37 compañías públicas — desde la arena de silicio hasta los hyperscalers. Los cuellos de botella son las oportunidades.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "AI Supply Chain Map",
  authors: [{ name: "MC Designs" }],
  icons: { icon: "/assets/favicon.svg" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "es",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0C0E",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Set the stored theme before first paint to avoid a flash. Default is dark.
const themeInit = `(function(){try{var t=localStorage.getItem('scm-theme');if(t==='light'){document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {children}
      </body>
    </html>
  );
}
