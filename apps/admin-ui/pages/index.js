import Head from "next/head";
import Image from "next/image";
import Layout from "../components/Layout";

export default function Home() {
  return (
    <Layout hideSidebar>
      <Head>
        <title>slimy.ai – Admin Panel</title>
      </Head>
      <div className="hero">
        <div className="hero__logo">
          <Image
            src="/slimy-admin-logo.svg"
            alt="slimy admin logo"
            width={96}
            height={96}
            priority
          />
        </div>

        <h1 className="hero__title">slimy.ai – Admin Panel</h1>
        <p className="hero__tagline">
          fueled by <span>adhd</span> — driven by <span>feet</span> — motivated by <span>ducks</span>
        </p>

        <a className="hero__cta" href="/api/admin-api/api/auth/login?returnTo=%2Fdashboard">
          Login with Discord
        </a>
      </div>

      <footer className="hero__footer">
        UI is online on port 3081 behind Caddy.
      </footer>
    </Layout>
  );
}
