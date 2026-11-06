"use client";

import { useEffect, useRef } from "react";
import { createHeroCurtain } from "./hero-curtain";
import { heroItems, type HeroMediaItem } from "./hero-content";
import { cn } from "@/lib/utils";

function ProjectMedia({
  item,
  first = false,
}: {
  item: HeroMediaItem;
  first?: boolean;
}) {
  return (
    <figure
      className={cn(
        "flex w-full shrink-0 flex-col items-center gap-4 md:w-auto",
        item.caption && "pb-4 md:pb-0",
      )}
    >
      <div
        className={cn(
          "relative box-border w-full shrink-0 overflow-hidden rounded-[24px] bg-muted p-(--card-padding) [--card-padding:clamp(16px,4vw,48px)] md:h-(--card-height) md:w-[calc((var(--card-height)_-_2_*_var(--card-padding))_*_4_/_3_+_2_*_var(--card-padding))]",
          item.compact
            ? "md:[--card-height:calc(var(--band-height)*0.665)]"
            : "md:[--card-height:var(--band-height)]",
        )}
        data-hero-media
      >
        <video
          className="pointer-events-none block aspect-[4/3] h-auto w-full rounded-[16px] object-cover"
          src={item.src}
          poster={item.poster}
          aria-label={item.alt}
          muted
          loop
          playsInline
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
          tabIndex={-1}
          preload={first ? "auto" : "none"}
        />
      </div>
      {item.caption && (
        <figcaption
          className="w-full max-w-72 text-center leading-[1.3] text-muted-foreground text-balance"
          data-hero-text
        >
          {item.caption}
        </figcaption>
      )}
    </figure>
  );
}

