export const SECTION_GLIDE = { stiffness: 380, damping: 32, mass: 0.45, restDelta: 0.0001, restSpeed: 0.001 };

export const getSectionPose = (preset, value, desktop) => {
    const t = Math.max(0, Math.min(1, value));
    const u = 1 - t;
    let heading;
    let clip = 'none';
    let contentX = 0;
    let contentY = (desktop ? 80 : 44) * u;
    let opacity = t <= .35 ? .3 : t >= .8 ? 1 : .3 + .7 * (t - .35) / .45;
    if (preset === 'lateral') {
        heading = `translate3d(${(desktop ? 34 : 6) * u}%,0,0)`;
        contentX = (desktop ? 30 : 6) * u;
        contentY = (desktop ? 44 : 28) * u;
        opacity = .65 + .35 * t;
    } else if (preset === 'curtain') {
        heading = `translate3d(0,${(desktop ? 18 : 10) * u}px,0) scale(${1 + (desktop ? .04 : .02) * u})`;
        const opening = Math.min(1, t / .85);
        clip = opening === 1 ? 'none' : `inset(-5% ${100 * (1 - opening)}% -5% -2%)`;
        contentY = (desktop ? 64 : 36) * u;
        opacity = .65 + .35 * t;
    } else if (preset === 'depth') {
        heading = `perspective(1000px) translate3d(0,${(desktop ? 48 : 24) * u}px,${-(desktop ? 120 : 40) * u}px) rotateX(${(desktop ? 18 : 10) * u}deg) scale(${1 - (desktop ? .18 : .08) * u})`;
        contentY = (desktop ? 56 : 32) * u;
        opacity = .65 + .35 * t;
    } else {
        heading = `translate3d(${(desktop ? 22 : 0) * u}%,${(desktop ? 24 : 12) * u}px,0) scale(${1 + (desktop ? .6 : .12) * u})`;
    }
    return {
        heading: t === 1 ? 'none' : heading,
        clip,
        content: t === 1 ? 'none' : `translate3d(${contentX}px,${contentY}px,0)`,
        opacity,
        rule: .18 + .82 * t,
    };
};
