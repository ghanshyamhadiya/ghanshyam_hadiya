// Work history, newest first. Rendered as a scroll-driven vertical timeline.
// Content taken from GhanshyamHadiya_DataEngineer.pdf.
//
// `companyNote` is a one-line description of what the company does — left null
// because I don't know what Flytics does. Adding it gives a reviewer useful
// context (industry, scale) in one line, so it's worth filling in.

export const experience = [
    {
        role: 'Data Consultant',
        company: 'Flytics',
        companyNote: null,
        location: 'India',
        start: 'Jul 2026',
        end: 'Present',
        current: true,

        summary:
            'Building and maintaining cloud data pipelines on AWS, owning delivery end to end from raw ingestion through transformation to validated reporting output.',

        achievements: [
            'Building and maintaining data pipelines using AWS Glue, PySpark and Python, responsible for end-to-end pipeline delivery from raw ingestion through transformation to validated reporting outputs.',
            'Writing PySpark and Spark SQL transformation logic for data migration, cleansing and validation workflows, with AWS Glue handling pipeline orchestration and scheduling across cloud source systems.',
            'Running SQL-based data validation checks and reconciliation across source and target systems, catching schema mismatches, null violations and business rule failures before data reaches downstream consumers.',
        ],

        stack: ['AWS Glue', 'PySpark', 'Python', 'Spark SQL', 'SQL'],
    },

    {
        role: 'Data Consultant Trainee',
        company: 'Flytics',
        companyNote: null,
        location: 'India',
        start: 'Jan 2026',
        end: 'Jun 2026',
        current: false,

        summary:
            'Built and maintained ETL pipelines in Oracle Data Integrator across enterprise source systems, and wrote the SQL and PL/SQL that fed reporting layers.',

        achievements: [
            'Built ETL pipelines in Oracle Data Integrator across 3+ enterprise source systems including Oracle Fusion ERP, improving consistency in weekly data preparation workflows.',
            'Developed SQL and PL/SQL scripts to extract, transform and load structured data into reporting layers consumed by business stakeholders.',
            'Identified and resolved data quality issues including null values, schema mismatches and format inconsistencies before downstream consumption.',
        ],

        stack: ['Oracle ODI', 'SQL', 'PL/SQL', 'Oracle Fusion ERP'],
    },
];

export default experience;
