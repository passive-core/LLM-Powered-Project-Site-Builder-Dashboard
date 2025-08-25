import React, { useState } from 'react'
import { Smartphone, Download, Shield, Zap, Globe, QrCode, Apple, Play } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'

interface MobileAppInfoProps {
  onClose?: () => void
}

export function MobileAppInfo({ onClose }: MobileAppInfoProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<'pwa' | 'native'>('pwa')

  const installPWA = () => {
    // Check if PWA installation is available
    if ('serviceWorker' in navigator) {
      // This would trigger the PWA install prompt
      alert('PWA installation will be available once the service worker is configured.')
    } else {
      alert('PWA is not supported in this browser.')
    }
  }

  const generateQRCode = () => {
    // In a real app, this would generate a QR code for the current URL
    const currentUrl = window.location.href
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-primary" />
            Mobile App Options
          </h2>
          <p className="text-muted-foreground">Access your projects on mobile devices</p>
        </div>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            ×
          </Button>
        )}
      </div>

      <Tabs value={selectedPlatform} onValueChange={(value: any) => setSelectedPlatform(value)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pwa">Progressive Web App</TabsTrigger>
          <TabsTrigger value="native">Native App</TabsTrigger>
        </TabsList>

        <TabsContent value="pwa" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="h-6 w-6 text-primary" />
              <div>
                <h3 className="text-xl font-semibold">Progressive Web App (PWA)</h3>
                <p className="text-muted-foreground">Install directly from your browser - available now!</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">✨ Features:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-green-500" />
                    Works offline with cached data
                  </li>
                  <li className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-green-500" />
                    Install like a native app
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    Secure HTTPS connection
                  </li>
                  <li className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-green-500" />
                    Responsive mobile design
                  </li>
                </ul>

                <div className="space-y-3">
                  <Button onClick={installPWA} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Install PWA
                  </Button>
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Or scan QR code:</p>
                    <div className="flex justify-center">
                      <img 
                        src={generateQRCode()} 
                        alt="QR Code" 
                        className="border rounded-lg"
                        width={150}
                        height={150}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">📱 How to Install:</h4>
                <div className="space-y-3 text-sm">
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium mb-1">Chrome/Edge (Android/Desktop):</div>
                    <p className="text-muted-foreground">Look for the install icon in the address bar or use the menu → "Install app"</p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium mb-1">Safari (iOS):</div>
                    <p className="text-muted-foreground">Tap Share → "Add to Home Screen"</p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium mb-1">Firefox:</div>
                    <p className="text-muted-foreground">Menu → "Install" or "Add to Home Screen"</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="native" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Smartphone className="h-6 w-6 text-primary" />
              <div>
                <h3 className="text-xl font-semibold">Native Mobile App</h3>
                <p className="text-muted-foreground">Full native experience with device integration</p>
              </div>
            </div>

            <Alert className="mb-6">
              <AlertDescription>
                <strong>Coming Soon!</strong> Native iOS and Android apps are in development. 
                The PWA version provides excellent mobile experience in the meantime.
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">🚀 Planned Features:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    Biometric authentication (Face ID, Touch ID)
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    Push notifications for project updates
                  </li>
                  <li className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-blue-500" />
                    Native camera integration
                  </li>
                  <li className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-blue-500" />
                    Offline-first architecture
                  </li>
                  <li className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-500" />
                    Deep linking and sharing
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">📅 Development Timeline:</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">Q2 2024</Badge>
                    <span className="text-sm">Beta testing begins</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">Q3 2024</Badge>
                    <span className="text-sm">iOS App Store release</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">Q3 2024</Badge>
                    <span className="text-sm">Google Play Store release</span>
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <Button variant="outline" className="w-full" disabled>
                    <Apple className="h-4 w-4 mr-2" />
                    Download from App Store
                    <Badge variant="secondary" className="ml-2">Soon</Badge>
                  </Button>
                  <Button variant="outline" className="w-full" disabled>
                    <Play className="h-4 w-4 mr-2" />
                    Get it on Google Play
                    <Badge variant="secondary" className="ml-2">Soon</Badge>
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h4 className="font-semibold mb-3">🔧 Technical Implementation</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium mb-2">Current Options:</h5>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• React Native with Expo</li>
                  <li>• Capacitor (Ionic)</li>
                  <li>• Flutter (cross-platform)</li>
                  <li>• Native iOS/Android</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium mb-2">Recommended Approach:</h5>
                <p className="text-muted-foreground">
                  <strong>Capacitor</strong> - Wrap the existing React app in a native container, 
                  providing native device access while reusing the web codebase.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="h-5 w-5 text-primary" />
          <h4 className="font-semibold">Security & Privacy</h4>
        </div>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium mb-2">Data Protection:</h5>
            <ul className="space-y-1 text-muted-foreground">
              <li>• End-to-end encryption</li>
              <li>• Local data caching</li>
              <li>• Secure authentication</li>
              <li>• No data tracking</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">Access Control:</h5>
            <ul className="space-y-1 text-muted-foreground">
              <li>• User-specific projects only</li>
              <li>• Session management</li>
              <li>• Automatic logout</li>
              <li>• IP-based restrictions</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}