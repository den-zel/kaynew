"use client";

import { cn } from "@/lib/utils";
import { animate, motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useRef, useState, type ComponentProps, type MouseEvent as ReactMouseEvent } from "react";

const CURSOR_REST = 15;
const CURSOR_STICK = 44;
const MAGNET_SPRING = { stiffness: 350, damping: 5, mass: 0.5 };
const CURSOR_SPRING = { damping: 20, stiffness: 300, mass: 0.5 };

export interface StickyCursorProps {
  className?: string;
  selector?: string;
}

interface HamburgerMenuProps extends ComponentProps<"button"> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  openLabel?: string;
  closeLabel?: string;
}

export function HamburgerMenu({
  open = false,
  onOpenChange,
  openLabel = "Open navigation menu",
  closeLabel = "Close navigation menu",
  className,
  onClick,
  disabled,
  ref,
  ...props
}: HamburgerMenuProps) {
  const finePointer = useFinePointer();
  const reducedMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, MAGNET_SPRING);
  const springY = useSpring(y, MAGNET_SPRING);
  const canMagnet = finePointer && !reducedMotion;
  const move = (event: ReactMouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - bounds.left - bounds.width / 2) * 0.1);
    y.set((event.clientY - bounds.top - bounds.height / 2) * 0.1);
  };

  return (
    <motion.div
      className="relative z-60 inline-flex"
      style={canMagnet ? { x: springX, y: springY } : undefined}
      onMouseMove={canMagnet ? move : undefined}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >
      <button
        {...props}
        ref={ref}
        type="button"
        disabled={disabled}
        data-slot="hamburger-menu"
        aria-expanded={open}
        aria-label={open ? closeLabel : openLabel}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented && !disabled) onOpenChange?.(!open);
        }}
        className={cn(
          "relative grid size-11 scale-125 shrink-0 cursor-pointer place-items-center overflow-hidden border-0 bg-transparent p-0 leading-none text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50",
          canMagnet && "data-[cursor-stuck=true]:text-background",
          className,
        )}
      >
        <motion.svg
          data-slot="hamburger-menu-icon"
          className="pointer-events-none relative z-1 block overflow-visible"
          width={40}
          height={40}
          viewBox="-10 -10 120 120"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
          initial={false}
          animate={{ x: open ? 1.28 : 0, y: open ? -1.28 : 0, rotate: open ? 45 : 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.7 }}
        >
          <motion.path
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m 20 40 h 60 a 1 1 0 0 1 0 20 h -60 a 1 1 0 0 1 0 -40 h 30 v 70"
            initial={false}
            animate={{ strokeDasharray: open ? "60 105 60 300" : "60 31 60 300", strokeDashoffset: open ? -90 : 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.7 }}
          />
        </motion.svg>
        {canMagnet && (
          <span className="absolute inset-0 z-2 origin-center hover:scale-300" data-sticky-cursor="" data-cursor-size={CURSOR_STICK} aria-hidden="true" />
        )}
      </button>
    </motion.div>
  );
}

function mapRange(
    value: number,
    input: readonly [number, number],
    output: readonly [number, number]
) {
    const [inputStart, inputEnd] = input;
    const [outputStart, outputEnd] = output;
    const span = inputEnd - inputStart;
    const progress = span === 0 ? 0 : (value - inputStart) / span;
    const clamped = Math.min(1, Math.max(0, progress));
    return outputStart + (outputEnd - outputStart) * clamped;
}

function useFinePointer() {
    const [finePointer, setFinePointer] = useState(false);

    useEffect(() => {
        const media = window.matchMedia("(hover: hover) and (pointer: fine)");
        const update = () => setFinePointer(media.matches);
        update();
        media.addEventListener("change", update);
        return () => media.removeEventListener("change", update);
    }, []);

    return finePointer;
}

function readCursorSize(target: HTMLElement) {
    const next = Number(target.dataset.cursorSize);
    return Number.isFinite(next) && next > 0 ? next : 60;
}

