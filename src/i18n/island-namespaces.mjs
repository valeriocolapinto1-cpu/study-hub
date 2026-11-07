/**
 * Namespace del dizionario (primo segmento della chiave) usati dalle isole che
 * chiamano `t()` lato client. Il modulo virtuale `virtual:island-i18n` contiene
 * solo queste chiavi: il dizionario completo (~67 KB con le due lingue) resta
 * fuori dal bundle. Un test controlla che ogni chiave usata dalle isole sia qui.
 */
export const ISLAND_NAMESPACES = [
  'dash',
  'date',
  'engine',
  'exam',
  'exercise',
  'list',
  'mastery',
  'notes',
  'page',
  'plan',
  'print',
  'review',
  'sync',
];
