import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { AUTH_URLS } from "@/lib/constants";
import { NavBar } from "@/components/landing/NavBar";
import { Footer } from "@/components/landing/StaticSections";

const benefits = [
  "រចនាធៀបអញ្ជើញមង្គលការជាភាសាខ្មែរ",
  "ផ្ញើតំណធៀបការតាម Telegram និង Messenger",
  "បន្ថែម Google Maps, RSVP និងព័ត៌មានកម្មវិធី",
  "ទទួលចំណងដៃតាម Bakong KHQR",
];

export default function DigitalWeddingInvitationPage() {
  return (
    <>
      <Helmet>
        <title>ធៀបការឌីជីថល | MONEO - Online Khmer Wedding Invitation</title>
        <meta
          name="description"
          content="បង្កើតធៀបការឌីជីថលជាភាសាខ្មែរ ជាមួយ MONEO: ភ្ជាប់ Google Maps, RSVP និងចំណងដៃ KHQR ក្នុងកន្លែងតែមួយ។"
        />

        <link rel="canonical" href="https://moneoez.com/khmer-digital-wedding-invitation" />
        <link rel="alternate" hrefLang="km" href="https://moneoez.com/khmer-digital-wedding-invitation" />
        <link rel="alternate" hrefLang="x-default" href="https://moneoez.com/khmer-digital-wedding-invitation" />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="MONEO" />
        <meta property="og:url" content="https://moneoez.com/khmer-digital-wedding-invitation" />
        <meta property="og:title" content="ធៀបការឌីជីថល | MONEO - Online Khmer Wedding Invitation" />
        <meta
          property="og:description"
          content="បង្កើតធៀបការឌីជីថលជាភាសាខ្មែរ ជាមួយ MONEO: RSVP, Google Maps និងចំណងដៃ KHQR ក្នុងកន្លែងតែមួយ។"
        />
        <meta property="og:image" content="https://moneoez.com/icons/SE.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ធៀបការឌីជីថល | MONEO" />
        <meta
          name="twitter:description"
          content="បង្កើតធៀបការឌីជីថលជាភាសាខ្មែរ ជាមួយ MONEO: RSVP, Google Maps និង KHQR។"
        />
        <meta name="twitter:url" content="https://moneoez.com/khmer-digital-wedding-invitation" />
        <meta name="twitter:image" content="https://moneoez.com/icons/SE.png" />

        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebPage',
                '@id': 'https://moneoez.com/khmer-digital-wedding-invitation#webpage',
                name: 'ធៀបការឌីជីថល | MONEO - Online Khmer Wedding Invitation',
                url: 'https://moneoez.com/khmer-digital-wedding-invitation',
                description:
                  'បង្កើតធៀបការឌីជីថលជាភាសាខ្មែរ ជាមួយ MONEO: ភ្ជាប់ Google Maps, RSVP និងចំណងដៃ KHQR ក្នុងកន្លែងតែមួយ។',
                about: { '@type': 'Thing', name: 'ធៀបការឌីជីថល' },
                inLanguage: 'km-KH',
                isPartOf: { '@id': 'https://moneoez.com/#website' },
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'MONEO',
                    item: 'https://moneoez.com/',
                  },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'ធៀបការឌីជីថល',
                    item: 'https://moneoez.com/khmer-digital-wedding-invitation',
                  },
                ],
              },
            ],
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-[#FAF8F5] font-kantumruy text-slate-900 dark:bg-[#09090B] dark:text-white">
        <NavBar />

        <main>
          <section className="mx-auto max-w-5xl px-4 pb-20 pt-36 text-center sm:px-6">
            <p className="mb-4 text-sm font-bold text-teal-700 dark:text-teal-200">MONEO · ធៀបការឌីជីថលខ្មែរ</p>
            <h1 className="mx-auto max-w-4xl text-3xl font-black leading-[1.45] sm:text-5xl">
              បង្កើតធៀបការឌីជីថល
              <span className="block text-teal-700 dark:text-teal-200">ស្អាត ងាយស្រួល និងសម័យទំនើប</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 dark:text-white/65 sm:text-lg">
              MONEO ជួយអ្នកបង្កើតធៀបការឌីជីថលជាភាសាខ្មែរ ដើម្បីផ្ញើជូនភ្ញៀវ គ្រប់គ្រង RSVP និងរៀបចំព័ត៌មានថ្ងៃមង្គលការនៅកន្លែងតែមួយ។
            </p>

            {/* SEO crawlable keyword content */}
            <div className="mx-auto mt-10 max-w-3xl text-left text-sm sm:text-base">
              <h2 className="mb-3 text-xl font-black text-slate-900 dark:text-white">
                ហេតុអ្វីជ្រើសរើស “ធៀបការ” (ធៀបការឌីជីថល)?
              </h2>
              <p className="mb-5 leading-8 text-slate-600 dark:text-white/70">
                ធៀបការឌីជីថលជួយអ្នកផ្ញើអញ្ជើញមង្គលការយ៉ាងរហ័សទៅកាន់ភ្ញៀវ តាម Telegram/Messenger និងអាចបង្ហាញព័ត៌មានសំខាន់ៗដូចជា ពេលវេលា ទីតាំង (Google Maps) និង RSVP។
                លើសពីនេះ អ្នកអាចភ្ជាប់ KHQR សម្រាប់ចំណងដៃឱ្យកាន់តែងាយស្រួល។
              </p>

              <h3 className="mb-2 text-lg font-bold">របៀបប្រើ (Quick Steps)</h3>
              <ol className="list-decimal pl-6 space-y-2 text-slate-600 dark:text-white/70">
                <li>ជ្រើសរើសរចនាបថ/Template</li>
                <li>បំពេញព័ត៌មានគូស្វាមីភរិយា ពេលវេលា និងទីតាំង</li>
                <li>បើក RSVP និងភ្ជាប់ Google Maps</li>
                <li>ភ្ជាប់ KHQR សម្រាប់ចំណងដៃ (បើចង់)</li>
                <li>ចែករំលែកតំណធៀបការទៅភ្ញៀវ</li>
              </ol>
            </div>

            <Link
              to={AUTH_URLS.SIGN_UP}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-700 to-teal-600 px-6 py-3 font-bold text-white shadow-lg shadow-teal-700/20 transition hover:from-teal-800 hover:to-teal-700"
            >
              ចាប់ផ្តើមបង្កើតធៀបការ <ArrowRight size={17} />
            </Link>
          </section>

          <section className="mx-auto grid max-w-5xl gap-4 px-4 pb-24 sm:grid-cols-2 sm:px-6">
            {/* Simple crawlable FAQ */}
            <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
              <h2 className="mb-4 text-xl font-black">សំណួរដែលសួរញឹកញាប់</h2>
              <div className="space-y-4 text-sm sm:text-base">
                <div>
                  <p className="font-bold">តើខ្ញុំអាចផ្ញើអញ្ជើញទៅភ្ញៀវដោយរបៀបណា?</p>
                  <p className="mt-1 text-slate-600 dark:text-white/70">
                    អ្នកអាចចែករំលែកតំណធៀបការតាម Telegram និង Messenger ហើយភ្ញៀវអាចមើលព័ត៌មានអញ្ជើញបានភ្លាមៗ។
                  </p>
                </div>
                <div>
                  <p className="font-bold">តើ RSVP ដំណើរការយ៉ាងដូចម្តេច?</p>
                  <p className="mt-1 text-slate-600 dark:text-white/70">
                    MONEO ជួយអ្នកប្រមូលការឆ្លើយ RSVP របស់ភ្ញៀវ និងធ្វើឲ្យអ្នកគ្រប់គ្រងបញ្ជីបានងាយស្រួល។
                  </p>
                </div>
                <div>
                  <p className="font-bold">តើអាចភ្ជាប់ Google Maps និង KHQR បានទេ?</p>
                  <p className="mt-1 text-slate-600 dark:text-white/70">
                    បាន។ អ្នកអាចបន្ថែម Google Maps និងចំណងដៃ KHQR នៅក្នុងធៀបការឌីជីថល។
                  </p>
                </div>
                <div>
                  <p className="font-bold">តើគំរូ M2 អាចប្រើដោយឥតគិតថ្លៃជានិច្ចមែនទេ?</p>
                  <p className="mt-1 text-slate-600 dark:text-white/70">
                    មែន។ អ្នកអាចប្រើគំរូ M2 ដោយឥតគិតថ្លៃជានិច្ច។ គណនីឥតគិតថ្លៃអាចបន្ថែមភ្ញៀវបានរហូតដល់ ២០ នាក់។
                  </p>
                </div>
                <div>
                  <p className="font-bold">តើខ្ញុំអាចមើលតម្លៃគំរូនីមួយៗនៅឯណា?</p>
                  <p className="mt-1 text-slate-600 dark:text-white/70">
                    គំរូ M2 អាចប្រើបានដោយឥតគិតថ្លៃជានិច្ច។ ចំពោះគំរូផ្សេងៗ សូមពិនិត្យតម្លៃដែលបង្ហាញនៅទំព័រ <Link className="font-semibold text-teal-700 underline dark:text-teal-200" to="/templates">មើលគំរូទាំងអស់</Link>។
                  </p>
                </div>
              </div>
            </div>

            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-start gap-3 rounded-2xl border border-teal-900/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
              >
                <CheckCircle2 className="mt-1 shrink-0 text-teal-600 dark:text-teal-300" size={19} />
                <p className="leading-7 text-slate-700 dark:text-white/80">{benefit}</p>
              </div>
            ))}
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
