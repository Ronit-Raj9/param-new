"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CreateShareLinkModal } from "@/components/modals/share-link-modal"
import { formatDate, formatRelativeTime } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import { Copy, MoreHorizontal, Trash2, ExternalLink, Plus } from "lucide-react"
import type { ShareLink } from "@/types"

interface ShareLinkManagerProps {
  links: ShareLink[]
  credentialId: string
}

export function ShareLinkManager({ links, credentialId }: ShareLinkManagerProps) {
  const { toast } = useToast()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleCopyLink = async (url: string) => {
    await navigator.clipboard.writeText(url)
    toast({
      title: "Link copied",
      description: "Share link has been copied to clipboard",
    })
  }

  const handleRevoke = (linkId: string) => {
    // In production, call API to revoke link
    toast({
      title: "Link revoked",
      description: "The share link has been deactivated",
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Link
        </Button>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No share links created yet</p>
          <p className="text-sm mt-1">Create a link to share your credential with employers</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Link</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-center">Views</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((link) => (
                <TableRow key={link.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs truncate max-w-[200px]">{link.url}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyLink(link.url)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{formatRelativeTime(link.createdAt)}</TableCell>
                  <TableCell className="text-sm">{link.expiresAt ? formatDate(link.expiresAt) : "Never"}</TableCell>
                  <TableCell className="text-center">{link.viewCount}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={link.isActive ? "default" : "secondary"}
                      className={link.isActive ? "bg-success" : ""}
                    >
                      {link.isActive ? "Active" : "Revoked"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCopyLink(link.url)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(link.url, "_blank")}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open Link
                        </DropdownMenuItem>
                        {link.isActive && (
                          <DropdownMenuItem onClick={() => handleRevoke(link.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Revoke Link
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateShareLinkModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        credentialId={credentialId}
      />
    </div>
  )
}
