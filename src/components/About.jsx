import React from 'react';
import Section from './Section';
import Panel from './Panel';
import AnimatedText from './AnimatedText';
import { profile } from '../data';

const Row = ({ term, value }) => (
    <div className="flex items-baseline justify-between gap-3 border-t border-line py-2.5">
        <dt className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-subtle">{term}</dt>
        <dd className="text-right text-[0.8rem] text-ink">{value}</dd>
    </div>
);

const About = () => (
    <Section id="about" index="01" eyebrow="Profile" title="What I actually do">
        <div className="grid gap-10 md:grid-cols-12">
            <div className="space-y-6 md:col-span-8">
                {profile.about.map((paragraph, index) => (
                    <AnimatedText
                        key={index}
                        text={paragraph}
                        delay={index * 0.06}
                        className="text-sm leading-relaxed text-muted sm:text-base"
                    />
                ))}
            </div>

            <div className="md:col-span-4">
                <Panel className="p-5 md:sticky md:top-32">
                    <h3 className="label text-accent">{profile.currently.label}</h3>
                    <p className="mt-3 text-[0.8rem] leading-relaxed text-muted">
                        {profile.currently.text}
                    </p>

                    <dl className="mt-6">
                        <Row term="Role" value={profile.role} />
                        <Row term="Based in" value={profile.location} />
                        <Row term="Status" value={profile.availability} />
                    </dl>
                </Panel>
            </div>
        </div>
    </Section>
);

export default About;
