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
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDUaqUz-T7bO3xJgRSHyuLKhcQ0Ae-YlwVuwxhLL6BDmm3gxVTFUxTh9X5YYRp9RlT_5PpUlcOCPlFqh52Nf6jqwZ9dZwf0JAp8I4k9142yxX5K7c5T2JtbUjz1PS2U8D8vOd71C8sjyOYKgLmrkv7eTt8QSZALdD1Yp-1Lb3GwcMb7Hjs644pOkZimMbHKUngVUsEzAeOA1Z5roPX2bcucjZmdWGfp1sW6Jq3h97nPlfPOk7n2pfnQMilpbF-_LJ3qrFnwDFnryMc",
    caption: "Our first coffee together.",
    rotate: -2,
    col: "md:col-span-5",
    aspect: "aspect-square",
    offset: "",
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAWs2BH3vu7UkEU7Y66TRwpMevd3KZ31rdA0gzjgowgrwrk_-YobKp0T5LifYPd1rHhc4NmWipBrj8tfA2uGUxvppWFVCEn7mtdSofaBEtYVNkMoXkPUGeslPIglI22yFqzeSqnaNWROoR2LZ8Cm4W2AHnalxK8mN_aN44YGvdiyszAc-EbjV3y7V4meM0IU2Ts42fhw7Y-nwZgKZuKovbchF_pZULAiieX-1xiXudW-RZ7sOCFkbvCYL_zD_vqJ8h8oorQ17NqOdY",
    caption: "That sunset we won't forget.",
    rotate: 3,
    col: "md:col-span-6 md:col-start-7",
    aspect: "aspect-[4/5]",
    offset: "md:mt-20",
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbUzb5LUmNOZGyQBNVCUnPka6ofFei-rhDvyqPSK2a806wNmdIVWTQxGxKwp47VXF-BJyTp4oMzAdcCbH749F2qqEomW2rr8-wM3RlZ41cm_f4_XuU5OehbMXb7NuKzArxUO_-hNn85t7A5Yl0mfV_sEvdebI75DCnLm1zPFgRO2REJa12mBph7M6bw9WIljp0b7pDW4694xTSJ0QqRGioiZKjCvs168XW34rKdYw9xHYX0sKAeCAGtNMqoUsTPaMM1CNB-Af0VSU",
    caption: "Writing our story.",
    rotate: -1,
    col: "md:col-span-7 md:col-start-2",
    aspect: "aspect-[16/10]",
    offset: "md:mt-8",
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuA3qB-WggunOTHFWv9P-5TBOpmuD8yd2SCo4x6nD-S0rOMyP9t6zkuyDbxjcypy8SJqSr9bOc3u8fbkzpmIh43e3GGHOwNrrV0tozHucUPraylH4UbJKRNzws9WKELRAaxNSBsTayQl1jC3Lx0MZ_yuKBuVhtAFA_T9iBhjTX8KV86F1s1V8TZ5hqV5HiNdwoEDv3r8BS6lHKIJxOTvjEVgWHNNt7awCnKzmKVB1waUzQaIBVrdaIE9BwFZc0HQ_gYV-F8u6swqFvo",
    caption: "The laugh-until-sunset kind of day.",
    rotate: 4,
    col: "md:col-span-4 md:col-start-9",
    aspect: "aspect-square",
    offset: "md:-mt-12",
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
