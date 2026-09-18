import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import useSectionSurface from '../hooks/useSectionSurface';
import { Github, Linkedin, Mail, Download, ArrowUpRight } from 'lucide-react';
import Button from './Button';
import CopyButton from './CopyButton';
import Reveal from './Reveal';
import AnimatedHeading from './type/AnimatedHeading';
import WireGlobe from './WireGlobe';
import SystemBackdrop from './SystemBackdrop';
import { Annotation } from './Signature';
import { profile, socials } from '../data';

const ICONS = { github: Github, linkedin: Linkedin, mail: Mail };

// Separator dot between labelled blocks — the reference contact panel uses
// these rather than rules, which keeps the column feeling like a readout.
const Dot = () => (
    <span aria-hidden="true" className="my-5 block h-1.5 w-1.5 rounded-full bg-canvas/40" />
);

const Field = ({ label, children }) => (
    <div>
        <span className="label block text-amber">{label}</span>
        <div className="mt-2 text-[0.95rem] leading-relaxed text-canvas">{children}</div>
    </div>
);

const Social = ({ href, label, icon }) => {
    const Icon = ICONS[icon] ?? Mail;
    const isExternal = href.startsWith('http');

    return (
        <a
            href={href}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            aria-label={label}
            data-cursor={label.toLowerCase()}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-canvas/30 text-canvas transition-colors duration-300 hover:bg-canvas hover:text-indigo"
        >
            <Icon size={17} aria-hidden="true" />
        </a>
    );
};

// Closing panel, modelled on the HOBRO reference: a giant left-hand element
// with the photo anchored beneath it, and a labelled mono data column on the
// right separated by bullet dots, with a wireframe globe as the recurring mark.
//
// On indigo so it lands as the site's final statement rather than blending into
// the cream canvas above it.
const Contact = () => {
    const sectionRef = useRef(null);
    const surface = useSectionSurface(sectionRef);
    return <motion.section
        ref={sectionRef}
        style={surface}
        data-section-surface=""
        id="contact"
        aria-labelledby="contact-title"
        // Matches Section's `curved`: lifts over the section above with a large
        // rounded top edge instead of butting against it.
        className="relative z-10 -mt-8 scroll-mt-24 overflow-hidden rounded-t-[2rem] bg-indigo text-canvas sm:-mt-14 sm:rounded-t-[3.5rem]"
    >
        <SystemBackdrop dark variant="contact" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28 md:py-32">
            <div>
                <span data-heading-label="" className="label text-amber">Contact</span>
            </div>
            <AnimatedHeading
                id="contact-title"
                text="Let’s talk"
                variant="converge"
                className="mt-5 font-display text-canvas"
            />
            <div className="mt-8 grid gap-12 md:grid-cols-12 md:gap-10">
                {/* Left: the big statement + photo */}
                <div className="flex flex-col items-start md:col-span-6">
                    <Reveal delay={0.1} className="mt-3 flex items-center gap-3">
                        <span className="font-display text-2xl text-amber sm:text-3xl">
                            &copy; 2026
                        </span>
                        <Annotation className="text-pink" rotate={-5}>
                            say hello
                        </Annotation>
                    </Reveal>

                    <Reveal delay={0.16} className="mt-10 text-amber md:mt-auto md:pt-12">
                        <WireGlobe size={180} stroke="currentColor" />
                    </Reveal>
                </div>

                {/* Right: labelled data column */}
                <div className="md:col-span-5 md:col-start-8">
                    <Reveal>
                        <Field label="Location">{profile.location}</Field>
                        <Dot />

                        <Field label="Phone">
                            <a
                                href={`tel:${profile.phone.replace(/\s/g, '')}`}
                                className="font-mono transition-colors hover:text-amber"
                            >
                                {profile.phone}
                            </a>
                        </Field>
                        <Dot />

                        <Field label="Email">
                            <a
                                href={`mailto:${profile.email}`}
                                data-cursor="write to me"
                                className="font-mono break-all transition-colors hover:text-amber"
                            >
                                {profile.email}
                            </a>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <Button
                                    as="a"
                                    href={`mailto:${profile.email}`}
                                    variant="pink"
                                    size="sm"
                                    icon={<ArrowUpRight size={14} />}
                                >
                                    <Mail size={14} aria-hidden="true" />
                                    Email me
                                </Button>
                                <CopyButton value={profile.email} label="Copy" invert />
                            </div>
                        </Field>
                        <Dot />

                        <Field label="Résumé">
                            <Button
                                as="a"
                                href={profile.resume.href}
                                download
                                variant="outlineInvert"
                                size="sm"
                                data-cursor="download cv"
                                icon={<Download size={14} />}
                            >
                                {profile.resume.label}
                            </Button>
                        </Field>
                        <Dot />

                        <Field label="Social">
                            <div className="mt-1 flex flex-wrap gap-2.5">
                                {socials.map((social) => (
                                    <Social key={social.label} {...social} />
                                ))}
                            </div>
                        </Field>
                    </Reveal>

                </div>
            </div>
        </div>
    </motion.section>;
};

export default Contact;
