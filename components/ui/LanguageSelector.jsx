'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { getSupportedLanguages, changeLanguage } from '@/lib/i18n';

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const supportedLanguages = getSupportedLanguages();
  const currentLanguage = supportedLanguages.find(lang => lang.code === i18n.language) || supportedLanguages[0];

  const handleLanguageChange = async (languageCode) => {
    try {
      await changeLanguage(languageCode);
      setIsOpen(false);
      // Reload the page to ensure all translations are loaded
      window.location.reload();
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <GlobeAltIcon className="w-4 h-4" />
        <span>{currentLanguage.nativeName}</span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="py-1">
            {supportedLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-3 ${
                  language.code === i18n.language ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <span className="font-medium">{language.nativeName}</span>
                <span className="text-gray-500 text-xs">({language.name})</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
