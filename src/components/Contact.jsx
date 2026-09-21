import React from 'react';
import { Github, Linkedin, Mail, Download, ArrowUpRight } from 'lucide-react';
import Button from './Button';
import CopyButton from './CopyButton';
import Reveal from './Reveal';
import Section from './Section';
import { profile, socials } from '../data';

const ICONS = { github: Github, linkedin: Linkedin, mail: Mail };

// Separator dot between labelled blocks — the reference contact panel uses
// these rather than rules, which keeps the column feeling like a readout.
const Dot = () => (
    <span aria-hidden="true" className="my-5 block h-px w-8 bg-line" />
);

const Field = ({ label, children }) => (
    <div>
        <span className="label block text-subtle">{label}</span>
        <div className="mt-2 text-[0.95rem] leading-relaxed text-ink">{children}</div>
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
            className="flex h-11 w-11 items-center justify-center rounded-md border border-line text-ink transition-colors duration-300 hover:bg-ink hover:text-canvas"
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
const Contact = () => (
    // Matches Section's `curved`: lifts over the section above with a large
    // rounded top edge instead of butting against it.
    <Section
        id="contact"
        index="07"
        eyebrow="Contact"
        title="Let’s talk"
        titleLines={['Let’s talk']}
        contentClassName="grid gap-12 md:grid-cols-12 md:gap-10"
    >
        {/* Left: the big statement + photo */}
        <div className="flex flex-col items-start md:col-span-6">
            <Reveal delay={0.1} className="mt-3">
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-subtle">
                    {profile.availability}
                </p>
                <a href={`mailto:${profile.email}`} className="editorial-contact-link mt-4">
                    Start a conversation
                    <ArrowUpRight size={20} aria-hidden="true" />
                </a>
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
                        className="font-mono transition-colors hover:text-pink-deep"
                    >
                        {profile.phone}
                    </a>
                </Field>
                <Dot />

                <Field label="Email">
                    <a
                        href={`mailto:${profile.email}`}
                        data-cursor="write to me"
                        className="font-mono break-all transition-colors hover:text-pink-deep"
                    >
                        {profile.email}
                    </a>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                            as="a"
                            href={`mailto:${profile.email}`}
                            variant="ink"
                            size="sm"
                            icon={<ArrowUpRight size={14} />}
                        >
                            <Mail size={14} aria-hidden="true" />
                            Email me
                        </Button>
                        <CopyButton value={profile.email} label="Copy" />
                    </div>
                </Field>
                <Dot />

                <Field label="Résumé">
                    <Button
                        as="a"
                        href={profile.resume.href}
                        download
                        variant="outline"
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
    </Section>
);

export default Contact;
