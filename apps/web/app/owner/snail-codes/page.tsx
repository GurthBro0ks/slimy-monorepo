import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/server";
import SnailCodesDashboard from "./SnailCodesDashboard";

export const metadata = {
  title: "Snail Codes | SlimyAI Owner Panel",
};

export default async function SnailCodesPage() {
  const user = await requireAuth();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "owner") {
    redirect("/owner/forbidden");
  }

  return <SnailCodesDashboard />;
}
