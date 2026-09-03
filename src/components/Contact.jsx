import React from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Mail, Download, ArrowUpRight, Phone } from 'lucide-react';
import Magnetic from './Magnetic';
import CopyButton from './CopyButton';
import { profile, socials } from '../data';
import { EASE_OUT_EXPO, viewport } from '../utils/motion';

const ICONS = {
    github: Github,
    linkedin: Linkedin,
    mail: Mail,
};

const SocialLink = ({ href, label, icon }) => {
    const Icon = ICONS[icon] ?? Mail;
    const isPlaceholder = href.startsWith('TODO:');
    const isExternal = href.startsWith('http');

    return (
        <a
            href={isPlaceholder ? undefined : href}
            aria-disabled={isPlaceholder || undefined}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className="group inline-flex items-center gap-2.5 rounded-full border border-line px-4 py-2.5 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-muted transition-colors duration-300 hover:border-accent/50 hover:text-accent"
        >
            <Icon size={14} aria-hidden="true" />
            {label}
            {isExternal && (
                <ArrowUpRight
                    size={12}
                    className="transition-transform duration-300 group-hover:rotate-45"
                />
            )}
        </a>
    );
};

const Contact = () => (
    <section
        id="contact"
        aria-labelledby="contact-title"
        className="scroll-mt-28 border-t border-line px-5 py-24 sm:px-8 sm:py-32 md:py-40"
    >
        <div className="mx-auto max-w-6xl">
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewport}
                transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                className="label text-accent"
            >
                Contact
            </motion.p>

            <span className="mt-6 block overflow-hidden pb-1">
                <motion.h2
                    id="contact-title"
                    initial={{ y: '110%' }}
                    whileInView={{ y: '0%' }}
                    viewport={viewport}
                    transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
                    className="max-w-3xl font-display text-display leading-[0.95] text-ink"
                >
                    Let's talk about your <span className="italic text-accent">data</span>.
                </motion.h2>
            </span>

            <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewport}
                transition={{ duration: 0.55, delay: 0.1, ease: EASE_OUT_EXPO }}
                className="mt-8 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
            >
                Open to data engineering roles and interesting pipeline problems. The fastest way to
                reach me is email — I reply to everything.
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewport}
                transition={{ duration: 0.55, delay: 0.18, ease: EASE_OUT_EXPO }}
                className="mt-10 flex flex-wrap items-center gap-3"
            >
                <Magnetic>
                    <a
                        href={`mailto:${profile.email}`}
                        className="inline-flex items-center gap-2.5 rounded-full bg-accent px-6 py-3.5 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-bg transition-colors duration-300 hover:bg-accent-hi"
                    >
                        <Mail size={14} aria-hidden="true" />
                        {profile.email}
                    </a>
                </Magnetic>

                <CopyButton value={profile.email} label="Copy email" className="py-3" />

                <a
                    href={profile.resume.href}
                    download
                    className="inline-flex items-center gap-2.5 rounded-full border border-line-strong px-5 py-3 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-muted transition-colors duration-300 hover:border-accent/50 hover:text-accent"
                >
                    <Download size={14} aria-hidden="true" />
                    {profile.resume.label}
                </a>

                {profile.phone && (
                    <a
                        href={`tel:${profile.phone.replace(/\s/g, '')}`}
                        className="inline-flex items-center gap-2.5 rounded-full border border-line px-5 py-3 font-mono text-[0.7rem] tracking-[0.08em] text-muted transition-colors duration-300 hover:border-accent/50 hover:text-accent"
                    >
                        <Phone size={14} aria-hidden="true" />
                        {profile.phone}
                    </a>
                )}
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={viewport}
                transition={{ duration: 0.6, delay: 0.28 }}
                className="mt-12 flex flex-wrap gap-3 border-t border-line pt-10"
            >
                {socials.map((social) => (
                    <SocialLink key={social.label} {...social} />
                ))}
            </motion.div>
        </div>
    </section>
);

export default Contact;
