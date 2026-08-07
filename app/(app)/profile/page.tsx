"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import { ArrowLeft, Pencil, Loader2 } from "lucide-react";
import { getUserProfile } from "@/app/actions";
import { MobileHeader } from "@/components/MobileHeader";
import ReactMarkdown from "react-markdown";

interface ProfileData {
  dob?: string | Date | null;
  age?: number | null;
  educationSchool?: string | null;
  educationDegree?: string | null;
  educationYear?: string | null;
  employmentDetails?: string | null;
  datingGoals?: string | null;
  seekingReason?: string | null;
  location?: string | null;
  annualIncome?: string | null;
  instaUrl?: string | null;
  linkedinUrl?: string | null;
  xUrl?: string | null;
  profileSummary?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Detail row — label + value                                         */
/* ------------------------------------------------------------------ */
function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-0 py-3 border-b border-stone-800/30 last:border-0">
      <span className="text-[12px] font-medium uppercase tracking-wider text-stone-500 sm:w-44 sm:shrink-0">
        {label}
      </span>
      <span className="text-[14px] text-stone-200 break-words">
        {value || <span className="text-stone-600 italic font-normal">—</span>}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function ProfilePage() {
  const { data: session, isPending: isSessionPending } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (!isSessionPending && !session) {
      router.push("/");
    }
  }, [session, isSessionPending, router]);

  useEffect(() => {
    if (session) {
      setIsLoading(true);
      getUserProfile()
        .then((data) => setProfile(data))
        .catch((err) => console.error("Failed to load user profile:", err))
        .finally(() => setIsLoading(false));
    }
  }, [session?.user?.id]);

  if (isSessionPending || !session) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0C0A09] text-stone-50">
        <Loader2 className="w-5 h-5 text-stone-600 animate-spin" />
      </div>
    );
  }

  const formattedDob = profile?.dob
    ? new Date(profile.dob).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const degreeDisplay = [profile?.educationDegree, profile?.educationYear]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="h-full bg-[#0C0A09] text-stone-50 overflow-y-auto">
      <MobileHeader />

      <div className="max-w-xl mx-auto px-5 sm:px-6 py-10 pt-16 md:pt-10 space-y-8">
        {/* ---- Header ---- */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[13px] text-stone-500 hover:text-stone-300 transition-colors mb-8 cursor-pointer group"
          >
            <ArrowLeft
              size={14}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Back
          </button>

          {/* Identity */}
          <div className="flex items-center gap-4 mb-2">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name}
                className="w-11 h-11 rounded-full ring-[1.5px] ring-stone-700/60"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-stone-800 flex items-center justify-center text-stone-500 text-base font-semibold ring-[1.5px] ring-stone-700/60">
                {(session.user.name || "U")[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-stone-50 truncate">
                {session.user.name || "User"}
              </h1>
              <p className="text-xs text-stone-500 truncate">
                {session.user.email}
              </p>
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-5 h-5 text-stone-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* ---- AI Summary ---- */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[12px] font-medium uppercase tracking-wider text-stone-500">
                  AI Summary
                </h2>
                <span className="text-[10px] text-stone-600 bg-stone-800/60 px-2 py-0.5 rounded-full select-none">
                  auto-generated
                </span>
              </div>

              <div className="rounded-xl border border-stone-800/30 bg-stone-900/40 px-5 py-4">
                {profile?.profileSummary ? (
                  <div className="text-[14px] text-stone-300 leading-relaxed prose prose-invert prose-sm max-w-none prose-p:mb-3 prose-p:last:mb-0 prose-strong:text-stone-100 prose-em:text-stone-400 prose-headings:text-stone-100 prose-ul:pl-5 prose-ol:pl-5 prose-li:text-stone-300">
                    <ReactMarkdown>{profile.profileSummary}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-[13px] text-stone-600 italic">
                    A summary will be generated when you send your first message.
                  </p>
                )}
              </div>
            </motion.section>

            {/* ---- Details ---- */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[12px] font-medium uppercase tracking-wider text-stone-500">
                  Details
                </h2>
                <button
                  onClick={() => router.push("/settings")}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
                >
                  <Pencil size={11} />
                  Edit
                </button>
              </div>

              <div className="rounded-xl border border-stone-800/30 bg-stone-900/40 px-5">
                <DetailRow
                  label="Date of Birth"
                  value={
                    formattedDob
                      ? `${formattedDob}${profile?.age ? ` (${profile.age})` : ""}`
                      : null
                  }
                />
                <DetailRow label="Location" value={profile?.location} />
                <DetailRow label="Dating Goals" value={profile?.datingGoals} />
                <DetailRow
                  label="Seeking Advice For"
                  value={profile?.seekingReason}
                />
                <DetailRow
                  label="School / College"
                  value={profile?.educationSchool}
                />
                <DetailRow
                  label="Degree & Year"
                  value={degreeDisplay || null}
                />
                <DetailRow
                  label="Employment"
                  value={profile?.employmentDetails}
                />
                <DetailRow label="Annual Income" value={profile?.annualIncome} />
              </div>
            </motion.section>

            {/* ---- Social ---- */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[12px] font-medium uppercase tracking-wider text-stone-500">
                  Social
                </h2>
                <button
                  onClick={() => router.push("/settings")}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
                >
                  <Pencil size={11} />
                  Edit
                </button>
              </div>

              <div className="rounded-xl border border-stone-800/30 bg-stone-900/40 px-5">
                <DetailRow label="Instagram" value={profile?.instaUrl} />
                <DetailRow label="LinkedIn" value={profile?.linkedinUrl} />
                <DetailRow label="X (Twitter)" value={profile?.xUrl} />
              </div>
            </motion.section>
          </>
        )}
      </div>
    </div>
  );
}
