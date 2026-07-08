import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, X, Download, RotateCcw, Check, Users, BellRing } from "lucide-react";
import { TopNav } from "@/components/SiteNav";
import { supabase } from "@/lib/supabase";
import Peer from "peerjs";

export const Route = createFileRoute("/photobooth")({
  head: () => ({
    meta: [
      { title: "Photobooth — Make a memory" },
      { name: "description", content: "Take four consecutive photos and turn them into a printable memory strip." },
    ],
  }),
  component: PhotoboothPage,
});

type Stage = "permission" | "denied" | "connect" | "capture" | "frame" | "result";
type FrameKey = "beige" | "doodle" | "vintage";

const FRAMES = [
  { key: "beige" as FrameKey,   name: "Minimal Beige", description: "Clean, warm, timeless.", bg: "#F2EAE2", accent: "#2E2E2E", text: "#2E2E2E" },
  { key: "doodle" as FrameKey,  name: "Cute Doodle",   description: "Playful hearts & sparkles.", bg: "#F4D8DC", accent: "#8A4B58", text: "#4A2A32" },
  { key: "vintage" as FrameKey, name: "Vintage Film",  description: "Grain, warmth, nostalgia.", bg: "#1F1B18", accent: "#E9E1D9", text: "#F2EAE2" },
];

