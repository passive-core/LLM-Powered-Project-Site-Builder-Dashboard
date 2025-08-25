import React, { useState, useEffect } from 'react'
import { Shield, Lock, Eye, EyeOff, AlertTriangle, CheckCircle, Key, Smartphone } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Input } from './ui/Input'
import { Switch } from './ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'

interface SecuritySettings {
  twoFactorEnabled: boolean
  sessionTimeout: number
  ipWhitelist: string[]
  accessLogging: boolean
  bruteForceProtection: boolean
  encryptionLevel: 'standard' | 'enhanced' | 'military'
}

interface SecurityLog {
  id: string
  timestamp: string
  event: string
  ipAddress: string
  userAgent: string
  status: 'success' | 'failed' | 'blocked'
}

export function SecuritySettings() {
  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    ipWhitelist: [],
    accessLogging: true,
    bruteForceProtection: true,
    encryptionLevel: 'enhanced'
  })
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([])
  const [newIpAddress, setNewIpAddress] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    loadSecuritySettings()
    loadSecurityLogs()
    generateApiKey()
  }, [user])

  const loadSecuritySettings = async () => {
    // In a real app, this would load from database
    // For now, using localStorage as demo
    const saved = localStorage.getItem('securitySettings')
    if (saved) {
      setSettings(JSON.parse(saved))
    }
  }

  const saveSecuritySettings = async (newSettings: SecuritySettings) => {
    setSettings(newSettings)
    localStorage.setItem('securitySettings', JSON.stringify(newSettings))
    
    // Log the security change
    const logEntry: SecurityLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      event: 'Security settings updated',
      ipAddress: '127.0.0.1', // In real app, get actual IP
      userAgent: navigator.userAgent,
      status: 'success'
    }
    
    setSecurityLogs(prev => [logEntry, ...prev.slice(0, 49)]) // Keep last 50 logs
  }

  const loadSecurityLogs = () => {
    // Demo security logs
    const demoLogs: SecurityLog[] = [
      {
        id: 'log_1',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        event: 'Successful login',
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/120.0.0.0',
        status: 'success'
      },
      {
        id: 'log_2',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        event: 'Failed login attempt',
        ipAddress: '203.0.113.42',
        userAgent: 'Unknown',
        status: 'failed'
      },
      {
        id: 'log_3',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        event: 'IP blocked due to suspicious activity',
        ipAddress: '198.51.100.1',
        userAgent: 'Bot/1.0',
        status: 'blocked'
      }
    ]
    setSecurityLogs(demoLogs)
  }

  const generateApiKey = () => {
    // Generate a secure API key
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = 'sk_'
    for (let i = 0; i < 48; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setApiKey(result)
  }

  const addIpToWhitelist = () => {
    if (!newIpAddress.trim()) return
    
    const newSettings = {
      ...settings,
      ipWhitelist: [...settings.ipWhitelist, newIpAddress.trim()]
    }
    saveSecuritySettings(newSettings)
    setNewIpAddress('')
  }

  const removeIpFromWhitelist = (ip: string) => {
    const newSettings = {
      ...settings,
      ipWhitelist: settings.ipWhitelist.filter(addr => addr !== ip)
    }
    saveSecuritySettings(newSettings)
  }

  const enable2FA = async () => {
    setIsLoading(true)
    // Simulate 2FA setup process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const newSettings = { ...settings, twoFactorEnabled: true }
    saveSecuritySettings(newSettings)
    setIsLoading(false)
  }

  const getSecurityScore = () => {
    let score = 0
    if (settings.twoFactorEnabled) score += 30
    if (settings.bruteForceProtection) score += 20
    if (settings.accessLogging) score += 15
    if (settings.ipWhitelist.length > 0) score += 20
    if (settings.encryptionLevel === 'military') score += 15
    else if (settings.encryptionLevel === 'enhanced') score += 10
    else score += 5
    return Math.min(score, 100)
  }

  const getStatusColor = (status: SecurityLog['status']) => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'failed': return 'text-yellow-600'
      case 'blocked': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const securityScore = getSecurityScore()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Settings</h2>
          <p className="text-muted-foreground">Protect your account and projects with advanced security features</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{securityScore}/100</div>
          <div className="text-sm text-muted-foreground">Security Score</div>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="logs">Security Logs</TabsTrigger>
          <TabsTrigger value="api">API Security</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          {/* Two-Factor Authentication */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {settings.twoFactorEnabled && (
                  <Badge variant="default">Enabled</Badge>
                )}
                <Switch
                  checked={settings.twoFactorEnabled}
                  onCheckedChange={(checked) => {
                    if (checked && !settings.twoFactorEnabled) {
                      enable2FA()
                    } else {
                      const newSettings = { ...settings, twoFactorEnabled: checked }
                      saveSecuritySettings(newSettings)
                    }
                  }}
                  disabled={isLoading}
                />
              </div>
            </div>
            {!settings.twoFactorEnabled && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Enable 2FA to significantly improve your account security. You'll need an authenticator app.
                </AlertDescription>
              </Alert>
            )}
          </Card>

          {/* Session Management */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">Session Management</h3>
                <p className="text-sm text-muted-foreground">Control how long you stay logged in</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Session Timeout (minutes)</label>
                <Input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => {
                    const newSettings = { ...settings, sessionTimeout: parseInt(e.target.value) || 30 }
                    saveSecuritySettings(newSettings)
                  }}
                  min="5"
                  max="480"
                  className="w-32"
                />
              </div>
            </div>
          </Card>

          {/* Encryption Level */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">Encryption Level</h3>
                <p className="text-sm text-muted-foreground">Choose your data encryption strength</p>
              </div>
            </div>
            <div className="space-y-3">
              {(['standard', 'enhanced', 'military'] as const).map(level => (
                <label key={level} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="encryption"
                    value={level}
                    checked={settings.encryptionLevel === level}
                    onChange={(e) => {
                      const newSettings = { ...settings, encryptionLevel: e.target.value as any }
                      saveSecuritySettings(newSettings)
                    }}
                    className="text-primary"
                  />
                  <div>
                    <div className="font-medium capitalize">{level} Encryption</div>
                    <div className="text-sm text-muted-foreground">
                      {level === 'standard' && 'AES-256 encryption (recommended for most users)'}
                      {level === 'enhanced' && 'AES-256 + RSA-4096 (high security applications)'}
                      {level === 'military' && 'Military-grade encryption (maximum security)'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="space-y-6">
          {/* IP Whitelist */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">IP Address Whitelist</h3>
                <p className="text-sm text-muted-foreground">Only allow access from specific IP addresses</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter IP address (e.g., 192.168.1.100)"
                  value={newIpAddress}
                  onChange={(e) => setNewIpAddress(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={addIpToWhitelist} disabled={!newIpAddress.trim()}>
                  Add IP
                </Button>
              </div>
              
              {settings.ipWhitelist.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Whitelisted IPs:</h4>
                  {settings.ipWhitelist.map((ip, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-mono text-sm">{ip}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIpFromWhitelist(ip)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Brute Force Protection */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Brute Force Protection</h3>
                  <p className="text-sm text-muted-foreground">Automatically block suspicious login attempts</p>
                </div>
              </div>
              <Switch
                checked={settings.bruteForceProtection}
                onCheckedChange={(checked) => {
                  const newSettings = { ...settings, bruteForceProtection: checked }
                  saveSecuritySettings(newSettings)
                }}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Security Activity Log</h3>
                  <p className="text-sm text-muted-foreground">Monitor all security-related events</p>
                </div>
              </div>
              <Switch
                checked={settings.accessLogging}
                onCheckedChange={(checked) => {
                  const newSettings = { ...settings, accessLogging: checked }
                  saveSecuritySettings(newSettings)
                }}
              />
            </div>
            
            {settings.accessLogging && (
              <div className="space-y-3">
                {securityLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{log.event}</span>
                        <Badge 
                          variant={log.status === 'success' ? 'default' : log.status === 'failed' ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {log.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {new Date(log.timestamp).toLocaleString()} • {log.ipAddress}
                      </div>
                    </div>
                    <div className={`text-sm ${getStatusColor(log.status)}`}>
                      {log.status === 'success' && <CheckCircle className="h-4 w-4" />}
                      {log.status === 'failed' && <AlertTriangle className="h-4 w-4" />}
                      {log.status === 'blocked' && <Shield className="h-4 w-4" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Key className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">API Security</h3>
                <p className="text-sm text-muted-foreground">Secure API access for your applications</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">API Key</label>
                <div className="flex gap-2">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    readOnly
                    className="flex-1 font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateApiKey}
                  >
                    Regenerate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Keep this key secure. It provides full access to your account via API.
                </p>
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security Notice:</strong> Never share your API key or commit it to version control. 
                  Use environment variables in production.
                </AlertDescription>
              </Alert>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}