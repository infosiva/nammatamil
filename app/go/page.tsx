import { Suspense } from 'react'
import GoClient from './GoClient'

export const metadata = {
  title: 'Opening article… | NammaTamil',
  robots: { index: false, follow: false },
}

export default function GoPage() {
  return (
    <Suspense fallback={<div style={{ background: '#07010f', minHeight: '100vh' }} />}>
      <GoClient />
    </Suspense>
  )
}
