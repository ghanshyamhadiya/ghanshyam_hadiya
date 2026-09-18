import * as THREE from 'three';
import { createQuality } from './quality';

// The one WebGL context on the page.
//
// Everything 3D shares this renderer. Multiple contexts is the classic way a
// site like this dies: browsers cap them (~8-16), and the oldest gets killed
// without warning, so a second scene later in the page silently destroys the
// hero. One context, one RAF loop, one resize observer.
//
// The canvas sits ABOVE the DOM with pointer-events: none. That is what lets
// opaque geometry occlude real HTML text — the hero name stays a true <h1>
// while the figure appears in front of it — and it keeps text selectable and
// links clickable. The cost is that geometry can cover body copy anywhere on
// the page, which scripts/audit-occlusion.mjs exists to prevent.

export function createStage(host, { onFailure, onQualityChange } = {}) {
    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch {
        onFailure?.();
        return null;
    }
    const quality = createQuality({
        onChange: (level) => {
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, level.dpr));
            renderer.shadowMap.enabled = level.shadows;
            resize();
            onQualityChange?.(level);
        },
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.level.dpr));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = quality.level.shadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    canvas.dataset.worldCanvas = '';
    canvas.style.cssText = 'display:block;width:100%;height:100%;';
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
    camera.position.set(0, 0, 9);

    const frameCallbacks = new Set();
    const disposables = new Set();
    let disposed = false;
    let paused = false;
    let visible = true;
    let frame = 0;
    let last = performance.now();
    let elapsed = 0;
    let frames = 0;
    let width = 0;
    let height = 0;

    function resize() {
        if (disposed) return;
        const rect = host.getBoundingClientRect();
        width = Math.max(1, Math.round(rect.width));
        height = Math.max(1, Math.round(rect.height));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        draw();
    }

    function draw(time = performance.now()) {
        if (disposed) return;
        // rAF hands back the frame's START time, which can predate the
        // performance.now() stored by a resize or a resume. Without the lower
        // clamp a negative dt runs every animation backwards — this cost real
        // debugging time on the data core it replaces.
        const dt = Math.max(0, Math.min((time - last) / 1000, 0.05));
        const started = performance.now();
        last = time;
        elapsed += dt;
        for (const callback of frameCallbacks) callback(dt, elapsed);
        renderer.render(scene, camera);
        frames += 1;
        canvas.dataset.renderCount = String(frames);
        canvas.dataset.qualityLevel = quality.level.name;
        if (quality.level.animate) quality.sample(performance.now() - started);
        canvas.dataset.frameP95 = quality.p95.toFixed(1);
    }

    function tick(time) {
        frame = 0;
        if (disposed || paused || !visible || document.hidden || !quality.level.animate) return;
        draw(time);
        frame = requestAnimationFrame(tick);
    }

    function schedule() {
        cancelAnimationFrame(frame);
        frame = 0;
        last = performance.now();
        if (disposed || !visible || document.hidden) return;
        draw();
        if (!paused && quality.level.animate) frame = requestAnimationFrame(tick);
    }

    const onVisibility = () => schedule();
    const onContextLost = (event) => {
        event.preventDefault();
        if (!disposed) onFailure?.();
    };
    canvas.addEventListener('webglcontextlost', onContextLost);
    document.addEventListener('visibilitychange', onVisibility);
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    schedule();

    return {
        scene,
        camera,
        renderer,
        quality,
        get size() { return { width, height }; },
        onFrame(callback) {
            frameCallbacks.add(callback);
            return () => frameCallbacks.delete(callback);
        },
        // Anything created with geometry/material lifetimes must be handed
        // over so destroy() can actually free the GPU memory.
        track(...items) {
            for (const item of items) disposables.add(item);
        },
        setPaused(value) {
            paused = value;
            schedule();
        },
        setVisible(value) {
            visible = value;
            schedule();
        },
        // Re-render once without resuming the loop: used by the static rung and
        // by pointer drags while paused.
        invalidate: () => { if (!disposed) draw(); },
        // How much of each CSS-pixel rect this canvas actually paints over.
        //
        // The whole "canvas above the DOM" approach trades an occlusion risk
        // for real heading semantics, so that risk has to be measurable.
        // Reads the drawing buffer directly in the same tick as a render,
        // because with preserveDrawingBuffer off it is gone by the next one.
        // Returns a 0..1 covered fraction per rect.
        coverage(rects) {
            if (disposed) return rects.map(() => 0);
            renderer.render(scene, camera);
            const gl = renderer.getContext();
            const ratio = renderer.getPixelRatio();
            return rects.map((rect) => {
                // readPixels is bottom-left origin and in device pixels.
                const x = Math.floor(rect.left * ratio);
                const y = Math.floor((height - rect.bottom) * ratio);
                const w = Math.ceil(rect.width * ratio);
                const h = Math.ceil(rect.height * ratio);
                const clampedX = Math.max(0, Math.min(x, canvas.width - 1));
                const clampedY = Math.max(0, Math.min(y, canvas.height - 1));
                const clampedW = Math.max(1, Math.min(w, canvas.width - clampedX));
                const clampedH = Math.max(1, Math.min(h, canvas.height - clampedY));
                const pixels = new Uint8Array(clampedW * clampedH * 4);
                gl.readPixels(clampedX, clampedY, clampedW, clampedH, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
                let painted = 0;
                for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 24) painted += 1;
                return painted / (clampedW * clampedH);
            });
        },
        destroy() {
            if (disposed) return;
            disposed = true;
            cancelAnimationFrame(frame);
            observer.disconnect();
            document.removeEventListener('visibilitychange', onVisibility);
            canvas.removeEventListener('webglcontextlost', onContextLost);
            frameCallbacks.clear();
            for (const item of disposables) item.dispose?.();
            disposables.clear();
            scene.clear();
            renderer.dispose();
            renderer.forceContextLoss();
            canvas.remove();
        },
    };
}
