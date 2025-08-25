export interface Project {
  id: string
  title: string
  description: string
  status: 'idea' | 'in_progress' | 'published'
  category: string
  createdAt: string
  updatedAt: string
  userId: string
  healthScore: number
  lastHealthCheck: string
  dependencies: string[]
  roadmapItems: RoadmapItem[]
  generatedAssets: GeneratedAsset[]
}

export interface RoadmapItem {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  projectId: string
  createdAt: string
}

export interface GeneratedAsset {
  id: string
  type: 'page' | 'component' | 'form' | 'funnel'
  name: string
  content: string
  projectId: string
  createdAt: string
}

export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string
  projectId?: string
}
