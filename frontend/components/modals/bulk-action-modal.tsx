"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"

interface BulkActionModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  selectedCount: number
  actionText?: string
  requireConfirmation?: boolean
  confirmationText?: string
  variant?: "default" | "destructive"
}

export function BulkActionModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  selectedCount,
  actionText = "Execute",
  requireConfirmation = true,
  confirmationText = "I understand this action cannot be undone",
  variant = "default",
}: BulkActionModalProps) {
  const [confirmed, setConfirmed] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const handleConfirm = async () => {
    if (requireConfirmation && !confirmed) return

    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error("Bulk action error:", error)
    } finally {
      setLoading(false)
      setConfirmed(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setConfirmed(false)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium">
              Selected items: <span className="text-primary">{selectedCount}</span>
            </p>
          </div>

          {requireConfirmation && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirmation"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                disabled={loading}
              />
              <label
                htmlFor="confirmation"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {confirmationText}
              </label>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant={variant === "destructive" ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={loading || (requireConfirmation && !confirmed)}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
