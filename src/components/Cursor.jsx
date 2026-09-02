import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useIsTouch } from '../hooks/useMediaQuery';

const Cursor = () => {
    const isTouch = useIsTouch();

    const [mousePosition, setMousePosition] = useState({
        x: 0,
        y: 0,
    });

    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (isTouch) return undefined;

        const updateMousePosition = (e) => {
            setMousePosition({
                x: e.clientX,
                y: e.clientY,
            });

            // Simple check to determine if hovering over something clickable or interesting
            const target = e.target;
            if (
                target.tagName.toLowerCase() === 'a' ||
                target.tagName.toLowerCase() === 'button' ||
                target.closest('a') ||
                target.closest('button') ||
                target.closest('h1') ||
                target.closest('h2') ||
                target.closest('.group') ||
                target.closest('.magnetic-text')
            ) {
                setIsHovered(true);
            } else {
                setIsHovered(false);
            }
        };

        window.addEventListener('mousemove', updateMousePosition);

        return () => {
            window.removeEventListener('mousemove', updateMousePosition);
        };
    }, [isTouch]);

    const variants = {
        default: {
            x: mousePosition.x,
            y: mousePosition.y,
            width: 0,
            height: 0,
            backgroundColor: "#ffffff",
            mixBlendMode: "difference",
            transition: {
                type: "spring",
                stiffness: 700,
                damping: 30,
                mass: 0.5
            }
        },
        hover: {
            x: mousePosition.x - 40,
            y: mousePosition.y - 40,
            width: 80,
            height: 80,
            backgroundColor: "#ffffff",
            mixBlendMode: "difference",
            scale: 1.2,
            transition: {
                type: "spring",
                stiffness: 500,
                damping: 25,
                mass: 0.5
            }
        }
    };

    // No custom cursor on touch devices.
    if (isTouch) return null;

    return (
        <>
            <motion.div
                variants={variants}
                animate={isHovered ? "hover" : "default"}
                className="fixed top-0 left-0 bg-black rounded-full pointer-events-none z-[9999]"
                style={{
                    boxShadow: isHovered ? "0 0 20px rgba(255,255,255,0.4)" : "none", // Add slight glow on hover
                }}
            />

            {/* Outer subtle ring for trailing effect */}
            <motion.div
                animate={{
                    x: mousePosition.x - 24,
                    y: mousePosition.y - 24,
                    scale: isHovered ? 0 : 1, // Shrink outer ring when hovered to focus on the big inner blob
                    opacity: isHovered ? 0 : 0.5
                }}
                transition={{
                    type: "spring",
                    stiffness: 250,
                    damping: 20,
                    mass: 0.8 // slightly higher mass for that trailing/lagging feel
                }}
                className="fixed top-0 left-0 w-12 h-12 border border-black rounded-full pointer-events-none z-[9998] mix-blend-difference"
            />
        </>
    );
}

export default Cursor;
