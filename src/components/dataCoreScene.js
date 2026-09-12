import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export function createDataCore(host, onFailure) {
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    const canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;';
    host.appendChild(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
    camera.position.set(3.4, 2.8, 4.6);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x332c81, 2.5));
    const key = new THREE.DirectionalLight(0xffffff, 3.5);
    key.position.set(3, 6, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffc93c, 1.6);
    rim.position.set(-4, 2, -3);
    scene.add(rim);
    const model = new THREE.Group();
    scene.add(model);
    const geometries = new Set();
    const materials = new Set();
    const geometry = (value) => { geometries.add(value); return value; };
    const material = (value) => { materials.add(value); return value; };
    const plate = geometry(new RoundedBoxGeometry(2.35, 0.42, 1.7, 4, 0.12));
    const tile = geometry(new RoundedBoxGeometry(0.26, 0.1, 0.26, 2, 0.035));
    const lightMaterial = material(new THREE.MeshStandardMaterial({ color: 0xfff7ec, roughness: 0.4, metalness: 0.12 }));
    const layers = [0xffc93c, 0x332c81, 0xff1e8e].map((color, index) => {
        const group = new THREE.Group();
        group.position.y = (index - 1) * 0.72;
        const surface = material(new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.16 }));
        group.add(new THREE.Mesh(plate, surface));
        for (let i = 0; i < 6; i += 1) {
            const chip = new THREE.Mesh(tile, lightMaterial);
            chip.position.set((i % 3 - 1) * 0.48, 0.265, (Math.floor(i / 3) - 0.5) * 0.55);
            group.add(chip);
        }
        model.add(group);
        return group;
    });
    const beamGeometry = geometry(new THREE.CylinderGeometry(0.014, 0.014, 2.4, 8));
    const beamMaterial = material(new THREE.MeshBasicMaterial({ color: 0x332c81, transparent: true, opacity: 0.3 }));
    const beams = [-0.85, 0.85].map((x) => {
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.position.set(x, 0, -0.55);
        model.add(beam);
        return beam;
    });
    const orbGeometry = geometry(new THREE.SphereGeometry(0.075, 12, 12));
    const orbMaterial = material(new THREE.MeshStandardMaterial({ color: 0xfff7ec, emissive: 0xffc93c, emissiveIntensity: 1.1 }));
    const packets = Array.from({ length: 5 }, () => {
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        model.add(orb);
        return orb;
    });
    const ring = new THREE.Mesh(geometry(new THREE.TorusGeometry(1.65, 0.016, 8, 80)), beamMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -1.2;
    model.add(ring);
    let disposed = false;
    let visible = true;
    let paused = false;
    let expanded = false;
    let frame = 0;
    let last = performance.now();
    let elapsed = 0;
    let frames = 0;
    let yaw = 0;
    let pitch = 0;
    let pointer = null;

    const draw = (time = performance.now()) => {
        if (disposed) return;
        // rAF hands back the frame's start time, which can predate the
        // performance.now() that schedule() stored. Without the lower clamp a
        // negative dt runs the drift and packet phase backwards.
        const dt = Math.max(0, Math.min((time - last) / 1000, 0.05));
        last = time;
        if (!paused && !pointer) { elapsed += dt; yaw += dt * 0.12; }
        const blend = paused ? 1 : 1 - Math.exp(-dt * 9);
        model.rotation.y += (yaw - model.rotation.y) * blend;
        model.rotation.x += (pitch - model.rotation.x) * blend;
        layers.forEach((layer, i) => {
            layer.position.y += ((i - 1) * (expanded ? 1.12 : 0.72) - layer.position.y) * blend;
        });
        beams.forEach((beam) => { beam.scale.y = expanded ? 1.25 : 1; });
        packets.forEach((packet, i) => {
            const phase = (elapsed * 0.16 + i / packets.length) % 1;
            packet.position.set(i % 2 ? 0.85 : -0.85, (phase - 0.5) * (expanded ? 2.7 : 1.9), -0.55);
        });
        renderer.render(scene, camera);
        host.dataset.modelYaw = model.rotation.y.toFixed(3);
        host.dataset.modelExpanded = String(expanded);
        host.dataset.modelGap = (layers[2].position.y - layers[0].position.y).toFixed(3);
        host.dataset.renderCount = String(++frames);
    };
    const tick = (time) => {
        frame = 0;
        if (disposed || !visible || document.hidden || paused) return;
        draw(time);
        frame = requestAnimationFrame(tick);
    };
    const schedule = () => {
        cancelAnimationFrame(frame);
        frame = 0;
        last = performance.now();
        if (!disposed && visible && !document.hidden) {
            draw();
            if (!paused) frame = requestAnimationFrame(tick);
        }
    };
    const resize = () => {
        const { width, height } = host.getBoundingClientRect();
        if (!width || !height || disposed) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        schedule();
    };
    const down = (event) => {
        if (!event.isPrimary || event.button !== 0) return;
        pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw, pitch };
        canvas.setPointerCapture(event.pointerId);
    };
    const move = (event) => {
        if (!pointer || pointer.id !== event.pointerId) return;
        const dx = event.clientX - pointer.x;
        const dy = event.clientY - pointer.y;
        if (event.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx)) return;
        yaw = pointer.yaw + dx * 0.008;
        pitch = Math.max(-0.3, Math.min(0.3, pointer.pitch + dy * 0.004));
        if (paused) draw();
    };
    const up = () => { pointer = null; };
    const lost = (event) => {
        event.preventDefault();
        if (!disposed) onFailure();
    };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('lostpointercapture', up);
    canvas.addEventListener('webglcontextlost', lost);
    document.addEventListener('visibilitychange', schedule);
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    return {
        rotate: () => { yaw += Math.PI / 4; schedule(); },
        setExpanded: (value) => { expanded = value; schedule(); },
        setPaused: (value) => { paused = value; schedule(); },
        setVisible: (value) => { visible = value; schedule(); },
        reset: () => { yaw = 0; pitch = 0; expanded = false; schedule(); },
        destroy: () => {
            if (disposed) return;
            disposed = true;
            cancelAnimationFrame(frame);
            observer.disconnect();
            document.removeEventListener('visibilitychange', schedule);
            canvas.removeEventListener('pointerdown', down);
            canvas.removeEventListener('pointermove', move);
            canvas.removeEventListener('pointerup', up);
            canvas.removeEventListener('pointercancel', up);
            canvas.removeEventListener('lostpointercapture', up);
            canvas.removeEventListener('webglcontextlost', lost);
            geometries.forEach((item) => item.dispose());
            materials.forEach((item) => item.dispose());
            renderer.dispose();
            renderer.forceContextLoss();
            canvas.remove();
        },
    };
}
