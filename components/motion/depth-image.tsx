"use client";

import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle, Texture } from "ogl";
import { gsap } from "@/lib/gsap";

// Original depth-parallax shader: the grayscale depth map offsets each
// pixel's UV toward/away from the pointer (white = near = moves more),
// plus a soft time-based ripple around the cursor. Cover-fit handles the
// square textures inside any container aspect.
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
uniform sampler2D uImage;
uniform sampler2D uDepth;
uniform vec2 uMouse;
uniform float uTime;
uniform float uHover;
uniform vec2 uPlaneAspect; // cover-fit scale factors

void main() {
  // Cover-fit: scale UV so a square texture fills the plane without stretching.
  vec2 uv = (vUv - 0.5) * uPlaneAspect + 0.5;

  float depth = texture2D(uDepth, uv).r;

  // Parallax: near pixels shift opposite the pointer for a 3D feel.
  vec2 parallax = (uMouse - 0.5) * depth * 0.045;

  // Gentle ripple emanating from the cursor while hovered.
  float d = distance(vUv, uMouse);
  float ripple = sin(d * 28.0 - uTime * 2.4) * 0.004 * uHover * smoothstep(0.5, 0.0, d);

  vec3 color = texture2D(uImage, uv - parallax + ripple).rgb;

  // Slight vignette keeps edges anchored to the dark section behind.
  float vig = smoothstep(1.05, 0.55, distance(vUv, vec2(0.5)));
  gl_FragColor = vec4(color * vig, 1.0);
}
`;

interface DepthImageProps {
  src: string;
  depthSrc: string;
  alt: string;
  className?: string;
}

export function DepthImage({ src, depthSrc, alt, className }: DepthImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio || 1, 2), antialias: false });
    } catch {
      return; // keep the <img> fallback
    }
    const gl = renderer.gl;
    Object.assign(gl.canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%" });

    const loadTexture = (url: string) =>
      new Promise<Texture>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(new Texture(gl, { image: img, generateMipmaps: false }));
        img.onerror = reject;
        img.src = url;
      });

    let disposed = false;
    let tick: ((t: number) => void) | null = null;

    Promise.all([loadTexture(src), loadTexture(depthSrc)]).then(([image, depthTex]) => {
      if (disposed) return;

      const program = new Program(gl, {
        vertex: VERTEX,
        fragment: FRAGMENT,
        uniforms: {
          uImage: { value: image },
          uDepth: { value: depthTex },
          uMouse: { value: [0.5, 0.5] },
          uTime: { value: 0 },
          uHover: { value: 0 },
          uPlaneAspect: { value: [1, 1] },
        },
      });
      const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

      const resize = () => {
        const { width, height } = container.getBoundingClientRect();
        renderer.setSize(width, height);
        // Texture is square; shrink the wider plane axis in UV space (cover).
        const planeRatio = width / height;
        program.uniforms.uPlaneAspect.value = planeRatio > 1 ? [1, 1 / planeRatio] : [planeRatio, 1];
      };
      resize();
      window.addEventListener("resize", resize);
      container.appendChild(gl.canvas);

      const target = { x: 0.5, y: 0.5, hover: 0 };
      const current = { x: 0.5, y: 0.5, hover: 0 };
      const onMove = (e: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        target.x = (e.clientX - rect.left) / rect.width;
        target.y = 1 - (e.clientY - rect.top) / rect.height;
      };
      const onEnter = () => (target.hover = 1);
      const onLeave = () => {
        target.hover = 0;
        target.x = 0.5;
        target.y = 0.5;
      };
      container.addEventListener("pointermove", onMove);
      container.addEventListener("pointerenter", onEnter);
      container.addEventListener("pointerleave", onLeave);

      let inView = true;
      const io = new IntersectionObserver(([entry]) => (inView = entry.isIntersecting));
      io.observe(container);

      tick = (time: number) => {
        if (!inView || document.hidden) return;
        current.x += (target.x - current.x) * 0.06;
        current.y += (target.y - current.y) * 0.06;
        current.hover += (target.hover - current.hover) * 0.08;
        program.uniforms.uMouse.value = [current.x, current.y];
        program.uniforms.uTime.value = time;
        program.uniforms.uHover.value = current.hover;
        renderer.render({ scene: mesh });
      };
      gsap.ticker.add(tick);

      const cleanup = () => {
        io.disconnect();
        window.removeEventListener("resize", resize);
        container.removeEventListener("pointermove", onMove);
        container.removeEventListener("pointerenter", onEnter);
        container.removeEventListener("pointerleave", onLeave);
      };
      (container as HTMLDivElement & { _dispose?: () => void })._dispose = cleanup;
    });

    return () => {
      disposed = true;
      if (tick) gsap.ticker.remove(tick);
      (container as HTMLDivElement & { _dispose?: () => void })._dispose?.();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      gl.canvas.parentElement === container && container.removeChild(gl.canvas);
    };
  }, [src, depthSrc]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className ?? ""}`}>
      {/* Static fallback shown until (or in place of) the WebGL canvas. */}
      <img src={src} alt={alt} className="absolute inset-0 w-full h-full object-cover" />
    </div>
  );
}
