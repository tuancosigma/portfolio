import React from "react"
import type { Metadata } from 'next'
import { Instrument_Sans, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { CommandPalette } from '@/components/command-palette'
import { ScrollProgress } from '@/components/landing/scroll-progress'
import { SmoothScrollProvider } from '@/components/motion/smooth-scroll-provider'
import './globals.css'

const instrumentSans = Instrument_Sans({ 
  subsets: ["latin"],
  variable: '--font-instrument'
});

const instrumentSerif = Instrument_Serif({ 
  subsets: ["latin"],
  weight: "400",
  variable: '--font-instrument-serif'
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--font-jetbrains'
});

export const metadata: Metadata = {
  metadataBase: new URL('https://portfolio.tinyly90891.workers.dev'),
  title: 'Pham Minh Tuan — SOC / Blue Team Security Engineer',
  description: 'Blue Team mindset, log-driven detection. SOC Tier 1 candidate with hands-on experience in SIEM monitoring, alert triage, firewall/WAF configuration, and log-driven investigation.',
  generator: 'v0.app',
}

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Pham Minh Tuan",
  jobTitle: "Security Engineer Fresher — SOC / Blue Team",
  url: "https://portfolio.tinyly90891.workers.dev",
  email: "mailto:tinyly90891@gmail.com",
  sameAs: [
    "https://github.com/TuanSOC",
    "https://www.linkedin.com/in/tuan-pham-8abb3a335/",
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </head>
      <body className={`${instrumentSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <SmoothScrollProvider>
          <ScrollProgress />
          {children}
          <CommandPalette />
        </SmoothScrollProvider>
      </body>
    </html>
  )
}
