import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { NavBar } from "@/components/landing/NavBar";
import PageTransition from "@/components/layout/PageTransition";
import { MoneaLogo } from "@/components/ui/MoneaLogo";
import { SocialMediaIcon } from "@/components/ui/SocialMediaIcon";
import { useSocialLinks } from "@/hooks/useSocialLinks";

export default function ContactPage() {
    const socialLinks = useSocialLinks();

    return (
        <>
            <Helmet>
                <title>MONEO | Contact Us | ទាក់ទង MONEO</title>
                <meta name="description" content="ទាក់ទងក្រុមការងារ MONEO សម្រាប់សំណួរ និងព័ត៌មានបន្ថែម។" />
                <meta name="robots" content="index, follow, max-image-preview:large" />
                <link rel="canonical" href="https://moneoez.com/contact" />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="MONEO" />
                <meta property="og:url" content="https://moneoez.com/contact" />
                <meta property="og:title" content="MONEO | Contact Us | ទាក់ទង MONEO" />
                <meta property="og:description" content="ទាក់ទងក្រុមការងារ MONEO សម្រាប់សំណួរ និងព័ត៌មានបន្ថែម។" />
                <meta property="og:image" content="https://moneoez.com/icons/SE.png" />
                <meta property="og:image:type" content="image/png" />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:image:alt" content="MONEO contact and support" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content="https://moneoez.com/contact" />
                <meta name="twitter:title" content="MONEO | Contact Us | ទាក់ទង MONEO" />
                <meta name="twitter:description" content="ទាក់ទងក្រុមការងារ MONEO សម្រាប់សំណួរ និងព័ត៌មានបន្ថែម។" />
                <meta name="twitter:image" content="https://moneoez.com/icons/SE.png" />
                <meta name="twitter:image:alt" content="MONEO contact and support" />
            </Helmet>
            <PageTransition>
                <main className="min-h-screen bg-background font-kantumruy text-foreground transition-colors duration-300">
                    <NavBar />
                    <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 pb-20 pt-32 sm:px-6">
                        <div className="w-full">
                            <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-primary transition-colors hover:text-sage">
                                <ArrowLeft size={16} /> ត្រឡប់ទៅទំព័រដើម
                            </Link>
                            <div className="max-w-2xl">
                                <div className="mb-3">
                                    <MoneaLogo showText size="sm" />
                                </div>
                                <h1 className="text-4xl font-black leading-[1.4] text-foreground sm:text-6xl">ចង់សួរអ្វីមួយ?</h1>
                                <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
                                    ក្រុមការងារ MONEO រីករាយជួយអ្នករៀបចំធៀបការឌីជីថលឱ្យស្អាត និងងាយស្រួលប្រើ។
                                </p>
                            </div>
                            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {socialLinks.map((socialLink, index) => (
                                    <a
                                        key={`${socialLink.platform}-${index}`}
                                        href={socialLink.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={socialLink.label}
                                        className="rounded-3xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-sage/40 hover:bg-accent"
                                    >
                                        <SocialMediaIcon platform={socialLink.platform} size={24} className="mb-5 text-sage" />
                                        <h2 className="font-bold text-card-foreground">{socialLink.label}</h2>
                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                            {`តាមដាន និងទាក់ទងក្រុមការងារ ${socialLink.label}`}
                                        </p>
                                    </a>
                                ))}
                            </div>
                            <p className="mt-8 border-t border-border pt-5 text-sm text-muted-foreground">
                                សូមជ្រើសរើសបណ្ដាញសង្គមដែលអ្នកចង់ប្រើ ដើម្បីទាក់ទងក្រុមការងារ MONEO។
                            </p>
                        </div>
                    </div>
                </main>
            </PageTransition>
        </>
    );
}
