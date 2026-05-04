import React, { createContext, useContext, useState } from 'react';
import { TRANSLATIONS } from '../i18n/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem('drt_lang') || 'ko'
  );

  const setLang = (l) => {
    localStorage.setItem('drt_lang', l);
    setLangState(l);
  };

  const t = TRANSLATIONS[lang] || TRANSLATIONS.ko;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
