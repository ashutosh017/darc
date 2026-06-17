import React from "react";
import Link from "next/link";
import { 
  Heart, 
  MessageSquare, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight, 
  HelpCircle, 
  CheckCircle,
  ArrowRight,
  TrendingUp
} from "lucide-react";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/chat");
  }

  const faqs = [
    {
      question: "What is DARC?",
      answer: "DARC (Dating and Relationship Coach) is an advanced AI relationship assistant designed to help you navigate dating, intimacy, and communication. It offers personalized, context-aware coaching based on psychology and relationship science."
    },
    {
      question: "Can DARC help me write openers or analyze messages?",
      answer: "Absolutely! You can paste message exchanges or ask DARC for personalized opener recommendations, reply suggestions, and subtext analysis. DARC helps you communicate clearly, showing interest while maintaining authentic boundaries."
    },
    {
      question: "Is DARC completely private and secure?",
      answer: "Yes, privacy is our top priority. Your conversations with DARC are completely anonymous, encrypted, and never shared with third parties. You have full control over your chat history and can delete it at any time."
    },
    {
      question: "How does the daily chat limit work?",
      answer: "We offer a daily allowance of free relationship coaching sessions. Your limit resets every 24 hours. You can view your current daily limit usage directly in the sidebar."
    },
    {
      question: "Is DARC based on professional relationship psychology?",
      answer: "Yes, DARC leverages concepts from attachment theory, active listening, and relationship communication frameworks (such as Gottman method principles) to provide constructive, growth-oriented dating and relationship guidance."
    }
  ];

  const features = [
    {
      icon: <MessageSquare className="w-6 h-6 text-blue-400" />,
      title: "Chat & Message Analysis",
      description: "Paste text messages or describe conversation dynamics. DARC decodes mixed signals, identifies attachment cues, and suggests what to say next."
    },
    {
      icon: <Sparkles className="w-6 h-6 text-purple-400" />,
      title: "Smart Openers & Replies",
      description: "Get creative, personality-aligned openers and replies tailored to your match's profile, making your first impression count."
    },
    {
      icon: <Heart className="w-6 h-6 text-pink-400" />,
      title: "Relationship & Intimacy Coaching",
      description: "Navigate relationship milestones, resolve conflicts, and address attachment insecurities with professional, constructive advice."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-green-400" />,
      title: "100% Anonymous & Secure",
      description: "Enjoy a completely safe, judgment-free space. Your data is encrypted, secure, and entirely under your control."
    }
  ];

  // Schema structured data for Google Rich Snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://darc.fun/#website",
        "url": "https://darc.fun",
        "name": "DARC | AI Dating & Relationship Coach",
        "description": "AI-powered relationship coaching for the modern age.",
        "publisher": {
          "@type": "Organization",
          "name": "DARC",
          "logo": {
            "@type": "ImageObject",
            "url": "https://darc.fun/darc-ai-logo.png"
          }
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://darc.fun/#software",
        "name": "DARC AI",
        "applicationCategory": "HealthApplication",
        "operatingSystem": "All",
        "url": "https://darc.fun",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "description": "AI-powered relationship coaching, text analysis, and dating advice."
      },
      {
        "@type": "FAQPage",
        "@id": "https://darc.fun/#faq",
        "mainEntity": faqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#131314] text-[#e3e3e3] font-sans overflow-x-hidden">
      {/* Google SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-[#131314]/80 backdrop-blur-md border-b border-[#3c4043]/30 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img 
              src="/darc-ai-logo.png" 
              alt="DARC Logo" 
              className="w-7 h-7 object-contain"
            />
            <span className="text-xl font-bold tracking-tight text-white">DARC</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href="/chat" 
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-full shadow-md transition-all active:scale-[0.98]"
            >
              Go to App
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-36 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-pink-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 mb-8 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Dating & Relationship Coach</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Master the Art of <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">
              Modern Dating & Intimacy
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-zinc-400 mb-10 leading-relaxed">
            Stuck on what to reply? Need to decode mixed signals? DARC offers 24/7 personalized, psychology-backed communication coaching to build deep, lasting connections.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link 
              href="/chat" 
              className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 text-base font-bold text-black bg-white rounded-full hover:bg-zinc-100 shadow-xl transition-all active:scale-[0.98]"
            >
              Start Free Coaching
              <ChevronRight className="w-5 h-5 ml-1" />
            </Link>
            <a 
              href="#features" 
              className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 text-base font-semibold text-zinc-300 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 rounded-full transition-all"
            >
              Explore Features
            </a>
          </div>

          {/* Product Preview Card */}
          <div className="max-w-4xl mx-auto rounded-[32px] border border-[#3c4043]/30 bg-[#1e1f20]/50 backdrop-blur-md p-4 sm:p-6 md:p-8 shadow-2xl relative">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
            
            {/* Header window control */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#3c4043]/20">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="text-xs text-zinc-500 font-medium">DARC — AI COACH</div>
              <div className="w-10" />
            </div>

            {/* Conversation Flow */}
            <div className="space-y-6 text-left max-w-2xl mx-auto">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold shrink-0 text-zinc-400">
                  ME
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl px-4 py-3 text-sm text-zinc-300 max-w-[85%]">
                  "I've been texting this guy for a week. Sometimes he replies instantly, and other times he takes 12 hours. Should I match his energy?"
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-pink-500 flex items-center justify-center text-xs font-semibold shrink-0 shadow-md">
                  💡
                </div>
                <div className="bg-gradient-to-r from-indigo-950/20 to-purple-950/20 border border-indigo-900/30 rounded-2xl px-4 py-3 text-sm text-zinc-200 max-w-[85%] shadow-sm leading-relaxed">
                  <p className="font-semibold text-indigo-400 mb-1">DARC AI Response</p>
                  "Fluctuating response times can trigger anxiety, but trying to play games or artificially match energy often leads to fatigue. Instead, focus on consistency. If he takes 12 hours, reply when you're naturally free, but keep your tone warm. If he asks to meet, that shows intent. If the slow replies persist and it feels draining, it's safe to prioritize matches who match your communication pace."
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 border-t border-[#3c4043]/20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Unlock Your Full Relationship Potential
            </h2>
            <p className="max-w-xl mx-auto text-zinc-400 text-base sm:text-lg">
              Get the skills, tools, and confidence to build deep and meaningful bonds. DARC guides you through every interaction.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className="bg-[#1a1a1c]/60 border border-zinc-800/60 p-6 rounded-3xl hover:border-indigo-500/50 hover:bg-[#1a1a1c] transition-all duration-300 relative group"
              >
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-[#1a1a1c]/30 border-t border-b border-[#3c4043]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How DARC Works
            </h2>
            <p className="max-w-xl mx-auto text-zinc-400">
              Personalized AI dating advice is just three steps away.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-xl font-bold text-blue-400 mb-6 shadow-lg">
                1
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Share Your Context</h3>
              <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
                Describe the situation, upload screenshot details, or paste a message thread that you want coaching on.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-xl font-bold text-purple-400 mb-6 shadow-lg">
                2
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Instant Analysis</h3>
              <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
                DARC parses subtext, Attachment Styles, and emotional cues to outline communication advice.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-xl font-bold text-pink-400 mb-6 shadow-lg">
                3
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Build Intimacy</h3>
              <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
                Send authentic replies, identify compatibility flags early, and improve your relationship habits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Stats Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        <div className="bg-gradient-to-r from-blue-950/20 to-purple-950/20 border border-indigo-950/40 rounded-[32px] p-8 md:p-12 lg:p-16 flex flex-col md:flex-row items-center justify-around gap-8">
          <div>
            <div className="text-4xl md:text-5xl font-black text-white mb-2">24/7</div>
            <div className="text-sm text-zinc-400 uppercase tracking-widest font-semibold">Availability</div>
          </div>
          <div className="hidden md:block w-px h-12 bg-zinc-800" />
          <div>
            <div className="text-4xl md:text-5xl font-black text-white mb-2">100%</div>
            <div className="text-sm text-zinc-400 uppercase tracking-widest font-semibold">Private & Safe</div>
          </div>
          <div className="hidden md:block w-px h-12 bg-zinc-800" />
          <div>
            <div className="text-4xl md:text-5xl font-black text-white mb-2 flex items-center justify-center gap-1.5">
              <TrendingUp className="w-8 h-8 text-indigo-400" />
              <span>Free</span>
            </div>
            <div className="text-sm text-zinc-400 uppercase tracking-widest font-semibold">Daily Coaching</div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          <p className="text-zinc-400">Everything you need to know about DARC relationship coaching.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <details 
              key={idx} 
              className="group border border-zinc-800/60 bg-[#1a1a1c]/40 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex items-center justify-between px-6 py-5 cursor-pointer select-none">
                <h3 className="font-bold text-white text-base sm:text-lg group-hover:text-indigo-400 transition-colors">
                  {faq.question}
                </h3>
                <span className="ml-1.5 flex-shrink-0 rounded-full bg-zinc-800 p-1 text-zinc-400 group-open:rotate-180 transition-transform duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <div className="px-6 pb-6 text-sm sm:text-base text-zinc-400 leading-relaxed border-t border-zinc-900 pt-4">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-b from-transparent to-[#161618] text-center border-t border-[#3c4043]/15">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6">
            Ready to Transform Your Dating Journey?
          </h2>
          <p className="text-lg text-zinc-400 mb-10 max-w-xl mx-auto">
            Join thousands of users building deeper connections and navigating the modern dating landscape with confidence.
          </p>
          <Link 
            href="/chat" 
            className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-black bg-white rounded-full hover:bg-zinc-100 shadow-xl transition-all active:scale-[0.98]"
          >
            Get Started Now — It's Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#131314] border-t border-[#3c4043]/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img 
              src="/darc-ai-logo.png" 
              alt="DARC Logo" 
              className="w-6 h-6 object-contain"
            />
            <span className="text-lg font-bold text-white">DARC</span>
          </div>

          <p className="text-xs text-zinc-500 text-center md:text-right">
            &copy; {new Date().getFullYear()} DARC. All rights reserved. 100% Secure & Anonymous.
          </p>
        </div>
      </footer>
    </div>
  );
}
