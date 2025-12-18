import "../styles/globals.css";
import { SessionProvider } from "../lib/session";
import { DebugDock } from "../components/debug/DebugDock";

export default function SlimyAdminApp({ Component, pageProps }) {
  return (
    <SessionProvider>
      <Component {...pageProps} />
      <DebugDock />
    </SessionProvider>
  );
}
