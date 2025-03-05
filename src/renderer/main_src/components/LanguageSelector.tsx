import { Component, For } from 'solid-js';
import { useI18n } from '../contexts/I18nContext';

interface LanguageOption {
  code: 'en' | 'de' | 'es' | 'fr';
  name: string;
  flag: string;
}

const languages: LanguageOption[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' }
];

const LanguageSelector: Component = () => {
  const { locale, setLocale, t } = useI18n();

  return (
    <div class="language-selector flex gap-2">
      <For each={languages}>
        {(lang) => (
          <button
            class={`px-2 py-1 rounded ${locale() === lang.code ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            onClick={() => setLocale(lang.code)}
            title={lang.name}
          >
            <span class="mr-1">{lang.flag}</span>
            <span>{lang.code.toUpperCase()}</span>
          </button>
        )}
      </For>
    </div>
  );
};

export default LanguageSelector;
