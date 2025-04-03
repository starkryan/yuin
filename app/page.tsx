import React from 'react'
import { Hero } from '@/components/ui/animated-hero'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OTPMaya - Virtual Phone Numbers for SMS Verification',
  description: 'Get instant virtual phone numbers for all your SMS verification needs.',
}

export default function HomePage() {
  return (
    <div>
      <Hero />
    </div>
  )
}