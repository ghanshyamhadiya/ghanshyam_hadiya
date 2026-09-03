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
        'Data engineer building cloud data pipelines with AWS Glue, PySpark, Python and SQL — end-to-end delivery from raw ingestion through transformation to validated reporting output.',

    // 1200x630 link-preview image in /public.
    ogImage: '/og.png',

    locale: 'en_IN',
};

export default site;
