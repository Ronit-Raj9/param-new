"use client"

import dynamic from "next/dynamic"

const DegreePage = dynamic(() => import("./degree-page").then((mod) => ({ default: mod.DegreePage })), {
  ssr: false,
})

export function DegreePageWrapper() {
  return <DegreePage />
}
