import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, X, Download, RotateCcw, Check } from "lucide-react";
import { TopNav } from "@/components/SiteNav";

export const Route = createFileRoute("/photobooth")({
  head: () => ({
    meta: [
      { title: "Photobooth — Make a memory" },
      { name: "description", content: "Take four consecutive photos and turn them into a printable memory strip." },
    ],
  }),
  component: PhotoboothPage,
});

type Stage = "permission" | "denied" | "capture" | "frame" | "result";
type FrameKey = "beige" | "doodle" | "vintage";

const FRAMES: { key: FrameKey; name: string; description: string; bg: string; accent: string; text: string }[] = [
  { key: "beige",   name: "Minimal Beige", description: "Clean, warm, timeless.", bg: "#F2EAE2", accent: "#2E2E2E", text: "#2E2E2E" },
  { key: "doodle",  name: "Cute Doodle",   description: "Playful hearts & sparkles.", bg: "#F4D8DC", accent: "#8A4B58", text: "#4A2A32" },
  { key: "vintage", name: "Vintage Film",  description: "Grain, warmth, nostalgia.", bg: "#1F1B18", accent: "#E9E1D9", text: "#F2EAE2" },
];

function PhotoboothPage() {
  const [stage, setStage] = useState<Stage>("permission");
  const [photos, setPhotos] = useState<string[]>([]);
  const [frame, setFrame] = useState<FrameKey>("beige");
  const [stripUrl, setStripUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopStream(), [stopStream]);

  const enableCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      setStage("capture");
    } catch {
      setStage("denied");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <TopNav />
      <main className="pt-24 pb-16 px-6 max-w-2xl mx-auto">
        {stage === "permission" && <Permission onEnable={enableCamera} />}
        {stage === "denied" && <Denied onRetry={enableCamera} />}
        {stage === "capture" && (
          <Capture
            videoRef={videoRef}
            stream={streamRef.current}
            onDone={(imgs) => {
              setPhotos(imgs);
              stopStream();
              setStage("frame");
            }}
          />
        )}
        {stage === "frame" && (
          <FrameSelection
            photos={photos}
            frame={frame}
            setFrame={setFrame}
            onContinue={(url) => {
              setStripUrl(url);
              setStage("result");
            }}
          />
        )}
        {stage === "result" && stripUrl && (
          <Result
            stripUrl={stripUrl}
            onRetake={() => {
              setPhotos([]);
              setStripUrl(null);
              setStage("permission");
            }}
          />
        )}
      </main>
    </div>
  );
}

/* --------------------------------- Screens -------------------------------- */

function Permission({ onEnable }: { onEnable: () => void }) {
  return (
    <section className="min-h-[70vh] flex flex-col items-center justify-center text-center animate-fade-up">
      <div className="w-28 h-28 rounded-full bg-accent/60 flex items-center justify-center mb-8 animate-float-slow">
        <Camera size={44} className="text-foreground" strokeWidth={1.2} />
      </div>
      <h1 className="serif italic text-4xl md:text-5xl mb-3">Ready?</h1>
      <p className="text-muted-foreground max-w-xs mb-10">We'll take four photos together — a little memory strip just for us.</p>
      <button onClick={onEnable} className="btn-primary w-full max-w-xs">
        Enable Camera
      </button>
      <Link to="/transition" className="mt-4 text-sm text-muted-foreground hover:opacity-70 transition">Cancel</Link>
    </section>
  );
}

function Denied({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="min-h-[70vh] flex flex-col items-center justify-center text-center animate-fade-up">
      <div className="w-20 h-20 rounded-full bg-accent/60 flex items-center justify-center mb-6">
        <X size={28} className="text-foreground" />
      </div>
      <h2 className="serif italic text-3xl mb-2">We need camera access to continue.</h2>
      <p className="text-muted-foreground max-w-xs mb-8">Please allow camera permissions in your browser, then try again.</p>
      <button onClick={onRetry} className="btn-primary">Try Again</button>
    </section>
  );
}

