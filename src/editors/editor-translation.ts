import de from '../../locales/de.json';
import en from '../../locales/en.json';
import es from '../../locales/es.json';
import fr from '../../locales/fr.json';
import it from '../../locales/it.json';
import nl from '../../locales/nl.json';
import pl from '../../locales/pl.json';
import ru from '../../locales/ru.json';
import sv from '../../locales/sv.json';

const localeMap: Record<string, Record<string, string>> = {
  de,
  en,
  es,
  fr,
  it,
  nl,
  pl,
  ru,
  sv,
};

export function translateEditor(
  language: string | undefined,
  key: string,
): string {
  const normalizedLanguage = (language ?? 'en')
    .toLowerCase()
    .split('-')[0];

  const translations =
    localeMap[normalizedLanguage] ?? localeMap.en;

  return translations[key] ?? localeMap.en[key] ?? key;
}