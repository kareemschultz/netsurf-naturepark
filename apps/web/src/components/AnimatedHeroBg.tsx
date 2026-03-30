import type { ReactNode } from "react"

import { motion, useReducedMotion } from "framer-motion"

/* ─────────────────────────────────────────────────────────────────────────
   AnimatedHeroBg — 12-layer rainforest animation system
   GPU-safe throughout: only transform (x/y/rotate/scale) + opacity animated.
   All static properties (blur, background, width, height, border) set once.
   ───────────────────────────────────────────────────────────────────────── */

const EASE = [0.45, 0, 0.55, 1] as [number, number, number, number]

/* ── Layer 1: Large ambient blobs ─────────────────────────────────────── */
const BLOB_COLORS = [
  "radial-gradient(ellipse at 45% 40%, rgba(90,165,40,0.26) 0%, rgba(45,80,22,0.11) 55%, transparent 100%)",
  "radial-gradient(ellipse at 55% 50%, rgba(70,150,30,0.22) 0%, rgba(30,70,15,0.09) 55%, transparent 100%)",
  "radial-gradient(ellipse at 40% 60%, rgba(196,148,26,0.18) 0%, rgba(150,100,10,0.07) 55%, transparent 100%)",
  "radial-gradient(ellipse at 50% 45%, rgba(30,120,90,0.20) 0%, rgba(20,80,55,0.08) 55%, transparent 100%)",
  "radial-gradient(ellipse at 60% 35%, rgba(110,190,55,0.24) 0%, rgba(60,110,28,0.10) 55%, transparent 100%)",
];

const blobs = [
  { left: "-8%",  top: "-10%", w: 650, h: 560, dur: 24, delay: 0,  dx: 65,  dy: 45,  color: 0 },
  { left: "52%",  top: "-14%", w: 580, h: 640, dur: 30, delay: 6,  dx: -55, dy: 68,  color: 1 },
  { left: "72%",  top: "46%",  w: 520, h: 470, dur: 21, delay: 11, dx: -70, dy: -58, color: 2 },
  { left: "6%",   top: "56%",  w: 500, h: 560, dur: 27, delay: 8,  dx: 78,  dy: -68, color: 3 },
  { left: "36%",  top: "24%",  w: 420, h: 420, dur: 36, delay: 16, dx: -42, dy: 38,  color: 4 },
  { left: "82%",  top: "10%",  w: 380, h: 490, dur: 19, delay: 4,  dx: -38, dy: 62,  color: 0 },
  { left: "16%",  top: "-8%",  w: 460, h: 400, dur: 29, delay: 10, dx: 52,  dy: 78,  color: 1 },
  { left: "60%",  top: "62%",  w: 530, h: 450, dur: 26, delay: 14, dx: -62, dy: -42, color: 2 },
  { left: "-10%", top: "36%",  w: 440, h: 510, dur: 33, delay: 7,  dx: 72,  dy: -48, color: 3 },
  { left: "44%",  top: "74%",  w: 590, h: 530, dur: 22, delay: 19, dx: 46,  dy: -74, color: 4 },
];

/* ── Layer 2: Morning mist wisps ─────────────────────────────────────── */
const mist = [
  { left: "-5%",  top: "70%", w: 500, h: 60, blur: 30, dur: 28, delay: 0,  dx: 90,  peak: 0.13 },
  { left: "30%",  top: "78%", w: 420, h: 50, blur: 25, dur: 35, delay: 8,  dx: -70, peak: 0.10 },
  { left: "55%",  top: "65%", w: 550, h: 70, blur: 35, dur: 30, delay: 15, dx: 80,  peak: 0.12 },
  { left: "-8%",  top: "85%", w: 380, h: 45, blur: 28, dur: 40, delay: 5,  dx: 100, peak: 0.09 },
];

/* ── Layer 3: Diagonal sunbeam shafts ────────────────────────────────── */
const beams = [
  { left: "11%", rotate: -28, dur: 13, delay: 0,  peak: 0.10, width: 5 },
  { left: "27%", rotate: -35, dur: 18, delay: 4,  peak: 0.07, width: 3 },
  { left: "48%", rotate: -24, dur: 15, delay: 8,  peak: 0.09, width: 6 },
  { left: "66%", rotate: -30, dur: 20, delay: 2,  peak: 0.06, width: 4 },
  { left: "82%", rotate: -22, dur: 14, delay: 11, peak: 0.08, width: 4 },
  { left: "38%", rotate: -32, dur: 17, delay: 16, peak: 0.05, width: 2 },
];

