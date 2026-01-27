import axios from "axios";

export async function fetchCommits(owner, repo) {
    const res = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/commits`,
        {
            headers: {
                Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
            }
        }
    );
    return res.data;
}
