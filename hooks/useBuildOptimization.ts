import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  componentLoader, 
  incrementalProcessor, 
  contextManager,
  optimizeBuild,
  type BuildConfig,
  defaultBuildConfig
} from '../utils/buildOptimization';

interface BuildOptimizationState {
  isOptimized: boolean;
  memoryUsage: number;
  componentsLoaded: number;
  chunksProcessed: number;
  contextSize: number;
  availableSpace: number;
  isNearLimit: boolean;
  history: number[];
}

interface BuildOptimizationActions {
  optimizeMemory: () => void;
  preloadComponents: (paths: string[]) => Promise<void>;
  processIncrementally: (content: string, chunkId: string) => boolean;
  cleanup: () => void;
  updateConfig: (config: Partial<BuildConfig>) => void;
}

export const useBuildOptimization = (
  initialConfig: Partial<BuildConfig> = {}
): [BuildOptimizationState, BuildOptimizationActions] => {
  const [config, setConfig] = useState<BuildConfig>({
    ...defaultBuildConfig,
    ...initialConfig
  });
  
  const [state, setState] = useState<BuildOptimizationState>({
    isOptimized: false,
    memoryUsage: 0,
    componentsLoaded: 0,
    chunksProcessed: 0,
    contextSize: 0,
    availableSpace: 0,
    isNearLimit: false,
    history: []
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const pushHistory = useCallback((value: number) => {
    setState(prev => {
      const next = { ...prev }
      next.history = [...(prev.history || []), value].slice(-20)
      return next
    })
  }, [])

  const updateState = useCallback(() => {
    const stats = componentLoader.getStats();
    const contextSize = contextManager.getCurrentSize();
    const availableSpace = contextManager.getAvailableSpace();
    const isNearLimit = contextManager.isNearLimit();
    const percentage = (() => {
      const total = contextSize + availableSpace
      return total > 0 ? (contextSize / total) * 100 : 0
    })()
    
    setState(prev => ({
      ...prev,
      componentsLoaded: stats.loaded,
      chunksProcessed: incrementalProcessor.getProcessedCount(),
      contextSize,
      availableSpace,
      isNearLimit,
      memoryUsage: contextSize,
      isOptimized: stats.loaded > 0 && !isNearLimit
    }));

    pushHistory(percentage)
  }, [pushHistory]);

  useEffect(() => {
    updateState();
    intervalRef.current = setInterval(updateState, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [updateState]);

  const optimizeMemory = useCallback(() => {
    optimizeBuild.cleanup();
    updateState();
  }, [updateState]);

  const preloadComponents = useCallback(async (paths: string[]) => {
    const promises = paths.map(path => componentLoader.loadComponent(path));
    await Promise.allSettled(promises);
    updateState();
  }, [updateState]);

  const processIncrementally = useCallback((content: string, chunkId: string): boolean => {
    const shouldProcess = incrementalProcessor.shouldProcess(chunkId, content);
    if (shouldProcess) {
      incrementalProcessor.markProcessed(chunkId);
      contextManager.addContent(content.length);
      updateState();
    }
    return shouldProcess;
  }, [updateState]);

  const cleanup = useCallback(() => {
    optimizeBuild.cleanup();
    updateState();
  }, [updateState]);

  const updateConfig = useCallback((newConfig: Partial<BuildConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  useEffect(() => {
    if (state.isNearLimit && config.incrementalMode) {
      console.log('Near context limit, performing auto-cleanup...');
      optimizeMemory();
    }
  }, [state.isNearLimit, config.incrementalMode, optimizeMemory]);

  return [
    state,
    {
      optimizeMemory,
      preloadComponents,
      processIncrementally,
      cleanup,
      updateConfig
    }
  ];
};

export const useComponentOptimization = (componentName: string) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const loadComponent = useCallback(async (path: string) => {
    const startTime = performance.now();
    try {
      await componentLoader.loadComponent(path);
      const endTime = performance.now();
      setLoadTime(endTime - startTime);
      setIsLoaded(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Load failed'));
      setIsLoaded(false);
    }
  }, []);

  const unloadComponent = useCallback(() => {
    componentLoader.cleanup([]);
    setIsLoaded(false);
    setLoadTime(null);
  }, []);

  return {
    isLoaded,
    loadTime,
    error,
    loadComponent,
    unloadComponent
  };
};

export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState({
    used: 0,
    available: 0,
    percentage: 0
  });

  useEffect(() => {
    const updateMemoryInfo = () => {
      const used = contextManager.getCurrentSize();
      const available = contextManager.getAvailableSpace();
      const total = used + available;
      const percentage = total > 0 ? (used / total) * 100 : 0;
      setMemoryInfo({ used, available, percentage });
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 3000);
    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};
