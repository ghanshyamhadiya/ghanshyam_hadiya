import React from 'react';
import { ArrowUp } from 'lucide-react';
import { profile, navLinks, site } from '../data';
import { scrollToSection } from '../utils/smoothScroll';

// Slimmed down now that the contact call-to-action lives in Contact.jsx.
const Footer = () => (
    <footer className="border-t border-line px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
                <p className="font-display text-xl text-ink">{site.shortName}</p>
                <p className="mt-1 font-mono text-[0.68rem] uppercase tracking-[0.15em] text-subtle">
                    {profile.role}
                </p>
            </div>

            <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
                {navLinks.map((link) => (
                    <a
                        key={link.id}
                        href={`#${link.id}`}
                        className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-subtle transition-colors duration-300 hover:text-accent"
                    >
                        {link.title}
                    </a>
                ))}
            </nav>

            <div className="flex items-center gap-5">
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-subtle">
                    © {new Date().getFullYear()}
                </p>
                <button
                    type="button"
                    onClick={() => scrollToSection('home')}
                    className="group inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-subtle transition-colors duration-300 hover:border-accent/50 hover:text-accent"
                >
                    Top
                    <ArrowUp
                        size={13}
                        className="transition-transform duration-300 group-hover:-translate-y-0.5"
                    />
                </button>
            </div>
        </div>
    </footer>
);

export default Footer;
