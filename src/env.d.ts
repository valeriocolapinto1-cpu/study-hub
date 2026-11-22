interface ImportMetaEnv {
  /** '1' nella build delle fixture end-to-end (corso finto "esempio"). */
  readonly PUBLIC_STUDY_HUB_FIXTURES?: string;
}

declare module 'virtual:island-i18n/it' {
  const dictionary: Record<string, string>;
  export default dictionary;
}
declare module 'virtual:island-i18n/en' {
  const dictionary: Record<string, string>;
  export default dictionary;
}

/** Commit (7 caratteri) e data ISO della build, da tools/build-info.mjs. */
declare const __SH_BUILD__: { commit: string; date: string };

declare module 'virtual:preact-client-original' {
  /** Client originale di @astrojs/preact (vedi tools/vite/island-boundary.mjs). */
  const hydrate: (element: HTMLElement) => (Component: unknown, ...rest: unknown[]) => Promise<void>;
  export default hydrate;
}