function PhotoboothPage() {
  const [stage, setStage] = useState<Stage>("permission");
  const [photos, setPhotos] = useState<string[]>([]);
  const [frame, setFrame] = useState<FrameKey>("beige");
  const [stripUrl, setStripUrl] = useState<string | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Refs untuk cleanup — agar stopStreams tidak bergantung pada state (yang menyebabkan re-run)
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);
  const peerRef = useRef<Peer | null>(null);
  const calledRef = useRef(false);

  // Sinkronkan state ke ref setiap kali berubah
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);
  useEffect(() => { remoteStreamRef.current = remoteStream; }, [remoteStream]);

  // stopStreams membaca dari ref, bukan state — jadi tidak pernah berubah identitas
  const stopStreams = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    remoteStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerRef.current?.destroy();
    channelRef.current?.unsubscribe();
  }, []);

  // Cleanup HANYA saat unmount (dependency [] kosong karena stopStreams stabil)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => stopStreams(), []);

  const enableCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: true,
      });
      setLocalStream(stream);
      setStage("connect");
    } catch {
      setStage("denied");
    }
  };

  // ── Koneksi WebRTC menggunakan Supabase Presence ──────────────────────────
  // Model: siapapun yang JOIN KE ROOM SAAT SUDAH ADA PARTNER → dia yang memanggil.
  // Siapa yang datang lebih dulu → menunggu p.on("call").
  // Presence menyimpan { peerId } sebagai metadata yang bisa dibaca semua orang.
  useEffect(() => {
    if (stage !== "connect" || !localStream) return;
    if (peerRef.current) return; // Prevent double init in Strict Mode

    const p = new Peer();
    peerRef.current = p;

    p.on("open", (myId) => {
      console.log("My Peer ID:", myId);

      // ── Selalu siap menerima panggilan (kita bisa jadi receiver) ──
      p.on("call", (incomingCall) => {
        if (calledRef.current) return;
        calledRef.current = true;
        console.log("Menerima panggilan masuk...");
        incomingCall.answer(localStream);
        incomingCall.on("stream", (remote) => {
          setRemoteStream(remote);
          setStage("capture");
        });
        incomingCall.on("error", (err) => console.error("Incoming call error:", err));
      });

      // ── Fungsi memanggil partner berdasarkan peerId yang kita dapat dari Presence ──
      const callPartner = (partnerId: string) => {
        if (calledRef.current || partnerId === myId) return;
        calledRef.current = true;
        console.log("Saya caller. Menghubungi:", partnerId);
        const outCall = p.call(partnerId, localStream);
        if (!outCall) { calledRef.current = false; return; }
        outCall.on("stream", (remote) => {
          setRemoteStream(remote);
          setStage("capture");
        });
        outCall.on("error", (err) => {
          console.error("Outgoing call error:", err);
          calledRef.current = false;
        });
      };

      // ── Ambil semua peerId dari presenceState (format: { [presenceKey]: [{peerId, ...}] }) ──
      const extractPeerIds = (state: Record<string, any[]>): string[] =>
        Object.values(state)
          .flat()
          .map((p: any) => p.peerId)
          .filter((id): id is string => !!id && id !== myId);

      // ── Setup channel Presence ──
      const channel = supabase.channel("photobooth-room", {
        config: { presence: { key: myId } },
      });
      channelRef.current = channel;

      // Saat ada partner JOIN setelah kita (kita yang sudah ada → tidak panggil)
      // Saat kita JOIN setelah partner (kita yang baru → kita panggil)
      // Event "join" terpanggil untuk SEMUA join, termasuk diri sendiri.
      // Kita hanya panggil jika presenceState sudah punya orang lain.
      channel.on("presence", { event: "join" }, () => {
        const state = channel.presenceState();
        const partnerIds = extractPeerIds(state);
        console.log("Presence join event. Partner ditemukan:", partnerIds);
        // Siapapun yang JOIN saat partner sudah ada → dia yang panggil.
        // Gunakan myId > partnerIds[0] sebagai tiebreaker deterministik
        // supaya tidak double-call jika kedua join hampir bersamaan.
        if (partnerIds.length > 0 && myId > partnerIds[0]) {
          callPartner(partnerIds[0]);
        }
      });

      // Subscribe + track kehadiran kita
      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ peerId: myId });

          // Cek langsung: siapa yang sudah ada sebelum kita subscribe?
          // (Presence state langsung tersedia setelah track)
          setTimeout(() => {
            const state = channel.presenceState();
            const partnerIds = extractPeerIds(state);
            console.log("Cek awal setelah subscribe. Partner:", partnerIds);
            if (partnerIds.length > 0 && myId > partnerIds[0]) {
              callPartner(partnerIds[0]);
            }
          }, 500); // Tunggu sebentar agar track tersinkron
        }
      });
    });

    p.on("error", (err) => console.error("Peer error:", err));
  }, [stage, localStream]);

  // ── Tombol manual: paksa panggil partner yang sudah ada di Presence ──
  const pingPartner = () => {
    if (!channelRef.current || !peerRef.current || !localStream) return;
    const myId = peerRef.current.id;
    const state = channelRef.current.presenceState();
    const partnerIds = Object.values(state)
      .flat()
      .map((p: any) => p.peerId)
      .filter((id): id is string => !!id && id !== myId);

    console.log("Ping manual. Partner di Presence:", partnerIds);

    if (partnerIds.length === 0) {
      // Belum ada partner, perbarui track kita
      channelRef.current.track({ peerId: myId });
      console.log("Belum ada partner, memperbaharui track...");
    } else {
      // Ada partner → paksa panggil, abaikan calledRef
      calledRef.current = false;
      const partnerId = partnerIds[0];
      const outCall = peerRef.current.call(partnerId, localStream);
      outCall?.on("stream", (remote) => {
        setRemoteStream(remote);
        setStage("capture");
      });
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <TopNav />
      <main className="pt-24 pb-16 px-6 max-w-2xl mx-auto w-full flex-grow flex flex-col justify-center">
        {stage === "permission" && <Permission onEnable={enableCamera} />}
        {stage === "denied" && <Denied onRetry={enableCamera} />}

        {stage === "connect" && (
          <div className="text-center animate-fade-in flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-accent/60 flex items-center justify-center mb-6 animate-pulse">
              <Users size={28} className="text-foreground" />
            </div>
            <h2 className="serif italic text-3xl mb-2">Waiting for partner...</h2>
            <p className="text-muted-foreground text-sm mb-8">Make sure both of you are on this page.</p>

            <button onClick={pingPartner} className="btn-secondary flex items-center gap-2 text-sm">
              <BellRing size={16} /> Partner is here? Connect!
            </button>
          </div>
        )}

        {stage === "capture" && (
          <Capture
            localStream={localStream}
            remoteStream={remoteStream}
            channel={channelRef.current}
            onDone={(imgs) => {
              setPhotos(imgs);
              stopStreams();
              setStage("frame");
            }}
          />
        )}

        {stage === "frame" && (
          <FrameSelection photos={photos} frame={frame} setFrame={setFrame} onContinue={(url) => { setStripUrl(url); setStage("result"); }} />
        )}

        {stage === "result" && stripUrl && (
          <Result stripUrl={stripUrl} onRetake={() => window.location.reload()} />
        )}
      </main>
    </div>
  );
}

