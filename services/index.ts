import services from './services.config.json'

export type ServiceConfig = {
  id: string
  name: string
  enabled: boolean
  tab: { label: string, icon: string, component: string }
  endpoint: string
  type: string
  description?: string
}

const getEnabledServices = (): ServiceConfig[] => {
  return (services as ServiceConfig[]).filter(s => s.enabled)
}

export { services, getEnabledServices }
