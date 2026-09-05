import React from 'react';
import { ExternalLink, GraduationCap, ShieldCheck } from 'lucide-react';
import Section from './Section';
import Panel from './Panel';
import { cn } from '../utils/cn';
import { certifications, education } from '../data';
import { stagger } from '../utils/motion';

const StatusBadge = ({ status }) => {
    const inProgress = status === 'in-progress';
    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.08em]',
                inProgress
                    ? 'border border-dashed border-line-strong text-subtle'
                    : 'bg-pink text-ink'
            )}
        >
            {inProgress ? 'In progress' : 'Certified'}
        </span>
    );
};

const Certification = ({ item, index }) => {
    const hasLink = Boolean(item.url);

    return (
        <li>
            <Panel
                as={hasLink ? 'a' : 'div'}
                delay={stagger(index)}
                hover={hasLink}
                className="block p-5"
                {...(hasLink
                    ? { href: item.url, target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
            >
                <div className="flex items-start justify-between gap-3">
                    <h4 className="font-display text-base leading-snug">{item.name}</h4>
                    <StatusBadge status={item.status} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.68rem] text-subtle">
                    <span className="text-muted">{item.issuer}</span>
                    {item.issued && <span>· {item.issued}</span>}
                    {item.credentialId && <span>· {item.credentialId}</span>}
                    {hasLink && (
                        <span className="inline-flex items-center gap-1 text-pink-deep">
                            <ExternalLink size={11} aria-hidden="true" />
                            Verify
                        </span>
                    )}
                </div>
            </Panel>
        </li>
    );
};

const Credentials = () => {
    const hasCerts = certifications.length > 0;
    const hasEducation = education.length > 0;
    if (!hasCerts && !hasEducation) return null;

    return (
        <Section
            id="credentials"
            index="06"
            eyebrow="Credentials"
            // Heading follows the data: with no certifications yet the section
            // presents itself as education rather than showing an empty column.
            title={hasCerts ? 'Certifications & education' : 'Education'}
            intro={
                hasCerts
                    ? 'Formal training and verified credentials, with anything still in progress labelled as such.'
                    : 'Formal training behind the production work.'
            }
            tone="canvas"
        >
            <div className={cn('grid gap-10', hasCerts && 'md:grid-cols-2')}>
                {hasCerts && (
                    <div>
                        <h3 className="label flex items-center gap-2.5 text-subtle">
                            <ShieldCheck size={14} className="text-indigo" aria-hidden="true" />
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
                        <h3 className="label flex items-center gap-2.5 text-subtle">
                            <GraduationCap size={14} className="text-indigo" aria-hidden="true" />
                            Education
                        </h3>
                        <ul className="mt-6 space-y-3">
                            {education.map((item, index) => (
                                <li key={item.degree}>
                                    <Panel delay={stagger(index)} className="p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <h4 className="font-display text-base leading-snug">
                                                {item.degree}
                                            </h4>
                                            <span className="shrink-0 font-mono text-[0.68rem] text-subtle tabular-nums">
                                                {item.start} → {item.end}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-[0.9rem] text-muted">
                                            {item.institution}
                                        </p>
                                        {item.note && (
                                            <p className="mt-2 text-[0.8rem] leading-relaxed text-subtle">
                                                {item.note}
                                            </p>
                                        )}
                                    </Panel>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </Section>
    );
};

export default Credentials;
