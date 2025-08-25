import React, { useEffect } from 'react'

export default function LazyComponentWrapper({ loadComponent }: { loadComponent: () => Promise<any> }) {
  useEffect(() => {
    let mounted = true
    loadComponent().catch(err => {
      if (mounted) console.error('Failed to load component', err)
    })
    return () => { mounted = false }
  }, [loadComponent])

  return null
}
