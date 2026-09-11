import "@fortawesome/fontawesome-free/css/fontawesome.min.css";
import "@fortawesome/fontawesome-free/css/solid.min.css";
import type { Metadata, Viewport } from "next";
import "./globals.css";

import { PublicEnv } from "@/public-env";
import { Roboto_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Providers } from "./providers";

const rawline = localFont({
  src: [
    {
      path: "../../public/fonts/rawline-100.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../../public/fonts/rawline-100i.ttf",
      weight: "100",
      style: "italic",
    },
    {
      path: "../../public/fonts/rawline-200.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../public/fonts/rawline-200i.ttf",
      weight: "200",
      style: "italic",
    },
    {
      path: "../../public/fonts/rawline-300.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/rawline-300i.ttf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../../public/fonts/rawline-400.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/rawline-400i.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/fonts/rawline-500.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/rawline-500i.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../../public/fonts/rawline-600.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/rawline-600i.ttf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../../public/fonts/rawline-700.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/rawline-700i.ttf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../../public/fonts/rawline-800.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/fonts/rawline-800i.ttf",
      weight: "800",
      style: "italic",
    },
    {
      path: "../../public/fonts/rawline-900.ttf",
      weight: "900",
      style: "normal",
    },
    {
      path: "../../public/fonts/rawline-900i.ttf",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-rawline",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Veracis",
    default: "Veracis",
  },
  description:
    "Vulnerabilidade Ético-Raciais, Ambientais, Clima e Impacto na Saúde",
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" dir="ltr">
      <body
        className={`${rawline.variable} ${robotoMono.variable} antialiased font-sans`}
      >
        <PublicEnv />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
