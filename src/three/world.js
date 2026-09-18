import * as THREE from 'three';
import { createStage } from './renderer';
import { createFigure } from './figure';
import { createAvatar } from './avatar';

// A real modelled avatar is the intended hero body; the hand-built figure in
// figure.js is the fallback when the asset is absent or fails to parse, so the
// hero is never an empty hole.
const AVATAR_URL = '/models/avatar.glb';

// The world: one stage, one light rig, and the content that lives in it.
//
// Phase 1 holds the hero figure. Section stations plug into the same stage
// later, which is why the camera and light rig live here rather than inside
// the figure.

export async function createWorld(host, { onFailure, staticMode = false, assembled = true, avatarUrl = AVATAR_URL } = {}) {
    // Declared before the stage so the quality callback can reach it without
    // tripping over the temporal dead zone of a const.
    let figure = null;
    const stage = createStage(host, {
        onFailure,
        onQualityChange: (level) => figure?.applyQuality(level),
    });
    if (!stage) return null;

    // Lighting follows the language already proven on the data core this
    // replaces: broad hemisphere fill, a white key from the upper right, and an
    // amber rim from behind-left that separates the figure from a deep indigo
    // background without washing the clay out.
    const hemisphere = new THREE.HemisphereLight(0xffffff, 0x332c81, 2.1);
    const key = new THREE.DirectionalLight(0xffffff, 2.8);
    key.position.set(4, 6, 5);
    const rim = new THREE.DirectionalLight(0xffc93c, 1.5);
    rim.position.set(-5, 1.5, -4);
    const fill = new THREE.DirectionalLight(0xff1e8e, 0.45);
    fill.position.set(-3, -2, 4);
    stage.scene.add(hemisphere, key, rim, fill);

    // Reduced motion still gets the figure, just never a render loop: the
    // static rung draws on demand only, so the composition is complete but
    // nothing animates. An empty hole would be worse than a still image.
    if (staticMode) stage.quality.force('static');

    // Try the modelled avatar, fall back to the procedural figure. A missing
    // or broken asset must degrade to a body, not to nothing.
    try {
        figure = await createAvatar(stage, { url: avatarUrl });
    } catch {
        figure = createFigure(stage, { segments: stage.quality.level.segments });
    }
    host.dataset.figureSource = figure.source ?? 'figure';
    host.dataset.figureNatural = [figure.width, figure.height, figure.centreY].map((v) => v.toFixed(3)).join(',');
    host.dataset.figureRigged = String(figure.rigged ?? false);
    figure.applyQuality(stage.quality.level);
    figure.setAssembly(assembled ? 1 : 0);

    let anchor = null;
    let unitsPerPixel = 1;

    // Maps a viewport rect onto the z=0 plane. The canvas is fixed to the
    // viewport, so DOM pixels and canvas pixels are the same space, and the
    // figure can be told to stand exactly where its layout slot is.
    const layout = () => {
        const { width, height } = stage.size;
        if (!width || !height) return;
        const visibleHeight = 2 * stage.camera.position.z * Math.tan((stage.camera.fov * Math.PI) / 360);
        unitsPerPixel = visibleHeight / height;
        if (!anchor) return;
        const centreX = anchor.x + anchor.width / 2;
        const centreY = anchor.y + anchor.height / 2;
        // Fit the figure's measured bounding box to the slot, on both axes, so
        // a narrow slot shrinks it rather than letting the arms spill out.
        const scale = Math.min(
            (anchor.height * unitsPerPixel) / figure.height,
            (anchor.width * unitsPerPixel) / figure.width,
        );
        figure.root.scale.setScalar(scale);
        figure.root.position.x = (centreX - width / 2) * unitsPerPixel;
        figure.root.position.z = 0;
        // The bounding-box centre, not the root origin, is what should land on
        // the slot centre — the root sits near the neck, not the middle.
        // setScrollPose adds to this, so it is stored rather than assigned.
        figure.setBaseY(-(centreY - height / 2) * unitsPerPixel - figure.centreY * scale);
    };

    // Projected screen box of the figure, published to the DOM so the browser
    // audits can assert where the geometry actually lands without reaching
    // into the scene graph. Cheap at this part count.
    const bounds = new THREE.Box3();
    const corner = new THREE.Vector3();
    const publishBounds = () => {
        const { width, height } = stage.size;
        if (!width || !height) return;
        bounds.setFromObject(figure.root);
        if (bounds.isEmpty()) return;
        let left = Infinity;
        let top = Infinity;
        let right = -Infinity;
        let bottom = -Infinity;
        for (let i = 0; i < 8; i += 1) {
            corner.set(
                i & 1 ? bounds.max.x : bounds.min.x,
                i & 2 ? bounds.max.y : bounds.min.y,
                i & 4 ? bounds.max.z : bounds.min.z,
            ).project(stage.camera);
            const x = ((corner.x + 1) / 2) * width;
            const y = ((1 - corner.y) / 2) * height;
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
        }
        host.dataset.figureBox = [left, top, right, bottom].map((v) => Math.round(v)).join(',');
        host.dataset.figureAssembly = figure.assembly.toFixed(3);
        host.dataset.figureYaw = figure.yaw.toFixed(3);
        host.dataset.figureHeadYaw = figure.headYaw.toFixed(3);
        host.dataset.figureWaving = String(figure.waving);
        host.dataset.figureSquash = (figure.squash ?? 0).toFixed(3);
    };

    const stopFrame = stage.onFrame((dt) => {
        layout();
        figure.update(dt);
        publishBounds();
    });

    // Hung off the host element rather than a global so it is scoped to this
    // layer. scripts/audit-occlusion.mjs calls it to prove geometry never
    // covers body copy.
    host.probeCoverage = (rects) => stage.coverage(rects);

    return {
        stage,
        figure,
        setAnchor(rect) {
            anchor = rect;
            layout();
            stage.invalidate();
        },
        setPointer: (x, y) => figure.setPointer(x, y),
        setScroll: (progress) => figure.setScrollPose(progress),
        setAssembly: (progress) => {
            figure.setAssembly(progress);
            stage.invalidate();
        },
        wave: () => figure.wave(),
        react: () => figure.react(),
        spinBy: (delta) => {
            figure.spinBy(delta);
            stage.invalidate();
        },
        setPaused: (value) => stage.setPaused(value),
        setVisible: (value) => stage.setVisible(value),
        destroy() {
            stopFrame();
            delete host.probeCoverage;
            figure.dispose();
            stage.scene.remove(hemisphere, key, rim, fill);
            hemisphere.dispose();
            key.dispose();
            rim.dispose();
            fill.dispose();
            stage.destroy();
        },
    };
}
