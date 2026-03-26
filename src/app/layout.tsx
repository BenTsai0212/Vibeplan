import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vibe Planner',
  description: '個人 Vibe Coding 思考外腦',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant" className="h-full">
      <body className="h-full font-mono antialiased">{children}</body>
    </html>
  )
}
