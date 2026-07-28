import { notFound } from "next/navigation";

// The admin area lives at a URL only the Guestly team knows: this dynamic
// segment must match ADMIN_ROUTE_SECRET exactly, or the request gets a real
// 404 (not a redirect — a redirect would leak "this route exists, you're
// just not allowed in"). Not linked from any nav. Combined with the
// role === 'admin' check in (protected)/layout.tsx, this satisfies "own,
// not-linked-from-anywhere URL, with real server-side role enforcement."
export default async function AdminSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ adminSlug: string }>;
}) {
  const { adminSlug } = await params;
  const secret = process.env.ADMIN_ROUTE_SECRET;

  if (!secret || adminSlug !== secret) {
    notFound();
  }

  return <>{children}</>;
}
