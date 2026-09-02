import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, GraduationCap, ShieldCheck } from 'lucide-react';
import Section from './Section';
import { cn } from '../utils/cn';
import { certifications, education } from '../data';
import { EASE_OUT_EXPO, viewport } from '../utils/motion';

const StatusBadge = ({ status }) => {
    const inProgress = status === 'in-progress';
    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.12em]',
                inProgress
                    ? 'border border-dashed border-line-strong text-subtle'
                    : 'border border-accent/40 bg-accent-soft text-accent'
            )}
        >
            {inProgress ? 'In progress' : 'Certified'}
        </span>
    );
};

const Certification = ({ item, index }) => {
    const hasLink = item.url && !item.url.startsWith('TODO:');
    const Wrapper = hasLink ? 'a' : 'div';

    return (
        <motion.li
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.5, delay: index * 0.06, ease: EASE_OUT_EXPO }}
        >
            <Wrapper
                {...(hasLink
                    ? { href: item.url, target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                className={cn(
                    'group block rounded-xl border border-line bg-surface/50 p-5 transition-colors duration-300',
                    hasLink && 'hover:border-accent/40 hover:bg-surface-2/60'
                )}
            >
                <div className="flex items-start justify-between gap-3">
                    <h4 className="text-[0.95rem] font-medium leading-snug text-ink">
                        {item.name}
                    </h4>
                    <StatusBadge status={item.status} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.7rem] text-subtle">
                    <span className="text-muted">{item.issuer}</span>
                    {item.issued && <span>· {item.issued}</span>}
                    {item.credentialId && <span>· {item.credentialId}</span>}
                    {hasLink && (
                        <span className="inline-flex items-center gap-1 text-accent">
                            <ExternalLink size={11} aria-hidden="true" />
                            Verify
                        </span>
                    )}
                </div>
            </Wrapper>
        </motion.li>
    );
};

const Credentials = () => {
    const hasCerts = certifications.length > 0;
    const hasEducation = education.length > 0;
    if (!hasCerts && !hasEducation) return null;

    return (
        <Section
            id="credentials"
            eyebrow="Credentials"
            title="Certifications & education"
            intro="Formal training and verified credentials, with anything still in progress labelled as such."
        >
            <div className="grid gap-12 md:grid-cols-2 md:gap-10">
                {hasCerts && (
                    <div>
                        <h3 className="flex items-center gap-2.5 label text-subtle">
                            <ShieldCheck size={14} className="text-accent" aria-hidden="true" />
                            Certifications
                        </h3>
                        <ul className="mt-6 space-y-3">
                            {certifications.map((item, index) => (
                                <Certification key={item.name} item={item} index={index} />
                            ))}
                        </ul>
                    </div>
                )}

                {hasEducation && (
                    <div>
                        <h3 className="flex items-center gap-2.5 label text-subtle">
                            <GraduationCap size={14} className="text-accent" aria-hidden="true" />
                            Education
                        </h3>
                        <ul className="mt-6 space-y-3">
                            {education.map((item, index) => (
                                <motion.li
                                    key={item.degree}
                                    initial={{ opacity: 0, y: 14 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={viewport}
                                    transition={{
                                        duration: 0.5,
                                        delay: index * 0.06,
                                        ease: EASE_OUT_EXPO,
                                    }}
                                    className="rounded-xl border border-line bg-surface/50 p-5"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <h4 className="text-[0.95rem] font-medium leading-snug text-ink">
                                            {item.degree}
                                        </h4>
                                        <span className="shrink-0 font-mono text-[0.7rem] text-subtle tabular-nums">
                                            {item.start} — {item.end}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm text-muted">{item.institution}</p>
                                    {item.note && (
                                        <p className="mt-2 text-[0.8rem] leading-relaxed text-subtle">
                                            {item.note}
                                        </p>
                                    )}
                                </motion.li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </Section>
    );
};

export default Credentials;