export default function Hero() {
  const outerRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const track = trackRef.current;
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;
    if (!outer || !track || !viewport || !canvas) return;

    const desktop = window.matchMedia("(min-width: 768px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cleanup = () => {};

    const setup = () => {
      cleanup();
      const animated = desktop.matches && !reducedMotion.matches;
      outer.dataset.animated = String(animated);
      const videos = Array.from(track.querySelectorAll("video"));
      const visibleVideos = new Set<HTMLVideoElement>();
      const syncVideos = () => {
        videos.forEach((video) => {
          if (
            visibleVideos.has(video) &&
            !reducedMotion.matches &&
            !document.hidden
          ) {
            void video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      };
      const videoObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(({ target, isIntersecting }) => {
            const video = target as HTMLVideoElement;
            if (isIntersecting) visibleVideos.add(video);
            else visibleVideos.delete(video);
          });
          syncVideos();
        },
        { threshold: 0.01 },
      );
      videos.forEach((video) => videoObserver.observe(video));
      document.addEventListener("visibilitychange", syncVideos);

      if (!animated) {
        cleanup = () => {
          videoObserver.disconnect();
          document.removeEventListener("visibilitychange", syncVideos);
          videos.forEach((video) => video.pause());
        };
        return;
      }

      const curtain = createHeroCurtain({ track, canvas });
      let distance = 0;
      let frame = 0;
      let pointer: {
        id: number;
        start: number;
        last: number;
        dragging: boolean;
      } | null = null;

      const progress = () =>
        Math.max(0, Math.min(-outer.getBoundingClientRect().top, distance));
      const syncScroll = () => {
        track.style.transform = `translate3d(${-progress()}px, 0, 0)`;
      };
      const resize = () => {
        distance = Math.max(0, track.scrollWidth - window.innerWidth);
        outer.style.height = `${distance + window.innerHeight}px`;
        curtain?.resize();
        syncScroll();
      };
      const render = () => {
        const rect = outer.getBoundingClientRect();
        const visible = rect.top <= 0 && rect.bottom >= window.innerHeight - 1;
        canvas.style.visibility = visible ? "visible" : "hidden";
        if (visible) curtain?.render();
        frame = requestAnimationFrame(render);
      };
      const visibility = () => {
        cancelAnimationFrame(frame);
        if (!document.hidden && curtain) frame = requestAnimationFrame(render);
      };
      const wheel = (event: WheelEvent) => {
        if (event.ctrlKey) return;
        const rect = outer.getBoundingClientRect();
        if (rect.top > 0 || rect.bottom < window.innerHeight - 1) return;
        const multiplier =
          event.deltaMode === 1
            ? 16
            : event.deltaMode === 2
              ? window.innerHeight
              : 1;
        const delta =
          (Math.abs(event.deltaX) > Math.abs(event.deltaY)
            ? event.deltaX
            : event.deltaY) * multiplier;
        const current = progress();
        if ((delta < 0 && current <= 0) || (delta > 0 && current >= distance))
          return;
        event.preventDefault();
        window.scrollBy({ top: delta, behavior: "instant" });
      };
      const release = () => {
        if (pointer && track.hasPointerCapture(pointer.id))
          track.releasePointerCapture(pointer.id);
        pointer = null;
        delete track.dataset.dragging;
      };
      const pointerDown = (event: PointerEvent) => {
        if (event.button !== 0) return;
        pointer = {
          id: event.pointerId,
          start: event.clientX,
          last: event.clientX,
          dragging: false,
        };
        track.setPointerCapture(event.pointerId);
      };
      const pointerMove = (event: PointerEvent) => {
        if (!pointer || pointer.id !== event.pointerId) return;
        if (!pointer.dragging && Math.abs(event.clientX - pointer.start) < 4) return;
        pointer.dragging = true;
        track.dataset.dragging = "true";
        event.preventDefault();
        const next = Math.max(
          0,
          Math.min(distance, progress() + pointer.last - event.clientX),
        );
        window.scrollBy({ top: next - progress(), behavior: "instant" });
        pointer.last = event.clientX;
      };
      const keyDown = (event: KeyboardEvent) => {
        const steps: Record<string, number> = {
          ArrowRight: 120,
          ArrowLeft: -120,
          PageDown: window.innerWidth * 0.8,
          PageUp: -window.innerWidth * 0.8,
          Home: -distance,
          End: distance,
        };
        if (!(event.key in steps)) return;
        event.preventDefault();
        const next = Math.max(
          0,
          Math.min(distance, progress() + steps[event.key]),
        );
        window.scrollBy({ top: next - progress(), behavior: "instant" });
      };

      resize();
      if (curtain) frame = requestAnimationFrame(render);
      const observer = new ResizeObserver(resize);
      observer.observe(track);
      const themeObserver = new MutationObserver(() => curtain?.resize());
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      window.addEventListener("resize", resize);
      window.addEventListener("scroll", syncScroll, { passive: true });
      document.addEventListener("visibilitychange", visibility);
      outer.addEventListener("wheel", wheel, { passive: false });
      track.addEventListener("pointerdown", pointerDown);
      track.addEventListener("pointermove", pointerMove);
      track.addEventListener("pointerup", release);
      track.addEventListener("pointercancel", release);
      track.addEventListener("lostpointercapture", release);
      viewport.addEventListener("keydown", keyDown);

      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        themeObserver.disconnect();
        videoObserver.disconnect();
        videos.forEach((video) => video.pause());
        window.removeEventListener("resize", resize);
        window.removeEventListener("scroll", syncScroll);
        document.removeEventListener("visibilitychange", visibility);
        document.removeEventListener("visibilitychange", syncVideos);
        outer.removeEventListener("wheel", wheel);
        track.removeEventListener("pointerdown", pointerDown);
        track.removeEventListener("pointermove", pointerMove);
        track.removeEventListener("pointerup", release);
        track.removeEventListener("pointercancel", release);
        track.removeEventListener("lostpointercapture", release);
        viewport.removeEventListener("keydown", keyDown);
        release();
        curtain?.dispose();
        canvas.style.visibility = "hidden";
        outer.style.height = "";
        track.style.transform = "";
      };
    };

    setup();
    desktop.addEventListener("change", setup);
    reducedMotion.addEventListener("change", setup);
    return () => {
      cleanup();
      desktop.removeEventListener("change", setup);
      reducedMotion.removeEventListener("change", setup);
    };
  }, []);

  return (
    <section
      ref={outerRef}
      className="group/hero relative isolate w-full bg-background font-camera text-[13px] leading-[1.4] font-normal text-foreground [--band-height:min(70svh,calc(100svh_-_200px))] md:leading-[1.3]"
      aria-labelledby="patch-title"
    >
      <div className="p-2 md:sticky md:top-0 md:flex md:h-svh md:flex-col md:justify-end md:overflow-hidden md:p-0 md:pb-2">
        <h1 id="patch-title" className="sr-only">Denzel Obeng — Product Designer &amp; Developer</h1>
        <div
          ref={viewportRef}
          className="focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring md:overflow-x-auto md:[scrollbar-width:none] md:group-data-[animated=true]/hero:overflow-visible md:[&::-webkit-scrollbar]:hidden"
          tabIndex={0}
          role="region"
          aria-label="Selected work video gallery"
          aria-describedby="patch-gallery-help"
        >
          <p id="patch-gallery-help" className="sr-only">
            Scroll or drag to explore. Use the left and right arrow keys to
            navigate the gallery.
          </p>
          <div
            ref={trackRef}
            data-hero-track
            className="flex flex-col gap-2 motion-reduce:scroll-auto md:h-(--band-height) md:flex-row md:items-start md:pl-2 md:group-data-[animated=true]/hero:cursor-grab md:group-data-[animated=true]/hero:touch-pan-y md:group-data-[animated=true]/hero:select-none md:group-data-[animated=true]/hero:will-change-transform md:group-data-[animated=true]/hero:data-[dragging=true]:cursor-grabbing"
          >
            {heroItems.map((item, index) => (
              <ProjectMedia key={item.src} item={item} first={index === 0} />
            ))}
            <div
              className="hidden md:-ml-2 md:block md:h-(--band-height) md:flex-[0_0_8px]"
              aria-hidden="true"
            />
          </div>
        </div>
        <canvas
          ref={canvasRef}
          className="pointer-events-none fixed inset-0 z-30 hidden h-svh w-screen motion-reduce:hidden! md:group-data-[animated=true]/hero:block"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
