// Lazy Component Helper Functions
// Extracted to separate file for React Fast Refresh compatibility

import { componentLoader } from './buildOptimization'

// Higher-order component for lazy loading
export const withLazyLoading = (componentPath: string, options?: { fallback?: any; errorFallback?: any }) => {
  return (props: any) => {
    const LazyComponentWrapper = require('../components/LazyComponentWrapper').default
    return LazyComponentWrapper({
      componentPath,
      fallback: options?.fallback,
      errorFallback: options?.errorFallback,
      ...props
    })
  }
}

// Preload component for better UX
export const preloadComponent = async (componentPath: string): Promise<void> => {
  try {
    await componentLoader.loadComponent(componentPath)
  } catch (error) {
    console.warn(`Failed to preload component ${componentPath}:`, error)
  }
}

// Batch preload multiple components
export const preloadComponents = async (componentPaths: string[]): Promise<void> => {
  const promises = componentPaths.map(path => preloadComponent(path))
  await Promise.allSettled(promises)
}
