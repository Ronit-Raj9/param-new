"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApi } from "@/hooks/use-api"
import { Search, MessageSquare, Clock, CheckCircle2, AlertCircle, Send, User, Loader2, Ticket } from "lucide-react"
import { format } from "date-fns"

interface TicketMessage {
  id: string
  sender: "student" | "admin"
  senderName: string
  message: string
  timestamp: string
}

interface Ticket {
  id: string
  subject: string
  description: string
  category: "result" | "credential" | "account" | "technical" | "other"
  status: "open" | "in-progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high"
  student: {
    name: string
    email: string
    rollNo: string
  }
  createdAt: string
  updatedAt: string
  messages: TicketMessage[]
}

const statusConfig = {
  open: { label: "Open", color: "bg-yellow-100 text-yellow-700", icon: AlertCircle },
  "in-progress": { label: "In Progress", color: "bg-blue-100 text-blue-700", icon: Clock },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  closed: { label: "Closed", color: "bg-slate-100 text-slate-700", icon: CheckCircle2 },
}

const priorityConfig = {
  low: { label: "Low", color: "bg-slate-100 text-slate-600" },
  medium: { label: "Medium", color: "bg-orange-100 text-orange-700" },
  high: { label: "High", color: "bg-red-100 text-red-700" },
}

export function SupportTickets() {
  const api = useApi()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [replyMessage, setReplyMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    if (!api.isReady) return
    
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (statusFilter !== "all") params.set("status", statusFilter)

      const data = await api.get<{ success: boolean; data: Ticket[] }>(
        `/v1/support/tickets?${params.toString()}`
      )

      if (data.success) {
        setTickets(data.data || [])
      }
    } catch (err) {
      console.error("Error fetching tickets:", err)
      setTickets([])
    } finally {
      setIsLoading(false)
    }
  }, [api, search, statusFilter])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
      ticket.id.toLowerCase().includes(search.toLowerCase()) ||
      ticket.student.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const openCount = tickets.filter((t) => t.status === "open").length
  const inProgressCount = tickets.filter((t) => t.status === "in-progress").length

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return

    try {
      setIsSending(true)
      const data = await api.post<{ success: boolean; data: { message: TicketMessage } }>(
        `/v1/support/tickets/${selectedTicket.id}/reply`,
        { message: replyMessage }
      )

      if (data.success) {
        // Update the ticket with the new message
        setSelectedTicket({
          ...selectedTicket,
          messages: [...selectedTicket.messages, data.data.message],
        })
        setReplyMessage("")
      }
    } catch (err) {
      console.error("Error sending reply:", err)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{openCount}</p>
                <p className="text-sm text-slate-500">Open Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressCount}</p>
                <p className="text-sm text-slate-500">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {tickets.filter((t) => t.status === "resolved").length}
                </p>
                <p className="text-sm text-slate-500">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tickets.length}</p>
                <p className="text-sm text-slate-500">Total Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Support Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredTickets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No tickets found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {search || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Support tickets will appear here"}
              </p>
            </div>
          )}

          {/* Tickets */}
          {!isLoading && filteredTickets.length > 0 && (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => {
                const statusCfg = statusConfig[ticket.status]
                const priorityCfg = priorityConfig[ticket.priority]
                return (
                  <div
                    key={ticket.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {ticket.student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900">{ticket.subject}</span>
                        <Badge className={priorityCfg.color}>{priorityCfg.label}</Badge>
                        <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                      </div>
                      <p className="text-sm text-slate-600 mt-0.5 truncate">{ticket.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {ticket.student.name} ({ticket.student.rollNo})
                        </span>
                        <span>{ticket.id}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 whitespace-nowrap">
                      {format(new Date(ticket.createdAt), "MMM d, h:mm a")}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTicket.subject}</DialogTitle>
                <DialogDescription>
                  {selectedTicket.id} • {selectedTicket.student.name} ({selectedTicket.student.rollNo})
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Messages */}
                <div className="space-y-3 max-h-[40vh] overflow-y-auto p-2">
                  {selectedTicket.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.sender === "admin" ? "flex-row-reverse" : ""}`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {msg.senderName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`flex-1 max-w-[80%] p-3 rounded-lg ${
                          msg.sender === "admin" ? "bg-primary text-primary-foreground" : "bg-slate-100"
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.sender === "admin" ? "text-primary-foreground/70" : "text-slate-500"
                          }`}
                        >
                          {format(new Date(msg.timestamp), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Input */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="flex-1"
                    rows={2}
                  />
                  <Button onClick={handleSendReply} disabled={!replyMessage.trim() || isSending}>
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
