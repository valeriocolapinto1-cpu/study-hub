/**
 * Client delle isole Preact con IslandBoundary: il plugin Vite
 * `tools/vite/island-boundary.mjs` fa puntare qui `@astrojs/preact/client.js`
 * (e la variante di sviluppo); questo modulo importa l'originale e avvolge ogni
 * componente prima dell'idratazione. Il wrapper non aggiunge DOM né chiama hook,
 * quindi l'HTML del server (senza wrapper) e gli id di `useId` restano coerenti.
 */
import type { ComponentType } from 'preact';
import original from 'virtual:preact-client-original';
import { withBoundary } from './boundary';

type Hydrate = (element: HTMLElement) => (Component: ComponentType, ...rest: unknown[]) => Promise<void>;

const wrapped = new WeakMap<ComponentType, ComponentType>();

export default ((element) =>
  (Component, ...rest) => {
    let W = wrapped.get(Component);
    if (!W) wrapped.set(Component, (W = withBoundary(Component as ComponentType<object>) as ComponentType));
    return original(element)(W, ...rest);
  }) satisfies Hydrate;
