import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/closing")({
  head: () => ({
    meta: [
      { title: "Happy Anniversary ❤️" },
      { name: "description", content: "A closing note — thank you for every ordinary day that became extraordinary." },
    ],
  }),
  component: Closing,
});

function Closing() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-background flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[10%] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-accent/60 blur-3xl animate-float-slow" />
        <div className="absolute right-[8%] bottom-[12%] h-[280px] w-[280px] rounded-full bg-secondary blur-3xl animate-float-slow" style={{ animationDelay: "2s" }} />
      </div>

      <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground mb-8 animate-fade-in">The End (for now)</p>

      <h1 className="serif italic text-foreground text-5xl md:text-7xl leading-tight animate-fade-up">
        Happy Anniversary <span aria-hidden>❤️</span>
      </h1>

      <p className="mt-10 max-w-xl text-lg md:text-xl text-muted-foreground leading-relaxed animate-fade-up" style={{ animationDelay: "0.3s" }}>
        Thank you for every laugh, every conversation, every adventure, and every ordinary day that became extraordinary because of you.
      </p>

      <p className="mt-10 serif italic text-2xl text-foreground animate-fade-up" style={{ animationDelay: "0.6s" }}>
        — Firdaus
      </p>

      <div className="mt-16 animate-fade-in" style={{ animationDelay: "0.9s" }}>
        <Heart className="text-foreground/70 mx-auto" size={20} fill="currentColor" />
      </div>

      <div className="mt-14 flex gap-3 animate-fade-up" style={{ animationDelay: "1.1s" }}>
        <Link to="/" className="btn-secondary">Start Over</Link>
        <Link to="/us" className="btn-primary">Revisit Us</Link>
      </div>
    </main>
  );
}
