import { redirect } from "next/navigation";
import { createClient, getCachedUser } from "@/lib/supabase/server";

// Authoritative role gate for every /dashboard/* route. proxy.ts only
// refreshes the session cookie — it does not check roles — so this check has
// to happen here, independently, on every request. RLS on the data tables is
// a third, independent layer: even a bug here can't leak cross-partner data.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const user = await getCachedUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    redirect("/login");
  }

  return <div className="min-h-full bg-mist">{children}</div>;
}
