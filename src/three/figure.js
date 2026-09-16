import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// The claymorphic figure. Hand-built from primitives — nothing to download,
// nothing to license, and the silhouette is tunable in code.
//
// Built from spheres, tapered cylinders and capsules rather than boxes. An
// earlier box-based version read as a Lego mannequin: blocky head, slab hair
// and a black box for a beard. Curvature is what makes clay read as clay.
//
// Identity cues are taken from the real portrait: a dark swept-back quiff,
// a short beard following the jaw, and a navy collared shirt with a chest
// pocket. Proportions are adult — a head much bigger than a third of the
// torso reads as a toy.
//
// Every part flies in from a scattered ring during the intro and lerps from a
// brand colour to its own, which is the "the welcome screen's colours become
// the person" beat.

const SKIN = 0xc9895c;
const SKIN_SHADE = 0xb0744c;
const HAIR = 0x191410;
const BEARD = 0x241d18;
const EYE = 0x140f0c;
const SHIRT = 0x2e4a7d;
const SHIRT_LIGHT = 0x3c5d95;
const AMBER = 0xffc93c;
// The colour field the parts arrive from: the curtain's own palette.
const FIELD = [0xff1e8e, 0xffc93c, 0x332c81, 0xfff7ec];

const smoothstep = (t) => t * t * (3 - 2 * t);
const clamp01 = (v) => Math.max(0, Math.min(1, v));
// Seeded, so the assembly choreography is identical on every load and can be
// asserted by the audit.
const hash = (n) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
};