/* --------------------------------- Capture Screen -------------------------------- */

function Capture({
  localStream,
  remoteStream,
  channel,
  onDone,
}: {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  channel: any;
  onDone: (imgs: string[]) => void;
}) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [count, setCount] = useState<number | null>(null);
  const [taken, setTaken] = useState<string[]>([]);
  const [flash, setFlash] = useState(false);
  const capturingRef = useRef(false);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  const snap = useCallback((): string | null => {
    const lv = localVideoRef.current;
    const rv = remoteVideoRef.current;
    if (!lv || !rv || !lv.videoWidth || !rv.videoWidth) return null;

    const c = document.createElement("canvas");
    c.width = 1280;
    c.height = 960;
    const ctx = c.getContext("2d");
    if (!ctx) return null;

    // Foto Kiri (Lokal - Di-mirror)
    ctx.save();
    ctx.translate(640, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(lv, (lv.videoWidth - 640) / 2, 0, 640, 960, 0, 0, 640, 960);
    ctx.restore();

    // Foto Kanan (Remote - Normal)
    ctx.drawImage(rv, (rv.videoWidth - 640) / 2, 0, 640, 960, 640, 0, 640, 960);

    return c.toDataURL("image/jpeg", 0.92);
  }, []);

  const startSnapSequence = useCallback(async () => {
    if (capturingRef.current) return;
    capturingRef.current = true;
    const results: string[] = [];

    for (let shot = 0; shot < 4; shot++) {
      for (let n = 3; n >= 1; n--) {
        setCount(n);
        await new Promise(r => setTimeout(r, 900));
      }
      setCount(null);
      setFlash(true);
      await new Promise(r => setTimeout(r, 80));

      const img = snap();
      if (img) results.push(img);
      setTaken([...results]);

      setFlash(false);
      await new Promise(r => setTimeout(r, 600));
    }
    capturingRef.current = false;
    onDone(results);
  }, [snap, onDone]);

  useEffect(() => {
    if (!channel) return;
    channel.on('broadcast', { event: 'start-snap' }, () => {
      startSnapSequence();
    });
  }, [channel, startSnapSequence]);

  const handleStart = () => {
    channel?.send({ type: 'broadcast', event: 'start-snap', payload: {} });
    startSnapSequence();
  };

  return (
    <section className="animate-fade-in w-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          Photo {Math.min(taken.length + 1, 4)} <span className="text-foreground/40">/ 4</span>
        </p>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`h-1.5 w-6 rounded-full transition-colors ${i < taken.length ? "bg-foreground" : "bg-border"}`} />
          ))}
        </div>
      </div>

      <div className="relative aspect-[3/4] md:aspect-square w-full rounded-3xl overflow-hidden bg-black shadow-xl flex">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-1/2 h-full object-cover [transform:scaleX(-1)] border-r-4 border-background"
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-1/2 h-full object-cover"
        />
        {count !== null && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <span className="serif italic text-white text-[160px] leading-none drop-shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-fade-up">
              {count}
            </span>
          </div>
        )}
        {flash && <div className="absolute inset-0 bg-white animate-flash pointer-events-none z-20" />}
      </div>

      <div className="mt-8 flex justify-center">
        <button onClick={handleStart} disabled={capturingRef.current || taken.length === 4} className="btn-primary w-full max-w-xs disabled:opacity-50">
          {taken.length === 0 ? "Start Together" : capturingRef.current ? "Capturing…" : "Finished"}
        </button>
      </div>
      <p className="mt-4 text-center text-sm text-muted-foreground">Both of you will see the countdown. Smile!</p>
    </section>
  );
}

