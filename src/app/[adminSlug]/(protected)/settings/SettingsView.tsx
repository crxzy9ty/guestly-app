"use client";

import { useState } from "react";
import { ContentEditor } from "./ContentEditor";
import { DemoRequestsList, type DemoRequestRow } from "./DemoRequestsList";
import { PartnerMessagesList, type PartnerMessageRow } from "./PartnerMessagesList";
import { QuestionSetsManager, type QuestionSet, type Aspect } from "./QuestionSetsManager";
import { PartnerAssignment } from "./PartnerAssignment";
import { AdminsManager, type AdminRow } from "./AdminsManager";
import type { MarketingContent } from "@/lib/content";

type Partner = { id: string; name: string; question_set_id: string | null };

export function SettingsView({
  adminSlug,
  content,
  demoRequests,
  questionSets,
  aspects,
  partners,
  admins,
  partnerMessages,
  currentUserId,
  canDeleteAdmins,
}: {
  adminSlug: string;
  content: MarketingContent;
  demoRequests: DemoRequestRow[];
  questionSets: QuestionSet[];
  aspects: Aspect[];
  partners: Partner[];
  admins: AdminRow[];
  partnerMessages: PartnerMessageRow[];
  currentUserId: string;
  canDeleteAdmins: boolean;
}) {
  const [tab, setTab] = useState<"sets" | "assign" | "content" | "demos" | "messages" | "admins">("sets");

  const unreadCount = partnerMessages.filter((m) => !m.is_read).length;

  const tabs = [
    ["sets", "Kérdéscsoportok"],
    ["assign", "Hozzárendelés"],
    ["content", "Tartalom szerkesztése"],
    ["demos", `Demó kérések (${demoRequests.length})`],
    ["messages", `Üzenetek (${unreadCount})`],
    ["admins", `Adminok (${admins.length})`],
  ] as const;

  return (
    <div>
      <div className="mb-5 flex w-fit flex-wrap gap-1.5 rounded-lg bg-line p-[3px]">
        {tabs.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-md px-4 py-1.5 text-xs font-bold ${tab === k ? "bg-paper text-ink" : "text-slate"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "sets" && <QuestionSetsManager adminSlug={adminSlug} questionSets={questionSets} aspects={aspects} />}
      {tab === "assign" && <PartnerAssignment adminSlug={adminSlug} questionSets={questionSets} partners={partners} />}
      {tab === "content" && <ContentEditor adminSlug={adminSlug} initial={content} />}
      {tab === "demos" && <DemoRequestsList adminSlug={adminSlug} requests={demoRequests} />}
      {tab === "messages" && <PartnerMessagesList adminSlug={adminSlug} messages={partnerMessages} />}
      {tab === "admins" && (
        <AdminsManager
          adminSlug={adminSlug}
          admins={admins}
          currentUserId={currentUserId}
          canDelete={canDeleteAdmins}
        />
      )}
    </div>
  );
}
