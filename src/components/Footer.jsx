import React from 'react';
import { ArrowUp } from 'lucide-react';
import { profile, navLinks, site } from '../data';
import { scrollToSection } from '../utils/smoothScroll';

const Footer = () => (
    <footer className="border-t border-line bg-canvas px-5 py-9 text-ink sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-7 md:flex-row md:items-center md:justify-between">
            <div>
                <p className="font-display text-xl">{site.shortName}</p>
                <p className="mt-1 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-subtle">
                    {profile.role}
                </p>
            </div>

            <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
                {navLinks.map((link) => (
                    <a
                        key={link.id}
                        href={`#${link.id}`}
                        className="font-display text-[0.85rem] font-semibold text-muted transition-colors duration-300 hover:text-ink"
                    >
                        {link.title}
                    </a>
                ))}
            </nav>

            <div className="flex items-center gap-5">
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.1em] text-subtle">
                    © {new Date().getFullYear()}
                </p>
                <button
                    type="button"
                    onClick={() => scrollToSection('home')}
                    data-cursor="top"
                    className="group inline-flex items-center gap-2 rounded-md border border-ink px-4 py-2 font-display text-[0.8rem] font-semibold text-ink transition-colors duration-300 hover:bg-ink hover:text-canvas"
                >
                    Top
                    <ArrowUp
                        size={14}
                        className="transition-transform duration-300 group-hover:-translate-y-0.5"
                    />
                </button>
            </div>
        </div>
    </footer>
);

export default Footer;
