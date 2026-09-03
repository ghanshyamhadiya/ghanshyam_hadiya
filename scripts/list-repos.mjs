// Lists public repos so project links can use real URLs instead of guesses.
const user = process.argv[2];
const res = await fetch(
    `https://api.github.com/users/${user}/repos?per_page=100&sort=updated`,
    { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'portfolio-setup' } }
);

if (!res.ok) {
    console.error(`GitHub API ${res.status}`);
    process.exit(1);
}

const repos = await res.json();
console.log(`${repos.length} public repos\n`);
for (const r of repos) {
    console.log(
        `${r.name}\n  lang=${r.language ?? '-'}  pushed=${r.pushed_at?.slice(0, 10)}  stars=${r.stargazers_count}` +
            `\n  desc=${r.description ?? '(none)'}\n  home=${r.homepage || '-'}\n`
    );
}