/* ── Layer 4: Bokeh light orbs ───────────────────────────────────────── */
const bokeh = [
  { left: "6%",  top: "20%", size: 150, blur: 45, dur: 23, delay: 0,  dx: 38,  dy: 28,  peak: 0.22 },
  { left: "22%", top: "66%", size: 100, blur: 32, dur: 27, delay: 5,  dx: -30, dy: -38, peak: 0.18 },
  { left: "47%", top: "10%", size: 200, blur: 60, dur: 20, delay: 9,  dx: 28,  dy: 48,  peak: 0.14 },
  { left: "67%", top: "50%", size: 125, blur: 38, dur: 25, delay: 3,  dx: -44, dy: 30,  peak: 0.20 },
  { left: "83%", top: "20%", size: 170, blur: 52, dur: 29, delay: 12, dx: -28, dy: -44, peak: 0.16 },
  { left: "37%", top: "76%", size: 115, blur: 36, dur: 19, delay: 8,  dx: 48,  dy: -28, peak: 0.19 },
  { left: "13%", top: "40%", size: 135, blur: 42, dur: 23, delay: 17, dx: 30,  dy: 35,  peak: 0.13 },
  { left: "75%", top: "74%", size: 145, blur: 46, dur: 21, delay: 22, dx: 35,  dy: -30, peak: 0.15 },
];

/* ── Layer 5: Drifting leaf silhouettes (5 distinct shapes) ──────────── */
const LEAF_PATHS = [
  "M12 2 Q20 7 19 15 Q18 21 12 23 Q6 21 5 15 Q4 7 12 2 Z",
  "M12 1 Q17 9 15 17 Q14 21 12 24 Q10 21 9 17 Q7 9 12 1 Z",
  "M2 14 Q9 3 17 2 Q23 5 22 14 Q20 21 14 22 Q8 23 3 19 Z",
  "M12 2 L14.5 9.5 L22 9 L16.5 13.5 L18.5 21 L12 17 L5.5 21 L7.5 13.5 L2 9 L9.5 9.5 Z",
  "M4 21 Q5 11 12 5 Q19 3 21 8 Q17 11 13 16 Q10 19 4 21 Z",
];
const LEAF_FILLS = [
  "rgba(255,255,255,0.62)",
  "rgba(190,240,150,0.52)",
  "rgba(255,255,220,0.56)",
  "rgba(210,245,170,0.54)",
  "rgba(255,255,255,0.48)",
];
const leaves = [
  { left: "2%",  dur: 22, delay: 0,  startRot: 15,  size: 36, shape: 0, fill: 0 },
  { left: "11%", dur: 29, delay: 7,  startRot: -42, size: 26, shape: 2, fill: 1 },
  { left: "21%", dur: 20, delay: 14, startRot: 68,  size: 42, shape: 1, fill: 2 },
  { left: "32%", dur: 26, delay: 4,  startRot: -28, size: 30, shape: 4, fill: 3 },
  { left: "43%", dur: 34, delay: 19, startRot: 52,  size: 22, shape: 3, fill: 4 },
  { left: "54%", dur: 24, delay: 10, startRot: -60, size: 38, shape: 0, fill: 1 },
  { left: "64%", dur: 19, delay: 16, startRot: 38,  size: 28, shape: 2, fill: 0 },
  { left: "74%", dur: 28, delay: 3,  startRot: -20, size: 46, shape: 1, fill: 3 },
  { left: "83%", dur: 22, delay: 21, startRot: 78,  size: 32, shape: 4, fill: 2 },
  { left: "92%", dur: 31, delay: 9,  startRot: -40, size: 40, shape: 3, fill: 4 },
  { left: "38%", dur: 18, delay: 23, startRot: -68, size: 48, shape: 0, fill: 0 },
  { left: "58%", dur: 36, delay: 31, startRot: 26,  size: 24, shape: 2, fill: 3 },
];

