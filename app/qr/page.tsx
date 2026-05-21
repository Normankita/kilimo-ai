'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { Sprout, Printer, ArrowLeft } from 'lucide-react'

export default function QRPage() {
  const [appUrl, setAppUrl] = useState(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourapp.vercel.app'
  )

  // On client, use the actual origin if env var is still the placeholder
  useEffect(() => {
    const env = process.env.NEXT_PUBLIC_APP_URL
    if (!env || env === 'https://yourapp.vercel.app') {
      setAppUrl(window.location.origin)
    }
  }, [])

  return (
    <>
      {/* Print-specific styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; }
          .print-card {
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      <div
        className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ backgroundColor: 'var(--bg)' }}
      >
        {/* Back link */}
        <div className="no-print w-full max-w-sm mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm hover:underline"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Rudi nyumbani
          </Link>
        </div>

        {/* Card */}
        <div
          className="print-card w-full max-w-sm rounded-3xl p-8 shadow-2xl border text-center"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: 'var(--primary)' }}>
              <Sprout className="h-9 w-9 text-white" />
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Kilimo AI</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Msaada wa Kilimo Tanzania
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-5">
            <div className="rounded-2xl p-3 bg-white shadow-inner">
              <QRCodeSVG
                value={appUrl}
                size={220}
                bgColor="#ffffff"
                fgColor="#2d5a27"
                level="H"
                includeMargin={false}
              />
            </div>
          </div>

          {/* CTA text */}
          <p className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>
            Scan ili kupakua Kilimo AI
          </p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Piga picha QR code kwa simu yako
          </p>

          {/* URL */}
          <div
            className="rounded-xl px-4 py-2 mb-5 font-mono text-xs break-all"
            style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-muted)' }}
          >
            {appUrl}
          </div>

          {/* Print button */}
          <button
            onClick={() => window.print()}
            className="no-print w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            <Printer className="h-4 w-4" />
            Chapisha QR Code
          </button>
        </div>

        {/* Attribution below card, hidden when printing */}
        <p className="no-print text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          © 2026 Kilimo AI · Haki zote zimehifadhiwa
        </p>
      </div>
    </>
  )
}
