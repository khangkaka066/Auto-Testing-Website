import { useEffect, useRef } from "react";
import * as THREE from "three";

const FLOAT_COUNT = 60;

export default function CTAIcosahedron() {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const w = el.offsetWidth;
    const h = el.offsetHeight;

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
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
    camera.position.set(0, 0, 5);

    // Wireframe icosahedron
    const icoGeo = new THREE.IcosahedronGeometry(1.4, 1);
    const edges = new THREE.EdgesGeometry(icoGeo);
    const icoMat = new THREE.LineBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.55,
    });
    const ico = new THREE.LineSegments(edges, icoMat);
    scene.add(ico);

    // Inner solid icosahedron (faint glow fill)
    const innerGeo = new THREE.IcosahedronGeometry(1.38, 1);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.04,
      side: THREE.DoubleSide,
    });
    scene.add(new THREE.Mesh(innerGeo, innerMat));

    // Floating particles
    const floatPositions = new Float32Array(FLOAT_COUNT * 3);
    const floatData = Array.from({ length: FLOAT_COUNT }, () => ({
      speed: 0.003 + Math.random() * 0.005,
      angle: Math.random() * Math.PI * 2,
      radius: 2.2 + Math.random() * 1.8,
      yOff: (Math.random() - 0.5) * 3,
      phase: Math.random() * Math.PI * 2,
    }));
    const floatGeo = new THREE.BufferGeometry();
    floatGeo.setAttribute("position", new THREE.BufferAttribute(floatPositions, 3));
    const floatMat = new THREE.PointsMaterial({
      color: 0xfed7aa,
      size: 2.5,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.7,
    });
    scene.add(new THREE.Points(floatGeo, floatMat));

    let animId;
    let t = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.008;

      // Rotate icosahedron on two axes
      ico.rotation.x = t * 0.35;
      ico.rotation.y = t * 0.55;

      // Orbit floating particles
      for (let i = 0; i < FLOAT_COUNT; i++) {
        const d = floatData[i];
        d.angle += d.speed;
        floatPositions[i * 3] = Math.cos(d.angle) * d.radius;
        floatPositions[i * 3 + 1] = d.yOff + Math.sin(t + d.phase) * 0.3;
        floatPositions[i * 3 + 2] = Math.sin(d.angle) * d.radius;
      }
      floatGeo.attributes.position.needsUpdate = true;

      // Pulse opacity
      icoMat.opacity = 0.4 + Math.sin(t * 1.5) * 0.15;

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const nw = el.offsetWidth;
      const nh = el.offsetHeight;
      renderer.setSize(nw, nh);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 pointer-events-none" />;
}