/* ── Layer 6: Birds in flight ────────────────────────────────────────── */
// Classic overhead bird-in-flight silhouette (wide wingspan, slight body)
const BIRD_PATH = "M2 6 Q8 2 15 4 Q22 2 28 6 Q22 5 15 6 Q8 5 2 6 Z";

const birds = [
  { top: "18%", size: 28, dur: 38, delay: 0,  fromRight: false, ys: [-8, 5, -6, 3, 0]  },
  { top: "32%", size: 22, dur: 44, delay: 12, fromRight: false, ys: [5, -10, 8, -4, 0]  },
  { top: "12%", size: 18, dur: 36, delay: 25, fromRight: true,  ys: [-5, 7, -3, 5, 0]   },
  { top: "25%", size: 26, dur: 50, delay: 7,  fromRight: true,  ys: [8, -6, 4, -8, 0]   },
];

/* ── Layer 7: Butterflies (Blue Morpho — native to Guyana) ───────────── */
// Four wing lobes + body as a compound path
const BUTTERFLY_PATH =
  "M14 11 Q6 3 1 6 Q5 10 14 11 Z " +
  "M14 11 Q22 3 27 6 Q23 10 14 11 Z " +
  "M14 11 Q5 15 3 21 Q9 19 14 13 Z " +
  "M14 11 Q23 15 25 21 Q19 19 14 13 Z";

const butterflies = [
  { top: "22%", size: 30, dur: 28, delay: 0,  fromRight: false,
    ys: [0, -45, 15, -35, 25, -50, 10, -30, 0] },
  { top: "45%", size: 26, dur: 34, delay: 15, fromRight: true,
    ys: [0, 30, -20, 50, -35, 20, -45, 30, 0]  },
  { top: "15%", size: 22, dur: 32, delay: 30, fromRight: false,
    ys: [0, -30, 40, -15, 55, -40, 20, -25, 0] },
];

/* ── Layer 8: Dragonflies ────────────────────────────────────────────── */
// Thin elongated body + two pairs of wide flat wings
const DRAGONFLY_PATH =
  "M21 2 Q22 8 22 15 Q21 8 20 2 Z " +
  "M22 5 Q12 1 3 4 Q9 7 22 5 Z " +
  "M22 5 Q32 1 41 4 Q35 7 22 5 Z " +
  "M22 9 Q11 7 2 10 Q9 11 22 9 Z " +
  "M22 9 Q33 7 42 10 Q35 11 22 9 Z";

const dragonflies = [
  { top: "55%", size: 32, dur: 12, delay: 5,  fromRight: false,
    ys: [0, -30, 20, -40, 10, 0] },
  { top: "35%", size: 28, dur: 10, delay: 22, fromRight: true,
    ys: [0, 40, -20, 35, -15, 0] },
  { top: "65%", size: 24, dur: 14, delay: 40, fromRight: false,
    ys: [0, -50, 30, -20, 40, 0] },
];

/* ── Layer 9: Firefly particles ──────────────────────────────────────── */
const fireflies = [
  { left: "8%",  top: "30%", dur: 7,  delay: 0,  dx: 26,  dy: -22, size: 5 },
  { left: "18%", top: "65%", dur: 9,  delay: 2,  dx: -22, dy: 16,  size: 4 },
  { left: "27%", top: "18%", dur: 8,  delay: 5,  dx: 32,  dy: 26,  size: 6 },
  { left: "37%", top: "74%", dur: 11, delay: 1,  dx: -26, dy: -32, size: 4 },
  { left: "46%", top: "40%", dur: 8,  delay: 7,  dx: 24,  dy: 24,  size: 5 },
  { left: "55%", top: "14%", dur: 10, delay: 3,  dx: -32, dy: 30,  size: 6 },
  { left: "62%", top: "55%", dur: 7,  delay: 9,  dx: 30,  dy: -20, size: 4 },
  { left: "71%", top: "80%", dur: 12, delay: 4,  dx: -24, dy: -30, size: 5 },
  { left: "79%", top: "35%", dur: 6,  delay: 11, dx: 20,  dy: 34,  size: 6 },
  { left: "87%", top: "60%", dur: 9,  delay: 6,  dx: -30, dy: 24,  size: 4 },
  { left: "11%", top: "50%", dur: 8,  delay: 14, dx: 24,  dy: -30, size: 5 },
  { left: "20%", top: "8%",  dur: 10, delay: 8,  dx: -20, dy: 34,  size: 6 },
  { left: "44%", top: "88%", dur: 7,  delay: 17, dx: 34,  dy: -24, size: 4 },
  { left: "67%", top: "22%", dur: 11, delay: 10, dx: -24, dy: 20,  size: 5 },
];

