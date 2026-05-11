import { useState, useEffect } from 'react'

export function useLocalDraft<T>(key: string, initialValue: T) {
  const [data, setData] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    const saved = localStorage.getItem(`draft_${key}`)
    return saved ? JSON.parse(saved) : initialValue
  })

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      localStorage.setItem(`draft_${key}`, JSON.stringify(data))
    }
  }, [key, data])

  const clearDraft = () => {
    localStorage.removeItem(`draft_${key}`)
    setData(initialValue)
  }

  return [data, setData, clearDraft] as const
}
