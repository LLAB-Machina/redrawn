export const DEFAULT_LANGUAGE: Language = "sv";

export type Language = "sv";

// This is a workaround to create a type-safe array of languages
function createLanguageArray<T extends readonly Language[]>(
  languages: T & (Language extends T[number] ? T : never),
): T {
  return languages;
}

export const LANGUAGES = createLanguageArray([DEFAULT_LANGUAGE] as const);
