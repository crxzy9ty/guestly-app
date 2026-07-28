import { redirect } from "next/navigation";
import { createClient, getCachedUser } from "@/lib/supabase/server";
import { AdminNav } from "./AdminNav";

// Authoritative role gate for the admin area, independent of the slug check
// in the parent [adminSlug]/layout.tsx and independent of proxy.ts (which
// only refreshes cookies, never authorizes). Even someone who discovers the
// correct slug still needs a real role='admin' session to get past this.
export default async function AdminProtectedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ adminSlug: string }>;
}) {
  const { adminSlug } = await params;
  const supabase = await createClient();
  const user = await getCachedUser();

  if (!user) {
    redirect(`/${adminSlug}/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect(`/${adminSlug}/login`);
  }

  return (
    <div className="min-h-full bg-mist">
      <AdminNav adminSlug={adminSlug} email={user.email} />
      <div className="mx-auto max-w-4xl px-6 py-8">{children}</div>
    </div>
  );
}
