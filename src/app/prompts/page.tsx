import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Sparkles, PenLine, ArrowRight } from "lucide-react";
import { getActivePrompts } from "@/lib/supabase/queries";

export const metadata = {
  title: "Community Prompts | People of Cornwall",
  description: "Writing prompts to inspire your Cornish stories.",
};

export default async function PromptsPage() {
  const prompts = await getActivePrompts();

  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-bone py-12 md:py-16">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-copper/10">
                <Sparkles className="h-5 w-5 text-copper" />
              </div>
              <h1 className="font-serif text-4xl font-bold tracking-tight text-granite md:text-5xl">
                Community Prompts
              </h1>
            </div>
            <p className="max-w-2xl text-lg text-stone">
              Not sure what to write about? These prompts are designed to spark your memories 
              and help you share stories from your Cornish life.
            </p>
          </div>
        </section>

        {/* Prompts List */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            {prompts.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {prompts.map((prompt) => (
                  <article 
                    key={prompt.id}
                    className={`rounded-lg border p-8 transition-all hover:shadow-md ${
                      prompt.featured 
                        ? "border-copper/30 bg-copper/5" 
                        : "border-bone bg-cream"
                    }`}
                  >
                    {prompt.featured && (
                      <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-copper/10 px-3 py-1 text-xs font-medium text-copper">
                        <Sparkles className="h-3 w-3" />
                        Featured
                      </div>
                    )}
                    
                    <h2 className="mb-3 font-serif text-2xl font-bold text-granite">
                      "{prompt.title}"
                    </h2>
                    
                    {prompt.body && (
                      <p className="mb-6 text-stone leading-relaxed">
                        {prompt.body}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <Link href={`/write?prompt=${prompt.id}`}>
                        <Button className="gap-2 bg-granite text-parchment hover:bg-slate">
                          <PenLine className="h-4 w-4" />
                          Write a story
                        </Button>
                      </Link>
                      
                      {prompt.story_count > 0 && (
                        <Link 
                          href={`/prompts/${prompt.id}`}
                          className="flex items-center gap-1 text-sm text-stone hover:text-granite transition-colors"
                        >
                          Read {prompt.story_count} {prompt.story_count === 1 ? "story" : "stories"}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <Sparkles className="mx-auto mb-4 h-12 w-12 text-stone/30" />
                <h2 className="mb-3 font-serif text-2xl font-bold text-granite">
                  Prompts coming soon
                </h2>
                <p className="mb-8 text-stone">
                  We're preparing community writing prompts to inspire your stories.
                </p>
                <Link href="/write">
                  <Button className="bg-granite text-parchment hover:bg-slate">
                    Write your own story
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
