// Client-only (uses document/Blob/URL) — call only from event handlers in
// Client Components, never during render.
export function downloadCsv(filename: string, headers: string[], rows: (string | number | null)[][]) {
  const esc = (v: string | number | null) => {
    let s = String(v ?? "");
    // Formula-injection guard: a leading =, +, -, @, tab or CR makes Excel/
    // Sheets evaluate the cell as a formula when the file is opened. Guest
    // review "reason" text is fully unauthenticated free text and ends up in
    // these exports, so this isn't just theoretical.
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
