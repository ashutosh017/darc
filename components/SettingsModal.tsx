"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Sparkles,
  ChevronDown,
  Check,
  X,
  Settings,
  Loader2
} from "lucide-react";
import { saveUserProfile, getUserProfile } from "@/app/actions";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

type TabType = "personal" | "career" | "socials";

export function SettingsModal({ isOpen, onClose, onSaved }: SettingsModalProps) {
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

  // Location Autocomplete suggestions state
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

  // Fetch current user details on open
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setSaveSuccess(false);
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

            // Parse Date of Birth (dob) into Month/Day/Year dropdown values
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
            } else {
              setSelectedYear("");
              setSelectedMonth("");
              setSelectedDay("");
            }
          }
        })
        .catch((err) => console.error("Failed to load user profile:", err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

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
      if (onSaved) onSaved();
      // Auto close after showing success for 1.2s
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (error) {
      console.error("Failed to update profile settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-[#1e1f20] border border-[#3c4043]/30 rounded-2xl sm:rounded-[32px] p-4 sm:p-8 md:p-10 shadow-2xl overflow-hidden"
          >
            {/* Decorative background glows */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#8ab4f8]/55 opacity-10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#d96570]/55 opacity-10 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={isSaving}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-xl transition-all disabled:opacity-50"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="mb-6 select-none">
              <div className="flex items-center gap-2 mb-2">
                <Settings size={18} className="text-[#8ab4f8]" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#8ab4f8]">
                  User Settings
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#e3e3e3]">
                Edit Profile details
              </h2>
            </div>

            {/* Tabs */}
            <div className="flex items-center justify-between mb-6 bg-[#131314]/50 p-1 rounded-full border border-[#3c4043]/20 select-none">
              <button 
                onClick={() => setActiveTab("personal")} 
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-full transition-all ${activeTab === "personal" ? "bg-[#e3e3e3] text-[#131314] shadow" : "text-zinc-400 hover:text-zinc-200"}`}
              >
                <span className="hidden sm:inline">Personal Info</span>
                <span className="sm:hidden">Personal</span>
              </button>
              <button 
                onClick={() => setActiveTab("career")} 
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-full transition-all ${activeTab === "career" ? "bg-[#e3e3e3] text-[#131314] shadow" : "text-zinc-400 hover:text-zinc-200"}`}
              >
                <span className="hidden sm:inline">Education & Career</span>
                <span className="sm:hidden">Career</span>
              </button>
              <button 
                onClick={() => setActiveTab("socials")} 
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-full transition-all ${activeTab === "socials" ? "bg-[#e3e3e3] text-[#131314] shadow" : "text-zinc-400 hover:text-zinc-200"}`}
              >
                <span className="hidden sm:inline">Social Links</span>
                <span className="sm:hidden">Socials</span>
              </button>
            </div>

            {/* Form Content */}
            <div className="min-h-[280px]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-8 h-8 text-[#8ab4f8] animate-spin" />
                  <span className="text-xs text-zinc-500 font-medium">Loading profile details...</span>
                </div>
              ) : (
                <div className="relative">
                  {/* Personal Tab */}
                  {activeTab === "personal" && (
                    <div className="space-y-4">
                      {/* Date of Birth */}
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                          Date of Birth
                        </label>
                        <div className="grid grid-cols-12 gap-3">
                          {/* Month Select */}
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

                          {/* Day Select */}
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

                          {/* Year Select */}
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
                            rows={2}
                            className="w-full bg-[#131314]/40 border border-[#3c4043]/30 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#8ab4f8] transition-all text-[#e3e3e3] resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Career & Education Tab */}
                  {activeTab === "career" && (
                    <div className="space-y-4">
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
                              placeholder="e.g. Engineer, Business owner..."
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
                    <div className="space-y-4">
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

            {/* Footer Actions */}
            {!isLoading && (
              <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-[#3c4043]/20">
                <button
                  onClick={onClose}
                  disabled={isSaving}
                  className="px-4 py-2.5 text-zinc-400 hover:text-white text-xs sm:text-sm font-semibold transition-all hover:bg-white/5 rounded-xl disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  disabled={isSaving || saveSuccess}
                  className={`flex items-center gap-1.5 px-6 py-2.5 text-white rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-[0.98] ${saveSuccess ? "bg-emerald-600 hover:bg-emerald-600" : "bg-gradient-to-tr from-[#4285f4] to-[#9b72cb] hover:shadow-lg"} disabled:opacity-50`}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : saveSuccess ? (
                    <Check className="w-4 h-4" />
                  ) : null}
                  {saveSuccess ? "Saved!" : isSaving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