export function createFigure(stage, { segments = 4 } = {}) {
    const geometries = new Set();
    const materials = new Set();
    const parts = [];
    const detail = Math.max(2, segments);

    const geometry = (value) => { geometries.add(value); return value; };
    const material = (color, extra = {}) => {
        const value = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.03, ...extra });
        materials.add(value);
        return value;
    };
    const ball = (r) => geometry(new THREE.SphereGeometry(r, detail * 6, detail * 5));
    const capsule = (r, len) => geometry(new THREE.CapsuleGeometry(r, len, detail, detail * 5));
    const slab = (w, h, d, radius) => geometry(new RoundedBoxGeometry(w, h, d, detail, radius));
    // Hair and beard are partial spheres sharing the head's centre and scale,
    // at a slightly larger radius. Two nearly-concentric SOLID spheres
    // z-fight along their intersection — that is what covered the first
    // attempt's hairline and jaw in speckle. A cap has no competing surface:
    // it simply sits on the head like a shell.
    const cap = (r, thetaStart, thetaLength) =>
        geometry(new THREE.SphereGeometry(r, detail * 7, detail * 5, 0, Math.PI * 2, thetaStart, thetaLength));

    const root = new THREE.Group();
    const body = new THREE.Group();
    root.add(body);
    // Head rides its own pivot at the base of the neck so a look-at rotation
    // swings the head instead of shearing it off the shoulders.
    const headPivot = new THREE.Group();
    body.add(headPivot);
    // Face sits on its own group so eyes, brows and nose move with the head
    // and can be dropped wholesale on the cheapest quality rung.
    const face = new THREE.Group();
    headPivot.add(face);

    // Position, rotation and scale are arguments rather than something a
    // caller assigns afterwards: `home` is captured here, and a call site
    // setting mesh.position later would silently collapse that part to its
    // pivot origin on the first assembly pass.
    const part = (name, mesh, { pivot = body, delay = 0, at = [0, 0, 0], turn, grow } = {}) => {
        mesh.position.set(...at);
        if (turn) mesh.rotation.set(...turn);
        if (grow) mesh.scale.set(...grow);
        mesh.name = name;
        pivot.add(mesh);
        const index = parts.length;
        const angle = hash(index) * Math.PI * 2;
        const radius = 7 + hash(index + 40) * 5;
        parts.push({
            name,
            mesh,
            home: mesh.position.clone(),
            homeQuaternion: mesh.quaternion.clone(),
            homeScale: mesh.scale.clone(),
            start: new THREE.Vector3(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius * 0.7,
                (hash(index + 80) - 0.5) * 6,
            ),
            startEuler: new THREE.Euler(hash(index + 120) * 4, hash(index + 160) * 4, hash(index + 200) * 4),
            field: new THREE.Color(FIELD[index % FIELD.length]),
            target: mesh.material.color.clone(),
            delay,
        });
        return mesh;
    };

    // Head centre and scale. Hair and beard reuse both so their caps stay
    // concentric with the skull; changing the head means changing one place.
    const HEAD_Y = 1.15;
    const HEAD_R = 0.5;
    const HEAD_GROW = [1, 1.12, 1];

    // ---- Torso -------------------------------------------------------------
    // A capsule, not a cylinder: the rounded ends give sloped shoulders and a
    // soft hem, where a cylinder showed hard rims at both cuts.
    part('torso', new THREE.Mesh(capsule(0.68, 1.0), material(SHIRT)), {
        delay: 0, at: [0, -0.5, 0], grow: [1, 1, 0.66],
    });
    part('pocket', new THREE.Mesh(slab(0.34, 0.32, 0.05, 0.04), material(SHIRT_LIGHT)), { delay: 0.1, at: [0.3, 0.12, 0.41] });
    [0.1, -0.42, -0.94].forEach((y, i) => {
        part(`button-${i}`, new THREE.Mesh(ball(0.048), material(AMBER, { roughness: 0.3 })), { delay: 0.12 + i * 0.02, at: [0, y, 0.44] });
    });
    // Open collar: two soft wedges falling away from the throat.
    [-1, 1].forEach((side, i) => {
        part(`collar-${i}`, new THREE.Mesh(slab(0.4, 0.34, 0.13, 0.06), material(SHIRT_LIGHT)), {
            delay: 0.14 + i * 0.02, at: [side * 0.23, 0.56, 0.26], turn: [0.32, side * 0.12, side * 0.6],
        });
    });

    // ---- Neck and head -----------------------------------------------------
    part('neck', new THREE.Mesh(capsule(0.185, 0.24), material(SKIN_SHADE)), { delay: 0.18, at: [0, 0.68, -0.02] });
    // Egg-shaped head: taller than it is wide.
    part('head', new THREE.Mesh(ball(HEAD_R), material(SKIN)), { pivot: headPivot, delay: 0.22, at: [0, HEAD_Y, 0], grow: HEAD_GROW });
    [-1, 1].forEach((side, i) => {
        part(`ear-${i}`, new THREE.Mesh(ball(0.1), material(SKIN_SHADE)), {
            pivot: headPivot, delay: 0.24 + i * 0.02, at: [side * 0.47, HEAD_Y - 0.02, -0.02], grow: [0.55, 1.2, 1],
        });
    });

    // Beard: the lower cap of a sphere sharing the head's centre, so it wraps
    // the jaw and chin exactly and stops at the cheekbone.
    part('beard', new THREE.Mesh(cap(HEAD_R + 0.015, Math.PI * 0.68, Math.PI * 0.32), material(BEARD, { side: THREE.DoubleSide })), {
        pivot: headPivot, delay: 0.3, at: [0, HEAD_Y, 0], grow: HEAD_GROW,
    });
    // Moustache bridges the beard under the nose.
    part('moustache', new THREE.Mesh(slab(0.23, 0.06, 0.09, 0.03), material(BEARD)), {
        pivot: face, delay: 0.32, at: [0, HEAD_Y - 0.13, 0.44],
    });
    // Hair: the upper cap of the same sphere, plus a quiff tipped up and
    // forward off the hairline.
    part('crown', new THREE.Mesh(cap(HEAD_R + 0.025, 0, Math.PI * 0.33), material(HAIR, { side: THREE.DoubleSide })), {
        pivot: headPivot, delay: 0.34, at: [0, HEAD_Y, -0.03], grow: HEAD_GROW,
    });
    part('quiff', new THREE.Mesh(ball(0.29), material(HAIR)), {
        pivot: headPivot, delay: 0.38, at: [0, HEAD_Y + 0.44, 0.1], grow: [1.2, 0.52, 0.88], turn: [-0.26, 0, 0.07],
    });

    // ---- Face --------------------------------------------------------------
    // Minimal, but present. A featureless head reads as a mannequin, which is
    // what the first pass looked like.
    [-1, 1].forEach((side, i) => {
        part(`eye-${i}`, new THREE.Mesh(ball(0.075), material(EYE, { roughness: 0.2 })), {
            pivot: face, delay: 0.26 + i * 0.01, at: [side * 0.17, HEAD_Y + 0.06, 0.41], grow: [1.15, 0.8, 0.5],
        });
        part(`brow-${i}`, new THREE.Mesh(slab(0.16, 0.042, 0.055, 0.018), material(HAIR)), {
            pivot: face, delay: 0.28 + i * 0.01, at: [side * 0.175, HEAD_Y + 0.19, 0.4], turn: [0, side * 0.1, side * -0.14],
        });
    });
    part('nose', new THREE.Mesh(ball(0.07), material(SKIN_SHADE)), {
        pivot: face, delay: 0.29, at: [0, HEAD_Y - 0.03, 0.45], grow: [0.85, 1.35, 1.15],
    });

    // ---- Arms --------------------------------------------------------------
    // Deltoid spheres tie the arms into the shoulder line; without them the
    // limbs look pinned on.
    const arms = [-1, 1].map((side, i) => {
        const pivot = new THREE.Group();
        pivot.position.set(side * 0.6, 0.4, 0);
        body.add(pivot);
        part(`shoulder-${i}`, new THREE.Mesh(ball(0.26), material(SHIRT)), { pivot, delay: 0.4 + i * 0.02, at: [0, 0, 0], grow: [1, 0.95, 0.8] });
        part(`arm-${i}`, new THREE.Mesh(capsule(0.185, 1.45), material(SHIRT)), { pivot, delay: 0.42 + i * 0.04, at: [side * 0.08, -0.95, 0] });
        part(`hand-${i}`, new THREE.Mesh(ball(0.17), material(SKIN)), { pivot, delay: 0.46 + i * 0.04, at: [side * 0.11, -1.92, 0], grow: [0.85, 1.1, 0.9] });
        return { pivot, side, rest: 0 };
    });

    stage.scene.add(root);

    let assembly = 1;
    let pointerX = 0;
    let pointerY = 0;
    let spin = 0;
    let scrollPose = 0;
    let waveUntil = 0;
    let reactUntil = 0;
    let clock = 0;
    let headYaw = 0;
    let headPitch = 0;
    // A slight three-quarter turn at rest. Dead-on symmetry looks like a
    // passport photo; a small yaw gives the clay somewhere to catch light.
    let bodyYaw = 0.22;
    // Written by the world when it maps the figure onto its DOM slot; the
    // scroll pose is added on top rather than overwriting it.
    let baseY = 0;

    // Every part must be fully home at assembly = 1. A fixed window plus a
    // delay overshoots for the late parts, leaving them permanently mid-flight
    // and slightly undersized — that is what detached the hands. Each part
    // instead uses whatever time it has left.
    const startQuaternion = new THREE.Quaternion();
    const applyAssembly = () => {
        for (const entry of parts) {
            const t = smoothstep(clamp01((assembly - entry.delay) / (1 - entry.delay)));
            entry.mesh.position.lerpVectors(entry.start, entry.home, t);
            startQuaternion.setFromEuler(entry.startEuler);
            entry.mesh.quaternion.slerpQuaternions(startQuaternion, entry.homeQuaternion, t);
            // Home scale is often non-uniform, so it is scaled rather than
            // replaced; setScalar here would flatten every squashed sphere.
            entry.mesh.scale.copy(entry.homeScale).multiplyScalar(0.25 + 0.75 * t);
            // Colour resolves late, so parts read as coloured light that turns
            // into a body only as it settles.
            entry.mesh.material.color.copy(entry.field).lerp(entry.target, smoothstep(clamp01((t - 0.45) / 0.55)));
            entry.mesh.visible = t > 0.001;
        }
    };
    applyAssembly();

    // Natural extent, measured from the assembled parts rather than written
    // down as a constant: a hand-maintained height drifts the moment a part
    // moves, and the world scales the figure onto a DOM rect with it.
    const natural = new THREE.Box3().setFromObject(root);
    const naturalSize = natural.getSize(new THREE.Vector3());
    const naturalCentre = natural.getCenter(new THREE.Vector3());

    return {
        root,
        parts: parts.length,
        height: naturalSize.y,
        width: naturalSize.x,
        centreY: naturalCentre.y,
        setAssembly(value) {
            assembly = clamp01(value);
            applyAssembly();
        },
        setPointer(x, y) {
            pointerX = x;
            pointerY = y;
        },
        setScrollPose(value) {
            scrollPose = clamp01(value);
        },
        setBaseY(value) {
            baseY = value;
        },
        spinBy(delta) {
            spin += delta;
        },
        wave(duration = 2.2) {
            waveUntil = clock + duration;
        },
        react() {
            reactUntil = clock + 0.5;
        },
        get waving() { return clock < waveUntil; },
        get yaw() { return bodyYaw; },
        get headYaw() { return headYaw; },
        get assembly() { return assembly; },
        update(dt) {
            clock += dt;
            const settled = assembly > 0.995;
            // Head and torso turn toward the cursor, the torso by less, which
            // is what stops it reading as a rigid billboard.
            const targetYaw = settled ? pointerX * 0.5 : 0;
            const targetPitch = settled ? -pointerY * 0.24 : 0;
            const blend = 1 - Math.exp(-dt * 5);
            headYaw += (targetYaw - headYaw) * blend;
            headPitch += (targetPitch - headPitch) * blend;
            bodyYaw += (0.22 + targetYaw * 0.3 + spin - bodyYaw) * blend;
            headPivot.rotation.set(headPitch, headYaw - (bodyYaw - 0.22) * 0.5, 0);
            root.rotation.y = bodyYaw;

            // Scroll pose: sinks and tips back as the hero leaves.
            root.position.y = baseY - scrollPose * 1.1;
            root.rotation.x = scrollPose * 0.12;

            // Breathing and the click squash share body.scale. root.scale is
            // owned by the world's DOM-rect layout and must not be touched
            // here, or the figure snaps to unit size on the next frame.
            const breath = Math.sin(clock * 1.15) * 0.5 + 0.5;
            const squash = clock < reactUntil ? Math.sin(((reactUntil - clock) / 0.5) * Math.PI) : 0;
            const wide = (1 + breath * 0.012) * (1 + squash * 0.06);
            body.scale.set(wide, (1 - breath * 0.01) * (1 - squash * 0.08), wide);
            body.position.y = breath * 0.04;

            for (const arm of arms) {
                // Only the figure's right arm (viewer's left) waves.
                const waving = clock < waveUntil && arm.side < 0;
                const raise = waving ? 2.3 : 0;
                const flap = waving ? Math.sin(clock * 9) * 0.3 : 0;
                arm.rest += (raise + flap - arm.rest) * (1 - Math.exp(-dt * 7));
                arm.pivot.rotation.z = arm.side * arm.rest;
                // A touch of outward hang so the arms clear the torso.
                arm.pivot.rotation.x = settled ? Math.sin(clock * 0.9 + arm.side) * 0.035 : 0;
            }
        },
        applyQuality(level) {
            // The face is the first thing to go on the cheapest rung: it is
            // the densest cluster of small spheres and the least visible at
            // the size a phone renders the figure.
            face.visible = level.name !== 'low' || level.animate;
            for (const entry of parts) entry.mesh.castShadow = level.shadows;
        },
        dispose() {
            stage.scene.remove(root);
            for (const item of geometries) item.dispose();
            for (const item of materials) item.dispose();
            geometries.clear();
            materials.clear();
            parts.length = 0;
        },
    };
}
