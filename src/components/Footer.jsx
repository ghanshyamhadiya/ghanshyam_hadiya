import React from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Twitter, Mail, ArrowUp } from 'lucide-react';
import Magnetic from './Magnetic';
import Reveal from './Reveal';
import { profile, socials } from '../data';
import { scrollToSection } from '../utils/smoothScroll';

const ICONS = {
    github: Github,
    linkedin: Linkedin,
    twitter: Twitter,
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
            aria-label={label}
            className="group relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-white/20 bg-white/[0.04] backdrop-blur-sm transition-colors duration-300 hover:bg-white hover:text-black"
        >
            <Icon size={20} />
            <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {label}
            </span>
        </a>
    );
};

const Footer = () => (
    <footer
        id="contact"
        className="relative scroll-mt-28 overflow-hidden border-t border-white/10 bg-black px-5 sm:px-8 md:px-12 pt-24 sm:pt-32 pb-10 text-white"
    >
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center text-center">
            <Reveal className="mb-8 sm:mb-12">
                <h2 className="mb-5 text-[0.65rem] sm:text-sm font-bold uppercase tracking-[0.3em] text-gray-400">
                    Let's create something together
                </h2>
                <a
                    href={`mailto:${profile.email}`}
                    className="magnetic-text block text-[2.7rem] leading-[0.9] sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter transition-colors duration-300 hover:text-gray-400"
                >
                    Get In Touch
                </a>
                <p className="mt-6 text-sm sm:text-base font-medium text-gray-500 break-all">
                    {profile.email}
                </p>
            </Reveal>

            <Reveal delay={0.2} direction="none" className="mb-20 flex flex-wrap justify-center gap-5 sm:gap-8">
                {socials.map((social) => (
                    <Magnetic key={social.label}>
                        <SocialLink {...social} />
                    </Magnetic>
                ))}
            </Reveal>

            <div className="flex w-full flex-col items-center gap-5 border-t border-white/10 pt-7 text-[0.65rem] sm:text-xs font-bold uppercase tracking-[0.2em] text-gray-500 sm:flex-row sm:justify-between">
                <p>© {new Date().getFullYear()} {profile.name}</p>

                <button
                    type="button"
                    onClick={() => scrollToSection('home')}
                    className="group inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 transition-colors duration-300 hover:border-white/40 hover:text-white"
                >
                    Back to top
                    <ArrowUp size={14} className="transition-transform duration-300 group-hover:-translate-y-0.5" />
                </button>
            </div>
        </div>

        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            className="pointer-events-none absolute -top-1/2 -right-[20%] h-[100vw] max-h-[900px] w-[100vw] max-w-[900px] rounded-full border border-white/5 opacity-30"
            aria-hidden="true"
        />
    </footer>
);

export default Footer;
