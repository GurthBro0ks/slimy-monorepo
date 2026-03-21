import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/server";
import CryptoDashboard from "./CryptoDashboard";

export const metadata = {
  title: "Crypto Dashboard | SlimyAI Owner Panel",
};

export default async function CryptoPage() {
  const user = await requireAuth();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "owner") {
    redirect("/owner/forbidden");
  }

  return <CryptoDashboard />;
}
