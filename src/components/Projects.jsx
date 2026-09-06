import React, { useRef } from 'react';
import { useScroll } from 'framer-motion';
import Section from './Section';
import Spine from './work/Spine';
import Stage from './work/Stage';
import StageIndex from './work/StageIndex';
import { featuredProjects } from '../data';

// Selected work, presented as one executing pipeline.
//
// A rail runs down the section; a payload token rides it as you scroll. Each
// project is a station on the rail, and when the payload reaches one that
// project's architecture assembles node by node, a run log narrates it from
// real data, and the metrics count up as the run's output.
//
// This replaces a horizontal card carousel. The carousel worked, but it was a
// pattern every portfolio has, and it made no use of the one asset this data
// actually holds: each project carries a real 4-6 node architecture flow. Using
// it turns the section into evidence of pipeline thinking rather than a claim
// of it — which is what data-engineering reviewers look for.
//
// Full detail (approach, stack, repository) unfolds inline per stage, so the
// summary stays scannable without anything becoming unreachable.
const Projects = () => {
    const runRef = useRef(null);

    // Drives the spine fill and the payload token across the whole run.
    const { scrollYProgress } = useScroll({
        target: runRef,
        offset: ['start 65%', 'end 85%'],
    });

    return (
        <Section
            id="work"
            index="05"
            eyebrow="Selected work"
            title="Pipelines I've built"
            intro="Scroll to run them. Each one assembles the way it was built: the problem, the architecture, then the numbers it produced."
            tone="indigo"
            curved
        >
            <StageIndex projects={featuredProjects} />

            <div ref={runRef} className="relative">
                <Spine progress={scrollYProgress} />

                {featuredProjects.map((project, index) => (
                    <Stage
                        key={project.slug}
                        project={project}
                        index={index}
                        total={featuredProjects.length}
                    />
                ))}
            </div>
        </Section>
    );
};

export default Projects;
