"use client"

import { useState } from "react"
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
import { formatDate, formatRelativeTime } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, Eye, FileText, GraduationCap, AlertTriangle } from "lucide-react"

interface PendingItem {
  id: string
  type: "results" | "degree"
  title: string
  submittedBy: string
  submittedAt: string
  details: string
  recordCount?: number
}

// Mock data
const mockPendingItems: PendingItem[] = [
  {
    id: "1",
    type: "results",
    title: "B.Tech CSE 2020 - Semester 7 Results",
    submittedBy: "Dr. Amit Kumar",
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    details: "45 student results for semester 7",
    recordCount: 45,
  },
  {
    id: "2",
    type: "results",
    title: "B.Tech IT 2021 - Semester 5 Results",
    submittedBy: "Prof. Meena Sharma",
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    details: "38 student results for semester 5",
    recordCount: 38,
  },
  {
    id: "3",
    type: "degree",
    title: "Degree Proposal - Rahul Sharma",
    submittedBy: "Academic Office",
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    details: "B.Tech CSE with CGPA 8.75",
  },
  {
    id: "4",
    type: "degree",
    title: "Degree Proposal - Priya Patel",
    submittedBy: "Academic Office",
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    details: "B.Tech CSE with CGPA 9.12",
  },
]

export function ApprovalsQueue() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("all")
  const [selectedItem, setSelectedItem] = useState<PendingItem | null>(null)
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null)
  const [notes, setNotes] = useState("")

  const resultItems = mockPendingItems.filter((item) => item.type === "results")
  const degreeItems = mockPendingItems.filter((item) => item.type === "degree")

  const getDisplayItems = () => {
    switch (activeTab) {
      case "results":
        return resultItems
      case "degrees":
        return degreeItems
      default:
        return mockPendingItems
    }
  }

  const handleAction = (item: PendingItem, action: "approve" | "reject") => {
    setSelectedItem(item)
    setActionType(action)
  }

  const confirmAction = () => {
    toast({
      title: actionType === "approve" ? "Approved" : "Rejected",
      description: `${selectedItem?.title} has been ${actionType === "approve" ? "approved" : "rejected"}`,
    })
    setSelectedItem(null)
    setActionType(null)
    setNotes("")
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({mockPendingItems.length})</TabsTrigger>
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
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedItem && !!actionType} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === "approve" ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              )}
              {actionType === "approve" ? "Approve" : "Reject"}{" "}
              {selectedItem?.type === "results" ? "Results" : "Degree"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? `Are you sure you want to approve "${selectedItem?.title}"?`
                : `Please provide a reason for rejecting "${selectedItem?.title}".`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="font-medium">{selectedItem?.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{selectedItem?.details}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Submitted by {selectedItem?.submittedBy} on{" "}
                {selectedItem?.submittedAt && formatDate(selectedItem.submittedAt)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{actionType === "approve" ? "Notes (optional)" : "Rejection Reason"}</Label>
              <Textarea
                id="notes"
                placeholder={
                  actionType === "approve"
                    ? "Add any notes for the record..."
                    : "Please explain why this is being rejected..."
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedItem(null)} className="bg-transparent">
              Cancel
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={confirmAction}
              disabled={actionType === "reject" && !notes.trim()}
            >
              {actionType === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
