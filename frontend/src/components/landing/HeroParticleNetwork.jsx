import { useEffect, useRef } from "react";
import * as THREE from "three";

const NODE_COUNT   = 120;
const MAX_DIST     = 100;
const PARALLAX     = 0.030;   // camera sway strength
const CURSOR_R     = 160;     // repulsion radius (scene px)
const CURSOR_STR   = 7;       // push force multiplier
const SPRING       = 0.055;   // spring-back toward resting offset
const DAMPING      = 0.80;    // velocity damping (lower = bouncier)

export default function HeroParticleNetwork() {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    let w = window.innerWidth;
    let h = window.innerHeight;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-w/2, w/2, h/2, -h/2, 0.1, 1000);
    camera.position.z = 10;

    // Each node: drift position + cursor-reaction offset
    const positions = Array.from({ length: NODE_COUNT }, () => ({
      x:   (Math.random() - 0.5) * w,
      y:   (Math.random() - 0.5) * h,
      vx:  (Math.random() - 0.5) * 0.4,
      vy:  (Math.random() - 0.5) * 0.4,
      // cursor-spring layer
      cx: 0, cy: 0,   // current cursor offset
      cvx: 0, cvy: 0, // cursor velocity
    }));

    // Dot geometry
    const dotGeo   = new THREE.BufferGeometry();
    const dotPos   = new Float32Array(NODE_COUNT * 3);
    dotGeo.setAttribute("position", new THREE.BufferAttribute(dotPos, 3));
    const dotMat   = new THREE.PointsMaterial({ color: 0xf97316, size: 3.5, sizeAttenuation: false });
    scene.add(new THREE.Points(dotGeo, dotMat));

    // Line geometry
    const maxLines  = (NODE_COUNT * (NODE_COUNT - 1)) / 2;
    const linePos   = new Float32Array(maxLines * 6);
    const lineCol   = new Float32Array(maxLines * 6);
    const lineGeo   = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
    lineGeo.setAttribute("color",    new THREE.BufferAttribute(lineCol, 3));
    lineGeo.setDrawRange(0, 0);
    const lineSegs  = new THREE.LineSegments(
      lineGeo,
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55 })
    );
    scene.add(lineSegs);

    // Mouse — two channels:
    //   parallax: for smooth camera sway (existing behaviour)
    //   scene:    raw scene coords for node repulsion
    const mouse = { px: 0, py: 0, sx: 0, sy: 0 };

    const onMouseMove = (e) => {
      // Camera parallax target
      mouse.px =  (e.clientX - w / 2) * PARALLAX;
      mouse.py = -(e.clientY - h / 2) * PARALLAX;
      // Scene-space position (for node collision)
      mouse.sx =  e.clientX - w / 2;
      mouse.sy = -(e.clientY - h / 2);
    };
    window.addEventListener("mousemove", onMouseMove);

    const r1 = new THREE.Color(0xfed7aa);
    const r2 = new THREE.Color(0xf97316);

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Smooth camera parallax
      camera.position.x += (mouse.px - camera.position.x) * 0.05;
      camera.position.y += (mouse.py - camera.position.y) * 0.05;

      for (let i = 0; i < NODE_COUNT; i++) {
        const p = positions[i];

        // — Drift (bounce off walls) —
        p.x += p.vx;
        p.y += p.vy;
        if (p.x >  w / 2 || p.x < -w / 2) p.vx *= -1;
        if (p.y >  h / 2 || p.y < -h / 2) p.vy *= -1;

        // — Cursor repulsion spring —
        const dx   = p.x - mouse.sx;
        const dy   = p.y - mouse.sy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CURSOR_R && dist > 0.5) {
          const force = ((1 - dist / CURSOR_R) ** 2) * CURSOR_STR;
          p.cvx += (dx / dist) * force;
          p.cvy += (dy / dist) * force;
        }

        // Spring pulls cursor offset back to zero
        p.cvx += -p.cx * SPRING;
        p.cvy += -p.cy * SPRING;
        // Damp
        p.cvx *= DAMPING;
        p.cvy *= DAMPING;
        // Integrate
        p.cx += p.cvx;
        p.cy += p.cvy;

        // Final rendered position = drift + cursor offset
        dotPos[i * 3]     = p.x + p.cx;
        dotPos[i * 3 + 1] = p.y + p.cy;
        dotPos[i * 3 + 2] = 0;
      }
      dotGeo.attributes.position.needsUpdate = true;

      // — Lines between displaced positions —
      let idx = 0;
      for (let i = 0; i < NODE_COUNT; i++) {
        const ax = positions[i].x + positions[i].cx;
        const ay = positions[i].y + positions[i].cy;

        for (let j = i + 1; j < NODE_COUNT; j++) {
          const bx = positions[j].x + positions[j].cx;
          const by = positions[j].y + positions[j].cy;

          const dx   = ax - bx;
          const dy   = ay - by;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < MAX_DIST) {
            const t = 1 - dist / MAX_DIST;
            const c = r1.clone().lerp(r2, t);
            const b = idx * 6;

            linePos[b]     = ax; linePos[b + 1] = ay; linePos[b + 2] = 0;
            linePos[b + 3] = bx; linePos[b + 4] = by; linePos[b + 5] = 0;

            lineCol[b]     = c.r; lineCol[b + 1] = c.g; lineCol[b + 2] = c.b;
            lineCol[b + 3] = c.r; lineCol[b + 4] = c.g; lineCol[b + 5] = c.b;
            idx++;
          }
        }
      }
      lineGeo.setDrawRange(0, idx * 2);
      lineGeo.attributes.position.needsUpdate = true;
      lineGeo.attributes.color.needsUpdate    = true;

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      renderer.setSize(w, h);
      camera.left = -w/2; camera.right = w/2;
      camera.top  =  h/2; camera.bottom = -h/2;
      camera.updateProjectionMatrix();
      for (const p of positions) {
        p.x = Math.max(-w/2, Math.min(w/2, p.x));
        p.y = Math.max(-h/2, Math.min(h/2, p.y));
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize",    onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
}
