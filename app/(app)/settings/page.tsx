"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { 
  Calendar, 
  MapPin, 
  HelpCircle, 
  GraduationCap, 
  Briefcase, 
  DollarSign, 
  Heart, 
  Camera, 
  Network, 
  Globe, 
  ChevronDown, 
  Check, 
  Settings, 
  Loader2, 
  User as UserIcon,
  ArrowLeft
} from "lucide-react";
import { saveUserProfile, getUserProfile } from "@/app/actions";

type TabType = "personal" | "career" | "socials";

export default function SettingsPage() {
  const { data: session, isPending: isSessionPending } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>("personal");
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
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
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

  if (isSessionPending || !session) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#131314] text-[#e3e3e3]">
        <Loader2 className="w-8 h-8 text-[#8ab4f8] animate-spin mb-3" />
        <span className="text-sm text-zinc-500">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#131314] text-[#e3e3e3] overflow-y-auto px-4 md:px-8 py-8">
      {/* Decorative background glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#8ab4f8]/5 opacity-20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#d96570]/5 opacity-20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Breadcrumb / Back Navigation */}
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          <span>Back</span>
        </button>

        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#3c4043]/30 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1e1f20] border border-[#3c4043]/30 flex items-center justify-center shadow-lg">
              <Settings size={24} className="text-[#8ab4f8]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-sm text-zinc-400 mt-1">Manage your profile details and preferences.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              disabled={isSaving}
              className="px-4 py-2 border border-[#3c4043]/30 text-zinc-300 hover:text-white rounded-xl text-sm font-semibold transition-all hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || saveSuccess}
              className={`flex items-center gap-1.5 px-5 py-2 text-white rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${saveSuccess ? "bg-emerald-600 hover:bg-emerald-600" : "bg-gradient-to-tr from-[#4285f4] to-[#9b72cb] hover:shadow-lg"} disabled:opacity-50`}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saveSuccess ? (
                <Check className="w-4 h-4" />
              ) : null}
              {saveSuccess ? "Saved!" : isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left Tab Navigation */}
          <div className="md:col-span-1 flex flex-col gap-1.5 bg-[#1e1f20]/50 p-2 border border-[#3c4043]/20 rounded-2xl h-fit">
            <button 
              onClick={() => setActiveTab("personal")}
              className={`flex items-center gap-2.5 px-4 py-3 text-sm font-semibold rounded-xl text-left transition-all cursor-pointer ${activeTab === "personal" ? "bg-[#e3e3e3] text-[#131314] shadow-md" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}
            >
              <UserIcon size={16} />
              <span>Personal Info</span>
            </button>
            <button 
              onClick={() => setActiveTab("career")}
              className={`flex items-center gap-2.5 px-4 py-3 text-sm font-semibold rounded-xl text-left transition-all cursor-pointer ${activeTab === "career" ? "bg-[#e3e3e3] text-[#131314] shadow-md" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}
            >
              <GraduationCap size={16} />
              <span>Career & Edu</span>
            </button>
            <button 
              onClick={() => setActiveTab("socials")}
              className={`flex items-center gap-2.5 px-4 py-3 text-sm font-semibold rounded-xl text-left transition-all cursor-pointer ${activeTab === "socials" ? "bg-[#e3e3e3] text-[#131314] shadow-md" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}
            >
              <Camera size={16} />
              <span>Social Links</span>
            </button>
          </div>

          {/* Right Form Container */}
          <div className="md:col-span-3 bg-[#1e1f20] border border-[#3c4043]/30 rounded-3xl p-6 md:p-8 shadow-xl min-h-[380px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 text-[#8ab4f8] animate-spin" />
                <span className="text-sm text-zinc-500 font-medium">Loading details...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Personal Info Tab */}
                {activeTab === "personal" && (
                  <div className="space-y-5">
                    <h3 className="text-lg font-bold text-white border-b border-[#3c4043]/20 pb-2">Personal Details</h3>
                    
                    {/* Date of Birth */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                        Date of Birth
                      </label>
                      <div className="grid grid-cols-12 gap-3">
                        <div className="relative col-span-5">
                          <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full bg-[#131314]/40 border border-[#3c4043]/30 rounded-xl py-2.5 pl-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-[#8ab4f8] transition-all text-[#e3e3e3] appearance-none cursor-pointer"
                          >
                            <option value="" className="bg-[#1e1f20] text-zinc-500">Month</option>
                            {months.map((m) => (
                              <option key={m.value} value={m.value} className="bg-[#1e1f20] text-[#e3e3e3]">
                                {m.label}
                              </option>
                            ))}
                          </select>
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                            <ChevronDown size={14} />
                          </span>
                        </div>

                        <div className="relative col-span-3">
                          <select
                            value={selectedDay}
                            onChange={(e) => setSelectedDay(e.target.value)}
                            className="w-full bg-[#131314]/40 border border-[#3c4043]/30 rounded-xl py-2.5 pl-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-[#8ab4f8] transition-all text-[#e3e3e3] appearance-none cursor-pointer"
                          >
                            <option value="" className="bg-[#1e1f20] text-zinc-500">Day</option>
                            {days.map((d) => (
                              <option key={d} value={d} className="bg-[#1e1f20] text-[#e3e3e3]">
                                {parseInt(d, 10)}
                              </option>
                            ))}
                          </select>
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                            <ChevronDown size={14} />
                          </span>
                        </div>

                        <div className="relative col-span-4">
                          <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="w-full bg-[#131314]/40 border border-[#3c4043]/30 rounded-xl py-2.5 pl-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-[#8ab4f8] transition-all text-[#e3e3e3] appearance-none cursor-pointer"
                          >
                            <option value="" className="bg-[#1e1f20] text-zinc-500">Year</option>
                            {years.map((y) => (
                              <option key={y} value={y} className="bg-[#1e1f20] text-[#e3e3e3]">
                                {y}
                              </option>
                            ))}
                          </select>
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                            <ChevronDown size={14} />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                        Where do you belong?
                      </label>
                      <div className="relative" ref={dropdownRef}>
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                          <MapPin size={14} />
                        </span>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => {
                            setLocation(e.target.value);
                            setShowSuggestions(true);
                          }}
                          onFocus={() => setShowSuggestions(true)}
                          placeholder="e.g. San Francisco, CA"
                          className="w-full bg-[#131314]/40 border border-[#3c4043]/30 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#8ab4f8] transition-all text-[#e3e3e3]"
                        />
                        {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-[#1e1f20] border border-[#3c4043]/40 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto scrollbar-hide">
                            {isLoadingSuggestions ? (
                              <div className="p-3 text-xs text-zinc-500 text-center flex items-center justify-center gap-2">
                                <div className="w-3.5 h-3.5 border-2 border-t-transparent border-[#8ab4f8] rounded-full animate-spin" />
                                Searching locations...
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
                                  className="w-full text-left px-4 py-2.5 text-xs text-[#e3e3e3] hover:bg-white/5 hover:text-white transition-colors border-b border-[#3c4043]/10 last:border-0"
                                >
                                  {suggestion}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Dating Goals */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                        Dating Goals
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                          <Heart size={14} />
                        </span>
                        <input
                          type="text"
                          value={datingGoals}
                          onChange={(e) => setDatingGoals(e.target.value)}
                          placeholder="e.g. Looking for marriage, self-discovery..."
                          className="w-full bg-[#131314]/40 border border-[#3c4043]/30 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#8ab4f8] transition-all text-[#e3e3e3]"
                        />
                      </div>
                    </div>

                    {/* Seeking Reason */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                        Reason for seeking expert advice
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-zinc-500">
                          <HelpCircle size={14} />
                        </span>
                        <textarea
                          value={seekingReason}
                          onChange={(e) => setSeekingReason(e.target.value)}
                          placeholder="e.g. Navigating relationship milestones..."
                          rows={3}
                          className="w-full bg-[#131314]/40 border border-[#3c4043]/30 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#8ab4f8] transition-all text-[#e3e3e3] resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Career & Education Tab */}
                {activeTab === "career" && (
                  <div className="space-y-5">
                    <h3 className="text-lg font-bold text-white border-b border-[#3c4043]/20 pb-2">Education & Career</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                          School / College
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                            <GraduationCap size={14} />
                          </span>
                          <input
                            type="text"
                            value={educationSchool}
                            onChange={(e) => setEducationSchool(e.target.value)}
                            placeholder="School / College"
                            className="w-full bg-[#131314]/40 border border-[#3c4043]/30 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#8ab4f8] transition-all text-[#e3e3e3]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                          Degree
                        </label>
                        <input
                          type="text"
                          value={educationDegree}
                          onChange={(e) => setEducationDegree(e.target.value)}
                          placeholder="Degree / Field"
                          className="w-full bg-[#131314]/40 border border-[#3c4043]/30 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#8ab4f8] transition-all text-[#e3e3e3]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="col-span-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                          Year
                        </label>
                        <input
                          type="text"
                          value={educationYear}
                          onChange={(e) => setEducationYear(e.target.value)}
                          placeholder="e.g. 2024"
                          className="w-full bg-[#131314]/40 border border-[#3c4043]/30 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#8ab4f8] transition-all text-[#e3e3e3]"
                        />
                      </div>

                      <div className="col-span-1 sm:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                          Employment Details
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                            <Briefcase size={14} />
                          </span>
                          <input
                            type="text"
                            value={employmentDetails}
                            onChange={(e) => setEmploymentDetails(e.target.value)}
                            placeholder="e.g. Engineer, Manager..."
                            className="w-full bg-[#131314]/40 border border-[#3c4043]/30 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#8ab4f8] transition-all text-[#e3e3e3]"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                        Annual Income
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                          <DollarSign size={14} />
                        </span>
                        <input
                          type="text"
                          value={annualIncome}
                          onChange={(e) => setAnnualIncome(e.target.value)}
                          placeholder="e.g. $100k - $120k"
                          className="w-full bg-[#131314]/40 border border-[#3c4043]/30 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#8ab4f8] transition-all text-[#e3e3e3]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Social Links Tab */}
                {activeTab === "socials" && (
                  <div className="space-y-5">
                    <h3 className="text-lg font-bold text-white border-b border-[#3c4043]/20 pb-2">Social Profiles</h3>
                    
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                        Instagram Profile
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                          <Camera size={14} />
                        </span>
                        <input
                          type="text"
                          value={instaUrl}
                          onChange={(e) => setInstaUrl(e.target.value)}
                          placeholder="Instagram Profile URL / Username"
                          className="w-full bg-[#131314]/40 border border-[#3c4043]/30 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#8ab4f8] transition-all text-[#e3e3e3]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                        LinkedIn Profile
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                          <Network size={14} />
                        </span>
                        <input
                          type="text"
                          value={linkedinUrl}
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                          placeholder="LinkedIn Profile URL"
                          className="w-full bg-[#131314]/40 border border-[#3c4043]/30 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#8ab4f8] transition-all text-[#e3e3e3]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                        X (Twitter) Profile
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                          <Globe size={14} />
                        </span>
                        <input
                          type="text"
                          value={xUrl}
                          onChange={(e) => setXUrl(e.target.value)}
                          placeholder="X (Twitter) Profile URL / Username"
                          className="w-full bg-[#131314]/40 border border-[#3c4043]/30 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#8ab4f8] transition-all text-[#e3e3e3]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
