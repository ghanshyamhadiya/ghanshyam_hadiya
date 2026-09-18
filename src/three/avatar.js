import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// The hero body, loaded from a real modelled avatar (public/models/avatar.glb).
//
// Exposes exactly the same interface as the procedural figure in figure.js, so
// world.js can use either: the avatar when the asset is present, the
// hand-built fallback when it is not. All the choreography — assembly, wave,
// cursor tracking, drag, scroll pose, DOM-rect scaling — lives against this
// interface rather than against a specific body.
//
// Bone names follow the Mixamo convention that Ready Player Me and most
// exporters use, matched case-insensitively and with an optional `mixamorig`
// prefix, because that prefix survives some export paths and not others.

// The colour field the shards arrive from: the curtain's own palette.
const FIELD = [0xff1e8e, 0xffc93c, 0x332c81, 0xfff7ec];
const SHARD_COUNT = 34;

const smoothstep = (t) => t * t * (3 - 2 * t);
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const hash = (n) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
};

const BONE_PATTERNS = {
    head: /^(mixamorig)?head$/,
    neck: /^(mixamorig)?neck$/,
    spine: /^(mixamorig)?spine2?$/,
    rightArm: /^(mixamorig)?rightarm$/,
    rightForeArm: /^(mixamorig)?rightforearm$/,
    leftArm: /^(mixamorig)?leftarm$/,
    leftForeArm: /^(mixamorig)?leftforearm$/,
};

