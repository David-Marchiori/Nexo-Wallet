import { useCallback, useEffect, useState } from "react"
import { defaultSettings } from "@/data/defaultSettings"
import { loadSettings, saveSettings } from "@/lib/storage"
import type { Settings } from "@/types/settings"

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings() ?? defaultSettings)

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const updateSettings = useCallback((changes: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...changes }))
  }, [])

  return { settings, updateSettings }
}
