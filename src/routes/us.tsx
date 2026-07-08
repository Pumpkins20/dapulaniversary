import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { TopNav, BottomNav } from "@/components/SiteNav";
import { daysTogether } from "@/lib/anniversary";

export const Route = createFileRoute("/us")({
  head: () => ({
    meta: [
      { title: "Us — Memory Lane" },
      { name: "description", content: "Days together, and a small collection of the moments that made them." },
    ],
  }),
  component: UsPage,
});

const memories = [
  {
    src: "/images/foto 1.jpeg", // Foto bercanda latar merah
    caption: "Always laughing and being silly with you.",
    rotate: -2,
    col: "md:col-span-5",
    aspect: "aspect-square",
    offset: "",
  },
  {
    src: "/images/foto 2.jpeg", // Foto bubur ayam dan es teh
    caption: "Our Movie Nights dates. And being happy!",
    rotate: 3,
    col: "md:col-span-6 md:col-start-7",
    aspect: "aspect-[4/5]",
    offset: "md:mt-20",
  },
  {
    src: "/images/foto 3.jpeg", // Foto selfie di luar ruangan
    caption: "Our photobooth moments for the memories.",
    rotate: -1,
    col: "md:col-span-7 md:col-start-2",
    aspect: "aspect-[16/10]",
    offset: "md:mt-8",
  },
  {
    src: "/images/foto 4.jpeg", // Foto selfie di bioskop
    caption: "Get our breakfast together.",
    rotate: 4,
    col: "md:col-span-4 md:col-start-9",
    aspect: "aspect-square",
    offset: "md:-mt-12",
  },
  {
    src: "/images/foto 5.jpeg",
    caption: "More culinary adventures together. And lampion at night",
    rotate: -3,
    col: "md:col-span-6 md:col-start-1", 
    aspect: "aspect-[4/5]",
    offset: "md:mt-16",
  },
  {
    src: "/images/foto 6.jpeg",
    caption: "Take our cuties of Black Pink Hat!.",
    rotate: 2,
    col: "md:col-span-5 md:col-start-8",
    aspect: "aspect-square",
    offset: "md:mt-32",
  },
  {
    src: "/images/foto 7.jpeg",
    caption: "Fireworks and You in the New Year!.",
    rotate: -2,
    col: "md:col-span-7 md:col-start-2",
    aspect: "aspect-[16/10]",
    offset: "md:mt-12",
  },
  {
    src: "/images/foto 8.jpeg",
    caption: "Celebrate Your Birthday!.",
    rotate: 3,
    col: "md:col-span-4 md:col-start-9",
    aspect: "aspect-[4/5]",
    offset: "md:-mt-10",
  },
  {
    src: "/images/foto 9.jpeg",
    caption: "So many laughs and endless stories.",
    rotate: -4,
    col: "md:col-span-5 md:col-start-1",
    aspect: "aspect-square",
    offset: "md:mt-24",
  },
  {
    src: "/images/foto 11.jpeg",
    caption: "Creating our own little world.",
    rotate: 2,
    col: "md:col-span-6 md:col-start-7",
    aspect: "aspect-[4/5]",
    offset: "md:mt-10",
  },
  {
    src: "/images/foto 10.jpeg",
    caption: "A quiet moment amidst the chaos.",
    rotate: -1,
    col: "md:col-span-7 md:col-start-3",
    aspect: "aspect-[16/10]",
    offset: "md:mt-16",
  },
  {
    src: "/images/foto 12.jpeg",
    caption: "To many more years together, Epul.",
    rotate: 4,
    col: "md:col-span-5 md:col-start-8",
    aspect: "aspect-square",
    offset: "md:-mt-8",
  },
];

function useCountUp(target: number, duration = 1800) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return n;
}

function UsPage() {
  const total = daysTogether();
  const n = useCountUp(total);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = gridRef.current?.querySelectorAll("[data-reveal]") ?? [];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) e.target.classList.add("is-visible");
      },
      { threshold: 0.1, rootMargin: "0px 0px -80px 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <TopNav />
      <main className="pt-24 pb-32">
        {/* Counter */}
        <section className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
          <div className="relative inline-block">
            <div className="absolute -inset-16 opacity-40 blur-3xl bg-accent rounded-full animate-float-slow" />
            <h1 className="serif italic text-foreground relative text-[120px] md:text-[200px] leading-none tracking-tight">
              {n.toLocaleString()}
            </h1>
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.28em] text-muted-foreground">Days Together</p>
          <p className="mt-8 serif italic text-2xl md:text-3xl text-muted-foreground">
            "And I would choose you again."
          </p>
          <div className="mt-14 h-24 w-px bg-gradient-to-b from-border to-transparent" />
        </section>

        {/* Memory Lane */}
        <section className="max-w-[1200px] mx-auto px-6 mt-16">
          <header className="mb-12">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground mb-2">The Collection</p>
            <h2 className="serif text-4xl md:text-6xl italic text-foreground">Memory Lane</h2>
          </header>

          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 items-start">
            {memories.map((m, i) => (
              <div
                key={i}
                data-reveal
                className={`${m.col} ${m.offset} polaroid`}
                style={{ ["--rot" as never]: `${m.rotate}deg`, transitionDelay: `${i * 100}ms` }}
              >
                <div className="bg-white p-3 pb-10 rounded-sm shadow-[0_20px_50px_-10px_rgba(46,46,46,0.15)] border border-border/60 transition-transform duration-500 hover:rotate-0 group">
                  <div className={`overflow-hidden ${m.aspect}`}>
                    <img
                      src={m.src}
                      alt={m.caption}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                    />
                  </div>
                  <p className="serif italic text-xl text-muted-foreground mt-5 text-center">{m.caption}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-24 text-center">
            <Link to="/transition" className="btn-primary">Continue</Link>
          </div>
        </section>
      </main>
      <BottomNav />

      <style>{`
        .polaroid {
          opacity: 0;
          transform: translateY(40px) rotate(var(--rot, 0deg));
          transition: opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1);
        }
        .polaroid.is-visible {
          opacity: 1;
          transform: translateY(0) rotate(var(--rot, 0deg));
        }
      `}</style>
    </div>
  );
}
