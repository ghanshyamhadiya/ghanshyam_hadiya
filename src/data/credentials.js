// Certifications and education.
//
// Certifications carry real weight in data-engineering screening, so link the
// credential wherever the issuer provides a verification URL.
//
// status: 'active'    -> solid copper badge
//         'in-progress' -> dashed badge, labelled honestly as in progress
//
// Delete any entry you don't have. An empty list hides its column entirely —
// an aspirational cert you haven't earned is the fastest way to lose trust.

export const certifications = [
    {
        name: 'TODO: Oracle Cloud Infrastructure Data Integration',
        issuer: 'TODO: Oracle',
        issued: 'TODO: 2025',
        credentialId: 'TODO: or delete this field',
        url: 'TODO: verification link, or null',
        status: 'active',
    },
    {
        name: 'TODO: certification you are working towards',
        issuer: 'TODO: issuer',
        issued: null,
        credentialId: null,
        url: null,
        status: 'in-progress',
    },
];

export const education = [
    {
        degree: 'TODO: B.E. / B.Tech in ...',
        institution: 'TODO: University Name',
        start: 'TODO: 2018',
        end: 'TODO: 2022',
        note: 'TODO: optional — specialisation, honours, or relevant coursework',
    },
];

export default certifications;
