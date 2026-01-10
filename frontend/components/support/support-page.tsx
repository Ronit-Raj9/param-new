"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { MessageSquare, Mail, Phone, HelpCircle, Send, CheckCircle2 } from "lucide-react"

const faqs = [
  {
    question: "How do I access my semester results?",
    answer:
      "Login to your PARAM account using your institutional email. Navigate to the 'Results' section in your dashboard to view all your semester results. You can also download official mark sheets from there.",
  },
  {
    question: "How can I share my credentials with employers?",
    answer:
      "Go to the 'Share Credentials' section in your dashboard. Select the credential you want to share and click 'Generate Link'. You can set an expiry date for the link. Share this link with employers who can then verify your credentials.",
  },
  {
    question: "What if my result shows incorrect marks?",
    answer:
      "If you notice any discrepancy in your results, please raise a support ticket through the 'Support' section. Provide your roll number, the specific subject, and details of the issue. Our team will verify and correct it if needed.",
  },
  {
    question: "How do I download my degree certificate?",
    answer:
      "Navigate to the 'Degree' section in your dashboard. If your degree has been issued and approved, you will see a download button. Click it to download your official digital degree certificate.",
  },
  {
    question: "I'm not receiving OTP for login. What should I do?",
    answer:
      "First, check your spam/junk folder. If the OTP is not there, wait for 2 minutes and try again. If the issue persists, raise a support ticket or contact us at support@iiitm.ac.in.",
  },
  {
    question: "How do employers verify my credentials?",
    answer:
      "When you share a verification link, employers can open it to see your verified credentials. They can also enter a verification token on our homepage to verify any credential. All verifications are cryptographically secured.",
  },
]

export function SupportPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  return (
    <div className="py-12 md:py-16">
      <div className="container max-w-7xl px-6 md:px-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">How can we help?</h1>
          <p className="mt-3 text-base text-slate-600 max-w-xl mx-auto">
            Find answers to common questions or get in touch with our support team
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* FAQ Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Frequently Asked Questions
                </CardTitle>
                <CardDescription>Quick answers to common questions</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left text-sm font-medium">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-sm text-slate-600">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Contact Support
                </CardTitle>
                <CardDescription>Send us a message and we will get back to you</CardDescription>
              </CardHeader>
              <CardContent>
                {isSubmitted ? (
                  <div className="text-center py-8">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">Message Sent!</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      We have received your message and will respond within 24 hours.
                    </p>
                    <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setIsSubmitted(false)}>
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" placeholder="Your name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="your@email.com" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rollNo">Roll Number (if student)</Label>
                      <Input id="rollNo" placeholder="e.g., 2021BCS001" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select required>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="result">Result Related</SelectItem>
                          <SelectItem value="credential">Credential/Certificate</SelectItem>
                          <SelectItem value="account">Account/Login Issues</SelectItem>
                          <SelectItem value="technical">Technical Problem</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input id="subject" placeholder="Brief description of your issue" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea id="message" placeholder="Please describe your issue in detail..." rows={4} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      <Send className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Other Ways to Reach Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Email</p>
                    <a href="mailto:support@iiitm.ac.in" className="text-sm text-primary hover:underline">
                      support@iiitm.ac.in
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Phone</p>
                    <p className="text-sm text-slate-600">+91-751-2449803</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 pt-2">Support hours: Monday - Friday, 9:00 AM - 5:00 PM IST</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
