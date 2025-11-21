'use client'

import { NextStudio } from 'next-sanity/studio'
import config from '@/sanity.config'

export default function StudioPage() {
  return (
    <NextStudio 
      config={config}
      unstable_globalStyles={{
        __legacy_disableStudioNav: true
      }}
    />
  )
}
