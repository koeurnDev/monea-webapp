import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, CircleHelp, Send, Ticket } from "lucide-react";
import { NavBar } from "@/components/landing/NavBar";
import PageTransition from "@/components/layout/PageTransition";
import { useSocialLinks } from "@/hooks/useSocialLinks";

export default function SupportPage() {
    const telegramLink = useSocialLinks().find((link) => link.platform === "telegram");

    return (
        <>
            <Helmet>
                <title>MONEO | Support Center | ជំនួយ និងការគាំទ្រ</title>
                <meta name="description" content="ទទួលជំនួយពី MONEO សម្រាប់ការបង្កើតធៀបការ និងការគ្រប់គ្រងភ្ញៀវ។" />
                <meta name="robots" content="index, follow, max-image-preview:large" />
                <link rel="canonical" href="https://moneoez.com/support" />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="MONEO" />
                <meta property="og:url" content="https://moneoez.com/support" />
                <meta property="og:title" content="MONEO | Support Center | ជំនួយ និងការគាំទ្រ" />
                <meta property="og:description" content="ទទួលជំនួយពី MONEO សម្រាប់ការបង្កើតធៀបការ និងការគ្រប់គ្រងភ្ញៀវ។" />
                <meta property="og:image" content="https://moneoez.com/icons/SE.png" />
                <meta property="og:image:type" content="image/png" />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:image:alt" content="MONEO support center" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content="https://moneoez.com/support" />
                <meta name="twitter:title" content="MONEO | Support Center | ជំនួយ និងការគាំទ្រ" />
                <meta name="twitter:description" content="ទទួលជំនួយពី MONEO សម្រាប់ការបង្កើតធៀបការ និងការគ្រប់គ្រងភ្ញៀវ។" />
                <meta name="twitter:image" content="https://moneoez.com/icons/SE.png" />
                <meta name="twitter:image:alt" content="MONEO support center" />
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
                                <p className="mb-3 text-sm font-bold tracking-wide text-gold">MONEO CARE</p>
                                <h1 className="text-4xl font-black leading-[1.4] text-foreground sm:text-6xl">ជំនួយនៅពេលអ្នកត្រូវការ</h1>
                                <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
                                    ជ្រើសរើសវិធីដែលងាយស្រួលសម្រាប់អ្នក ហើយក្រុមការងាររបស់យើងនឹងជួយឱ្យអ្នកបន្តការងារបានរលូន។
                                </p>
                            </div>
                            <div className="mt-12 grid gap-4 md:grid-cols-3">
                                {telegramLink && <a href={telegramLink.url} target="_blank" rel="noopener noreferrer" className="rounded-3xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-sage/40 hover:bg-accent">
                                    <Send className="mb-5 text-sage" size={24} />
                                    <h2 className="font-bold text-card-foreground">ជំនួយតាម {telegramLink.label}</h2>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">សម្រាប់សំណួរដែលត្រូវការចម្លើយរហ័ស</p>
                                </a>}
                                <Link to="/sign-in" className="rounded-3xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-sage/40 hover:bg-accent">
                                    <Ticket className="mb-5 text-sage" size={24} />
                                    <h2 className="font-bold text-card-foreground">ផ្ញើសំណើសុំជំនួយ</h2>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">ចូលគណនី ដើម្បីផ្ញើបញ្ហាទៅក្រុមការងារ</p>
                                </Link>
                                <Link to="/templates" className="rounded-3xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-sage/40 hover:bg-accent">
                                    <BookOpen className="mb-5 text-sage" size={24} />
                                    <h2 className="font-bold text-card-foreground">មើលគំរូធៀបការ</h2>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">ស្វែងរកគំរូដែលសមនឹងថ្ងៃពិសេសរបស់អ្នក</p>
                                </Link>
                            </div>
                            <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
                                <CircleHelp size={17} className="text-sage" /> ជាទូទៅ យើងឆ្លើយតបក្នុងរយៈពេល ១ ទៅ ២៤ ម៉ោង
                            </div>
                        </div>
                    </div>
                </main>
            </PageTransition>
        </>
    );
}
