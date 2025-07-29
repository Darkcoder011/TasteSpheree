// Combined context providers for TasteSphere
import { ApiProvider } from './ApiContext';
import { AppStateProvider } from './AppStateContext';
import { ThemeProvider } from './ThemeContext';

// Combined provider component that wraps all context providers
export const TasteSphereProviders = ({ children }) => {
  return (
    <ThemeProvider>
      <ApiProvider>
        <AppStateProvider>
          {children}
        </AppStateProvider>
      </ApiProvider>
    </ThemeProvider>
  );
};

// Export individual providers and hooks
export { ApiProvider, useApi } from './ApiContext';
export { AppStateProvider, useAppState } from './AppStateContext';
export { ThemeProvider, useTheme } from './ThemeContext';

export default TasteSphereProviders;