/* ------------------ Komponen Pendukung Bawah (Tetap Sama) ----------------- */

function Permission({ onEnable }: { onEnable: () => void }) {
  return (
    <section className="min-h-[70vh] flex flex-col items-center justify-center text-center animate-fade-up">
      <div className="w-28 h-28 rounded-full bg-accent/60 flex items-center justify-center mb-8 animate-float-slow">
        <Camera size={44} className="text-foreground" strokeWidth={1.2} />
      </div>
      <h1 className="serif italic text-4xl md:text-5xl mb-3">Ready?</h1>
      <p className="text-muted-foreground max-w-xs mb-10">We'll take four photos together. Make sure your partner is ready too.</p>
      <button onClick={onEnable} className="btn-primary w-full max-w-xs">Enable Camera & Mic</button>
      <Link to="/transition" className="mt-4 text-sm text-muted-foreground hover:opacity-70 transition">Cancel</Link>
    </section>
  );
}

function Denied({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="min-h-[70vh] flex flex-col items-center justify-center text-center animate-fade-up">
      <div className="w-20 h-20 rounded-full bg-accent/60 flex items-center justify-center mb-6"><X size={28} className="text-foreground" /></div>
      <h2 className="serif italic text-3xl mb-2">We need camera access.</h2>
      <p className="text-muted-foreground max-w-xs mb-8">Please allow camera permissions, then try again.</p>
      <button onClick={onRetry} className="btn-primary">Try Again</button>
    </section>
  );
}

function FrameSelection({ photos, frame, setFrame, onContinue }: { photos: string[]; frame: FrameKey; setFrame: (f: FrameKey) => void; onContinue: (url: string) => void; }) {
  const [busy, setBusy] = useState(false);
  const handleContinue = async () => { setBusy(true); const url = await renderStrip(photos, frame); onContinue(url); };
  return (
    <section className="animate-fade-up">
      <header className="text-center mb-8">
        <h2 className="serif italic text-3xl md:text-4xl">Choose Your Frame</h2>
      </header>
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {FRAMES.map((f) => {
          const selected = frame === f.key;
          return (
            <button key={f.key} onClick={() => setFrame(f.key)} className={`relative rounded-2xl p-2 transition-all ${selected ? "ring-2 ring-foreground scale-[1.02]" : "opacity-80"}`}>
              <MiniPreview photos={photos} frame={f.key} />
              <div className="mt-2 text-left"><p className="text-xs font-medium">{f.name}</p></div>
              {selected && <span className="absolute top-3 right-3 h-6 w-6 rounded-full bg-foreground text-background grid place-items-center"><Check size={14} /></span>}
            </button>
          );
        })}
      </div>
      <button onClick={handleContinue} disabled={busy} className="btn-primary w-full mt-10">{busy ? "Preparing…" : "Continue"}</button>
    </section>
  );
}

function MiniPreview({ photos, frame }: { photos: string[]; frame: FrameKey }) {
  const cfg = FRAMES.find((f) => f.key === frame)!;
  return (
    <div className="rounded-lg overflow-hidden shadow-inner" style={{ background: cfg.bg }}>
      <div className="p-2 flex flex-col gap-1.5">
        {photos.slice(0, 4).map((p, i) => <img key={i} src={p} alt="" className="w-full aspect-[4/3] object-cover rounded-sm" />)}
        <p className="text-center text-[8px] mt-1 serif italic" style={{ color: cfg.text }}>For Epul ❤ Firdaus</p>
      </div>
    </div>
  );
}

