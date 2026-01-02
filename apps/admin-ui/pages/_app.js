import "../styles/globals.css";
import { SessionProvider } from "../lib/session";
import { DebugDock } from "../components/debug/DebugDock";
import ErrorBoundary from "../components/ErrorBoundary";

export default function SlimyAdminApp({ Component, pageProps }) {
  return (
    <SessionProvider>
      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
      <DebugDock />
    </SessionProvider>
  );
}
