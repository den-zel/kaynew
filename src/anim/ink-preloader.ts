import {
    float,
    fwidth,
    max,
    mix,
    mx_fractal_noise_float,
    screenUV,
    select,
    smoothstep,
    step,
    uniform,
    vec2,
    vec3,
} from "three/tsl";
import {
    Color,
    MeshBasicNodeMaterial,
    QuadMesh,
    SRGBColorSpace,
    Vector2,
    WebGPURenderer,
} from "three/webgpu";

export interface InkReveal {
    draw: (progress: number) => boolean;
    dispose: () => void;
}

export async function createInkReveal(
    canvas: HTMLCanvasElement,
    background: HTMLElement,
): Promise<InkReveal | null> {
    if (!canvas.getContext("webgl2", { alpha: true })) return null;

    // TSL uses the same fractal noise as Interlude, with a WebGL 2 backend.
    const renderer = new WebGPURenderer({ canvas, alpha: true, forceWebGL: true });
    const material = new MeshBasicNodeMaterial({ transparent: true, depthTest: false });
    const progress = uniform(1);
    const aspect = uniform(1);
    const origin = uniform(new Vector2());
    const color = uniform(new Color());
    const position = screenUV.mul(vec2(aspect, 1));
    const reach = max(origin, vec2(aspect, 1).sub(origin)).length();
    const distance = position.distance(origin).div(reach);
    const noise = mx_fractal_noise_float(vec3(position.mul(2.5), 5), 3, 2, 0.5);
    const field = distance.add(noise.mul(0.25)).clamp(-0.08, 1.15);
    const threshold = mix(1.2, -0.1, progress);
    const half = max(fwidth(field), float(0.02)).mul(0.5);
    const outsideHole = smoothstep(threshold.sub(half), threshold.add(half), field);

    material.colorNode = color;
    material.opacityNode = select(
        progress.greaterThanEqual(0.999),
        float(1),
        outsideHole.clamp(0, 1).mul(step(0.001, progress)),
    );
    material.toneMapped = false;

    const quad = new QuadMesh(material);
    const swatch = document.createElement("canvas");
    swatch.width = swatch.height = 1;
    const context = swatch.getContext("2d", { willReadFrequently: true });
    let width = 0;
    let height = 0;
    let lastColor = "";
    let disposed = false;
    let deviceLost = false;

    const dispose = () => {
        if (disposed) return;
        disposed = true;
        material.dispose();
        renderer.dispose();
    };

    try {
        await renderer.init();
        renderer.setClearColor(0, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.onDeviceLost = () => { deviceLost = true; };
        await renderer.compileAsync(quad, quad.camera);
    } catch {
        dispose();
        return null;
    }

    return {
        draw(value) {
            if (disposed || deviceLost) return false;

            const nextWidth = canvas.clientWidth;
            const nextHeight = canvas.clientHeight;
            if (!nextWidth || !nextHeight) return false;

            if (width !== nextWidth || height !== nextHeight) {
                width = nextWidth;
                height = nextHeight;
                renderer.setSize(width, height, false);
                aspect.value = width / height;
                origin.value.set(aspect.value / 2, 0.5);
            }

            // Canvas resolves Tailwind's OKLCH theme colors to sRGB for Three.
            const cssColor = getComputedStyle(background).backgroundColor;
            if (context && cssColor !== lastColor) {
                context.clearRect(0, 0, 1, 1);
                context.fillStyle = cssColor;
                context.fillRect(0, 0, 1, 1);
                const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
                color.value.setRGB(r / 255, g / 255, b / 255, SRGBColorSpace);
                lastColor = cssColor;
            }

            progress.value = value;
            try {
                quad.render(renderer);
                return true;
            } catch {
                return false;
            }
        },
        dispose,
    };
}

