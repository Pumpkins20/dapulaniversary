import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import { TopNav, BottomNav } from "@/components/SiteNav";

export const Route = createFileRoute("/transition")({
  head: () => ({
    meta: [
      { title: "Let's make another memory" },
      { name: "description", content: "From remembering the past to creating a new memory together." },
    ],
  }),
  component: Transition,
});

function Transition() {
  return (
    <div className="min-h-[100dvh] bg-background relative overflow-hidden">
      <TopNav />

      {/* sparkles */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        {[...Array(24)].map((_, i) => (
          <span
            key={i}
            className="absolute block h-1 w-1 rounded-full bg-accent-foreground/40 animate-sparkle"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              animationDelay: `${(i % 8) * 0.4}s`,
            }}
          />
        ))}
      </div>

      <main className="min-h-[100dvh] flex flex-col items-center justify-center text-center px-6 max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground mb-8 animate-fade-in">Interlude</p>
        <h1 className="serif italic text-foreground text-4xl md:text-6xl leading-[1.15] animate-fade-up">
          We've made so many beautiful memories.
          <br />
          <span className="text-muted-foreground">Let's make another one today.</span>
        </h1>

        <Link to="/photobooth" className="btn-primary mt-16 gap-3 animate-fade-up" style={{ animationDelay: "0.4s" }}>
          <Camera size={20} />
          Open Photobooth
        </Link>
      </main>

      <BottomNav />
    </div>
  );
}
