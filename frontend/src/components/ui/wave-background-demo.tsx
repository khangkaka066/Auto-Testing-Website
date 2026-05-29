import * as React from "react"
import { Waves } from "@/components/ui/wave-background"

export function WavesDemo() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-black">
      <div className="w-full flex flex-col items-center">
        <div className="w-full h-[1px] bg-white/80" />
        <div className="w-full aspect-video relative">
          <Waves className="h-full w-full" />
        </div>
        <div className="w-full h-[1px] bg-white/80" />
      </div>
    </div>
  )
}

export { WavesDemo as default }
