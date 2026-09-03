import React from 'react';
import { Github, Linkedin, Mail, Download, ArrowUpRight, Phone } from 'lucide-react';
import Magnetic from './Magnetic';
import CopyButton from './CopyButton';
import ScrambleText from './ScrambleText';
import Reveal from './Reveal';
import { profile, socials } from '../data';

const ICONS = {
    github: Github,
    linkedin: Linkedin,
    mail: Mail,
};

const SocialLink = ({ href, label, icon }) => {
    const Icon = ICONS[icon] ?? Mail;
    const isExternal = href.startsWith('http');

    return (
        <a
            href={href}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            data-cursor={label.toLowerCase()}
            className="group relative inline-flex items-center gap-2.5 overflow-hidden border border-line px-4 py-2.5 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-muted transition-colors duration-300 hover:border-accent hover:text-bg"
        >
            <span className="absolute inset-0 -translate-x-full bg-accent transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0" />
            <Icon size={14} aria-hidden="true" className="relative" />
            <span className="relative">{label}</span>
            {isExternal && (
                <ArrowUpRight
                    size={12}
                    className="relative transition-transform duration-300 group-hover:rotate-45"
                />
            )}
        </a>
    );
};

const Contact = () => (
    <section
        id="contact"
        aria-labelledby="contact-title"
        className="relative scroll-mt-28 overflow-hidden border-t border-line"
    >
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />

        <div className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32 md:py-40">
            <ScrambleText text="Contact" className="label block text-accent" rescanOnHover />

            {/* Each line reveals through the shared system. These two lines
                previously used whileInView and were measured sitting 36px and
                71px below their masks after a full scroll — never revealed. */}
            <h2
                id="contact-title"
                className="mt-6 max-w-4xl font-display text-display leading-[0.88] text-balance text-ink"
            >
                {['Let\u2019s talk', 'about your data.'].map((line, i) => (
                    <span key={line} className="block overflow-hidden pb-[0.06em]">
                        <Reveal
                            variant="mask"
                            duration={0.8}
                            delay={i * 0.09}
                            className={i === 1 ? 'block text-accent' : 'block'}
                        >
                            {line}
                        </Reveal>
                    </span>
                ))}
            </h2>

            <Reveal
                as="p"
                delay={0.12}
                className="mt-7 max-w-xl border-l border-accent/40 pl-4 text-sm leading-relaxed text-muted sm:mt-8 sm:text-base"
            >
                Open to data engineering roles and interesting pipeline problems. The fastest way to
                reach me is email — I reply to everything.
            </Reveal>

            {/* Full-width stacked buttons on a phone; inline from sm up. */}
            <Reveal
                delay={0.18}
                className="mt-8 flex flex-col gap-2.5 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3"
            >
                <Magnetic>
                    <a
                        href={`mailto:${profile.email}`}
                        data-cursor="write to me"
                        className="group relative inline-flex items-center justify-start gap-2.5 overflow-hidden border border-accent bg-accent px-6 py-3.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-bg transition-colors duration-300 hover:text-accent"
                    >
                        <span className="absolute inset-0 translate-y-full bg-bg transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0" />
                        <Mail size={14} aria-hidden="true" className="relative" />
                        <span className="relative">{profile.email}</span>
                    </a>
                </Magnetic>

                <CopyButton value={profile.email} label="Copy" />

                <a
                    href={profile.resume.href}
                    download
                    data-cursor="download cv"
                    className="group relative inline-flex items-center justify-start gap-2.5 overflow-hidden border border-line-strong px-5 py-3 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted transition-colors duration-300 hover:text-ink"
                >
                    <span className="absolute inset-0 -translate-x-full bg-surface-2 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0" />
                    <Download size={14} aria-hidden="true" className="relative" />
                    <span className="relative">{profile.resume.label}</span>
                </a>

                {profile.phone && (
                    <a
                        href={`tel:${profile.phone.replace(/\s/g, '')}`}
                        className="inline-flex items-center justify-start gap-2.5 border border-line px-5 py-3 font-mono text-[0.68rem] tracking-[0.06em] text-muted transition-colors duration-300 hover:border-accent/50 hover:text-accent"
                    >
                        <Phone size={14} aria-hidden="true" />
                        {profile.phone}
                    </a>
                )}
            </Reveal>

            <Reveal
                delay={0.24}
                className="mt-10 flex flex-wrap gap-2 border-t border-line pt-8 sm:mt-12 sm:pt-10"
            >
                {socials.map((social) => (
                    <SocialLink key={social.label} {...social} />
                ))}
            </Reveal>
        </div>
    </section>
);

export default Contact;
