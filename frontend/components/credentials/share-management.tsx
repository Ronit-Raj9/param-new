"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShareLinkManager } from "@/components/credentials/share-link-manager"
import { useApi } from "@/hooks/use-api"
import { Loader2, Share2 } from "lucide-react"
import type { ShareLink } from "@/types"

interface ShareLinkWithUrl extends ShareLink {
  credential?: {
    id: string
    type: string
    status: string
  }
}

export function ShareManagement() {
  const api = useApi()
  const [allShares, setAllShares] = useState<ShareLinkWithUrl[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("results")

  const fetchShareLinks = useCallback(async () => {
    if (!api.isReady) return
    
    try {
      setIsLoading(true)
      const data = await api.get<{ success: boolean; data: ShareLinkWithUrl[] }>("/v1/credentials/shares")

      if (data.success) {
        // Add URL to each share link
        const linksWithUrls = (data.data || []).map((link) => ({
          ...link,
          url: `${window.location.origin}/verify/${link.token}`,
        }))
        setAllShares(linksWithUrls)
      }
    } catch (err) {
      console.error("Error fetching share links:", err)
      setAllShares([])
    } finally {
      setIsLoading(false)
    }
  }, [api.isReady])

  useEffect(() => {
    fetchShareLinks()
  }, [fetchShareLinks])

  // Filter shares by type
  const resultShares = allShares.filter((link) => link.credential?.type === "SEMESTER")
  const degreeShares = allShares.filter((link) => link.credential?.type === "DEGREE")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Share Links</CardTitle>
        <CardDescription>View and manage all your credential verification links</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Content */}
        {!isLoading && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="results">Semester Results ({resultShares.length})</TabsTrigger>
              <TabsTrigger value="degree">Degree Certificate ({degreeShares.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="results">
              {resultShares.length > 0 ? (
                <ShareLinkManager links={resultShares} credentialId="results" onLinksChange={fetchShareLinks} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Share2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No result share links</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a share link from your results page to share with employers
                  </p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="degree">
              {degreeShares.length > 0 ? (
                <ShareLinkManager links={degreeShares} credentialId="degree" onLinksChange={fetchShareLinks} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Share2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No degree share links</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a share link from your degree page once it&apos;s issued
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