/* ── Layer 10: Water ripple rings (blackwater creek) ─────────────────── */
const ripples = [
  { left: "14%", top: "82%", dur: 7,  delay: 0 },
  { left: "68%", top: "87%", dur: 9,  delay: 3 },
  { left: "40%", top: "91%", dur: 8,  delay: 6 },
  { left: "82%", top: "78%", dur: 11, delay: 1 },
];

/* ── Layer 11: Dewdrop / sunlight sparkles ───────────────────────────── */
// 4-pointed star shape — represents dewdrops catching early morning light
const SPARKLE_PATH =
  "M12 1 L13.8 10.2 L22 12 L13.8 13.8 L12 23 L10.2 13.8 L2 12 L10.2 10.2 Z";

const sparkles = [
  { left: "9%",  top: "22%", size: 12, dur: 4,  delay: 0  },
  { left: "23%", top: "44%", size: 10, dur: 5,  delay: 2  },
  { left: "38%", top: "16%", size: 14, dur: 3,  delay: 7  },
  { left: "52%", top: "58%", size: 10, dur: 6,  delay: 1  },
  { left: "67%", top: "28%", size: 12, dur: 4,  delay: 9  },
  { left: "78%", top: "70%", size: 8,  dur: 5,  delay: 4  },
  { left: "88%", top: "38%", size: 14, dur: 3,  delay: 12 },
  { left: "15%", top: "74%", size: 10, dur: 6,  delay: 6  },
];

/* ─────────────────────────────────────────────────────────────────────── */

