import React, { useEffect, useRef } from 'react';
import { useWorld } from '../hooks/useWorld';

// Reserves a DOM box for a piece of 3D content and registers it with the
// world as a named anchor. The world measures it in document space (never on
// scroll) and projects the matching geometry into it per frame.
const Station = ({ id, className, style }) => {
    const ref = useRef(null);
    const world = useWorld();
    useEffect(() => {
        if (!world.live || !ref.current) return undefined;
        return world.registerAnchor(id, ref.current);
    }, [world, id]);
    return <div ref={ref} data-station={id} aria-hidden="true" className={className} style={style} />;
};

export default Station;
