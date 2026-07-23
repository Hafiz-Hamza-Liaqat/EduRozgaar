import { createContext, useContext } from 'react';

/** @type {import('react').Context<{ useLayoutContainer: boolean; typographyClass: string }>} */
export const BlockLayoutContext = createContext({
  useLayoutContainer: false,
  typographyClass: '',
});

export function useBlockLayoutContext() {
  return useContext(BlockLayoutContext);
}
