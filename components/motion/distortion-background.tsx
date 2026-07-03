"use client";

import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle, Texture } from "ogl";
import { gsap } from "@/lib/gsap";

// Original slow-drift warp: two moving sine fields bend the texture UVs so
// the smoke artwork breathes behind the section content.
const VERTEX = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
`;

const FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uMap;
uniform float uTime;
void main() {
  vec2 uv = vUv;
  uv.x += sin(uv.y * 5.0 + uTime * 0.12) * 0.02;
  uv.y += cos(uv.x * 4.0 + uTime * 0.09) * 0.02;
  vec3 c = texture2D(uMap, uv).rgb;
  gl_FragColor = vec4(c, 1.0);
}
`;

export function DistortionBackground({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({ dpr: 1, antialias: false }); // background layer: low DPR is plenty
    } catch {
      return;
    }
    const gl = renderer.gl;
    Object.assign(gl.canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%" });

    let disposed = false;
    let tick: ((t: number) => void) | null = null;
    let cleanupInner: (() => void) | null = null;

    const img = new Image();
    img.onload = () => {
      if (disposed) return;
      const program = new Program(gl, {
        vertex: VERTEX,
        fragment: FRAGMENT,
        uniforms: {
          uMap: { value: new Texture(gl, { image: img, generateMipmaps: false }) },
          uTime: { value: 0 },
        },
      });
      const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

      const resize = () => {
        const { width, height } = container.getBoundingClientRect();
        renderer.setSize(width, height);
      };
      resize();
      window.addEventListener("resize", resize);
      container.appendChild(gl.canvas);

      let inView = true;
      const io = new IntersectionObserver(([e]) => (inView = e.isIntersecting));
      io.observe(container);

      tick = (time: number) => {
        if (!inView || document.hidden) return;
        program.uniforms.uTime.value = time;
        renderer.render({ scene: mesh });
      };
      gsap.ticker.add(tick);
      cleanupInner = () => {
        io.disconnect();
        window.removeEventListener("resize", resize);
      };
    };
    img.src = src;

    return () => {
      disposed = true;
      if (tick) gsap.ticker.remove(tick);
      cleanupInner?.();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      if (gl.canvas.parentElement === container) container.removeChild(gl.canvas);
    };
  }, [src]);

  return <div ref={ref} aria-hidden="true" className={`absolute inset-0 pointer-events-none ${className ?? ""}`} />;
}
