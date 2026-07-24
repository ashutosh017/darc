"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

export default function LandingPageClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useGSAP(
    () => {
      let mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Hero Timeline
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.from(".hero-headline", { y: 40, autoAlpha: 0, duration: 1 })
          .from(".hero-sub", { y: 20, autoAlpha: 0, duration: 0.8 }, "-=0.5")
          .from(
            ".hero-cta-area",
            { y: 20, autoAlpha: 0, duration: 0.8 },
            "-=0.4",
          );

        // Blobs animation
        gsap.to(".mesh-blob-1", {
          x: "+=60",
          y: "-=40",
          scale: 1.1,
          duration: 12,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
        gsap.to(".mesh-blob-2", {
          x: "-=50",
          y: "+=30",
          scale: 0.9,
          duration: 15,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
        gsap.to(".mesh-blob-3", {
          x: "+=30",
          y: "+=50",
          scale: 1.15,
          duration: 18,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });

        // Scroll animations
        gsap.from(".conv-card", {
          scrollTrigger: {
            trigger: ".conv-section",
            start: "top 80%",
            once: true,
          },
          y: 30,
          autoAlpha: 0,
          duration: 0.8,
          ease: "power2.out",
        });

        gsap.from(".cap-row", {
          scrollTrigger: {
            trigger: ".cap-section",
            start: "top 80%",
            once: true,
          },
          y: 20,
          autoAlpha: 0,
          stagger: 0.06,
          duration: 0.7,
          ease: "power2.out",
        });

        gsap.from(".trust-block", {
          scrollTrigger: {
            trigger: ".trust-section",
            start: "top 80%",
            once: true,
          },
          y: 20,
          autoAlpha: 0,
          stagger: 0.1,
          duration: 0.7,
          ease: "power2.out",
        });

        gsap.from(".closing-cta", {
          scrollTrigger: {
            trigger: ".closing-section",
            start: "top 80%",
            once: true,
          },
          y: 20,
          autoAlpha: 0,
          duration: 0.7,
          ease: "power2.out",
        });
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(
          [
            ".hero-headline",
            ".hero-sub",
            ".hero-cta-area",
            ".conv-card",
            ".cap-row",
            ".trust-block",
            ".closing-cta",
          ],
          { autoAlpha: 1, y: 0 },
        );
      });
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#0C0A09] text-stone-50 overflow-x-hidden font-sans"
    >
      {/* HEADER */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#0C0A09]/80 backdrop-blur-xl border-b border-stone-800/50 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/darc_logo.png"
              alt="DaRC Logo"
              width={24}
              height={24}
              className="rounded-lg"
            />
            <span className="font-bold tracking-tight text-xl">DARC</span>
          </Link>
          <Link
            href="/chat"
            className="px-5 py-2 rounded-full bg-transparent border border-stone-700 hover:border-stone-500 hover:bg-stone-800 transition-colors text-sm font-medium"
          >
            Open DaRC
          </Link>
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 px-6 flex flex-col items-center text-center min-h-[90dvh] justify-center overflow-hidden">
          <div className="max-w-4xl z-10 relative">
            <h1 className="hero-headline invisible text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight mb-8">
              Your{" "}
              <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 bg-clip-text text-transparent">
                relationships
              </span>{" "}
              deserve better than guesswork
            </h1>
            <p className="hero-sub invisible text-lg text-stone-400 leading-relaxed max-w-2xl mx-auto mb-10">
              DaRC is an AI coach trained in relationship psychology. Ask about
              texting anxiety, mixed signals, conflict resolution, or intimacy —
              and get advice that actually understands context.
            </p>
            <div className="hero-cta-area invisible flex flex-col items-center gap-4">
              <Link
                href="/chat"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-amber-500 text-[#0C0A09] font-medium hover:bg-amber-400 transition-colors text-lg"
              >
                Start a conversation
              </Link>
              <p className="text-sm text-stone-500">
                Free. Private. Always confidential.
              </p>
            </div>
          </div>

          {/* GRADIENT MESH BACKGROUND */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[600px] pointer-events-none z-0 opacity-40 blur-[100px] saturate-150">
            <div className="mesh-blob-1 absolute top-10 left-10 w-[400px] h-[400px] bg-amber-500 rounded-full mix-blend-screen will-change-transform"></div>
            <div className="mesh-blob-2 absolute top-20 right-10 w-[450px] h-[450px] bg-rose-500 rounded-full mix-blend-screen will-change-transform"></div>
            <div className="mesh-blob-3 absolute bottom-10 left-1/4 w-[500px] h-[300px] bg-violet-500 rounded-full mix-blend-screen will-change-transform"></div>
          </div>
        </section>

        {/* THE CONVERSATION SECTION */}
        <section className="conv-section py-20 px-6 max-w-3xl mx-auto relative z-10">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500 font-medium text-center mb-10">
            See DaRC in action
          </p>
          <div className="conv-card invisible bg-stone-900 rounded-2xl border border-stone-800 p-6 sm:p-8 flex flex-col gap-6 shadow-2xl shadow-black/50">
            {/* User Message */}
            <div className="bg-stone-800 text-stone-100 p-4 rounded-2xl rounded-br-md max-w-[85%] ml-auto text-sm sm:text-base leading-relaxed">
              My partner and I keep having the same argument about how much time
              we spend together. Every time I bring it up, they get defensive
              and shut down. I don't know what to do anymore.
            </div>

            {/* DaRC Response */}
            <div className="bg-gradient-to-br from-stone-900 to-stone-800 border border-stone-800 border-l-amber-500/30 border-l-2 p-5 rounded-2xl rounded-bl-md max-w-[95%] text-stone-300 text-sm sm:text-base leading-relaxed space-y-4 shadow-inner">
              <p>
                This pattern — where one person pursues and the other withdraws
                — is called the{" "}
                <strong className="text-stone-200 font-medium">
                  pursue-withdraw cycle
                </strong>
                . It's one of the most common relationship dynamics, and the
                good news is it's very workable.
              </p>
              <p>Here's what's likely happening:</p>
              <p>
                Your partner isn't shutting down because they don't care.
                Withdrawal is often a{" "}
                <strong className="text-stone-200 font-medium">
                  self-protection response
                </strong>{" "}
                when someone feels overwhelmed or fears they'll say something
                hurtful.
              </p>
              <div className="pt-4 mt-2 border-t border-stone-800/50">
                <p className="mb-2">
                  <strong className="text-stone-200 font-medium">
                    Try this approach next time:
                  </strong>
                </p>
                <p className="mb-2">
                  Instead of &quot;we need to talk about time together,&quot;
                  which can trigger defensiveness, try leading with your
                  feeling: &quot;I've been missing you lately. Can we find a
                  time this week that's just for us?&quot;
                </p>
                <p>
                  This reframes the conversation from a complaint to an
                  invitation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* WHAT DARC UNDERSTANDS (Capability Grid) */}
        <section className="cap-section py-24 px-6 max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500 font-medium mb-12">
            What you can ask about
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
            {[
              {
                title: "Texting & Communication",
                desc: "Decode mixed signals, craft authentic replies, understand response patterns",
              },
              {
                title: "Dating Confidence",
                desc: "Build social skills, manage approach anxiety, make strong first impressions",
              },
              {
                title: "Conflict Resolution",
                desc: "Navigate arguments without escalation, break repetitive cycles",
              },
              {
                title: "Attachment & Intimacy",
                desc: "Understand attachment styles, build emotional safety, deepen connection",
              },
              {
                title: "Breakups & Moving On",
                desc: "Process grief, decide whether to stay or go, rebuild after heartbreak",
              },
              {
                title: "Boundaries & Self-Worth",
                desc: "Recognize red flags, set healthy limits, build relationship self-esteem",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="cap-row invisible py-6 border-b border-stone-800 flex flex-col gap-1"
              >
                <h3 className="text-stone-50 font-medium text-lg">
                  {item.title}
                </h3>
                <p className="text-stone-500 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* THE TRUST SECTION */}
        <section className="trust-section py-24 px-6 bg-[#131110] border-y border-stone-900">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500 font-medium text-center mb-16">
              Why DaRC Works
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="trust-block invisible flex flex-col gap-4">
                <div className="w-12 h-[2px] bg-amber-500 rounded-full"></div>
                <h3 className="text-xl font-medium text-stone-50">
                  Psychology, not platitudes
                </h3>
                <p className="text-stone-400 leading-relaxed text-sm">
                  Every response draws from attachment theory, Gottman method
                  principles, and CBT-informed communication frameworks. Not
                  fortune cookie advice.
                </p>
              </div>
              <div className="trust-block invisible flex flex-col gap-4">
                <div className="w-12 h-[2px] bg-rose-500 rounded-full"></div>
                <h3 className="text-xl font-medium text-stone-50">
                  Your context matters
                </h3>
                <p className="text-stone-400 leading-relaxed text-sm">
                  DaRC remembers what you've shared in a conversation and
                  tailors advice to your specific situation, relationship
                  history, and goals.
                </p>
              </div>
              <div className="trust-block invisible flex flex-col gap-4">
                <div className="w-12 h-[2px] bg-violet-500 rounded-full"></div>
                <h3 className="text-xl font-medium text-stone-50">
                  Completely private
                </h3>
                <p className="text-stone-400 leading-relaxed text-sm">
                  Your conversations are encrypted and anonymous. No human ever
                  reads them. Delete everything at any time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="closing-section py-32 px-6 flex flex-col items-center text-center">
          <div className="closing-cta invisible flex flex-col items-center">
            <h2 className="text-3xl lg:text-4xl font-medium text-stone-50 mb-4">
              Whenever you're ready
            </h2>
            <p className="text-stone-400 mb-10 max-w-md mx-auto">
              Start a conversation whenever something's on your mind.
            </p>
            <Link
              href="/chat"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-amber-500 text-[#0C0A09] font-medium hover:bg-amber-400 transition-colors text-lg"
            >
              Open DaRC
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-stone-800 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stone-600">
          <div className="flex items-center gap-0">
            <Image
              src="/darc_logo.png"
              alt="DaRC Logo"
              width={36}
              height={36}
              className="rounded-md opacity-50"
            />
            <span className="font-semibold tracking-tight">DARC</span>
          </div>
          <div className="text-center">
            Conversations are encrypted and anonymous.
          </div>
          <div>© {new Date().getFullYear()}</div>
        </div>
      </footer>
    </div>
  );
}
