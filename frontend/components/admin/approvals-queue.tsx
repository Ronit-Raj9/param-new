"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { formatRelativeTime } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import { useApi } from "@/hooks/use-api"
import { CheckCircle, XCircle, Eye, FileText, GraduationCap, Loader2, ClipboardList } from "lucide-react"

interface PendingItem {
  id: string
  type: "results" | "degree"
  title: string
  submittedBy: string
  submittedAt: string
  details: string
  recordCount?: number
}

export function ApprovalsQueue() {
  const { toast } = useToast()
  const api = useApi()
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedItem, setSelectedItem] = useState<PendingItem | null>(null)
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null)
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch pending approvals (results in REVIEWED status + degree proposals pending approval)
  const fetchPendingApprovals = useCallback(async () => {
    if (!api.isReady) return

    try {
      setIsLoading(true)

      // Fetch results in REVIEWED status (waiting for approval)
      const resultsResponse = await api.get<{
        success: boolean
        data: Array<{
          id: string
          semester: number
          academicYear: string
          sgpa: number | null
          status: string
          reviewedAt: string | null
          student: {
            enrollmentNumber: string
            name: string
            user?: { name: string }
            program?: { code: string; name: string }
          }
          courseResults?: Array<{ id: string }>
        }>
      }>("/v1/results?status=REVIEWED")

      const items: PendingItem[] = []

      if (resultsResponse.success && Array.isArray(resultsResponse.data)) {
        // Transform results to PendingItem format
        for (const r of resultsResponse.data) {
          items.push({
            id: r.id,
            type: "results",
            title: `Semester ${r.semester} Results - ${r.student?.enrollmentNumber || "Unknown"}`,
            submittedBy: r.student?.user?.name || r.student?.name || "Unknown",
            submittedAt: r.reviewedAt || new Date().toISOString(),
            details: `${r.student?.program?.code || "Unknown"} | ${r.academicYear} | SGPA: ${r.sgpa?.toFixed(2) || "N/A"}`,
            recordCount: r.courseResults?.length || 0,
          })
        }
      }

      // TODO: Add degree proposals fetch when that feature is complete

      setPendingItems(items)
    } catch (err) {
      console.error("Error fetching pending approvals:", err)
      setPendingItems([])
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api.isReady])

  useEffect(() => {
    if (api.isReady) {
      fetchPendingApprovals()
    }
  }, [api.isReady, fetchPendingApprovals])

  const resultItems = pendingItems.filter((item) => item.type === "results")
  const degreeItems = pendingItems.filter((item) => item.type === "degree")

  const getDisplayItems = () => {
    switch (activeTab) {
      case "results":
        return resultItems
      case "degrees":
        return degreeItems
      default:
        return pendingItems
    }
  }

  const handleAction = (item: PendingItem, action: "approve" | "reject") => {
    setSelectedItem(item)
    setActionType(action)
  }

  const confirmAction = async () => {
    if (!selectedItem || !actionType) return

    try {
      setIsSubmitting(true)

      // For results, use the status update endpoint
      if (selectedItem.type === "results") {
        // REVIEWED -> APPROVED (approve) or REVIEWED -> DRAFT (reject/send back)
        const newStatus = actionType === "approve" ? "APPROVED" : "DRAFT"
        const data = await api.patch<{ success: boolean }>(`/v1/results/${selectedItem.id}/status`, {
          status: newStatus,
          approvalNote: notes || undefined,
        })

        if (data.success) {
          toast({
            title: actionType === "approve" ? "Approved" : "Sent Back",
            description: `${selectedItem.title} has been ${actionType === "approve" ? "approved" : "sent back for revision"}`,
          })
          // Remove item from list
          setPendingItems((items) => items.filter((item) => item.id !== selectedItem.id))
        }
      } else {
        // For degree proposals, use the degree proposals API (to be implemented)
        toast({
          title: "Not implemented",
          description: "Degree approval is not yet implemented",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to process approval",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setSelectedItem(null)
      setActionType(null)
      setNotes("")
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Items waiting for your review</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">
                <FileText className="mr-1 h-3 w-3" />
                {resultItems.length} Results
              </Badge>
              <Badge variant="outline">
                <GraduationCap className="mr-1 h-3 w-3" />
                {degreeItems.length} Degrees
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && pendingItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No pending approvals</h3>
              <p className="text-sm text-muted-foreground mt-1">
                All items have been reviewed
              </p>
            </div>
          )}

          {/* Content */}
          {!isLoading && pendingItems.length > 0 && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All ({pendingItems.length})</TabsTrigger>
                <TabsTrigger value="results">Results ({resultItems.length})</TabsTrigger>
                <TabsTrigger value="degrees">Degrees ({degreeItems.length})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Type</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getDisplayItems().map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {item.type === "results" ? (
                              <FileText className="h-5 w-5 text-info" />
                            ) : (
                              <GraduationCap className="h-5 w-5 text-primary" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell>{item.submittedBy}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatRelativeTime(item.submittedAt)}
                          </TableCell>
                          <TableCell className="text-sm">{item.details}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-success hover:text-success"
                                onClick={() => handleAction(item, "approve")}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleAction(item, "reject")}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedItem && !!actionType} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve" : "Reject"} {selectedItem?.title}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "This will approve and publish the selected item."
                : "This will reject the item and notify the submitter."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes or comments..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedItem(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              variant={actionType === "approve" ? "default" : "destructive"}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {actionType === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