export function StickyCursor({
    className,
    selector = "[data-sticky-cursor]",
}: StickyCursorProps) {
    const hoveredRef = useRef<HTMLElement | null>(null);
    const sizeRef = useRef(CURSOR_REST);
    const [cursorSize, setCursorSize] = useState(CURSOR_REST);
    const [ready, setReady] = useState(false);
    const [visible, setVisible] = useState(false);
    const seenRef = useRef(false);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const scaleX = useMotionValue(1);
    const scaleY = useMotionValue(1);
    const rotate = useMotionValue(0);
    const smoothX = useSpring(mouseX, CURSOR_SPRING);
    const smoothY = useSpring(mouseY, CURSOR_SPRING);
    const motionRef = useRef({
        mouseX,
        mouseY,
        scaleX,
        scaleY,
        rotate,
    });

    useEffect(() => {
        motionRef.current = { mouseX, mouseY, scaleX, scaleY, rotate };
    }, [mouseX, mouseY, rotate, scaleX, scaleY]);

    useEffect(() => {
        const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

        const enable = () => {
            setReady(fine.matches && !reduced.matches);
        };

        enable();
        fine.addEventListener("change", enable);
        reduced.addEventListener("change", enable);
        return () => {
            fine.removeEventListener("change", enable);
            reduced.removeEventListener("change", enable);
        };
    }, []);

    useEffect(() => {
        if (!ready) {
            return;
        }

        const stickTo = (target: HTMLElement, clientX: number, clientY: number) => {
            const { mouseX: x, mouseY: y, scaleX: sx, scaleY: sy, rotate: spin } =
                motionRef.current;
            const { left, top, height, width } = target.getBoundingClientRect();
            const centerX = left + width / 2;
            const centerY = top + height / 2;
            const distanceX = clientX - centerX;
            const distanceY = clientY - centerY;
            const reach = Math.max(Math.abs(distanceX), Math.abs(distanceY));
            const size = sizeRef.current;

            spin.set(Math.atan2(distanceY, distanceX) * (180 / Math.PI));
            sx.set(mapRange(reach, [0, height / 2], [1, 1.3]));
            sy.set(mapRange(reach, [0, width / 2], [1, 0.8]));
            x.set(centerX - size / 2 + distanceX * 0.1);
            y.set(centerY - size / 2 + distanceY * 0.1);
        };

        const follow = (clientX: number, clientY: number) => {
            const { mouseX: x, mouseY: y } = motionRef.current;
            const size = sizeRef.current;
            x.set(clientX - size / 2);
            y.set(clientY - size / 2);
        };

        const releaseScales = () => {
            const { scaleX: sx, scaleY: sy, rotate: spin } = motionRef.current;
            animate(sx, 1, { duration: 0.1 });
            animate(sy, 1, { duration: 0.1 });
            spin.set(0);
        };

        const onMove = (event: MouseEvent) => {
            if (!seenRef.current) {
                seenRef.current = true;
                setVisible(true);
            }

            const target = hoveredRef.current;

            if (target) {
                stickTo(target, event.clientX, event.clientY);
                return;
            }

            follow(event.clientX, event.clientY);
        };

        const onOver = (event: MouseEvent) => {
            const raw = event.target;

            if (!(raw instanceof Element)) {
                return;
            }

            const button = raw.closest("[data-slot='hamburger-menu']");
            const next =
                raw.closest(selector) ??
                button?.querySelector(selector);

            if (!(next instanceof HTMLElement) || hoveredRef.current === next) {
                return;
            }

            hoveredRef.current = next;
            const owner = next.closest<HTMLElement>("[data-slot='hamburger-menu']");
            if (owner) owner.dataset.cursorStuck = "true";
            seenRef.current = true;
            setVisible(true);
            sizeRef.current = readCursorSize(next);
            setCursorSize(sizeRef.current);
            stickTo(next, event.clientX, event.clientY);
        };

        const onOut = (event: MouseEvent) => {
            const current = hoveredRef.current;

            if (!current) {
                return;
            }

            const raw = event.target;

            if (!(raw instanceof Node) || !current.contains(raw)) {
                return;
            }

            const related = event.relatedTarget;

            if (related instanceof Node && current.contains(related)) {
                return;
            }

            const owner = current.closest<HTMLElement>("[data-slot='hamburger-menu']");
            if (owner) delete owner.dataset.cursorStuck;
            hoveredRef.current = null;
            sizeRef.current = CURSOR_REST;
            setCursorSize(CURSOR_REST);
            releaseScales();
        };

        window.addEventListener("mousemove", onMove);
        document.addEventListener("mouseover", onOver);
        document.addEventListener("mouseout", onOut);

        return () => {
            const owner = hoveredRef.current?.closest<HTMLElement>("[data-slot='hamburger-menu']");
            if (owner) delete owner.dataset.cursorStuck;
            window.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseover", onOver);
            document.removeEventListener("mouseout", onOut);
        };
    }, [ready, selector]);

    if (!ready) {
        return null;
    }

    return (
        <motion.div
            aria-hidden
            transformTemplate={(transform) =>
                `rotate(${transform.rotate ?? "0deg"}) scaleX(${transform.scaleX ?? 1}) scaleY(${transform.scaleY ?? 1})`
            }
            animate={{ width: cursorSize, height: cursorSize }}
            transition={{ type: "spring", damping: 20, stiffness: 300, mass: 0.5 }}
            style={{
                left: smoothX,
                top: smoothY,
                scaleX,
                scaleY,
                rotate,
            }}
            className={cn(
                "pointer-events-none fixed z-50 rounded-full bg-foreground",
                visible ? "opacity-100" : "opacity-0",
                className
            )}
        />
    );
}
