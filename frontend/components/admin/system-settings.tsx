"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useApi } from "@/hooks/use-api"
import { Bell, Mail, Shield, Database, Globe, Save, Loader2, Link2, Wallet } from "lucide-react"

interface CollegeSettings {
  id: string
  name: string
  shortName: string
  fullName: string
  logoUrl?: string
  websiteUrl?: string
  address?: string
  city?: string
  state?: string
  country: string
  pincode?: string
  phone?: string
  email?: string
  chainId: number
  rpcUrl?: string
  contractSemester?: string
  contractDegree?: string
  degreeSoulbound: boolean
  allowCorrections: boolean
  requireCreditValidation: boolean
  gradingSystem?: unknown
}

export function SystemSettings() {
  const { toast } = useToast()
  const api = useApi()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [settings, setSettings] = useState<CollegeSettings | null>(null)

  useEffect(() => {
    if (!api.isReady) return

    async function fetchSettings() {
      try {
        setIsLoading(true)
        const data = await api.get<{ success: boolean; data: CollegeSettings }>("/v1/settings/college")
        if (data.success) {
          setSettings(data.data)
        }
      } catch (err) {
        console.error("Error fetching settings:", err)
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [api.isReady])

  const handleSave = async () => {
    if (!settings) return

    try {
      setIsSaving(true)
      const data = await api.patch<{ success: boolean }>("/v1/settings/college", settings)
      
      if (data.success) {
        toast({
          title: "Settings saved",
          description: "Your changes have been saved successfully",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = <K extends keyof CollegeSettings>(key: K, value: CollegeSettings[K]) => {
    setSettings((prev) => prev ? { ...prev, [key]: value } : null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load settings</p>
      </div>
    )
  }

  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList className="bg-slate-100">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="integrations">Integrations</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5 text-primary" />
              Institution Settings
            </CardTitle>
            <CardDescription>Configure basic institution information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="institutionName">Institution Name</Label>
                <Input 
                  id="institutionName" 
                  value={settings.name}
                  onChange={(e) => updateSetting("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="institutionCode">Short Name</Label>
                <Input 
                  id="institutionCode" 
                  value={settings.shortName}
                  onChange={(e) => updateSetting("shortName", e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  value={settings.fullName}
                  onChange={(e) => updateSetting("fullName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Website URL</Label>
                <Input 
                  id="websiteUrl" 
                  type="url"
                  value={settings.websiteUrl || ""}
                  onChange={(e) => updateSetting("websiteUrl", e.target.value)}
                  placeholder="https://example.ac.in"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input 
                  id="supportEmail" 
                  type="email" 
                  value={settings.email || ""}
                  onChange={(e) => updateSetting("email", e.target.value)}
                  placeholder="support@example.ac.in"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  value={settings.phone || ""}
                  onChange={(e) => updateSetting("phone", e.target.value)}
                  placeholder="+91 1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input 
                  id="country" 
                  value={settings.country}
                  onChange={(e) => updateSetting("country", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea 
                id="address" 
                value={settings.address || ""}
                onChange={(e) => updateSetting("address", e.target.value)}
                placeholder="Full institution address"
                rows={2} 
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  value={settings.city || ""}
                  onChange={(e) => updateSetting("city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input 
                  id="state" 
                  value={settings.state || ""}
                  onChange={(e) => updateSetting("state", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input 
                  id="pincode" 
                  value={settings.pincode || ""}
                  onChange={(e) => updateSetting("pincode", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-primary" />
              Academic Settings
            </CardTitle>
            <CardDescription>Configure academic policies and result settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Corrections</Label>
                <p className="text-sm text-slate-500">Students can request result corrections</p>
              </div>
              <Switch 
                checked={settings.allowCorrections}
                onCheckedChange={(checked) => updateSetting("allowCorrections", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Credit Validation</Label>
                <p className="text-sm text-slate-500">Validate credit requirements for degree</p>
              </div>
              <Switch 
                checked={settings.requireCreditValidation}
                onCheckedChange={(checked) => updateSetting("requireCreditValidation", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Soulbound Degrees</Label>
                <p className="text-sm text-slate-500">Degree NFTs cannot be transferred</p>
              </div>
              <Switch 
                checked={settings.degreeSoulbound}
                onCheckedChange={(checked) => updateSetting("degreeSoulbound", checked)}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="blockchain" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5 text-primary" />
              Blockchain Configuration
            </CardTitle>
            <CardDescription>Configure blockchain network and smart contract settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="chainId">Chain ID</Label>
                <Select 
                  value={String(settings.chainId)}
                  onValueChange={(val) => updateSetting("chainId", parseInt(val))}
                >
                  <SelectTrigger id="chainId">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="84532">Base Sepolia (Testnet)</SelectItem>
                    <SelectItem value="8453">Base Mainnet</SelectItem>
                    <SelectItem value="11155111">Ethereum Sepolia (Testnet)</SelectItem>
                    <SelectItem value="1">Ethereum Mainnet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rpcUrl">RPC URL</Label>
                <Input 
                  id="rpcUrl" 
                  value={settings.rpcUrl || ""}
                  onChange={(e) => updateSetting("rpcUrl", e.target.value)}
                  placeholder="https://sepolia.base.org"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractSemester">Semester NFT Contract Address</Label>
              <Input 
                id="contractSemester" 
                value={settings.contractSemester || ""}
                onChange={(e) => updateSetting("contractSemester", e.target.value)}
                placeholder="0x..."
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractDegree">Degree NFT Contract Address</Label>
              <Input 
                id="contractDegree" 
                value={settings.contractDegree || ""}
                onChange={(e) => updateSetting("contractDegree", e.target.value)}
                placeholder="0x..."
                className="font-mono"
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-primary" />
              Notification Preferences
            </CardTitle>
            <CardDescription>Configure when and how notifications are sent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Result Publication Alerts</Label>
                <p className="text-sm text-slate-500">Notify students when results are published</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Degree Issuance Alerts</Label>
                <p className="text-sm text-slate-500">Notify students when degree is issued</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Credential Verification Alerts</Label>
                <p className="text-sm text-slate-500">Notify students when their credentials are verified</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Admin Action Notifications</Label>
                <p className="text-sm text-slate-500">Notify admins of pending approvals</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-primary" />
              Email Settings
            </CardTitle>
            <CardDescription>Configure email delivery settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input id="smtpHost" placeholder="smtp.example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input id="smtpPort" placeholder="587" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpUser">SMTP Username</Label>
                <Input id="smtpUser" placeholder="username" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPass">SMTP Password</Label>
                <Input id="smtpPass" type="password" placeholder="••••••••" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email Address</Label>
              <Input id="fromEmail" type="email" placeholder="noreply@iiitm.ac.in" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              Security Settings
            </CardTitle>
            <CardDescription>Configure authentication and security options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-slate-500">Require 2FA for admin accounts</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>OTP Expiry (minutes)</Label>
                <p className="text-sm text-slate-500">Time before OTP expires</p>
              </div>
              <Input type="number" defaultValue="10" className="w-24" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Session Timeout (hours)</Label>
                <p className="text-sm text-slate-500">Auto logout after inactivity</p>
              </div>
              <Input type="number" defaultValue="24" className="w-24" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>IP Whitelisting</Label>
                <p className="text-sm text-slate-500">Restrict admin access to specific IPs</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Allowed Email Domains</CardTitle>
            <CardDescription>Only users with these email domains can register</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {["iiitm.ac.in", "alumni.iiitm.ac.in"].map((domain) => (
                <div
                  key={domain}
                  className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                >
                  @{domain}
                  <button className="hover:text-destructive">&times;</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Add new domain (e.g., example.edu)" className="flex-1" />
              <Button variant="outline">Add Domain</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="integrations" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">API Configuration</CardTitle>
            <CardDescription>Configure external API integrations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="flex gap-2">
                <Input id="apiKey" defaultValue="pk_live_••••••••••••••••" readOnly className="flex-1 font-mono" />
                <Button variant="outline">Regenerate</Button>
              </div>
              <p className="text-xs text-slate-500">Use this key to authenticate API requests</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input id="webhookUrl" placeholder="https://your-server.com/webhook" />
              <p className="text-xs text-slate-500">Receive real-time notifications for credential events</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Third-Party Integrations</CardTitle>
            <CardDescription>Connect with external services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">DigiLocker</p>
                <p className="text-sm text-slate-500">Push credentials to DigiLocker</p>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">National Academic Depository</p>
                <p className="text-sm text-slate-500">Sync with NAD platform</p>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">ERP System</p>
                <p className="text-sm text-slate-500">Import student data from ERP</p>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </Tabs>
  )
}
