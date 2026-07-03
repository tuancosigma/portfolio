"use client";

import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";
import { gsap } from "@/lib/gsap";

// Original shader: 3-octave value-noise fbm drifts a soft mist upward while a
// radial glow tracks the (lerped) pointer. Brand pink over transparent black.
const VERTEX = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uResolution;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * valueNoise(p);
    p *= 2.1;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 p = vUv * aspect;

  // Slow upward-drifting mist.
  float mist = fbm(p * 2.4 + vec2(uTime * 0.03, -uTime * 0.06));
  mist = smoothstep(0.42, 0.85, mist);

  // Glow following the pointer.
  float d = distance(vUv * aspect, uMouse * aspect);
  float glow = smoothstep(0.55, 0.0, d);

  // Brand pink #eca8d6, brighter near the pointer.
  vec3 pink = vec3(0.925, 0.659, 0.839);
  float strength = mist * (0.10 + glow * 0.35) + glow * 0.08;

  gl_FragColor = vec4(pink, strength);
}
`;

export function HeroWebglLayer() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        alpha: true,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
        antialias: false,
      });
    } catch {
      return; // No WebGL — hero still works with just the video.
    }
    const gl = renderer.gl;
    gl.canvas.style.position = "absolute";
    gl.canvas.style.inset = "0";
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    container.appendChild(gl.canvas);

    const program = new Program(gl, {
      vertex: VERTEX,
      fragment: FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: [0.5, 0.5] },
        uResolution: { value: [1, 1] },
      },
      transparent: true,
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [width, height];
    };
    resize();
    window.addEventListener("resize", resize);

    // Lerped pointer target (uv space, y flipped to match GL).
    const target = { x: 0.5, y: 0.5 };
    const current = { x: 0.5, y: 0.5 };
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      target.x = (e.clientX - rect.left) / rect.width;
      target.y = 1 - (e.clientY - rect.top) / rect.height;
    };
    window.addEventListener("pointermove", onPointerMove);

    // Pause when the hero is off-screen or the tab is hidden.
    let inView = true;
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
    });
    io.observe(container);

    const tick = (time: number) => {
      if (!inView || document.hidden) return;
      current.x += (target.x - current.x) * 0.05;
      current.y += (target.y - current.y) * 0.05;
      program.uniforms.uTime.value = time;
      program.uniforms.uMouse.value = [current.x, current.y];
      renderer.render({ scene: mesh });
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      container.removeChild(gl.canvas);
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 pointer-events-none" aria-hidden="true" />;
}