function Result({ stripUrl, onRetake }: { stripUrl: string; onRetake: () => void }) {
  const download = () => { const a = document.createElement("a"); a.href = stripUrl; a.download = `anniversary-strip-${Date.now()}.png`; a.click(); };
  return (
    <section className="animate-fade-up flex flex-col items-center">
      <header className="text-center mb-6"><h2 className="serif italic text-3xl md:text-4xl">Your Memory Strip</h2></header>
      <img src={stripUrl} alt="Photostrip" className="w-full max-w-[280px] rounded-lg shadow-2xl animate-fade-up" />
      <div className="mt-10 w-full max-w-sm space-y-3">
        <button onClick={download} className="btn-primary w-full"><Download size={18} /> Download</button>
        <button onClick={onRetake} className="btn-secondary w-full"><RotateCcw size={16} /> Retake Photos</button>
        <Link to="/closing" className="block text-center text-sm text-muted-foreground mt-4">Continue to letter →</Link>
      </div>
    </section>
  );
}

/* -------------------------------- Utilities ------------------------------- */
async function renderStrip(photos: string[], frameKey: FrameKey): Promise<string> {
  const cfg = FRAMES.find((f) => f.key === frameKey)!;
  const W = 800; const pad = 48; const gap = 24; const cellW = W - pad * 2; const cellH = Math.round((cellW * 3) / 4); const footer = 160;
  const H = pad + (cellH + gap) * photos.length - gap + footer;

  const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = cfg.bg; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = cfg.accent + "22"; ctx.lineWidth = 2; ctx.strokeRect(16, 16, W - 32, H - 32);

  const imgs = await Promise.all(photos.map(src => new Promise<HTMLImageElement>((resolve, reject) => { const im = new Image(); im.onload = () => resolve(im); im.onerror = reject; im.src = src; })));

  imgs.forEach((im, i) => {
    const x = pad; const y = pad + i * (cellH + gap);
    const ir = im.width / im.height; const tr = cellW / cellH;
    let sx = 0, sy = 0, sw = im.width, sh = im.height;
    if (ir > tr) { sw = im.height * tr; sx = (im.width - sw) / 2; } else { sh = im.width / tr; sy = (im.height - sh) / 2; }

    ctx.drawImage(im, sx, sy, sw, sh, x, y, cellW, cellH);
    ctx.strokeStyle = cfg.accent + "33"; ctx.lineWidth = 1; ctx.strokeRect(x, y, cellW, cellH);

    if (frameKey === "doodle") {
      ctx.fillStyle = "#8A4B58"; ctx.beginPath(); const s = 18; const hx = x + cellW - 32; const hy = y + 24;
      ctx.moveTo(hx, hy + s / 4); ctx.bezierCurveTo(hx, hy, hx - s / 2, hy, hx - s / 2, hy + s / 4); ctx.bezierCurveTo(hx - s / 2, hy + s / 2, hx, hy + s * 0.7, hx, hy + s); ctx.bezierCurveTo(hx, hy + s * 0.7, hx + s / 2, hy + s / 2, hx + s / 2, hy + s / 4); ctx.bezierCurveTo(hx + s / 2, hy, hx, hy, hx, hy + s / 4); ctx.fill();
    }
  });

  ctx.fillStyle = cfg.text; ctx.textAlign = "center"; ctx.font = 'italic 34px Georgia, serif';
  ctx.fillText("For Epul  ❤  Firdaus", W / 2, H - footer + 60);
  ctx.font = '400 18px sans-serif'; ctx.fillStyle = cfg.text + "aa";
  ctx.fillText(`${new Date().toLocaleString(undefined, { month: "long", year: "numeric" })}  ·  Anniversary Edition`, W / 2, H - footer + 100);

  return canvas.toDataURL("image/png");
}