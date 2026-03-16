"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";

type FrameImages = HTMLImageElement[];

export default function Home() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const heroImgRef = useRef<HTMLDivElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const imagesRef = useRef<FrameImages>([]);
  const videoFrameRef = useRef({ frame: 0 });
  const lenisRef = useRef<Lenis | null>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
  }, []);

  useEffect(() => {
    const lenis = new Lenis();
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove((time) => {
        lenis.raf(time * 1000);
      });
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useGSAP(
    () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext("2d");
      if (!context) return;
      contextRef.current = context;

      const setCanvasSize = () => {
        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * pixelRatio;
        canvas.height = window.innerHeight * pixelRatio;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        context.imageSmoothingEnabled = true;
context.imageSmoothingQuality = 'high';
      };

      setCanvasSize();

      const frameCount = 191;

// שנה מ-jpg ל-png
const currentFrame = (index: number) =>
  `/frames/ezgif-frame-${(index + 1).toString().padStart(3, "0")}.png`;

      let images: FrameImages = [];
      let imagesToLoad = frameCount;

      const render = () => {
        if (!contextRef.current || !canvas) return;

        const canvasWidth = window.innerWidth;
        const canvasHeight = window.innerHeight;

        contextRef.current.clearRect(0, 0, canvasWidth, canvasHeight);

        const img = imagesRef.current[videoFrameRef.current.frame];
        if (img && img.complete && img.naturalWidth > 0) {
          const imageAspect = img.naturalWidth / img.naturalHeight;
          const canvasAspect = canvasWidth / canvasHeight;

          let drawWidth: number;
          let drawHeight: number;
          let drawX: number;
          let drawY: number;

          if (imageAspect > canvasAspect) {
            drawHeight = canvasHeight;
            drawWidth = drawHeight * imageAspect;
            drawX = (canvasWidth - drawWidth) / 2;
            drawY = 0;
          } else {
            drawWidth = canvasWidth;
            drawHeight = drawWidth / imageAspect;
            drawX = 0;
            drawY = (canvasHeight - drawHeight) / 2;
          }

          contextRef.current.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        }
      };

      const setupScrollTrigger = () => {
        if (!containerRef.current) return;

        const trigger = ScrollTrigger.create({
          trigger: ".hero",
          start: "top top",
          end: `+=${window.innerHeight * 7}px`,
          pin: true,
          pinSpacing: true,
          scrub: 1,
          onUpdate: (self) => {
            const progress = self.progress;
            const animationProgress = Math.min(progress / 0.9, 1);
            const targetFrame = Math.round(animationProgress * (frameCount - 1));
            videoFrameRef.current.frame = targetFrame;
            render();

            if (navRef.current) {
              const opacity = progress <= 0.1 ? 1 - progress / 0.1 : 0;
              gsap.set(navRef.current, { opacity });
            }

            if (headerRef.current) {
              if (progress <= 0.25) {
                const zProgress = progress / 0.25;
                const translateZ = zProgress * -500;
                let opacity = 1;
                if (progress >= 0.2) {
                  const fadeProgress = Math.min((progress - 0.2) / 0.05, 1);
                  opacity = 1 - fadeProgress;
                }
                gsap.set(headerRef.current, {
                  transform: `translate(-50%, -50%) translateZ(${translateZ}px)`,
                  opacity,
                });
              } else {
                gsap.set(headerRef.current, { opacity: 0 });
              }
            }

            if (heroImgRef.current) {
              if (progress < 0.6) {
                gsap.set(heroImgRef.current, {
                  transform: "translateZ(1000px)",
                  opacity: 0,
                });
              } else if (progress <= 0.9) {
                const imgProgress = (progress - 0.6) / 0.3;
                const translateZ = 1000 - imgProgress * 1000;
                const opacity = progress <= 0.8 ? (progress - 0.6) / 0.2 : 1;
                gsap.set(heroImgRef.current, {
                  transform: `translateZ(${translateZ}px)`,
                  opacity,
                });
              } else {
                gsap.set(heroImgRef.current, {
                  transform: "translateZ(0px)",
                  opacity: 1,
                });
              }
            }
          },
        });

        scrollTriggerRef.current = trigger;
      };

      const onImageLoad = () => {
        imagesToLoad -= 1;
        if (!imagesToLoad) {
          render();
          setupScrollTrigger();
        }
      };

      for (let i = 0; i < frameCount; i++) {
        const img = new Image();
        img.onload = onImageLoad;
        img.onerror = onImageLoad;
        img.src = currentFrame(i);
        images.push(img);
      }

      imagesRef.current = images;

      const handleResize = () => {
        setCanvasSize();
        render();
        ScrollTrigger.refresh();
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (scrollTriggerRef.current) {
          scrollTriggerRef.current.kill();
          scrollTriggerRef.current = null;
        }
      };
    },
    { scope: containerRef }
  );

return (
  <div ref={containerRef} className="bg-black text-white overflow-x-hidden">
    <nav ref={navRef} className="fixed top-0 w-full z-50 flex justify-between items-center px-1 md:px-1 bg-black/50 backdrop-blur-md">
      <div className="logo text-xl md:text-2xl font-bold tracking-tighter">
        <a href="#" className="flex items-center gap-2">
          <span className="text-red-600">V8</span> CLASSIC
        </a>
      </div>
      
      <div className="hidden md:flex gap-3 font-medium uppercase text-sm tracking-widest">
        <a href="#" className="hover:text-red-500 transition">התהליך</a>
        <a href="#" className="hover:text-red-500 transition">פרויקטים</a>
        <a href="#" className="hover:text-red-500 transition">גלריה</a>
      </div>

      <div className="flex gap-2 md:gap-4">
        <button className="bg-red-700 hover:bg-red-600 text-white px-3 py-1 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-bold uppercase transition">
          קבע ייעוץ
        </button>
      </div>
    </nav>

    <section className="hero relative h-screen w-full">
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full object-cover z-0"
      ></canvas>

      <div className="hero-content relative z-10 h-full flex items-center justify-center px-6">
        <div className="header absolute left-1/2 top-1/2 w-full max-w-4xl text-center" ref={headerRef}>
          <h1 className="text-3xl md:text-6xl lg:text-8xl text-center font-black uppercase italic leading-none drop-shadow-2xl">
            מחזירים לחיים את <br />
            <span className="text-red-600">הברזל האמריקאי</span>
          </h1>
          <p className="mt-4 text-sm md:text-xl font-light tracking-wide opacity-80">
            שיחזור ברמה עולמית למכוניות שרירים ואספנות
          </p>
          
          <div className="mt-8 flex flex-wrap justify-center gap-4 md:gap-8 opacity-50 grayscale">
            <span className="text-xs md:text-base font-bold">MUSTANG</span>
            <span className="text-xs md:text-base font-bold">CHEVROLET</span>
            <span className="text-xs md:text-base font-bold">DODGE</span>
            <span className="text-xs md:text-base font-bold">CADILLAC</span>
          </div>
        </div>
      </div>

      {/* תמונת דשבורד שמופיעה בסוף הגלילה */}
      <div className="hero-img-container absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="hero-img w-4/5 md:w-3/5" ref={heroImgRef}>
          <img 
            src="/dashboard.png" 
            alt="Restored Dashboard" 
            className="w-full drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)]"
          />
        </div>
      </div>
    </section>

    <section className="outro h-screen flex items-center justify-center bg-zinc-900 px-6 text-center">
      <h2 className="text-2xl md:text-5xl font-bold italic uppercase">
        הצטרפו למועדון האספנים <br />
        <span className="text-red-600 text-lg md:text-3xl">שבוחר באיכות ללא פשרות</span>
      </h2>
    </section>
  </div>
);
}


