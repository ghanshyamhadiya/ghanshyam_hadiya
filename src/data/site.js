// Deployment + SEO configuration.
// Everything URL-related reads from here, so moving hosts is a one-line change.

export const site = {
    // Taken from the homepage field on your ghanshyam_hadiya---portfolio repo.
    // Change it if this build deploys somewhere else.
    url: 'https://ghanshyam-hadiya-portfolio.vercel.app',

    name: 'Ghanshyam M. Hadiya',

    // Short form used in the navbar wordmark and footer.
    shortName: 'Ghanshyam',

    jobTitle: 'Data Engineer',

    description:
        'Data engineer building Oracle ODI pipelines and Databricks medallion architectures — from Oracle Fusion ERP ingestion and PL/SQL transformation through to OAC analytics delivery.',

    // 1200x630 link-preview image in /public.
    ogImage: '/og.png',

    locale: 'en_IN',
};

export default site;
