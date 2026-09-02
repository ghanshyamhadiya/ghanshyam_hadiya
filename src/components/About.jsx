import React from 'react';
import { motion } from 'framer-motion';
import Section from './Section';
import AnimatedText from './AnimatedText';
import { profile } from '../data';
import { EASE_OUT_EXPO, viewport } from '../utils/motion';

const About = () => (
    <Section id="about" eyebrow="Profile" title="What I actually do">
        <div className="grid gap-10 md:grid-cols-12 md:gap-10">
            <div className="space-y-6 md:col-span-8">
                {profile.about.map((paragraph, index) => (
                    <AnimatedText
                        key={index}
                        text={paragraph}
                        delay={index * 0.08}
                        className="text-base leading-relaxed text-muted sm:text-lg"
                    />
                ))}
            </div>

            {/* Replaces the previous full-width scrolling background marquee:
                same job (a bit of texture and a "currently" note), a fraction
                of the cost, and it doesn't fight the editorial tone. */}
            <motion.aside
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewport}
                transition={{ duration: 0.6, delay: 0.15, ease: EASE_OUT_EXPO }}
                className="md:col-span-4"
            >
                <div className="rounded-xl border border-line bg-surface/60 p-5 md:sticky md:top-32">
                    <h3 className="label text-accent">{profile.currently.label}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted">
                        {profile.currently.text}
                    </p>

                    <dl className="mt-6 space-y-3 border-t border-line pt-5">
                        <div className="flex items-baseline justify-between gap-3">
                            <dt className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-subtle">
                                Role
                            </dt>
                            <dd className="text-right text-sm text-ink">{profile.role}</dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-3">
                            <dt className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-subtle">
                                Based in
                            </dt>
                            <dd className="text-right text-sm text-ink">{profile.location}</dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-3">
                            <dt className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-subtle">
                                Status
                            </dt>
                            <dd className="text-right text-sm text-ink">{profile.availability}</dd>
                        </div>
                    </dl>
                </div>
            </motion.aside>
        </div>
    </Section>
);

export default About;
