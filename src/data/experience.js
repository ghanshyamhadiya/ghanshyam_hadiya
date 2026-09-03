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
            'Building data pipelines and analytics layers on Oracle Cloud Infrastructure and Oracle Analytics Cloud for enterprise reporting, alongside Spark-based migration work.',

        achievements: [
            'Working on Oracle OCI and OAC implementations, building the data pipelines and analytics layers that sit on top of them for enterprise reporting.',
            'Writing Spark SQL and PySpark transformation logic for data migration and ETL workflows, including AWS Glue jobs for cloud-based pipeline orchestration across source systems.',
            'Designing and reviewing ODI mappings and session flows for ongoing Oracle Fusion ERP integrations, owning data validation, reconciliation and quality checks before delivery to downstream consumers.',
        ],

        stack: ['Oracle ODI', 'OCI', 'OAC', 'PySpark', 'Spark SQL', 'AWS Glue'],
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
