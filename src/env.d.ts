interface ImportMetaEnv {
  /** '1' nella build delle fixture end-to-end (corso finto "esempio"). */
  readonly PUBLIC_STUDY_HUB_FIXTURES?: string;
}

declare module 'virtual:island-i18n' {
  const dictionaries: Record<'it' | 'en', Record<string, string>>;
  export default dictionaries;
}
