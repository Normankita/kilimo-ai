'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { translations, type Lang, type TranslationKeys } from './translations'

type LanguageContextType = {
  lang: Lang
  setLang: (l: Lang) => void
  t: TranslationKeys
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'sw',
  setLang: () => {},
  t: translations.sw as unknown as TranslationKeys,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('sw')

  useEffect(() => {
    const saved = localStorage.getItem('kilimo-lang') as Lang
    if (saved === 'sw' || saved === 'en') setLangState(saved)
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('kilimo-lang', l)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] as unknown as TranslationKeys }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