// Geometry detail comes baked into the asset, so unlike the procedural figure
// there is no segment count to take here.
export async function createAvatar(stage, { url } = {}) {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(url);
    const model = gltf.scene;

    const bones = {};
    const disposables = new Set();
    model.traverse((node) => {
        if (node.isBone) {
            const name = node.name.toLowerCase();
            for (const [key, pattern] of Object.entries(BONE_PATTERNS)) {
                if (!bones[key] && pattern.test(name)) bones[key] = node;
            }
        }
        if (node.isMesh || node.isSkinnedMesh) {
            node.castShadow = true;
            node.frustumCulled = false;
            if (node.geometry) disposables.add(node.geometry);
            for (const mat of Array.isArray(node.material) ? node.material : [node.material]) {
                if (!mat) continue;
                // Exported avatars are often lit for a bright studio HDRI. This
                // scene is a deep indigo zone lit by three lights, so the
                // materials are pulled toward the matte clay look of the rest
                // of the site instead of arriving shiny.
                mat.roughness = Math.max(mat.roughness ?? 0.5, 0.62);
                mat.metalness = Math.min(mat.metalness ?? 0, 0.05);
                mat.envMapIntensity = 0.4;
                disposables.add(mat);
            }
        }
    });

    // Bring the arms down out of the A/T pose so the body reads as standing
    // rather than presenting. Stored as the rest pose the wave returns to.
    const rest = new Map();
    const restPose = (bone, x, y, z) => {
        if (!bone) return;
        bone.rotation.set(x, y, z);
        rest.set(bone, bone.rotation.clone());
    };
    restPose(bones.rightArm, 0, 0, -1.25);
    restPose(bones.leftArm, 0, 0, 1.25);
    restPose(bones.rightForeArm, 0, 0, -0.12);
    restPose(bones.leftForeArm, 0, 0, 0.12);
    for (const bone of [bones.head, bones.neck, bones.spine]) {
        if (bone) rest.set(bone, bone.rotation.clone());
    }

    const root = new THREE.Group();
    const body = new THREE.Group();
    body.add(model);
    root.add(body);

    // Normalise the model so a 1.8m avatar and a stylised bust both fill their
    // slot: measure it, then move it so its own centre sits on the group
    // origin and scale it to a known height.
    const raw = new THREE.Box3().setFromObject(model);
    const rawSize = raw.getSize(new THREE.Vector3());
    const rawCentre = raw.getCenter(new THREE.Vector3());
    // Frame the upper body: a full-body avatar in a hero slot is a distant
    // doll, so the crop keeps head-to-waist and lets the slot do the rest.
    const fullBody = rawSize.y > rawSize.x * 2.2;
    const targetHeight = 3.6;
    const modelScale = targetHeight / (fullBody ? rawSize.y * 0.52 : rawSize.y);
    model.scale.setScalar(modelScale);
    model.position.set(
        -rawCentre.x * modelScale,
        // Keep the head near the top of the frame for a full-body rig.
        (fullBody ? -(raw.max.y - rawSize.y * 0.26) : -rawCentre.y) * modelScale,
        -rawCentre.z * modelScale,
    );

    // Shard cloud: the welcome curtain's colours, which converge on the body
    // and shrink away as it resolves. A skinned mesh cannot be flown in as
    // loose parts, so the "colours become the person" beat is carried by these
    // instead, and the body cross-fades in underneath them.
    const shardGeometry = new THREE.IcosahedronGeometry(0.17, 0);
    const shardMaterials = FIELD.map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.05 }));
    const shards = [];
    const shardGroup = new THREE.Group();
    root.add(shardGroup);
    for (let i = 0; i < SHARD_COUNT; i += 1) {
        const mesh = new THREE.Mesh(shardGeometry, shardMaterials[i % shardMaterials.length]);
        const angle = hash(i) * Math.PI * 2;
        const radius = 7 + hash(i + 40) * 5;
        // Home is a point on the body's own silhouette, so the cloud collapses
        // into the shape of the person rather than into a ball.
        const t = hash(i + 300);
        shards.push({
            mesh,
            start: new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.7, (hash(i + 80) - 0.5) * 6),
            home: new THREE.Vector3(
                (hash(i + 200) - 0.5) * targetHeight * 0.42,
                (t - 0.5) * targetHeight * 0.92,
                (hash(i + 400) - 0.5) * targetHeight * 0.22,
            ),
            spin: new THREE.Euler(hash(i + 120) * 4, hash(i + 160) * 4, hash(i + 500) * 4),
            delay: hash(i + 600) * 0.45,
        });
        shardGroup.add(mesh);
    }
    disposables.add(shardGeometry);
    for (const mat of shardMaterials) disposables.add(mat);

    stage.scene.add(root);

    let assembly = 1;
    let pointerX = 0;
    let pointerY = 0;
    let spin = 0;
    let scrollPose = 0;
    let waveUntil = 0;
    let reactUntil = 0;
    let squashAmount = 0;
    let clock = 0;
    let headYaw = 0;
    let headPitch = 0;
    let bodyYaw = 0.22;
    let baseY = 0;
    let waveAmount = 0;
    let revealScale = 1;

    const applyAssembly = () => {
        // The body fades and grows in over the second half; the shards lead.
        const reveal = smoothstep(clamp01((assembly - 0.42) / 0.58));
        body.visible = reveal > 0.001;
        // Scale is owned by update(), which layers the click squash on top of
        // this; writing it in both places makes them fight frame to frame.
        revealScale = 0.88 + 0.12 * reveal;
        model.traverse((node) => {
            if (!node.isMesh && !node.isSkinnedMesh) return;
            for (const mat of Array.isArray(node.material) ? node.material : [node.material]) {
                if (!mat) continue;
                mat.transparent = reveal < 0.999;
                mat.opacity = reveal;
                mat.depthWrite = reveal > 0.5;
            }
        });
        for (const shard of shards) {
            const t = smoothstep(clamp01((assembly - shard.delay) / (1 - shard.delay)));
            shard.mesh.position.lerpVectors(shard.start, shard.home, t);
            shard.mesh.rotation.set(shard.spin.x * (1 - t), shard.spin.y * (1 - t), shard.spin.z * (1 - t));
            // Grow on the way in, then shrink to nothing as the body resolves,
            // so the colours look absorbed rather than switched off.
            const fade = 1 - smoothstep(clamp01((assembly - 0.55) / 0.45));
            shard.mesh.scale.setScalar((0.3 + 0.7 * t) * fade);
            shard.mesh.visible = fade > 0.01;
        }
        shardGroup.visible = assembly < 0.999;
    };
    applyAssembly();

    const natural = new THREE.Box3().setFromObject(body);
    const naturalSize = natural.getSize(new THREE.Vector3());
    const naturalCentre = natural.getCenter(new THREE.Vector3());

    const applyBone = (bone, x, y, z) => {
        if (!bone) return;
        const base = rest.get(bone);
        if (!base) return;
        bone.rotation.set(base.x + x, base.y + y, base.z + z);
    };

    return {
        root,
        source: 'avatar',
        parts: shards.length,
        bones: Object.keys(bones),
        rigged: Boolean(bones.head),
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
        get squash() { return squashAmount; },
        update(dt) {
            clock += dt;
            const settled = assembly > 0.995;
            const blend = 1 - Math.exp(-dt * 5);
            const targetYaw = settled ? pointerX * 0.5 : 0;
            const targetPitch = settled ? -pointerY * 0.24 : 0;
            headYaw += (targetYaw - headYaw) * blend;
            headPitch += (targetPitch - headPitch) * blend;
            bodyYaw += (0.22 + targetYaw * 0.3 + spin - bodyYaw) * blend;
            root.rotation.y = bodyYaw;

            // Split the look between neck and head so the turn reads through
            // the shoulders instead of the skull swivelling alone.
            if (bones.head) {
                const local = headYaw - (bodyYaw - 0.22) * 0.5;
                applyBone(bones.neck, headPitch * 0.35, local * 0.35, 0);
                applyBone(bones.head, headPitch * 0.65, local * 0.65, 0);
            } else {
                // No skeleton: turn the whole body a little more instead, so
                // an unrigged model still responds to the cursor.
                root.rotation.y = bodyYaw + headYaw * 0.35;
            }

            root.position.y = baseY - scrollPose * 1.1;
            root.rotation.x = scrollPose * 0.12;

            const breath = Math.sin(clock * 1.15) * 0.5 + 0.5;
            squashAmount = clock < reactUntil ? Math.sin(((reactUntil - clock) / 0.5) * Math.PI) : 0;
            applyBone(bones.spine, breath * 0.012, 0, 0);
            body.scale.setScalar(revealScale * (1 - squashAmount * 0.06));
            body.position.y = breath * 0.035 - squashAmount * 0.05;

            // Wave with the figure's right arm, raised from the shoulder with
            // the forearm doing the actual waving.
            const target = clock < waveUntil ? 1 : 0;
            waveAmount += (target - waveAmount) * (1 - Math.exp(-dt * 6));
            if (waveAmount > 0.001) {
                const flap = Math.sin(clock * 9) * 0.34 * waveAmount;
                applyBone(bones.rightArm, 0, 0, waveAmount * 1.05);
                applyBone(bones.rightForeArm, 0, flap, waveAmount * 0.5);
            } else {
                applyBone(bones.rightArm, 0, 0, 0);
                applyBone(bones.rightForeArm, 0, 0, 0);
            }
        },
        applyQuality(level) {
            shardGroup.visible = level.particles > 0 && assembly < 0.999;
            model.traverse((node) => {
                if (node.isMesh || node.isSkinnedMesh) node.castShadow = level.shadows;
            });
        },
        dispose() {
            stage.scene.remove(root);
            for (const item of disposables) item.dispose?.();
            disposables.clear();
            shards.length = 0;
        },
    };
}
