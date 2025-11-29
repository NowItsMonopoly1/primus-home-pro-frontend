import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PrimusHomePro - Roofing & Solar Solutions',
  description: 'Professional roofing and solar installation services',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
