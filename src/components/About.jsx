import React from 'react';
import Section from './Section';
import { profile } from '../data';

const Row = ({ term, value }) => (
    <div className="flex items-baseline justify-between gap-3 border-t border-line py-2.5">
        <dt className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-subtle">{term}</dt>
        <dd className="text-right text-[0.85rem] font-medium">{value}</dd>
    </div>
);

const About = () => (
    <Section
        id="about"
        index="01"
        eyebrow="Profile"
        title="What I actually do"
        titleLines={['What I', 'actually do']}
        contentClassName="grid gap-10 md:grid-cols-12 md:gap-10"
    >
        <div className="space-y-5 md:col-span-7">
            {profile.about.map((paragraph) => (
                <p key={paragraph} className="text-base leading-relaxed text-muted sm:text-lg">{paragraph}</p>
            ))}
        </div>

        <div className="md:col-span-5 md:self-start">
            <aside className="border-t border-line-strong pt-6" aria-labelledby="about-currently-title">
                <h3 id="about-currently-title" className="label text-pink-deep">{profile.currently.label}</h3>
                <p className="mt-3 text-[0.85rem] leading-relaxed text-ink/80">
                    {profile.currently.text}
                </p>

                <dl className="mt-5">
                    <Row term="Role" value={profile.role} />
                    <Row term="Based in" value={profile.location} />
                    <Row term="Status" value={profile.availability} />
                </dl>
            </aside>
        </div>
    </Section>
);

export default About;
