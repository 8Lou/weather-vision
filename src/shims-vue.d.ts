/**
 * TypeScript declaration file for Vue single-file components
 * This allows TypeScript to understand .vue file imports
 */

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
