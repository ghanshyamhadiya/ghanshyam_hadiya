// Personal details, hero copy and contact links.
// Edit this file to update the top of the site and the footer.

export const profile = {
    name: 'Portfolio',
    role: 'MERN Stack Developer & Data Engineer',
    // Each array entry becomes one line of the giant hero headline.
    headline: ['I build exceptional', 'digital experiences'],
    intro:
        'Specializing in building robust web applications with the MERN stack, Python, and Django. Currently expanding my expertise as an Oracle ODI Data Engineer.',
    // The About section renders one animated paragraph per entry.
    about: [
        'I am a passionate software developer specializing in creating seamless, intuitive, and highly functional digital experiences. With a strong foundation in the MERN stack, I build robust, scalable applications from back to front.',
        'Beyond JavaScript, my expertise extends into data management and backend logic using Python, Django, and SQL. I am deeply dedicated to continuous learning, currently mastering Oracle ODI to become a multifaceted Data Engineer capable of orchestrating complex data workflows.',
        'My design philosophy is simple: clarity over clutter. I believe in writing clean code and designing minimalist interfaces that perform flawlessly.',
    ],
    // Scrolling marquee text behind the About section.
    marquee: 'Data Engineer — Developer — Problem Solver —',
    email: 'hello@example.com',
    availability: 'Available for new projects',
    cta: {
        label: "Let's Talk",
        href: '#contact',
    },
};

// `icon` must match a key in the ICONS map inside src/components/Footer.jsx
export const socials = [
    { label: 'GitHub', icon: 'github', href: 'https://github.com/' },
    { label: 'LinkedIn', icon: 'linkedin', href: 'https://linkedin.com/' },
    { label: 'Twitter', icon: 'twitter', href: 'https://twitter.com/' },
    { label: 'Email', icon: 'mail', href: `mailto:${profile.email}` },
];

export default profile;