export function AnimatedHeroBg() {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 30% 40%, rgba(90,165,40,0.22) 0%, transparent 70%)",
        }}
      />
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">

      {/* ── 1: Large ambient blobs ──────────────────────────────────────── */}
      {blobs.map((b, i) => (
        <motion.div
          key={`blob-${i}`}
          className="absolute rounded-full"
          style={{ left: b.left, top: b.top, width: b.w, height: b.h, background: BLOB_COLORS[b.color] }}
          animate={{ x: [0, b.dx, 0], y: [0, b.dy, 0] }}
          transition={{ duration: b.dur, delay: b.delay, repeat: Infinity, repeatType: "mirror", ease: EASE }}
        />
      ))}

      {/* ── 2: Morning mist wisps ──────────────────────────────────────── */}
      {mist.map((m, i) => (
        <motion.div
          key={`mist-${i}`}
          className="absolute rounded-full"
          style={{
            left: m.left,
            top: m.top,
            width: m.w,
            height: m.h,
            background: "linear-gradient(90deg, transparent 0%, rgba(220,240,210,0.5) 30%, rgba(220,240,210,0.5) 70%, transparent 100%)",
            filter: `blur(${m.blur}px)`,
          }}
          animate={{ x: [0, m.dx, 0], opacity: [0, m.peak, m.peak * 0.6, m.peak, 0] }}
          transition={{ duration: m.dur, delay: m.delay, repeat: Infinity, repeatType: "mirror", ease: EASE }}
        />
      ))}

      {/* ── 3: Sunbeam shafts ──────────────────────────────────────────── */}
      {beams.map((beam, i) => (
        <motion.div
          key={`beam-${i}`}
          className="absolute"
          style={{
            left: beam.left,
            top: "-20%",
            width: `${beam.width}px`,
            height: "140%",
            background: "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.55) 30%, rgba(255,255,255,0.30) 65%, transparent 100%)",
            rotate: beam.rotate,
            transformOrigin: "top center",
          }}
          animate={{ opacity: [0, beam.peak, beam.peak * 0.4, beam.peak, 0] }}
          transition={{ duration: beam.dur, delay: beam.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* ── 4: Bokeh orbs ─────────────────────────────────────────────── */}
      {bokeh.map((b, i) => (
        <motion.div
          key={`bokeh-${i}`}
          className="absolute rounded-full"
          style={{
            left: b.left,
            top: b.top,
            width: b.size,
            height: b.size,
            background: "radial-gradient(circle, rgba(190,240,120,0.65) 0%, rgba(90,165,40,0.35) 50%, transparent 100%)",
            filter: `blur(${b.blur}px)`,
            marginLeft: -b.size / 2,
            marginTop: -b.size / 2,
          }}
          animate={{ x: [0, b.dx, 0], y: [0, b.dy, 0], opacity: [0, b.peak, b.peak * 0.65, b.peak, 0] }}
          transition={{ duration: b.dur, delay: b.delay, repeat: Infinity, repeatType: "mirror", ease: EASE }}
        />
      ))}

      {/* ── 5: Drifting leaf silhouettes ───────────────────────────────── */}
      {leaves.map((l, i) => (
        <motion.div
          key={`leaf-${i}`}
          className="absolute"
          style={{ left: l.left, bottom: "-6%" }}
          animate={{
            y: [0, -1700],
            x: [0, 45, -35, 22, 0],
            rotate: [l.startRot, l.startRot + 210, l.startRot + 420],
            opacity: [0, 0.75, 0.65, 0.50, 0.20, 0],
          }}
          transition={{ duration: l.dur, delay: l.delay, repeat: Infinity, ease: "linear" }}
        >
          <svg width={l.size} height={l.size} viewBox="0 0 24 24" fill={LEAF_FILLS[l.fill]} stroke="none">
            <path d={LEAF_PATHS[l.shape]} />
          </svg>
        </motion.div>
      ))}

      {/* ── 6: Birds in flight ─────────────────────────────────────────── */}
      {birds.map((b, i) => (
        <motion.div
          key={`bird-${i}`}
          className="absolute"
          style={{
            top: b.top,
            left: b.fromRight ? "auto" : "-6%",
            right: b.fromRight ? "-6%" : "auto",
            rotate: b.fromRight ? 180 : 0,
          }}
          animate={{
            x: b.fromRight ? [0, -2600] : [0, 2600],
            y: b.ys,
            opacity: [0, 0.55, 0.50, 0.55, 0.50, 0.45, 0],
          }}
          transition={{ duration: b.dur, delay: b.delay, repeat: Infinity, repeatType: "loop", ease: "linear" }}
        >
          <svg width={b.size} height={b.size * 0.4} viewBox="0 0 30 12" fill="rgba(255,255,255,0.70)" stroke="none">
            <path d={BIRD_PATH} />
          </svg>
        </motion.div>
      ))}

      {/* ── 7: Butterflies (Blue Morpho) ───────────────────────────────── */}
      {butterflies.map((b, i) => (
        <motion.div
          key={`butterfly-${i}`}
          className="absolute"
          style={{
            top: b.top,
            left: b.fromRight ? "auto" : "-4%",
            right: b.fromRight ? "-4%" : "auto",
            rotate: b.fromRight ? 180 : 0,
          }}
          animate={{
            x: b.fromRight ? [0, -2200] : [0, 2200],
            y: b.ys,
            opacity: [0, 0.60, 0.55, 0.60, 0.55, 0.58, 0.50, 0.55, 0],
          }}
          transition={{ duration: b.dur, delay: b.delay, repeat: Infinity, repeatType: "loop", ease: "linear" }}
        >
          <svg width={b.size} height={b.size} viewBox="0 0 28 22" fill="rgba(100,180,255,0.65)" stroke="none">
            <path d={BUTTERFLY_PATH} />
          </svg>
        </motion.div>
      ))}

      {/* ── 8: Dragonflies ─────────────────────────────────────────────── */}
      {dragonflies.map((d, i) => (
        <motion.div
          key={`dragonfly-${i}`}
          className="absolute"
          style={{
            top: d.top,
            left: d.fromRight ? "auto" : "-5%",
            right: d.fromRight ? "-5%" : "auto",
            rotate: d.fromRight ? 180 : 0,
          }}
          animate={{
            x: d.fromRight ? [0, -2400] : [0, 2400],
            y: d.ys,
            opacity: [0, 0.50, 0.45, 0.50, 0.44, 0],
          }}
          transition={{ duration: d.dur, delay: d.delay, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
        >
          <svg width={d.size} height={d.size * 0.5} viewBox="0 0 44 18" fill="rgba(180,240,200,0.70)" stroke="none">
            <path d={DRAGONFLY_PATH} />
          </svg>
        </motion.div>
      ))}

      {/* ── 9: Firefly particles ───────────────────────────────────────── */}
      {fireflies.map((ff, i) => (
        <motion.div
          key={`ff-${i}`}
          className="absolute rounded-full"
          style={{
            left: ff.left,
            top: ff.top,
            width: ff.size,
            height: ff.size,
            background: "radial-gradient(circle, rgba(255,235,110,0.95) 0%, rgba(196,148,26,0.65) 50%, transparent 100%)",
            filter: `blur(${ff.size * 0.35}px)`,
            boxShadow: `0 0 ${ff.size * 2.5}px ${ff.size * 1.5}px rgba(196,148,26,0.35)`,
          }}
          animate={{
            x: [0, ff.dx, 0, -ff.dx * 0.5, 0],
            y: [0, ff.dy, 0, -ff.dy * 0.4, 0],
            opacity: [0, 0.95, 0.20, 0.85, 0],
            scale: [0.8, 1.4, 0.9, 1.2, 0.8],
          }}
          transition={{ duration: ff.dur, delay: ff.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* ── 10: Water ripple rings ─────────────────────────────────────── */}
      {ripples.map((r, i) => (
        <motion.div
          key={`ripple-${i}`}
          className="absolute rounded-full"
          style={{
            left: r.left,
            top: r.top,
            width: 36,
            height: 36,
            marginLeft: -18,
            marginTop: -18,
            border: "1.5px solid rgba(255,255,255,0.30)",
          }}
          animate={{ scale: [1, 6, 11], opacity: [0.45, 0.14, 0] }}
          transition={{ duration: r.dur, delay: r.delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}

      {/* ── 11: Dewdrop sparkles ───────────────────────────────────────── */}
      {sparkles.map((s, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute"
          style={{ left: s.left, top: s.top }}
          animate={{
            opacity: [0, 0.80, 0.20, 0.70, 0],
            scale: [0.6, 1.2, 0.8, 1.1, 0.6],
            rotate: [0, 45, 0],
          }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="rgba(255,255,200,0.85)" stroke="none">
            <path d={SPARKLE_PATH} />
          </svg>
        </motion.div>
      ))}

      {/* ── 12: Ambient center radial pulse ───────────────────────────── */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 68% 58% at 50% 50%, rgba(58,107,30,0.16) 0%, transparent 70%)",
        }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   AnimatedPageHero — reusable banner for all inner pages
   ───────────────────────────────────────────────────────────────────────── */

const SLIDE = [0.22, 1, 0.36, 1] as [number, number, number, number]

interface AnimatedPageHeroProps {
  eyebrow?: string
  title: string
  subtitle?: string
  children?: ReactNode
}

export function AnimatedPageHero({ eyebrow, title, subtitle, children }: AnimatedPageHeroProps) {
  return (
    <section
      className="relative flex items-center justify-center overflow-hidden text-white py-20 px-4"
      style={{
        background: "linear-gradient(160deg, #1E3A0E 0%, #2D5016 40%, #3A6B1E 70%, #1E3A0E 100%)",
        minHeight: "280px",
      }}
    >
      <AnimatedHeroBg />

      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-[#FAF6F0]/30 pointer-events-none" />

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {eyebrow && (
          <motion.span
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: SLIDE }}
            className="inline-block text-xs font-bold uppercase tracking-widest text-white/60 mb-3"
          >
            {eyebrow}
          </motion.span>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: SLIDE, delay: 0.08 }}
          className="text-4xl sm:text-5xl font-black leading-tight drop-shadow-lg"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: SLIDE, delay: 0.18 }}
            className="mt-4 text-white/75 text-base sm:text-lg leading-relaxed max-w-lg mx-auto"
          >
            {subtitle}
          </motion.p>
        )}
        {children && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: SLIDE, delay: 0.28 }}
            className="mt-5"
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}
