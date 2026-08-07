"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  ChevronDown,
  Check,
  Loader2,
  User as UserIcon,
} from "lucide-react";
import { saveUserProfile, getUserProfile } from "@/app/actions";
import { MobileHeader } from "@/components/MobileHeader";

/* ------------------------------------------------------------------ */
/*  Reusable styled input                                              */
/* ------------------------------------------------------------------ */
function SettingsInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold uppercase tracking-widest text-stone-500">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent border-b border-stone-800/60 py-2.5 text-[15px] text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/60 transition-colors"
      />
    </div>
  );
}

function SettingsTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 2,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold uppercase tracking-widest text-stone-500">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-transparent border-b border-stone-800/60 py-2.5 text-[15px] text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/60 transition-colors resize-none"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section card wrapper                                               */
/* ------------------------------------------------------------------ */
function Section({
  title,
  description,
  children,
  delay = 0,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
      className="rounded-2xl border border-stone-800/25 bg-stone-900/30 p-5 sm:p-7"
    >
      <div className="mb-5">
        <h3 className="text-base font-semibold text-stone-100 tracking-tight">{title}</h3>
        {description && (
          <p className="text-[13px] text-stone-500 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="space-y-5">{children}</div>
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function SettingsPage() {
  const { data: session, isPending: isSessionPending } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [dob, setDob] = useState<string>("");
  const [location, setLocation] = useState("");
  const [seekingReason, setSeekingReason] = useState("");

  const [educationSchool, setEducationSchool] = useState("");
  const [educationDegree, setEducationDegree] = useState("");
  const [educationYear, setEducationYear] = useState("");
  const [employmentDetails, setEmploymentDetails] = useState("");
  const [annualIncome, setAnnualIncome] = useState("");

  const [datingGoals, setDatingGoals] = useState("");
  const [instaUrl, setInstaUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [xUrl, setXUrl] = useState("");

  // DOB dropdown picker states
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [maxDays, setMaxDays] = useState(31);

  // Location suggestions state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => String(currentYear - i));
  const months = [
    { value: "01", label: "Jan" },
    { value: "02", label: "Feb" },
    { value: "03", label: "Mar" },
    { value: "04", label: "Apr" },
    { value: "05", label: "May" },
    { value: "06", label: "Jun" },
    { value: "07", label: "Jul" },
    { value: "08", label: "Aug" },
    { value: "09", label: "Sep" },
    { value: "10", label: "Oct" },
    { value: "11", label: "Nov" },
    { value: "12", label: "Dec" },
  ];

  // Redirect if not logged in
  useEffect(() => {
    if (!isSessionPending && !session) {
      router.push("/");
    }
  }, [session, isSessionPending, router]);

  // Fetch current user details on mount
  useEffect(() => {
    if (session) {
      setIsLoading(true);
      getUserProfile()
        .then((profile) => {
          if (profile) {
            setLocation(profile.location || "");
            setSeekingReason(profile.seekingReason || "");
            setEducationSchool(profile.educationSchool || "");
            setEducationDegree(profile.educationDegree || "");
            setEducationYear(profile.educationYear || "");
            setEmploymentDetails(profile.employmentDetails || "");
            setAnnualIncome(profile.annualIncome || "");
            setDatingGoals(profile.datingGoals || "");
            setInstaUrl(profile.instaUrl || "");
            setLinkedinUrl(profile.linkedinUrl || "");
            setXUrl(profile.xUrl || "");

            if (profile.dob) {
              const d = new Date(profile.dob);
              if (!isNaN(d.getTime())) {
                const yyyy = String(d.getFullYear());
                const mm = String(d.getMonth() + 1).padStart(2, "0");
                const dd = String(d.getDate()).padStart(2, "0");
                setSelectedYear(yyyy);
                setSelectedMonth(mm);
                setSelectedDay(dd);
              }
            }
          }
        })
        .catch((err) => console.error("Failed to load user profile:", err))
        .finally(() => setIsLoading(false));
    }
  }, [session?.user?.id]);

  // Dynamically update max days and selected day if needed for DOB
  useEffect(() => {
    if (selectedMonth) {
      const yearNum = selectedYear ? parseInt(selectedYear, 10) : 2000;
      const monthNum = parseInt(selectedMonth, 10);
      const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
      setMaxDays(daysInMonth);
      if (selectedDay && parseInt(selectedDay, 10) > daysInMonth) {
        setSelectedDay(String(daysInMonth).padStart(2, "0"));
      }
    }
  }, [selectedMonth, selectedYear, selectedDay]);

  const days = Array.from({ length: maxDays }, (_, i) => String(i + 1).padStart(2, "0"));

  // Sync custom dropdown values back to dob state string
  useEffect(() => {
    if (selectedMonth && selectedDay && selectedYear) {
      setDob(`${selectedYear}-${selectedMonth}-${selectedDay}`);
    } else {
      setDob("");
    }
  }, [selectedMonth, selectedDay, selectedYear]);

  // Debounced search for locations using Nominatim OpenStreetMap API
  useEffect(() => {
    if (location.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            location
          )}&format=json&limit=5&addressdetails=1`,
          {
            headers: {
              "User-Agent": "DarcCoachingApp/1.0",
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          const names = data.map((item: any) => {
            const addr = item.address;
            if (!addr) return item.display_name;
            const city = addr.city || addr.town || addr.village || addr.municipality || addr.state || addr.suburb;
            const state = addr.state;
            const country = addr.country;
            if (city && state && country) {
              return `${city}, ${state}, ${country}`;
            } else if (city && country) {
              return `${city}, ${country}`;
            }
            return item.display_name;
          });
          const uniqueNames = Array.from(new Set(names.filter(Boolean))) as string[];
          setSuggestions(uniqueNames.slice(0, 5));
        }
      } catch (err) {
        console.error("Error fetching locations:", err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [location]);

  // Close suggestions dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await saveUserProfile({
        dob: dob || null,
        location: location || null,
        seekingReason: seekingReason || null,
        educationSchool: educationSchool || null,
        educationDegree: educationDegree || null,
        educationYear: educationYear || null,
        employmentDetails: employmentDetails || null,
        annualIncome: annualIncome || null,
        datingGoals: datingGoals || null,
        instaUrl: instaUrl || null,
        linkedinUrl: linkedinUrl || null,
        xUrl: xUrl || null,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to update profile settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  /* ---- Custom DOB select component ---- */
  const DobSelect = ({
    value,
    onChange,
    placeholder,
    options,
  }: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    options: { value: string; label: string }[];
  }) => (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent border-b border-stone-800/60 py-2.5 pr-7 text-[15px] text-stone-200 focus:outline-none focus:border-amber-500/60 transition-colors appearance-none cursor-pointer"
      >
        <option value="" className="bg-[#0C0A09] text-stone-500">
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#0C0A09] text-stone-200">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-1 top-1/2 -translate-y-1/2 text-stone-600 pointer-events-none"
      />
    </div>
  );

  if (isSessionPending || !session) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0C0A09] text-stone-50">
        <Loader2 className="w-6 h-6 text-stone-500 animate-spin mb-3" />
        <span className="text-sm text-stone-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#0C0A09] text-stone-50 overflow-y-auto relative">
      <MobileHeader />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-28 pt-16 md:pt-8 space-y-6">
        {/* ---- Back + Title ---- */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[13px] text-stone-500 hover:text-stone-300 transition-colors mb-6 cursor-pointer group"
          >
            <ArrowLeft
              size={14}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Back
          </button>

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-50">
            Settings
          </h1>
          <p className="text-[14px] text-stone-500 mt-1">
            Update your profile to get personalized coaching.
          </p>
        </motion.div>

        {/* ---- User Identity ---- */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex items-center gap-4 py-4"
        >
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name}
              className="w-12 h-12 rounded-full ring-2 ring-stone-800/60"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center ring-2 ring-stone-800/60">
              <UserIcon size={20} className="text-stone-500" />
            </div>
          )}
          <div>
            <p className="text-[15px] font-medium text-stone-100">
              {session.user.name || "User"}
            </p>
            <p className="text-[13px] text-stone-500">{session.user.email}</p>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 text-stone-500 animate-spin" />
            <span className="text-sm text-stone-600">Loading profile...</span>
          </div>
        ) : (
          <>
            {/* ---- Section 1: About You ---- */}
            <Section
              title="About You"
              description="Basic details for personalized advice."
              delay={0.1}
            >
              {/* Date of Birth */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-stone-500">
                  Date of Birth
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <DobSelect
                    value={selectedMonth}
                    onChange={setSelectedMonth}
                    placeholder="Month"
                    options={months.map((m) => ({ value: m.value, label: m.label }))}
                  />
                  <DobSelect
                    value={selectedDay}
                    onChange={setSelectedDay}
                    placeholder="Day"
                    options={days.map((d) => ({
                      value: d,
                      label: String(parseInt(d, 10)),
                    }))}
                  />
                  <DobSelect
                    value={selectedYear}
                    onChange={setSelectedYear}
                    placeholder="Year"
                    options={years.map((y) => ({ value: y, label: y }))}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-stone-500">
                  Location
                </label>
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <MapPin
                      size={14}
                      className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-600"
                    />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="San Francisco, CA"
                      className="w-full bg-transparent border-b border-stone-800/60 py-2.5 pl-5 text-[15px] text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/60 transition-colors"
                    />
                  </div>
                  {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#161412] border border-stone-800/40 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto scrollbar-hide">
                      {isLoadingSuggestions ? (
                        <div className="p-3 text-xs text-stone-500 text-center flex items-center justify-center gap-2">
                          <div className="w-3 h-3 border-2 border-t-transparent border-stone-500 rounded-full animate-spin" />
                          Searching...
                        </div>
                      ) : (
                        suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setLocation(suggestion);
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-[13px] text-stone-300 hover:bg-white/5 hover:text-white transition-colors border-b border-stone-800/10 last:border-0"
                          >
                            {suggestion}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <SettingsInput
                label="Dating Goals"
                value={datingGoals}
                onChange={setDatingGoals}
                placeholder="Looking for marriage, self-discovery..."
              />

              <SettingsTextarea
                label="Reason for seeking advice"
                value={seekingReason}
                onChange={setSeekingReason}
                placeholder="Navigating relationship milestones, improving communication..."
              />
            </Section>

            {/* ---- Section 2: Education & Career ---- */}
            <Section
              title="Education & Career"
              description="Helps contextualise life-stage advice."
              delay={0.2}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <SettingsInput
                  label="School / College"
                  value={educationSchool}
                  onChange={setEducationSchool}
                  placeholder="Stanford University"
                />
                <SettingsInput
                  label="Degree"
                  value={educationDegree}
                  onChange={setEducationDegree}
                  placeholder="BS Computer Science"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <SettingsInput
                  label="Year"
                  value={educationYear}
                  onChange={setEducationYear}
                  placeholder="2024"
                />
                <div className="sm:col-span-2">
                  <SettingsInput
                    label="Employment"
                    value={employmentDetails}
                    onChange={setEmploymentDetails}
                    placeholder="Product Manager at Google"
                  />
                </div>
              </div>

              <SettingsInput
                label="Annual Income"
                value={annualIncome}
                onChange={setAnnualIncome}
                placeholder="$100k – $120k"
              />
            </Section>

            {/* ---- Section 3: Social Profiles ---- */}
            <Section
              title="Social Profiles"
              description="Optional — helps DaRC understand your social context."
              delay={0.3}
            >
              <SettingsInput
                label="Instagram"
                value={instaUrl}
                onChange={setInstaUrl}
                placeholder="@username or profile URL"
              />
              <SettingsInput
                label="LinkedIn"
                value={linkedinUrl}
                onChange={setLinkedinUrl}
                placeholder="Profile URL"
              />
              <SettingsInput
                label="X (Twitter)"
                value={xUrl}
                onChange={setXUrl}
                placeholder="@handle or profile URL"
              />
            </Section>
          </>
        )}
      </div>

      {/* ---- Floating Save Bar ---- */}
      {!isLoading && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:left-auto">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.4 }}
              className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-stone-800/30 bg-[#161412]/90 backdrop-blur-xl px-5 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.3)]"
            >
              <p className="text-[13px] text-stone-500 hidden sm:block">
                All changes are saved to your profile.
              </p>

              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  onClick={() => router.back()}
                  disabled={isSaving}
                  className="px-4 py-2 text-[13px] font-medium text-stone-400 hover:text-stone-200 transition-colors rounded-xl hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || saveSuccess}
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-[13px] font-semibold transition-all active:scale-[0.98] ${
                    saveSuccess
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                      : "bg-stone-100 text-stone-900 hover:bg-white"
                  } disabled:opacity-60`}
                >
                  <AnimatePresence mode="wait">
                    {isSaving ? (
                      <motion.span
                        key="saving"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      </motion.span>
                    ) : saveSuccess ? (
                      <motion.span
                        key="success"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                  {saveSuccess ? "Saved" : isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
