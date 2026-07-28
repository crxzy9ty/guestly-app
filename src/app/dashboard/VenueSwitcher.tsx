"use client";

import { useRouter } from "next/navigation";

export function VenueSwitcher({
  partners,
  selectedId,
}: {
  partners: { id: string; name: string }[];
  selectedId: string;
}) {
  const router = useRouter();

  if (partners.length <= 1) {
    return <h1 className="text-2xl font-bold tracking-tight text-ink">{partners[0]?.name}</h1>;
  }

  return (
    <select
      value={selectedId}
      onChange={(e) => router.push(`/dashboard?partner=${e.target.value}`)}
      className="h-10 rounded-lg border border-line bg-paper px-3 text-lg font-bold text-ink"
    >
      {partners.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
