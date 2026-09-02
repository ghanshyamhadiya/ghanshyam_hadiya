// Deployment + SEO configuration.
// Everything URL-related reads from here, so moving hosts is a one-line change.

export const site = {
    // TODO: set this to your real Vercel domain (no trailing slash), e.g.
    // 'https://yourname.vercel.app'. Until the TODO prefix is removed the build
    // deliberately omits canonical/sitemap URLs rather than publishing a
    // pointing-nowhere domain, which would hurt SEO more than having none.
    url: 'TODO: https://your-portfolio.vercel.app',

    // TODO: your name — also used for the JSON-LD Person schema.
    name: 'TODO: Your Name',

    // Short form used in the navbar wordmark and footer.
    shortName: 'TODO: Name',

    jobTitle: 'Data Engineer',

    description:
        'Data engineer building reliable ETL pipelines, dimensional warehouse models and orchestrated data platforms with Oracle ODI, Python, SQL and Airflow.',

    // 1200x630 image in /public. TODO: replace the placeholder.
    ogImage: '/og.png',

    locale: 'en_US',
};

export default site;
