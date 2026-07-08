import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Home, Heart, Camera } from "lucide-react";

export function TopNav({ back = true }: { back?: boolean }) {
  const router = useRouter();
  return (
    <header className="fixed top-0 inset-x-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/40">
      <nav className="flex items-center justify-between px-6 py-4 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-2">
          {back && (
            <button
              aria-label="Back"
              onClick={() => router.history.back()}
              className="p-1 -ml-1 hover:opacity-70 transition"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <Link to="/" className="serif italic text-[22px] text-foreground">For Epul</Link>
        </div>
      </nav>
    </header>
  );
}

export function BottomNav() {
  return (
    <footer className="fixed bottom-0 inset-x-0 z-40 md:hidden">
      <div className="mx-auto max-w-[600px] rounded-t-[32px] bg-background/80 backdrop-blur-xl shadow-[0_-20px_40px_rgba(0,0,0,0.06)] border-t border-border/40">
        <div className="flex justify-around items-center px-8 pt-3 pb-6">
          <NavIcon to="/us" icon={<Home size={22} />} label="Us" />
          <NavIcon to="/transition" icon={<Heart size={22} />} label="Moments" />
          <NavIcon to="/photobooth" icon={<Camera size={22} />} label="Photobooth" />
        </div>
      </div>
    </footer>
  );
}

function NavIcon({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center w-14 h-14 rounded-full text-foreground/70 hover:text-foreground transition active:scale-90"
      activeProps={{ className: "text-foreground bg-accent/60 rounded-full" }}
      aria-label={label}
    >
      {icon}
    </Link>
  );
}
