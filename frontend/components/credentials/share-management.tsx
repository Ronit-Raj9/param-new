"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShareLinkManager } from "@/components/credentials/share-link-manager"
import type { ShareLink } from "@/types"

// Mock data
const mockResultShares: ShareLink[] = [
  {
    id: "1",
    credentialId: "sem-7",
    token: "res123",
    url: "https://param.iiitm.ac.in/verify/res123",
    expiresAt: "2025-01-01T00:00:00Z",
    viewCount: 3,
    isActive: true,
    createdAt: "2024-07-01T10:00:00Z",
  },
]

const mockDegreeShares: ShareLink[] = [
  {
    id: "2",
    credentialId: "deg-1",
    token: "deg456",
    url: "https://param.iiitm.ac.in/verify/deg456",
    viewCount: 8,
    isActive: true,
    createdAt: "2024-07-15T10:00:00Z",
  },
]

export function ShareManagement() {
  const [activeTab, setActiveTab] = useState("results")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Share Links</CardTitle>
        <CardDescription>View and manage all your credential verification links</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="results">Semester Results</TabsTrigger>
            <TabsTrigger value="degree">Degree Certificate</TabsTrigger>
          </TabsList>
          <TabsContent value="results">
            <ShareLinkManager links={mockResultShares} credentialId="results" />
          </TabsContent>
          <TabsContent value="degree">
            <ShareLinkManager links={mockDegreeShares} credentialId="degree" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
