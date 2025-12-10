// Minimal React type shims to satisfy TypeScript when using CDN React without local @types
declare module 'react' {
  export type FC<P = any> = (props: P & { children?: any }) => any;
  export type ReactNode = any;
  export type ReactElement = any;
  export type SetStateAction<T> = T | ((prev: T) => T);
  export type ChangeEvent<T = any> = { target: T };
  export function useState<T>(initial: T | (() => T)): [T, (value: SetStateAction<T>) => void];
  export function useEffect(...args: any[]): any;
  export function useRef<T = any>(initial: T): { current: T };
  export const Fragment: any;
  const React: any;
  export default React;
  export as namespace React;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module 'react-dom/client' {
  export function createRoot(container: Element | Document | null): any;
}

// Minimal process shim for browser builds using Vite define
declare var process: {
  env: Record<string, string | undefined>;
};

