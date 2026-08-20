"use client"

import type React from "react"
import { Keyboard, ArrowRight, Github, Star, User } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface NavbarProps {
  onStartClick?: () => void
  savedName?: string | null
  stars?: number | null
  rightContent?: React.ReactNode
}

export function Navbar({ onStartClick, savedName, stars, rightContent }: NavbarProps) {
  return (
    <header className="border-b-2 border-foreground bg-card">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          <div className="bg-primary text-primary-foreground border-2 border-foreground shadow-brutal p-1.5 sm:p-2">
            <Keyboard className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h1 className="text-base sm:text-xl font-black uppercase tracking-tight text-foreground">TypeMaster</h1>
        </Link>
        {rightContent ?? (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 border-2 border-foreground bg-card text-foreground text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Profile</span>
            </Link>
            <a
              href="https://github.com/ausafulislam/Typing-Master"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border-2 border-foreground bg-card text-foreground text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
            >
              <Github className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">GitHub</span>
              {stars !== null && stars !== undefined && (
                <span className="inline-flex items-center gap-0.5 text-primary">
                  <Star className="w-3 h-3 fill-primary" />
                  {stars}
                </span>
              )}
            </a>
            {onStartClick && (
              <Button
                onClick={onStartClick}
                className="border-2 border-foreground bg-primary text-primary-foreground text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 sm:px-4 py-1.5 sm:py-2 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
              >
                {savedName ? "Play" : "Start"}
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
