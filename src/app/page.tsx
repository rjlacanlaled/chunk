import {
  MessageCircle,
  Zap,
  Trophy,
  MessageSquare,
  Flame,
  Brain,
  Sparkles,
} from 'lucide-react';
import LandingHero from '@/components/landing/hero';

const TECH_STACK = [
  'Next.js',
  'React',
  'TypeScript',
  'Supabase',
  'Drizzle',
  'Vercel AI SDK',
  'TanStack Query',
];

const HOW_IT_WORKS = [
  {
    icon: MessageCircle,
    title: 'Chat it',
    description:
      'Tell Chunk what\'s on your plate. Natural language. No forms. No dropdowns.',
  },
  {
    icon: Zap,
    title: 'Chunk it',
    description:
      'Chunk breaks your goal into scored, bite-sized tasks automatically.',
  },
  {
    icon: Trophy,
    title: 'Crush it',
    description:
      'Check things off and watch your XP climb. Streaks. Levels. Confetti.',
  },
];

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Talk, don\'t click',
    description:
      'Describe your goals in plain English. Chunk\'s AI creates and organizes tasks for you.',
  },
  {
    icon: Zap,
    title: 'Big goals, bite-sized pieces',
    description:
      'Complex tasks get automatically split into manageable subtasks, scored by difficulty.',
  },
  {
    icon: Trophy,
    title: 'Every task earns XP',
    description:
      'Harder tasks earn more. Watch your level climb from Starter to Legend.',
  },
  {
    icon: Flame,
    title: 'Don\'t break the chain',
    description:
      'Daily streaks reward consistency. Show up, check things off, keep the fire alive.',
  },
  {
    icon: Brain,
    title: 'AI-powered difficulty',
    description:
      'Chunk\'s AI assigns difficulty scores so you know exactly what you\'re tackling.',
  },
  {
    icon: Sparkles,
    title: 'Zero friction',
    description:
      'No sign-up wall. Start in 3 seconds. Sign up later to save across devices.',
  },
];

const MEDALS = [
  { src: '/chunk-gamification/chunk-medal-1-starter.svg', label: 'Starter' },
  { src: '/chunk-gamification/chunk-medal-2-builder.svg', label: 'Builder' },
  { src: '/chunk-gamification/chunk-medal-3-chunker.svg', label: 'Chunker' },
  { src: '/chunk-gamification/chunk-medal-4-crusher.svg', label: 'Crusher' },
  { src: '/chunk-gamification/chunk-medal-5-champion.svg', label: 'Champion' },
  { src: '/chunk-gamification/chunk-medal-6-legend.svg', label: 'Legend' },
];

