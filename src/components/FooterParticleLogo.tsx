import React, { useEffect, useRef, useState } from "react";

interface Particle {
  originX: number;
  originY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ease: number;
  targetEase: number;
  friction: number;
  size: number;
  baseColor: string;
  activeColor: string;
}

export function FooterParticleLogo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number | null = null;
    let isVisible = false;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const mouse = {
      x: -9999,
      y: -9999,
      radius: 4500 * dpr,
      actualRadius: Math.sqrt(4500 * dpr),
      isActive: false,
      timeout: null as NodeJS.Timeout | null,
    };

    let canvasWidth = 0;
    let canvasHeight = 0;
    let parentW = 0;
    let parentH = 0;

    const getColors = () => {
      const isDark =
        document.documentElement.classList.contains("dark") ||
        document.body.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;

      return {
        base: isDark ? "rgba(255, 255, 255, 0.48)" : "rgba(24, 24, 27, 0.45)",
        active: "rgba(255, 107, 43, 0.95)",
      };
    };

    const initParticles = () => {
      if (!container || !canvas || !ctx) return;

      const rect = container.getBoundingClientRect();
      parentW = rect.width || window.innerWidth;
      parentH = Math.max(rect.height || 0, 140);

      // Oversized canvas so exploding/repelled particles never clip at the boundaries
      const displayW = Math.max(parentW * 1.25, 300);
      const displayH = Math.max(parentH * 2.2, 280);

      canvasWidth = Math.floor(displayW * dpr);
      canvasHeight = Math.floor(displayH * dpr);

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      canvas.style.width = `${displayW}px`;
      canvas.style.height = `${displayH}px`;

      // Draw offscreen text to sample pixel coordinates
      const offCanvas = document.createElement("canvas");
      const offCtx = offCanvas.getContext("2d", { willReadFrequently: true });
      if (!offCtx) return;

      offCanvas.width = canvasWidth;
      offCanvas.height = canvasHeight;

      const isMobile = window.innerWidth <= 768;

      // Font size: bigger and more prominent on mobile (82px-115px), expansive on desktop (up to 220px)
      const baseFontSize = isMobile
        ? Math.min(Math.max(parentW * 0.22, 82), 120)
        : Math.min(Math.max(parentW * 0.155, 90), 220);
      const fontSize = Math.floor(baseFontSize * dpr);

      offCtx.font = `italic 900 ${fontSize}px "Fraunces", Georgia, "Times New Roman", serif`;
      offCtx.textAlign = "center";
      offCtx.textBaseline = "middle";

      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;

      // Rich stroke outline to give the dot matrix solid structural presence
      offCtx.lineWidth = isMobile ? Math.max(2.4 * dpr, 2.6) : Math.max(2.8 * dpr, 3.2);
      offCtx.strokeStyle = "#ffffff";
      offCtx.strokeText("the fale", centerX, centerY);

      let imgData: ImageData;
      try {
        imgData = offCtx.getImageData(0, 0, canvasWidth, canvasHeight);
      } catch {
        return;
      }

      particles = [];
      const colors = getColors();

      // Ultra-dense sampling gap so dots form a rich, continuous luminous matrix
      const gap = isMobile
        ? Math.max(Math.round(1.8 * dpr), 2)
        : Math.max(Math.round(2.1 * dpr), 2);

      const dotSize = isMobile ? 1.6 * dpr : 1.85 * dpr;

      const data = imgData.data;
      for (let y = 0; y < canvasHeight; y += gap) {
        for (let x = 0; x < canvasWidth; x += gap) {
          const index = (y * canvasWidth + x) * 4;
          const alpha = data[index + 3];

          if (alpha > 35) {
            particles.push({
              originX: x,
              originY: y,
              // Start scattered from random locations across canvas for assembly entrance
              x: x + (Math.random() - 0.5) * 350 * dpr,
              y: y + (Math.random() - 0.5) * 180 * dpr,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              ease: 0.045 + 0.045 * Math.random(),
              targetEase: 0.22 + 0.18 * Math.random(),
              friction: 0.82 + 0.1 * Math.random(),
              size: dotSize,
              baseColor: colors.base,
              activeColor: colors.active,
            });
          }
        }
      }

      if (particles.length > 0) {
        setIsReady(true);
      }
    };

    const updateCanvasOffset = () => {
      const rect = canvas.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
      };
    };

    let offset = updateCanvasOffset();

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isVisible) return;
      const rect = canvas.getBoundingClientRect();
      let clientX = 0;
      let clientY = 0;

      if ("touches" in e) {
        if (e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          return;
        }
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      // Track cursor position relative to the canvas
      mouse.x = (clientX - rect.left) * dpr;
      mouse.y = (clientY - rect.top) * dpr;
      mouse.isActive = true;

      if (mouse.timeout) clearTimeout(mouse.timeout);
      mouse.timeout = setTimeout(() => {
        mouse.isActive = false;
      }, 120);
    };

    const handlePointerLeave = () => {
      mouse.isActive = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };

    // Shockwave burst on click / tap
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) * dpr;
      const clickY = (e.clientY - rect.top) * dpr;
      const burstRadius = 200 * dpr;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = clickX - p.x;
        const dy = clickY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < burstRadius && dist > 0) {
          const force = ((burstRadius - dist) / burstRadius) * 32;
          p.vx -= (dx / dist) * force;
          p.vy -= (dy / dist) * force;
        }
      }
    };

    const render = () => {
      if (!ctx || !isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      const hasMouse = mouse.isActive;
      const mouseRadius = mouse.radius;
      const actualRadius = mouse.actualRadius;
      const mouseX = mouse.x;
      const mouseY = mouse.y;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        let isExcited = false;

        if (hasMouse) {
          const dx = mouseX - p.x;
          const dy = mouseY - p.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < mouseRadius) {
            p.ease = p.targetEase;
            const dist = Math.sqrt(distSq);
            if (dist > 0) {
              const force =
                -((actualRadius - dist) / actualRadius) *
                140 *
                (0.5 + Math.random() * 0.5);
              p.vx += (dx / dist) * force + (Math.random() - 0.5) * 1.2;
              p.vy += (dy / dist) * force + (Math.random() - 0.5) * 1.2;
              isExcited = true;
            }
          }
        }

        // Apply friction and spring back to origin
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.x += p.vx + (p.originX - p.x) * p.ease;
        p.y += p.vy + (p.originY - p.y) * p.ease;

        // Check velocity for dynamic glow
        const speedSq = p.vx * p.vx + p.vy * p.vy;
        if (speedSq > 1.5) {
          isExcited = true;
        }

        ctx.fillStyle = isExcited ? p.activeColor : p.baseColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    // Wait for custom web fonts to be fully available
    if ("fonts" in document) {
      document.fonts.ready.then(() => {
        initParticles();
      });
    } else {
      initParticles();
    }

    // Observer to pause animation loop when footer is offscreen
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // Resize handling with debounce
    let resizeTimer: NodeJS.Timeout | null = null;
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        initParticles();
      }, 150);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("touchmove", handlePointerMove, { passive: true });
    container.addEventListener("mouseleave", handlePointerLeave);
    container.addEventListener("click", handleClick);

    animationFrameId = requestAnimationFrame(render);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (mouse.timeout) clearTimeout(mouse.timeout);
      if (resizeTimer) clearTimeout(resizeTimer);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
      container.removeEventListener("mouseleave", handlePointerLeave);
      container.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="uc-foot-particle-wrap"
      aria-label="The Fale Interactive Logo"
    >
      <canvas
        ref={canvasRef}
        className="uc-foot-particle-canvas"
        aria-hidden="true"
      />
      {/* Underlying outline watermark for accessible fallback and instantaneous layout stability */}
      <span
        className="uc-foot-watermark-fallback"
        aria-hidden="true"
        style={{
          opacity: isReady ? 0 : 0.35,
          pointerEvents: "none",
          transition: "opacity 0.4s ease",
        }}
      >
        the fale
      </span>
    </div>
  );
}
