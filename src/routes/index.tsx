import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Photoboth - Anyversary" },
      { name: "description", content: "Another year together. Thank you for being my favorite person." },
    ],
  }),
  component: Opening,
});

function Opening() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-background flex flex-col items-center justify-between px-6 py-10 text-center">
      {/* Floating romantic blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[15%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-accent/60 blur-3xl animate-float-slow" />
        <div className="absolute left-[10%] bottom-[10%] h-[260px] w-[260px] rounded-full bg-secondary blur-3xl animate-float-slow" style={{ animationDelay: "1.5s" }} />
        <div className="absolute right-[5%] top-[35%] h-[220px] w-[220px] rounded-full bg-accent/40 blur-3xl animate-float-slow" style={{ animationDelay: "3s" }} />
      </div>

      {/* Floating hearts */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {[...Array(8)].map((_, i) => (
          <Heart
            key={i}
            aria-hidden
            className="absolute text-accent-foreground/20 animate-float-slow"
            fill="currentColor"
            size={12 + (i % 3) * 6}
            style={{
              left: `${(i * 13 + 8) % 92}%`,
              top: `${(i * 21 + 15) % 80}%`,
              animationDelay: `${i * 0.6}s`,
              animationDuration: `${6 + (i % 3)}s`,
            }}
          />
        ))}
      </div>

      <div className="pt-6 animate-fade-in">
        <Heart className="mx-auto text-foreground/80" size={22} fill="currentColor" />
      </div>

      <section className="flex-1 flex flex-col items-center justify-center max-w-lg animate-fade-up">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground mb-6">A Love Letter</p>
        <h1 className="serif italic text-foreground text-[56px] leading-[1.05] md:text-[88px]">
          Hi Epul <span aria-hidden>❤️</span>
        </h1>
        <p className="mt-8 max-w-md text-lg md:text-xl text-muted-foreground leading-relaxed">
          Another year together. Thank you for being my favorite person.
        </p>
      </section>

      <div className="w-full max-w-sm animate-fade-up" style={{ animationDelay: "0.4s" }}>
        <Link to="/us" className="btn-primary w-full">
          Begin Our Journey
        </Link>
        <p className="mt-4 text-xs text-muted-foreground/70">— Firdaus</p>
      </div>
    </main>
  );
}
