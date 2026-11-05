# Estrattori degli argomenti dai siti originali

Per ogni corso presente in `src/content/courses/` deve esistere `<courseId>.mjs` con:

```js
/** @param {string} legacyDir percorso assoluto di legacy/<courseId> */
export default function extract(legacyDir) {
  return [{ title: 'Titolo italiano', group: 'Capitolo (facoltativo)' } /* … nell'ordine originale */];
}
```

Il test `tests/content/content.test.ts` confronta l'elenco con gli argomenti in
`src/content/topics/<courseId>/` (ordinati per `order`): titoli italiani, ordine e
gruppi devono coincidere (vedi `compare.mjs`). Se l'estrattore restituisce `group`,
anche il gruppo viene confrontato.
