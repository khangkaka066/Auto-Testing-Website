import { useEffect, useRef } from "react";
import * as THREE from "three";

const LINE_COUNT = 68;
const PTS = 210;

// Five wave layers for organic, hand-drawn feel
const WAVES = [
  { amp: 24, freq: 0.0060, speed:  0.33, phase: 0.41 },
  { amp: 12, freq: 0.0155, speed: -0.51, phase: 0.92 },
  { amp:  6, freq: 0.040,  speed:  0.70, phase: 1.73 },
  { amp:  3, freq: 0.095,  speed: -0.29, phase: 2.35 },
  { amp:  1.4, freq: 0.21, speed:  0.57, phase: 3.14 },
];

const MOUSE_R   = 260;
const MOUSE_STR = 88;   // dramatic warp

// Pre-baked per-vertex jitter for roughness
const JITTER = new Float32Array(LINE_COUNT * PTS);
for (let i = 0; i < JITTER.length; i++) JITTER[i] = (Math.random() - 0.5) * 1.6;

// Vignette: lines near vertical center are brighter
function vignetteOpacity(i) {
  const t = i / (LINE_COUNT - 1);          // 0 → 1
  const bell = Math.sin(t * Math.PI);      // 0 at edges, 1 at centre
  return 0.10 + 0.32 * bell;               // 0.10 … 0.42
}

export default function StoryCanvas({ colorRef }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    let w = window.innerWidth;
    let h = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x0f172a, 1);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const cam = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 100);
    cam.position.z = 10;

    // Per-line materials with vignette opacity
    const scanLines = [];
    for (let i = 0; i < LINE_COUNT; i++) {
      const baseY = (i / (LINE_COUNT - 1)) * h - h / 2;
      const buf   = new Float32Array(PTS * 3);
      const geo   = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(buf, 3));
      const mat = new THREE.LineBasicMaterial({
        color: 0xf97316,
        transparent: true,
        opacity: vignetteOpacity(i),
      });
      const line = new THREE.Line(geo, mat);
      scene.add(line);
      scanLines.push({ geo, buf, mat, baseY });
    }

    // Smooth mouse (scene coords)
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e) => {
      mouse.tx =  e.clientX - w / 2;
      mouse.ty = -(e.clientY - h / 2);
    };
    window.addEventListener("mousemove", onMove);

    // Lerp-able colors
    const bgColor  = new THREE.Color(0x0f172a);
    const bgTarget = new THREE.Color(0x0f172a);
    const lnColor  = new THREE.Color(0xf97316);
    const lnTarget = new THREE.Color(0xf97316);

    let animId;
    let t = 0;

    const tick = () => {
      animId = requestAnimationFrame(tick);
      t += 0.013;

      // Smooth mouse
      mouse.x += (mouse.tx - mouse.x) * 0.065;
      mouse.y += (mouse.ty - mouse.y) * 0.065;

      // Subtle camera sway following mouse
      cam.position.x += ((mouse.tx * 0.012) - cam.position.x) * 0.04;
      cam.position.y += ((mouse.ty * 0.012) - cam.position.y) * 0.04;

      // Pull chapter colors from shared ref
      if (colorRef?.current) {
        bgTarget.set(colorRef.current.bg);
        lnTarget.setHex(colorRef.current.lineHex);
      }
      bgColor.lerp(bgTarget, 0.05);
      lnColor.lerp(lnTarget, 0.05);
      renderer.setClearColor(bgColor, 1);

      // Update scan lines
      for (let i = 0; i < LINE_COUNT; i++) {
        const { geo, buf, mat, baseY } = scanLines[i];
        mat.color.copy(lnColor);

        for (let j = 0; j < PTS; j++) {
          const x = (j / (PTS - 1)) * w - w / 2;
          let dy = JITTER[i * PTS + j];

          for (const wv of WAVES) {
            dy += wv.amp * Math.sin(x * wv.freq + t * wv.speed + i * wv.phase);
          }

          // Gaussian push from mouse
          const dx  = x - mouse.x;
          const dy2 = (baseY + dy) - mouse.y;
          dy += MOUSE_STR * Math.exp(-(dx * dx + dy2 * dy2) / (2 * MOUSE_R * MOUSE_R));

          buf[j * 3]     = x;
          buf[j * 3 + 1] = baseY + dy;
          buf[j * 3 + 2] = 0;
        }
        geo.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, cam);
    };
    tick();

    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      renderer.setSize(w, h);
      cam.left = -w / 2; cam.right = w / 2;
      cam.top  =  h / 2; cam.bottom = -h / 2;
      cam.updateProjectionMatrix();
      scanLines.forEach((sl, i) => {
        sl.baseY = (i / (LINE_COUNT - 1)) * h - h / 2;
      });
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [colorRef]);

  return (
    <div
      ref={mountRef}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
}
