"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { StatusBadge } from "@/components/status/status-badge"
import { ResultDetailModal } from "@/components/modals/result-detail-modal"
import { useApi } from "@/hooks/use-api"
import { formatGPA } from "@/lib/format"
import { Download, Share2, Eye, Loader2, FileText, CheckCircle2, Clock, ExternalLink } from "lucide-react"
import type { SemesterResult } from "@/types"

export function ResultsList() {
  const api = useApi()
  const [results, setResults] = useState<SemesterResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortOrder, setSortOrder] = useState<string>("desc")
  const [selectedResult, setSelectedResult] = useState<SemesterResult | null>(null)

  useEffect(() => {
    async function fetchResults() {
      if (!api.isReady) return
      
      try {
        setIsLoading(true)
        const data = await api.get<{ success: boolean; data: SemesterResult[] }>("/v1/results/my-results")

        if (data.success) {
          setResults(data.data || [])
        }
      } catch (err) {
        console.error("Error fetching results:", err)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [api.isReady])

  const filteredResults = results
    .filter((result) => statusFilter === "all" || result.status === statusFilter)
    .sort((a, b) => {
      return sortOrder === "desc" ? b.semester - a.semester : a.semester - b.semester
    })

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <CardTitle>Semester Results</CardTitle>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Latest First</SelectItem>
              <SelectItem value="asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>
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
        {!isLoading && filteredResults.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No results found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {statusFilter !== "all" ? "Try a different status filter" : "Results will appear here once published"}
            </p>
          </div>
        )}

        {/* Results Table */}
        {!isLoading && filteredResults.length > 0 && (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Semester</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead className="text-center">SGPA</TableHead>
                  <TableHead className="text-center">CGPA</TableHead>
                  <TableHead className="text-center">Credits</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Blockchain</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">Semester {result.semester}</TableCell>
                    <TableCell>{result.academicYear}</TableCell>
                    <TableCell className="text-center font-medium text-primary">
                      {formatGPA(result.sgpa)}
                    </TableCell>
                    <TableCell className="text-center font-medium">{formatGPA(result.cgpa)}</TableCell>
                    <TableCell className="text-center">
                      {result.earnedCredits}/{result.totalCredits}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={result.status} />
                    </TableCell>
                    <TableCell className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {result.credential?.tokenId ? (
                              <Badge 
                                variant="default" 
                                className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                                onClick={() => {
                                  if (result.credential?.txHash) {
                                    window.open(`https://sepolia.basescan.org/tx/${result.credential.txHash}`, "_blank")
                                  }
                                }}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Minted
                              </Badge>
                            ) : result.status === "ISSUED" ? (
                              <Badge variant="secondary" className="cursor-default">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="cursor-default">
                                —
                              </Badge>
                            )}
                          </TooltipTrigger>
                          <TooltipContent>
                            {result.credential?.tokenId 
                              ? `Token ID: ${result.credential.tokenId}` 
                              : result.status === "ISSUED" 
                                ? "Waiting to be minted on blockchain"
                                : "Not yet issued"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedResult(result)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Result Detail Modal */}
      {selectedResult && (
        <ResultDetailModal
          result={selectedResult}
          open={!!selectedResult}
          onOpenChange={(open) => !open && setSelectedResult(null)}
        />
      )}
    </Card>
  )
}
