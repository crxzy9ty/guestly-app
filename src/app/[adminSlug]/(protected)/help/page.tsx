import { HelpPanel } from "@/app/HelpPanel";
import { adminHelpFaqs } from "@/lib/help-content";

export default function AdminHelpPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-ink">Súgó</h1>
      <HelpPanel faqs={adminHelpFaqs} />
    </div>
  );
}
