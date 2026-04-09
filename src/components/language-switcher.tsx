
'use client';

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggleLanguage}>
      {language === 'bn' ? 'EN' : 'BN'}
    </Button>
  );
}
