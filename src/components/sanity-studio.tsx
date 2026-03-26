"use client"

import dynamic from "next/dynamic"

const NextStudio = dynamic(
  async () => {
    const [{ NextStudio: Studio }, { default: config }] = await Promise.all([
      import("next-sanity/studio"),
      import("@/sanity/sanity.config"),
    ])
    // eslint-disable-next-line react/display-name
    return function StudioWrapper() {
      return <Studio config={config} />
    }
  },
  { ssr: false }
)

export function SanityStudio() {
  return <NextStudio />
}