function Capture({
  videoRef,
  stream,
  onDone,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  onDone: (imgs: string[]) => void;
}) {
  const [count, setCount] = useState<number | null>(null);
  const [taken, setTaken] = useState<string[]>([]);
  const [flash, setFlash] = useState(false);
  const capturingRef = useRef(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [videoRef, stream]);

  const snap = useCallback((): string | null => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return null;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    // Mirror to match preview
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.92);
  }, [videoRef]);

  const runSequence = useCallback(async () => {
    if (capturingRef.current) return;
    capturingRef.current = true;
    const results: string[] = [];
    for (let shot = 0; shot < 4; shot++) {
      for (let n = 3; n >= 1; n--) {
        setCount(n);
        await wait(900);
      }
      setCount(null);
      setFlash(true);
      await wait(80);
      const img = snap();
      if (img) results.push(img);
      setTaken([...results]);
      setFlash(false);
      await wait(600);
    }
    capturingRef.current = false;
    onDone(results);
  }, [snap, onDone]);

  return (
    <section className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          Photo {Math.min(taken.length + 1, 4)} <span className="text-foreground/40">/ 4</span>
        </p>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-1.5 w-6 rounded-full transition-colors ${i < taken.length ? "bg-foreground" : "bg-border"}`}
            />
          ))}
        </div>
      </div>

      <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden bg-black shadow-xl">
        <video ref={videoRef} muted playsInline className="w-full h-full object-cover [transform:scaleX(-1)]" />
        {count !== null && (
          <div key={count} className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="serif italic text-white text-[160px] leading-none drop-shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-fade-up">
              {count}
            </span>
          </div>
        )}
        {flash && <div className="absolute inset-0 bg-white animate-flash pointer-events-none" />}

        {/* thumbnails */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          {taken.map((t, i) => (
            <img key={i} src={t} alt="" className="w-12 h-16 object-cover rounded-md border-2 border-white/80 shadow" />
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={runSequence}
          disabled={capturingRef.current || taken.length === 4}
          className="btn-primary w-full max-w-xs disabled:opacity-50"
        >
          {taken.length === 0 ? "Start" : capturingRef.current ? "Capturing…" : "Restart"}
        </button>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">Hold still — a 3-second countdown before every shot.</p>
    </section>
  );
}

function FrameSelection({
  photos,
  frame,
  setFrame,
  onContinue,
}: {
  photos: string[];
  frame: FrameKey;
  setFrame: (f: FrameKey) => void;
  onContinue: (dataUrl: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  const handleContinue = async () => {
    setBusy(true);
    const url = await renderStrip(photos, frame);
    onContinue(url);
  };

  return (
    <section className="animate-fade-up">
      <header className="text-center mb-8">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground mb-2">Almost there</p>
        <h2 className="serif italic text-3xl md:text-4xl">Choose Your Favorite Frame</h2>
      </header>

      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {FRAMES.map((f) => {
          const selected = frame === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFrame(f.key)}
              className={`relative rounded-2xl p-2 transition-all ${selected ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-[1.02]" : "opacity-80 hover:opacity-100"}`}
            >
              <MiniPreview photos={photos} frame={f.key} />
              <div className="mt-2 text-left">
                <p className="text-xs font-medium">{f.name}</p>
                <p className="text-[10px] text-muted-foreground leading-snug">{f.description}</p>
              </div>
              {selected && (
                <span className="absolute top-3 right-3 h-6 w-6 rounded-full bg-foreground text-background grid place-items-center shadow">
                  <Check size={14} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button onClick={handleContinue} disabled={busy} className="btn-primary w-full mt-10">
        {busy ? "Preparing…" : "Continue"}
      </button>
    </section>
  );
}

function MiniPreview({ photos, frame }: { photos: string[]; frame: FrameKey }) {
  const cfg = FRAMES.find((f) => f.key === frame)!;
  return (
    <div className="rounded-lg overflow-hidden shadow-inner" style={{ background: cfg.bg }}>
      <div className="p-2 flex flex-col gap-1.5">
        {photos.slice(0, 4).map((p, i) => (
          <img key={i} src={p} alt="" className="w-full aspect-[4/3] object-cover rounded-sm" />
        ))}
        <p className="text-center text-[8px] mt-1 serif italic" style={{ color: cfg.text }}>
          For Epul ❤ Firdaus
        </p>
      </div>
    </div>
  );
}

function Result({ stripUrl, onRetake }: { stripUrl: string; onRetake: () => void }) {
  const download = () => {
    const a = document.createElement("a");
    a.href = stripUrl;
    a.download = `for-epul-memory-strip-${Date.now()}.png`;
    a.click();
  };

  return (
    <section className="animate-fade-up flex flex-col items-center">
      <header className="text-center mb-6">
        <h2 className="serif italic text-3xl md:text-4xl">Your Memory Strip</h2>
        <p className="serif italic text-lg text-muted-foreground mt-1">Anniversary Edition</p>
      </header>

      <img
        src={stripUrl}
        alt="Your photostrip"
        className="w-full max-w-[280px] rounded-lg shadow-[0_30px_60px_-20px_rgba(0,0,0,0.35)] animate-fade-up"
      />

      <div className="mt-10 w-full max-w-sm space-y-3">
        <button onClick={download} className="btn-primary w-full">
          <Download size={18} /> Download
        </button>
        <button onClick={onRetake} className="btn-secondary w-full">
          <RotateCcw size={16} /> Retake Photos
        </button>
        <Link to="/closing" className="block text-center text-sm text-muted-foreground mt-4 hover:opacity-70">
          Continue to letter →
        </Link>
      </div>
    </section>
  );
}

/* -------------------------------- Utilities ------------------------------- */

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function renderStrip(photos: string[], frameKey: FrameKey): Promise<string> {
  const cfg = FRAMES.find((f) => f.key === frameKey)!;
  const W = 800;
  const pad = 48;
  const gap = 24;
  const cellW = W - pad * 2;
  const cellH = Math.round((cellW * 3) / 4);
  const footer = 160;
  const H = pad + (cellH + gap) * photos.length - gap + footer;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // background
  ctx.fillStyle = cfg.bg;
  ctx.fillRect(0, 0, W, H);

  // subtle inner border
  ctx.strokeStyle = cfg.accent + "22";
  ctx.lineWidth = 2;
  ctx.strokeRect(16, 16, W - 32, H - 32);

  // grain for vintage
  if (frameKey === "vintage") {
    const img = ctx.getImageData(0, 0, W, H);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 24;
      img.data[i] = clamp(img.data[i] + n);
      img.data[i + 1] = clamp(img.data[i + 1] + n);
      img.data[i + 2] = clamp(img.data[i + 2] + n);
    }
    ctx.putImageData(img, 0, 0);
  }

  // photos
  const imgs = await Promise.all(photos.map(loadImage));
  imgs.forEach((im, i) => {
    const x = pad;
    const y = pad + i * (cellH + gap);
    drawCover(ctx, im, x, y, cellW, cellH);
    // photo border
    ctx.strokeStyle = cfg.accent + "33";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);

    if (frameKey === "doodle") {
      drawHeart(ctx, x + cellW - 32, y + 24, 18, "#8A4B58");
    }
  });

  // footer text
  ctx.fillStyle = cfg.text;
  ctx.textAlign = "center";
  ctx.font = 'italic 34px "Playfair Display", Georgia, serif';
  ctx.fillText("For Epul  ❤  Firdaus", W / 2, H - footer + 60);
  ctx.font = '400 18px "Geist", system-ui, sans-serif';
  ctx.fillStyle = cfg.text + "aa";
  const d = new Date();
  const stamp = `${d.toLocaleString(undefined, { month: "long", year: "numeric" })}  ·  Anniversary Edition`;
  ctx.fillText(stamp, W / 2, H - footer + 100);

  return canvas.toDataURL("image/png");
}

function clamp(v: number) { return Math.max(0, Math.min(255, v)); }

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, im: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const ir = im.width / im.height;
  const tr = w / h;
  let sx = 0, sy = 0, sw = im.width, sh = im.height;
  if (ir > tr) {
    sw = im.height * tr;
    sx = (im.width - sw) / 2;
  } else {
    sh = im.width / tr;
    sy = (im.height - sh) / 2;
  }
  ctx.drawImage(im, sx, sy, sw, sh, x, y, w, h);
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  const s = size;
  ctx.moveTo(x, y + s / 4);
  ctx.bezierCurveTo(x, y, x - s / 2, y, x - s / 2, y + s / 4);
  ctx.bezierCurveTo(x - s / 2, y + s / 2, x, y + s * 0.7, x, y + s);
  ctx.bezierCurveTo(x, y + s * 0.7, x + s / 2, y + s / 2, x + s / 2, y + s / 4);
  ctx.bezierCurveTo(x + s / 2, y, x, y, x, y + s / 4);
  ctx.fill();
  ctx.restore();
}
