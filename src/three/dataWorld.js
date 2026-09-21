import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { createStage } from './renderer';

const STATIONS = ['hero-data', 'process-data', 'skills-data', 'contact-data'];
const FIT = {
    'hero-data': { w: 5.8, h: 4.8 },
    'process-data': { w: 6.7, h: 2.8 },
    'skills-data': { w: 4.5, h: 5.3 },
    'contact-data': { w: 5.6, h: 5.6 },
};

export function createWorld(host, { onFailure, staticMode = false, assembled = true } = {}) {
    const stage = createStage(host, { onFailure });
    if (!stage) return null;
    stage.renderer.shadowMap.enabled = false;

    const hemisphere = new THREE.HemisphereLight(0xffffff, 0x332c81, 2.1);
    const key = new THREE.DirectionalLight(0xffffff, 2.8);
    key.position.set(4, 6, 5);
    const rim = new THREE.DirectionalLight(0xffc93c, 1.5);
    rim.position.set(-5, 1.5, -4);
    const fill = new THREE.DirectionalLight(0xff1e8e, 0.45);
    fill.position.set(-3, -2, 4);
    stage.scene.add(hemisphere, key, rim, fill);
    stage.track(hemisphere, key, rim, fill);

    const mat = (color) => {
        const m = new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.22 });
        stage.track(m);
        return m;
    };
    const palette = {
        amber: mat(0xffc93c),
        lavender: mat(0x8b7de8),
        pink: mat(0xff1e8e),
        cream: mat(0xfff7ec),
        dark: mat(0x332c81),
    };

    const plateGeo = new RoundedBoxGeometry(2.5, 0.22, 1.7, 3, 0.09);
    const stripGeo = new THREE.BoxGeometry(1.7, 0.05, 0.05);
    const beadGeo = new THREE.SphereGeometry(0.06, 10, 8);
    const orbitGeo = new THREE.TorusGeometry(2.25, 0.035, 8, 72);
    const nodeGeo = new THREE.SphereGeometry(0.13, 12, 10);
    const connectorGeo = new THREE.BoxGeometry(0.9, 0.045, 0.045);
    const coreGeo = new THREE.IcosahedronGeometry(0.65, 0);
    stage.track(plateGeo, stripGeo, beadGeo, orbitGeo, nodeGeo, connectorGeo, coreGeo);

    const plate = (material) => {
        const g = new THREE.Group();
        const slab = new THREE.Mesh(plateGeo, material);
        const strip = new THREE.Mesh(stripGeo, palette.dark);
        strip.position.set(0, 0.06, 0.86);
        const bead = new THREE.Mesh(beadGeo, palette.cream);
        bead.position.set(1.05, 0.08, 0.86);
        g.add(slab, strip, bead);
        return g;
    };

    const scenes = new Map();
    const makeScene = (id) => {
        const root = new THREE.Group();
        const pivot = new THREE.Group();
        root.add(pivot);
        root.visible = false;
        stage.scene.add(root);
        const scene = { id, root, pivot, plates: [], orbiters: [], orbitRing: null, travellers: [], rings: [] };
        scenes.set(id, scene);
        return scene;
    };

    {
        const s = makeScene('hero-data');
        const mats = [palette.pink, palette.lavender, palette.amber];
        for (let i = 0; i < 3; i += 1) {
            const p = plate(mats[i]);
            s.pivot.add(p);
            s.plates.push(p);
        }
        const ring = new THREE.Mesh(orbitGeo, palette.cream);
        ring.rotation.x = Math.PI / 2 - 0.3;
        s.pivot.add(ring);
        s.orbitRing = ring;
        for (let i = 0; i < 3; i += 1) {
            const node = new THREE.Mesh(nodeGeo, [palette.amber, palette.pink, palette.cream][i]);
            node.userData.angle = (i / 3) * Math.PI * 2;
            ring.add(node);
            s.orbiters.push(node);
        }
    }

    {
        const s = makeScene('process-data');
        const mats = [palette.amber, palette.lavender, palette.pink, palette.cream];
        for (let i = 0; i < 4; i += 1) {
            const node = new THREE.Mesh(plateGeo, mats[i]);
            node.scale.setScalar(0.44);
            node.position.x = (i - 1.5) * 1.35;
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.03, 8, 48), palette.lavender);
            stage.track(ring.geometry);
            ring.position.copy(node.position);
            ring.position.z = -0.5;
            s.pivot.add(node, ring);
        }
        for (let i = 0; i < 3; i += 1) {
            const link = new THREE.Mesh(connectorGeo, palette.cream);
            link.position.x = (i - 1) * 1.35;
            s.pivot.add(link);
            const packet = new THREE.Mesh(nodeGeo, palette.pink);
            packet.scale.setScalar(0.7);
            packet.userData.offset = i / 3;
            s.pivot.add(packet);
            s.travellers.push(packet);
        }
    }

    {
        const s = makeScene('skills-data');
        const mats = [palette.cream, palette.lavender, palette.amber, palette.pink];
        for (let i = 0; i < 4; i += 1) {
            const p = plate(mats[i]);
            s.pivot.add(p);
            s.plates.push(p);
        }
    }

    {
        const s = makeScene('contact-data');
        const radii = [1.4, 1.75, 2.1];
        const tilts = [0.2, Math.PI / 2.6, Math.PI / 1.6];
        for (let i = 0; i < 3; i += 1) {
            const geo = new THREE.TorusGeometry(radii[i], 0.035, 8, 72);
            stage.track(geo);
            const ring = new THREE.Mesh(geo, [palette.amber, palette.cream, palette.pink][i]);
            ring.rotation.set(tilts[i], i * 0.5, i * 0.35);
            s.pivot.add(ring);
            s.rings.push(ring);
        }
        const core = new THREE.Mesh(coreGeo, palette.lavender);
        s.pivot.add(core);
        for (let i = 0; i < 3; i += 1) {
            const node = new THREE.Mesh(nodeGeo, [palette.pink, palette.amber, palette.cream][i]);
            node.userData.angle = (i / 3) * Math.PI * 2;
            node.userData.ring = s.rings[i];
            s.rings[i].add(node);
            s.orbiters.push(node);
        }
    }

    const anchors = new Map();
    const measureAnchor = (el) => {
        const a = anchors.get(el);
        if (!a) return;
        const rect = el.getBoundingClientRect();
        a.top = rect.top + window.scrollY;
        a.left = rect.left + window.scrollX;
        a.width = rect.width;
        a.height = rect.height;
    };
    const anchorObserver = new ResizeObserver((entries) => {
        if (entries.some((entry) => entry.target === document.body)) {
            for (const el of anchors.keys()) measureAnchor(el);
        } else {
            for (const entry of entries) measureAnchor(entry.target);
        }
        stage.invalidate();
    });
    const measureAllAnchors = () => {
        for (const el of anchors.keys()) measureAnchor(el);
        stage.invalidate();
    };
    window.addEventListener('resize', measureAllAnchors);
    anchorObserver.observe(document.body);
    document.fonts.ready.then(() => { if (!disposed) measureAllAnchors(); });

    let scrollY = window.scrollY;
    let paused = false;
    let pointerX = 0;
    let assembly = assembled ? 1 : 0;

    const visibleIds = new Set();
    const anyVisible = () => visibleIds.size > 0;
    const onIntersect = (entries) => {
        let changed = false;
        for (const entry of entries) {
            const id = anchors.get(entry.target)?.id;
            if (!id) continue;
            const had = visibleIds.has(id);
            if (entry.isIntersecting) visibleIds.add(id);
            else visibleIds.delete(id);
            changed = changed || had !== visibleIds.has(id);
        }
        if (!changed) return;
        if (!anyVisible()) {
            for (const scene of scenes.values()) {
                scene.root.visible = false;
                if (poses[scene.id]) poses[scene.id].visible = false;
            }
            host.dataset.scenePoses = JSON.stringify(poses);
            stage.invalidate();
        }
        stage.setVisible(anyVisible());
    };
    const intersectionObserver = new IntersectionObserver(onIntersect, { rootMargin: '8%' });

    const onScroll = () => {
        scrollY = window.scrollY;
        if ((staticMode || paused || !stage.quality.level.animate) && anyVisible()) stage.invalidate();
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    let unitsPerPixel = 1;
    const place = (scene, rect, width, height) => {
        const upp = unitsPerPixel;
        const fit = FIT[scene.id];
        const scale = fit
            ? Math.min((rect.width * upp) / fit.w, (rect.height * upp) / fit.h)
            : (Math.min(rect.width, rect.height) * upp) / 8.4;
        scene.root.scale.setScalar(scale);
        scene.root.position.set(
            (rect.x + rect.width / 2 - width / 2) * upp,
            -(rect.y + rect.height / 2 - height / 2) * upp,
            0,
        );
    };

    const poses = {};
    const frameScene = (scene, rect) => {
        const { height } = stage.size;
        const p = THREE.MathUtils.clamp((height - rect.y) / (height + rect.height), 0, 1);
        const animating = !staticMode && !paused && stage.quality.level.animate;
        const pose = animating ? p : 0.5;
        const px = animating ? pointerX : 0;
        scene.pivot.rotation.set(
            0.38 + pose * 0.22,
            -0.65 + pose * 1.7 + px * 0.07,
            -0.08 + pose * 0.16,
        );
        scene.pivot.scale.setScalar(0.5 + 0.5 * assembly);
        const spread = 0.48 + pose * 0.58 + (1 - assembly) * 0.5;
        scene.plates.forEach((plateGroup, i) => {
            plateGroup.position.y = (i - (scene.plates.length - 1) / 2) * spread;
        });
        const elapsed = animating ? stageElapsed : 0;
        for (const node of scene.orbiters) {
            node.position.set(
                Math.cos(node.userData.angle + elapsed * 0.5) * (node.userData.ring ? node.userData.ring.geometry.parameters.radius : 2.25),
                Math.sin(node.userData.angle + elapsed * 0.5) * (node.userData.ring ? node.userData.ring.geometry.parameters.radius : 2.25),
                0,
            );
        }
        for (const packet of scene.travellers) {
            const t = ((elapsed * 0.25 + packet.userData.offset) % 1);
            packet.position.set((t - 0.5) * 4.05, 0, 0.2);
        }
        for (let i = 0; i < scene.rings.length; i += 1) {
            scene.rings[i].rotation.z = i * 0.35 + elapsed * 0.12 * (i % 2 ? -1 : 1);
        }
        poses[scene.id] = {
            progress: Math.round(p * 1000) / 1000,
            rotation: [scene.pivot.rotation.x, scene.pivot.rotation.y, scene.pivot.rotation.z].map((v) => Math.round(v * 1000) / 1000),
            visible: scene.root.visible,
        };
    };

    let stageElapsed = 0;
    let disposed = false;
    const stopFrame = stage.onFrame((dt) => {
        const { width, height } = stage.size;
        if (!width || !height) return;
        stageElapsed += dt;
        scrollY = window.scrollY;
        const visibleHeight = 2 * stage.camera.position.z * Math.tan((stage.camera.fov * Math.PI) / 360);
        unitsPerPixel = visibleHeight / height;
        for (const a of anchors.values()) {
            const scene = scenes.get(a.id);
            if (!scene || !a.width) continue;
            const rect = { x: a.left - window.scrollX, y: a.top - scrollY, width: a.width, height: a.height };
            scene.root.visible = visibleIds.has(a.id);
            if (!scene.root.visible) {
                if (poses[scene.id]) poses[scene.id].visible = false;
                continue;
            }
            place(scene, rect, width, height);
            frameScene(scene, rect);
        }
        host.dataset.scenePoses = JSON.stringify(poses);
    });

    host.dataset.experience = 'data';
    host.probeCoverage = (rects) => stage.coverage(rects);

    if (staticMode) stage.quality.force('static');

    return {
        stage,
        registerAnchor(id, el) {
            if (!STATIONS.includes(id) || !el) return () => {};
            const existing = [...anchors.entries()].find(([, a]) => a.id === id);
            if (existing) {
                anchorObserver.unobserve(existing[0]);
                intersectionObserver.unobserve(existing[0]);
                anchors.delete(existing[0]);
            }
            anchors.set(el, { id });
            measureAnchor(el);
            anchorObserver.observe(el);
            intersectionObserver.observe(el);
            visibleIds.add(id);
            stage.setVisible(true);
            return () => {
                if (anchors.get(el)?.id !== id) return;
                anchorObserver.unobserve(el);
                intersectionObserver.unobserve(el);
                anchors.delete(el);
                visibleIds.delete(id);
                const scene = scenes.get(id);
                if (scene) {
                    scene.root.visible = false;
                    if (poses[scene.id]) poses[scene.id].visible = false;
                }
                stage.invalidate();
                stage.setVisible(anyVisible());
            };
        },
        anchorRect(id) {
            for (const a of anchors.values()) {
                if (a.id !== id) continue;
                return { x: a.left - window.scrollX, y: a.top - scrollY, width: a.width, height: a.height };
            }
            return null;
        },
        setPointer(x) { pointerX = x; },
        setAssembly(value) {
            assembly = THREE.MathUtils.clamp(value, 0, 1);
            stage.invalidate();
        },
        setPaused(value) {
            paused = value;
            stage.setPaused(value);
            stage.invalidate();
        },
        destroy() {
            disposed = true;
            stopFrame();
            anchorObserver.disconnect();
            intersectionObserver.disconnect();
            window.removeEventListener('resize', measureAllAnchors);
            window.removeEventListener('scroll', onScroll);
            anchors.clear();
            delete host.probeCoverage;
            delete host.dataset.scenePoses;
            delete host.dataset.experience;
            stage.scene.clear();
            stage.destroy();
        },
    };
}
