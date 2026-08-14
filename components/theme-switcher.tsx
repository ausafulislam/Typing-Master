"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useTheme, type ThemeKey } from "@/components/theme-provider"

export function ThemeSwitcher() {
  const [showSettings, setShowSettings] = useState(false)
  const { currentTheme, setTheme, themes } = useTheme()

  return (
    <>
      <Button variant="outline" size="icon" onClick={() => setShowSettings(true)} className="ml-2">
        <Settings className="w-4 h-4" />
      </Button>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold">Theme Settings</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p className="text-sm text-muted-foreground mb-4 text-center">Choose your preferred color theme</p>
            <div className="grid grid-cols-5 gap-2 justify-items-center">
              {(Object.keys(themes) as ThemeKey[]).map((themeKey) => (
                <button
                  key={themeKey}
                  onClick={() => setTheme(themeKey)}
                  className={`
                    w-12 h-12 rounded-full border-2 transition-all duration-200 flex items-center justify-center
                    ${currentTheme === themeKey ? "border-foreground scale-110" : "border-transparent hover:scale-105"}
                  `}
                  style={{ backgroundColor: themes[themeKey].primary }}
                  aria-label={`Select ${themes[themeKey].name} theme`}
                >
                  {currentTheme === themeKey && <div className="w-3 h-3 bg-white rounded-full shadow-sm" />}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setShowSettings(false)} className="w-full sm:w-auto">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
