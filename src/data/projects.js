// Featured work. `image` is a path inside /public (or any absolute URL).
// Set `featured: false` to keep a project in the file but hide it from the site.

export const projects = [
    {
        title: 'Data Pipeline Orchestrator',
        tech: 'Python / ODI / Django',
        year: '2025',
        description:
            'A comprehensive data ingestion and transformation pipeline utilizing Oracle ODI and custom Python scripts, managed via a Django REST API.',
        tags: ['ETL', 'Oracle ODI', 'Django REST'],
        image: '/project1.png',
        link: '#',
        featured: true,
    },
    {
        title: 'E-Commerce Monolith',
        tech: 'MERN Stack',
        year: '2024',
        description:
            'Full-stack e-commerce solution featuring real-time inventory tracking, secure authentication, and a headless React/Vite frontend.',
        tags: ['MongoDB', 'Express', 'React', 'Node'],
        image: '/project1.png',
        link: '#',
        featured: true,
    },
    {
        title: 'Analytics Dashboard',
        tech: 'React / Tailwind / SQL',
        year: '2024',
        description:
            'Interactive data visualization dashboard that queries a massive SQL dataset and renders complex charting metrics smoothly.',
        tags: ['React', 'Tailwind', 'SQL'],
        image: '/project1.png',
        link: '#',
        featured: true,
    },
];

export const featuredProjects = projects.filter((project) => project.featured !== false);

export default projects;
