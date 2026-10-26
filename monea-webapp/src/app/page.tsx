import React from "react";
import { Helmet } from "react-helmet-async";
import PageTransition from "@/components/layout/PageTransition";
import { NavBar } from "@/components/landing/NavBar";
import { Hero } from "@/components/landing/Hero";
import { TemplatesShowcase } from "@/components/landing/sections/TemplatesShowcase";
import { Features } from "@/components/landing/sections/Features";
import { HowItWorks } from "@/components/landing/sections/HowItWorks";
import { FAQ } from "@/components/landing/sections/FAQ";
import { FinalCTA } from "@/components/landing/sections/FinalCTA";
import { Footer } from "@/components/landing/StaticSections";

export default function LandingPage() {
  return (
    <>
      <Helmet>
        <title>MONEO - ធៀបការឌីជីថលខ្មែរ</title>
        <meta
          name="description"
          content="បង្កើតធៀបអញ្ជើញមង្គលការឌីជីថលបានយ៉ាងងាយស្រួលជាមួយ MONEO ភ្ជាប់ Google Maps, KHQR និង Telegram ក្នុងពេលតែមួយ។"
        />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="googlebot" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href="https://moneoez.com/" />
        <link rel="alternate" hrefLang="km" href="https://moneoez.com/" />
        <link rel="alternate" hrefLang="x-default" href="https://moneoez.com/" />

        <meta property="og:title" content="MONEO - ធៀបការឌីជីថលខ្មែរ" />
        <meta
          property="og:description"
          content="បង្កើតធៀបអញ្ជើញមង្គលការឌីជីថលជាមួយ MONEO ភ្ជាប់ Google Maps, KHQR និង Telegram ក្នុងពេលតែមួយ។"
        />
        <meta property="og:site_name" content="MONEO" />
        <meta property="og:url" content="https://moneoez.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://moneoez.com/icons/SE.png" />
        <meta property="og:image:alt" content="MONEO — ធៀបអញ្ជើញមង្គលការឌីជីថលនៅកម្ពុជា" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://moneoez.com/" />
        <meta name="twitter:title" content="MONEO - ធៀបការឌីជីថលខ្មែរ" />
        <meta
          name="twitter:description"
          content="បង្កើតធៀបការឌីជីថលបានយ៉ាងងាយស្រួលជាមួយ MONEO ភ្ជាប់ Google Maps, KHQR និង Telegram ក្នុងពេលតែមួយ។"
        />
        <meta name="twitter:image" content="https://moneoez.com/icons/SE.png" />
        <meta name="twitter:image:alt" content="MONEO — ធៀបអញ្ជើញមង្គលការឌីជីថលនៅកម្ពុជា" />
      </Helmet>

      <PageTransition>
        <div className="monea-landing relative flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
          <NavBar />
          <main>
            <Hero />
            <TemplatesShowcase />

            {/* SEO-critical sections: render immediately so Google can crawl initial HTML */}
            <section className="mx-auto max-w-5xl px-4 pb-8 sm:px-6">
              <div className="rounded-3xl border border-border bg-background p-6 sm:p-8">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  MONEO · ធៀបការ
                </p>
                <h2 className="font-kantumruy text-xl font-black leading-tight text-foreground sm:text-2xl">
                  បង្កើត <span className="text-primary">ធៀបការឌីជីថល</span> សម្រាប់ “ធៀបការ” របស់អ្នក
                </h2>
                <p className="mt-3 font-kantumruy text-sm leading-7 text-muted-foreground sm:text-base">
                  ផ្ញើអញ្ជើញយ៉ាងងាយស្រួលទៅភ្ញៀវ និងគ្រប់គ្រង RSVP ពីកន្លែងតែមួយ។ រួមបញ្ចូល Google Maps, KHQR និង Telegram ដើម្បីឲ្យការរៀបចំធៀបការរបស់អ្នកកាន់តែងាយស្រួល។
                </p>
              </div>
            </section>
            <Features />
            <HowItWorks />
            <FAQ />
            <FinalCTA />
          </main>

          <Footer />
        </div>
      </PageTransition>
    </>
  );
}
