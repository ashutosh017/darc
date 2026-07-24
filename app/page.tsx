import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import LandingPageClient from "@/components/landing/LandingPageClient";

export default async function LandingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/chat");
  }

  // Schema structured data for Google Rich Snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://darc.fun/#website",
        url: "https://darc.fun",
        name: "DARC | AI Dating & Relationship Coach",
        description: "AI-powered relationship coaching for the modern age.",
        publisher: {
          "@type": "Organization",
          name: "DARC",
          logo: {
            "@type": "ImageObject",
            url: "https://darc.fun/darc_logo.png",
          },
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://darc.fun/#software",
        name: "DARC AI",
        applicationCategory: "HealthApplication",
        operatingSystem: "All",
        url: "https://darc.fun",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description:
          "AI-powered relationship coaching, text analysis, and dating advice.",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPageClient />
    </>
  );
}
