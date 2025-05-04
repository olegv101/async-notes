import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Note Editor',
  description: 'A simple note editor application built with Next.js and Tailwind CSS. Made by Oleg.',
  authors: [{ name: 'Oleg' }],
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
