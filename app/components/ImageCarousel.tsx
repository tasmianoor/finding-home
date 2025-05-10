"use client"

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

const images = [
  {
    src: "https://gfnfawmtebnndhundozy.supabase.co/storage/v1/object/sign/stories/Eid.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzY5ZWUzYjBjLTVmNDAtNGFlYy05MWRkLTg4ODgyMTQxOWU4YSJ9.eyJ1cmwiOiJzdG9yaWVzL0VpZC5wbmciLCJpYXQiOjE3NDY4NDU4OTAsImV4cCI6MTc0OTQzNzg5MH0.Z74nUvXDjPj3vb4mXCzN1RMASEFuGOx7dGXx-NjGW_o",
    alt: "Eid celebration"
  },
  {
    src: "https://gfnfawmtebnndhundozy.supabase.co/storage/v1/object/sign/stories/Cousins.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzY5ZWUzYjBjLTVmNDAtNGFlYy05MWRkLTg4ODgyMTQxOWU4YSJ9.eyJ1cmwiOiJzdG9yaWVzL0NvdXNpbnMucG5nIiwiaWF0IjoxNzQ2ODQ1OTYxLCJleHAiOjE3NDk0Mzc5NjF9.tSG3NG69DQHYBO_2RhHnrTZgTwh_37BfnYfv0Yi8tSo",
    alt: "Cousins"
  },
  {
    src: "https://gfnfawmtebnndhundozy.supabase.co/storage/v1/object/sign/stories/Niece.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzY5ZWUzYjBjLTVmNDAtNGFlYy05MWRkLTg4ODgyMTQxOWU4YSJ9.eyJ1cmwiOiJzdG9yaWVzL05pZWNlLnBuZyIsImlhdCI6MTc0Njg0NTkwMywiZXhwIjoxNzQ5NDM3OTAzfQ.GaoFKxvZZcYD5iKRYoWZvKNF4e_wcPBO2IrwfceWcds",
    alt: "Niece"
  },
  {
    src: "https://gfnfawmtebnndhundozy.supabase.co/storage/v1/object/sign/stories/Tigers.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzY5ZWUzYjBjLTVmNDAtNGFlYy05MWRkLTg4ODgyMTQxOWU4YSJ9.eyJ1cmwiOiJzdG9yaWVzL1RpZ2Vycy5wbmciLCJpYXQiOjE3NDY4NDU5NDUsImV4cCI6MTc0OTQzNzk0NX0.mQDyNLtgXMFKwCft5mKZW1x-xHOdP--kdowcwgYUIYU",
    alt: "Tigers"
  },
  {
    src: "https://gfnfawmtebnndhundozy.supabase.co/storage/v1/object/sign/stories/Raising.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzY5ZWUzYjBjLTVmNDAtNGFlYy05MWRkLTg4ODgyMTQxOWU4YSJ9.eyJ1cmwiOiJzdG9yaWVzL1JhaXNpbmcucG5nIiwiaWF0IjoxNzQ2ODQ1OTE2LCJleHAiOjE3NDk0Mzc5MTZ9.TleIb7eHUtraMS5Cb7M8oR57vWuzaAFfdfp-YFFqJ4M",
    alt: "Raising"
  },
  {
    src: "https://gfnfawmtebnndhundozy.supabase.co/storage/v1/object/sign/stories/Teen.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzY5ZWUzYjBjLTVmNDAtNGFlYy05MWRkLTg4ODgyMTQxOWU4YSJ9.eyJ1cmwiOiJzdG9yaWVzL1RlZW4ucG5nIiwiaWF0IjoxNzQ2ODQ1OTMzLCJleHAiOjE3NDk0Mzc5MzN9.IciT5W3dXL9a2F3vX1TvIVRmh0xEPrmGY4uKzrF1nt0",
    alt: "Teen"
  },
  {
    src: "https://gfnfawmtebnndhundozy.supabase.co/storage/v1/object/sign/stories/Rubina.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzY5ZWUzYjBjLTVmNDAtNGFlYy05MWRkLTg4ODgyMTQxOWU4YSJ9.eyJ1cmwiOiJzdG9yaWVzL1J1YmluYS5wbmciLCJpYXQiOjE3NDY4NDU5MjUsImV4cCI6MTc0OTQzNzkyNX0.5nlcLjqoVi_PcY84hWKiqcC2-T74bcvavt6ZVsEftVc",
    alt: "Rubina"
  }
]

export default function ImageCarousel() {
  const [isPaused, setIsPaused] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    let scrollAmount = 0
    const scrollSpeed = 1 // pixels per frame
    const scrollInterval = 30 // milliseconds
    const maxScroll = scrollContainer.scrollWidth / 2

    const scroll = () => {
      if (!isPaused && scrollContainer) {
        scrollAmount += scrollSpeed
        if (scrollAmount >= maxScroll) {
          scrollAmount = 0
          scrollContainer.scrollLeft = 0
        } else {
          scrollContainer.scrollLeft = scrollAmount
        }
      }
    }

    const intervalId = setInterval(scroll, scrollInterval)

    return () => clearInterval(intervalId)
  }, [isPaused])

  return (
    <div 
      className="w-full overflow-hidden bg-[#faf9f5] py-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-hidden"
      >
        {images.map((image, index) => (
          <div key={index} className="flex-shrink-0">
            <Image
              src={image.src}
              alt={image.alt}
              width={300}
              height={300}
              className="object-cover rounded-[8px]"
              style={{ width: '300px', height: '300px' }}
            />
          </div>
        ))}
        {/* Duplicate images for seamless loop */}
        {images.map((image, index) => (
          <div key={`duplicate-${index}`} className="flex-shrink-0">
            <Image
              src={image.src}
              alt={image.alt}
              width={300}
              height={300}
              className="object-cover rounded-[8px]"
              style={{ width: '300px', height: '300px' }}
            />
          </div>
        ))}
      </div>
    </div>
  )
} 