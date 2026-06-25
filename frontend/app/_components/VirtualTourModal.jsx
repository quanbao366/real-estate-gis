"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * Three.js VR panorama modal.
 * - Panorama is loaded from `virtualTourUrl` (equirectangular 360)
 * - Drag mouse / touch to rotate horizontally (yaw)
 * - No React state updates for continuous rotation
 * - Cleanup all WebGL resources on close
 */
export default function VirtualTourModal({
  open,
  onClose,
  virtualTourUrl,
  title,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const rafRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const meshRef = useRef(null);

  const textureRef = useRef(null);
  const geometryRef = useRef(null);
  const materialRef = useRef(null);

  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const targetYawRef = useRef(0);
  const yawRef = useRef(0);

  const [ready, setReady] = useState(false);
  const [imgError, setImgError] = useState("");
  const [imgFormatError, setImgFormatError] = useState("");

  const reducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  const isEquirectangularRatioValid = (naturalW, naturalH) => {
    if (!naturalW || !naturalH) return false;
    const ratio = naturalW / naturalH;
    // Equirectangular panorama typically has ratio 2:1 (width:height)
    return ratio >= 1.9 && ratio <= 2.1;
  };

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Reset when opening / URL changes
  useEffect(() => {
    if (!open) return;
    targetYawRef.current = 0;
    yawRef.current = 0;
    setReady(false);
    setImgFormatError("");
    setImgError("");
  }, [open, virtualTourUrl]);

  useEffect(() => {
    if (!open) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // ---- Validate panorama by preloading image (ratio check) ----
    const img = new Image();
    img.crossOrigin = "anonymous";

    let cancelled = false;
    let objectCleanup = null;

    const cleanupThree = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;

      const mesh = meshRef.current;
      if (mesh) {
        sceneRef.current?.remove(mesh);
      }

      try {
        if (rendererRef.current) {
          rendererRef.current.dispose?.();
        }
      } catch {
        // ignore
      }

      if (textureRef.current) {
        try {
          textureRef.current.dispose?.();
        } catch {
          // ignore
        }
      }

      if (geometryRef.current) {
        try {
          geometryRef.current.dispose?.();
        } catch {
          // ignore
        }
      }

      if (materialRef.current) {
        try {
          // dispose may fail for some material types; safe-guard
          materialRef.current.dispose?.();
        } catch {
          // ignore
        }
      }

      if (sceneRef.current) {
        sceneRef.current.clear?.();
      }

      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      meshRef.current = null;

      textureRef.current = null;
      geometryRef.current = null;
      materialRef.current = null;
    };

    const initThreeAndAnimate = () => {
      // Scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      cameraRef.current = camera;

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      rendererRef.current = renderer;

      // Sphere: inside-out
      const geometry = new THREE.SphereGeometry(500, 60, 40);
      geometryRef.current = geometry;

      const textureLoader = new THREE.TextureLoader();
      const texture = textureLoader.load(virtualTourUrl);
      textureRef.current = texture;

      // Mapping equirectangular panorama
      // Default THREE.UV mapping for SphereGeometry works for equirectangular.
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide,
      });
      materialRef.current = material;

      const mesh = new THREE.Mesh(geometry, material);
      meshRef.current = mesh;
      scene.add(mesh);

      // Resize observer
      const resize = () => {
        if (!containerRef.current || !rendererRef.current || !cameraRef.current)
          return;
        const rect = containerRef.current.getBoundingClientRect();
        const width = Math.max(1, Math.floor(rect.width));
        const height = Math.max(1, Math.floor(rect.height));
        rendererRef.current.setSize(width, height, false);
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      };

      resize();

      const ro = new ResizeObserver(() => resize());
      ro.observe(container);

      // Drag rotate (yaw only)
      const onPointerDown = (e) => {
        if (!open) return;
        draggingRef.current = true;
        lastXRef.current = e.clientX;
        e.currentTarget.setPointerCapture?.(e.pointerId);
      };
      const onPointerMove = (e) => {
        if (!draggingRef.current) return;
        const dx = e.clientX - lastXRef.current;
        lastXRef.current = e.clientX;

        const sensitivity = 0.005;
        targetYawRef.current += dx * sensitivity;
      };
      const onPointerUp = (e) => {
        draggingRef.current = false;
        e.currentTarget.releasePointerCapture?.(e.pointerId);
      };

      // Attach listeners directly on container to ensure touch works
      container.addEventListener("pointerdown", onPointerDown);
      container.addEventListener("pointermove", onPointerMove);
      container.addEventListener("pointerup", onPointerUp);
      container.addEventListener("pointercancel", onPointerUp);

      objectCleanup = () => {
        try {
          container.removeEventListener("pointerdown", onPointerDown);
          container.removeEventListener("pointermove", onPointerMove);
          container.removeEventListener("pointerup", onPointerUp);
          container.removeEventListener("pointercancel", onPointerUp);
        } catch {
          // ignore
        }
        try {
          ro.disconnect();
        } catch {
          // ignore
        }
      };

      const animate = () => {
        if (!open) return;

        // Smooth yaw
        if (!reducedMotion) {
          yawRef.current += (targetYawRef.current - yawRef.current) * 0.15;
        } else {
          yawRef.current = targetYawRef.current;
        }

        // Apply rotation
        const meshLocal = meshRef.current;
        const rendererLocal = rendererRef.current;
        const sceneLocal = sceneRef.current;
        const cameraLocal = cameraRef.current;
        if (meshLocal && rendererLocal && sceneLocal && cameraLocal) {
          meshLocal.rotation.y = yawRef.current;
          rendererLocal.render(sceneLocal, cameraLocal);
        }

        rafRef.current = requestAnimationFrame(animate);
      };

      // When texture is ready, mark ready
      texture.onUpdate = () => {
        if (cancelled) return;
        setReady(true);
      };

      // Start loop
      rafRef.current = requestAnimationFrame(animate);
    };

    img.onload = () => {
      if (cancelled) return;

      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;

      if (!isEquirectangularRatioValid(naturalW, naturalH)) {
        setImgFormatError("Ảnh VR không đúng định dạng panorama 360");
        setReady(true);
        return;
      }

      // init three only after validation
      initThreeAndAnimate();
    };

    img.onerror = () => {
      if (cancelled) return;
      setImgError("Không tải được panorama. Kiểm tra URL virtual tour.");
      setReady(false);
    };

    img.src = virtualTourUrl;

    return () => {
      cancelled = true;
      if (objectCleanup) objectCleanup();
      cleanupThree();
    };
  }, [open, virtualTourUrl, reducedMotion, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={() => onClose?.()}
      />

      <div className="absolute inset-0 flex flex-col">
        <header className="flex items-center justify-between gap-3 p-3 md:p-4 bg-white/90 backdrop-blur border-b">
          <div className="min-w-0">
            <div className="text-sm md:text-base font-bold truncate">
              {title || "Tham quan ảo"}
            </div>
            <div className="text-xs text-gray-600">
              Kéo để xoay • ESC để đóng
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onClose?.()}
              className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold transition"
            >
              ← Quay lại
            </button>
          </div>
        </header>

        <main className="flex-1 bg-black">
          {imgError || imgFormatError ? (
            <div className="h-full flex items-center justify-center text-white/90 text-sm text-center p-4">
              {imgFormatError || imgError}
            </div>
          ) : (
            <div
              ref={containerRef}
              className="relative w-full h-full overflow-hidden"
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full touch-none select-none"
              />

              {!ready ? (
                <div className="absolute left-0 right-0 top-[64px] md:top-[72px] bottom-0 flex items-center justify-center pointer-events-none">
                  <div className="text-white/90 text-sm md:text-base">
                    Đang tải VR 360...
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
