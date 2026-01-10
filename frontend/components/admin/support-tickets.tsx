"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MessageSquare, Clock, CheckCircle2, AlertCircle, Send, User } from "lucide-react"
import { format } from "date-fns"

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
  createdAt: Date
  updatedAt: Date
  messages: {
    id: string
    sender: "student" | "admin"
    senderName: string
    message: string
    timestamp: Date
  }[]
}

const mockTickets: Ticket[] = [
  {
    id: "TKT-001",
    subject: "Result discrepancy in Semester 5",
    description: "My marks in CS301 Database Management Systems appear to be incorrect. I scored 85 but it shows 75.",
    category: "result",
    status: "open",
    priority: "high",
    student: { name: "Rahul Sharma", email: "2021bcs045@iiitm.ac.in", rollNo: "2021BCS045" },
    createdAt: new Date("2026-01-10T10:00:00"),
    updatedAt: new Date("2026-01-10T10:00:00"),
    messages: [
      {
        id: "1",
        sender: "student",
        senderName: "Rahul Sharma",
        message:
          "My marks in CS301 Database Management Systems appear to be incorrect. I scored 85 but it shows 75. Please check and correct this.",
        timestamp: new Date("2026-01-10T10:00:00"),
      },
    ],
  },
  {
    id: "TKT-002",
    subject: "Unable to generate share link",
    description: "Getting an error when trying to generate a verification link for my degree certificate.",
    category: "technical",
    status: "in-progress",
    priority: "medium",
    student: { name: "Priya Singh", email: "2020bcs032@iiitm.ac.in", rollNo: "2020BCS032" },
    createdAt: new Date("2026-01-09T15:30:00"),
    updatedAt: new Date("2026-01-10T09:00:00"),
    messages: [
      {
        id: "1",
        sender: "student",
        senderName: "Priya Singh",
        message:
          "I am getting an error when trying to generate a share link for my degree certificate. The error says 'Something went wrong'.",
        timestamp: new Date("2026-01-09T15:30:00"),
      },
      {
        id: "2",
        sender: "admin",
        senderName: "Support Team",
        message: "Thank you for reporting this issue. We are looking into it and will get back to you shortly.",
        timestamp: new Date("2026-01-10T09:00:00"),
      },
    ],
  },
  {
    id: "TKT-003",
    subject: "Name correction in certificate",
    description: "My name is spelled incorrectly in the degree certificate. It shows 'Amit' instead of 'Amith'.",
    category: "credential",
    status: "resolved",
    priority: "medium",
    student: { name: "Amith Kumar", email: "2019bcs018@iiitm.ac.in", rollNo: "2019BCS018" },
    createdAt: new Date("2026-01-08T11:00:00"),
    updatedAt: new Date("2026-01-09T14:00:00"),
    messages: [
      {
        id: "1",
        sender: "student",
        senderName: "Amith Kumar",
        message: "My name is spelled incorrectly in the degree certificate. Please correct it.",
        timestamp: new Date("2026-01-08T11:00:00"),
      },
      {
        id: "2",
        sender: "admin",
        senderName: "Support Team",
        message: "We have verified your documents and corrected the spelling. Please check your updated certificate.",
        timestamp: new Date("2026-01-09T14:00:00"),
      },
    ],
  },
  {
    id: "TKT-004",
    subject: "Cannot login to account",
    description: "OTP is not being received on my registered email.",
    category: "account",
    status: "open",
    priority: "high",
    student: { name: "Sneha Patel", email: "2022bit012@iiitm.ac.in", rollNo: "2022BIT012" },
    createdAt: new Date("2026-01-10T08:00:00"),
    updatedAt: new Date("2026-01-10T08:00:00"),
    messages: [
      {
        id: "1",
        sender: "student",
        senderName: "Sneha Patel",
        message: "I am not receiving OTP on my email. I have checked spam folder too.",
        timestamp: new Date("2026-01-10T08:00:00"),
      },
    ],
  },
]

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
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [replyMessage, setReplyMessage] = useState("")

  const filteredTickets = mockTickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
      ticket.id.toLowerCase().includes(search.toLowerCase()) ||
      ticket.student.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const openCount = mockTickets.filter((t) => t.status === "open").length
  const inProgressCount = mockTickets.filter((t) => t.status === "in-progress").length

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
                <p className="text-2xl font-bold">156</p>
                <p className="text-sm text-slate-500">Resolved This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">4.2h</p>
                <p className="text-sm text-slate-500">Avg Response Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">All Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by ticket ID, subject, or student..."
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

          <div className="space-y-3">
            {filteredTickets.map((ticket) => {
              const status = statusConfig[ticket.status]
              const priority = priorityConfig[ticket.priority]
              return (
                <div
                  key={ticket.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 hover:border-primary/30 hover:bg-slate-50/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {ticket.student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-900">{ticket.subject}</span>
                      <Badge variant="outline" className={status.color}>
                        {status.label}
                      </Badge>
                      <Badge variant="outline" className={priority.color}>
                        {priority.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5 line-clamp-1">{ticket.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="font-mono">{ticket.id}</span>
                      <span>{ticket.student.name}</span>
                      <span>{ticket.student.rollNo}</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 whitespace-nowrap">
                    {format(ticket.createdAt, "MMM d, h:mm a")}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-slate-500">{selectedTicket.id}</span>
                  <Badge variant="outline" className={statusConfig[selectedTicket.status].color}>
                    {statusConfig[selectedTicket.status].label}
                  </Badge>
                </div>
                <DialogTitle>{selectedTicket.subject}</DialogTitle>
                <DialogDescription>
                  From {selectedTicket.student.name} ({selectedTicket.student.rollNo})
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {selectedTicket.messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.sender === "admin" ? "flex-row-reverse" : ""}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback
                        className={msg.sender === "admin" ? "bg-primary text-primary-foreground" : "bg-slate-100"}
                      >
                        {msg.sender === "admin" ? "A" : <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 max-w-[80%] ${msg.sender === "admin" ? "text-right" : ""}`}>
                      <div
                        className={`inline-block p-3 rounded-lg ${
                          msg.sender === "admin" ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-900"
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {msg.senderName} - {format(msg.timestamp, "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  <Button className="self-end">
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Select defaultValue={selectedTicket.status}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    Update Status
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