const CHAT_EXCHANGES = [
  {
    user: 'I have a huge exam Monday and I haven\'t started studying',
    chunky:
      'Say less. I just broke that down into 6 study sessions. First one\'s only 25 minutes. You\'ve got this. \ud83d\udcaa',
  },
  {
    user: 'done with the grocery run',
    chunky:
      'Boom! +15 XP. You\'re 40 XP from leveling up. Keep that energy going! \ud83d\udd25',
  },
  {
    user: 'I\'m overwhelmed, I have like 20 things to do',
    chunky:
      'Deep breath. Drop them all on me and I\'ll sort the chaos. That\'s literally what I\'m here for. \ud83d\ude0e',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#1C1C4E]">
      <LandingHero />

      {/* Tech Strip */}
      <section className="border-y border-white/10 bg-white/5 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-3 px-6">
          <span className="mr-2 text-sm text-white/40">Built with</span>
          {TECH_STACK.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* The Problem */}
      <section id="the-problem" className="py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#9593FF]">
            The productivity trap
          </p>
          <h2 className="mt-4 text-4xl font-bold text-white md:text-5xl">
            Your to-do list is lying to you.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-white/60">
            Most task apps give you a blank list and wish you luck. No
            priorities. No structure. No idea where to start. You end up
            reorganizing your tasks instead of doing them.
          </p>
          <p className="mt-8 text-lg font-semibold text-[#4945FF]">
            Chunk does things differently.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#9593FF]">
              How Chunk works
            </p>
            <h2 className="mt-4 text-4xl font-bold text-white md:text-5xl">
              Chat it. Chunk it. Crush it.
            </h2>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map((step) => (
              <div
                key={step.title}
                className="rounded-lg border border-white/10 bg-white/5 p-8 text-center"
              >
                <div className="mx-auto flex size-14 items-center justify-center rounded-lg bg-[#4945FF]/15">
                  <step.icon className="size-7 text-[#4945FF]" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-4xl font-bold text-white md:text-5xl">
            Your AI co-pilot for getting things done.
          </h2>

          {/* Static mockup */}
          <div className="mx-auto mt-16 max-w-4xl overflow-hidden rounded-xl border border-white/10 shadow-[0_0_80px_-20px_rgba(73,69,255,0.25)]">
            {/* Mockup header bar */}
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-2.5">
              <div className="size-2.5 rounded-full bg-white/20" />
              <div className="size-2.5 rounded-full bg-white/20" />
              <div className="size-2.5 rounded-full bg-white/20" />
              <span className="ml-3 text-xs text-white/40">chunk.app</span>
            </div>

            <div className="flex min-h-[340px]">
              {/* Task panel */}
              <div className="flex-[7] border-r border-white/10 bg-[#1a1a45] p-5">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/40">
                  Tasks
                </p>
                {/* Main task */}
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-5 items-center justify-center rounded border border-white/20">
                        <div className="size-2.5 rounded-sm bg-[#4945FF]" />
                      </div>
                      <span className="font-medium text-white">
                        Plan trip to Japan
                      </span>
                    </div>
                    <span className="rounded-full bg-[#4945FF]/20 px-2.5 py-0.5 text-xs font-semibold text-[#9593FF]">
                      40 pts
                    </span>
                  </div>
                  {/* Subtasks */}
                  <div className="mt-4 space-y-2.5 pl-8">
                    {[
                      'Research flights and book tickets',
                      'Plan itinerary for Tokyo and Kyoto',
                      'Book hotels and accommodations',
                    ].map((subtask) => (
                      <div
                        key={subtask}
                        className="flex items-center gap-3 text-sm text-white/60"
                      >
                        <div className="size-4 rounded border border-white/15" />
                        <span>{subtask}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat panel */}
              <div className="flex flex-[3] flex-col bg-[#161640] p-5">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/40">
                  Chat
                </p>
                <div className="flex flex-1 flex-col justify-end gap-3">
                  <div className="self-end rounded-lg rounded-br-sm bg-[#4945FF] px-3.5 py-2 text-xs text-white">
                    plan my trip to japan
                  </div>
                  <div className="flex items-start gap-2">
                    <img
                      src="/chunk-logos/chunk-ai-icon-idle.svg"
                      alt=""
                      className="mt-0.5 size-5 shrink-0"
                    />
                    <div className="rounded-lg rounded-bl-sm bg-white/8 px-3.5 py-2 text-xs text-white/80">
                      I&apos;ve broken it down into 5 steps! Starting with
                      flights and ending with packing.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-base text-white/50">
            No tutorial needed. If you can text, you can Chunk.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-4xl font-bold text-white md:text-5xl">
            Not just another to-do list.
          </h2>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-white/10 bg-white/5 p-6"
              >
                <div className="flex size-11 items-center justify-center rounded-lg bg-[#4945FF]/15">
                  <feature.icon className="size-5 text-[#4945FF]" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gamification Showcase */}
      <section
        id="gamification"
        className="py-24"
        style={{
          background:
            'linear-gradient(180deg, rgba(73,69,255,0.08) 0%, transparent 50%, rgba(73,69,255,0.05) 100%)',
        }}
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#9593FF]">
              Productivity, gamified
            </p>
            <h2 className="mt-4 text-4xl font-bold text-white md:text-5xl">
              Finally, a reason to finish things.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
              Checking a box doesn&apos;t feel like much. But earning XP,
              leveling up, and watching confetti explode? That hits different.
            </p>
          </div>

          {/* Medals row */}
          <div className="mt-16 flex flex-wrap items-end justify-center gap-6 md:gap-10">
            {MEDALS.map((medal, i) => {
              const isLegend = i === MEDALS.length - 1;
              return (
                <div
                  key={medal.label}
                  className="flex flex-col items-center gap-3"
                >
                  <img
                    src={medal.src}
                    alt={`${medal.label} medal`}
                    className={
                      isLegend
                        ? 'size-24 drop-shadow-[0_0_20px_rgba(73,69,255,0.5)] md:size-28'
                        : 'size-16 md:size-20'
                    }
                  />
                  <span
                    className={`text-xs font-semibold ${
                      isLegend ? 'text-[#4945FF]' : 'text-white/50'
                    }`}
                  >
                    {medal.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Feature callouts */}
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'XP System',
                desc: 'Earn points based on task difficulty. Harder chunks = more XP.',
              },
              {
                title: 'Streaks',
                desc: 'Daily consistency tracking. Show up every day and watch your streak grow.',
              },
              {
                title: 'Confetti',
                desc: 'Celebrations for hard completions. Because you earned it.',
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <h3 className="text-lg font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-white/60">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personality Showcase */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white md:text-5xl">
              Meet your new favorite co-worker.
            </h2>
            <p className="mt-4 text-lg text-white/60">
              Witty. Warm. Weirdly good at organizing.
            </p>
          </div>

          <div className="mt-14 space-y-8">
            {CHAT_EXCHANGES.map((exchange) => (
              <div key={exchange.user} className="space-y-3">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="max-w-[75%] rounded-2xl rounded-br-md bg-[#4945FF] px-4 py-3 text-sm text-white">
                    {exchange.user}
                  </div>
                </div>
                {/* Chunky response */}
                <div className="flex items-start gap-3">
                  <img
                    src="/chunk-logos/chunk-ai-icon-idle.svg"
                    alt=""
                    className="mt-1 size-7 shrink-0"
                  />
                  <div className="max-w-[75%] rounded-2xl rounded-bl-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                    {exchange.chunky}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        className="py-24"
        style={{
          background:
            'linear-gradient(180deg, #1C1C4E 0%, rgba(73,69,255,0.15) 100%)',
        }}
      >
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl font-bold text-white md:text-5xl">
            Your tasks aren&apos;t going to chunk themselves.
          </h2>
          <p className="mt-6 text-lg text-white/60">
            Start for free. No sign-up required. Seriously.
          </p>
          <a
            href="/dashboard"
            className="mt-10 inline-block rounded-[5px] bg-[#4945FF] px-10 py-4 text-lg font-semibold text-white shadow-[0_0_60px_-12px_rgba(73,69,255,0.5)] transition-colors hover:bg-[#3b38e0]"
          >
            Start chunking
          </a>
          <p className="mt-6 text-sm text-white/40">
            Guest sessions persist. Sign up anytime to save across devices.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center gap-6">
            <img
              src="/chunk-logos/chunk-logo-horizontal-dark.svg"
              alt="Chunk"
              className="h-7"
            />
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/rjlacanlaled/chunk"
                className="text-sm text-white/50 transition-colors hover:text-white"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              <a
                href="#the-problem"
                className="text-sm text-white/50 transition-colors hover:text-white"
              >
                About
              </a>
            </div>
            <div className="space-y-1 text-center text-xs text-white/30">
              <p>Built by Rj Lacanlale for OPIT University &middot; 2026</p>
              <p>Powered by Next.js, Supabase, and the Vercel AI SDK</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
