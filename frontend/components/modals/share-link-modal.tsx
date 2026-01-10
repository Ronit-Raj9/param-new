"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { SHARE_EXPIRY_OPTIONS } from "@/lib/constants"
import { Copy, Loader2, CheckCircle2 } from "lucide-react"

interface CreateShareLinkModalProps {
  open: boolean
  onClose: () => void
  credentialId: string
}

export function CreateShareLinkModal({ open, onClose, credentialId }: CreateShareLinkModalProps) {
  const { toast } = useToast()
  const [expiry, setExpiry] = useState("30")
  const [isLoading, setIsLoading] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)

  const handleCreate = async () => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // In production: POST /api/student/shares { credentialId, expiryDays: expiry === 'never' ? null : parseInt(expiry) }
      const mockLink = `https://param.iiitm.ac.in/verify/${Math.random().toString(36).slice(2, 10)}`
      setGeneratedLink(mockLink)
    } catch {
      toast({
        title: "Error",
        description: "Failed to create share link",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    if (generatedLink) {
      await navigator.clipboard.writeText(generatedLink)
      toast({
        title: "Copied!",
        description: "Link has been copied to clipboard",
      })
    }
  }

  const handleClose = () => {
    setGeneratedLink(null)
    setExpiry("30")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{generatedLink ? "Share Link Created" : "Create Share Link"}</DialogTitle>
          <DialogDescription>
            {generatedLink
              ? "Your share link is ready. Copy it and send to employers for verification."
              : "Generate a verification link to share your credential"}
          </DialogDescription>
        </DialogHeader>

        {generatedLink ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-6">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Your Share Link</Label>
              <div className="flex gap-2">
                <Input value={generatedLink} readOnly className="font-mono text-sm" />
                <Button variant="outline" onClick={handleCopy} className="bg-transparent">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleClose} className="bg-transparent">
                Close
              </Button>
              <Button onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Link Expiry</Label>
              <Select value={expiry} onValueChange={setExpiry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select expiry" />
                </SelectTrigger>
                <SelectContent>
                  {SHARE_EXPIRY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose how long this link should remain active for verification
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleClose} disabled={isLoading} className="bg-transparent">
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Link
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
