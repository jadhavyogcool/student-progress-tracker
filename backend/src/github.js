import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export async function fetchCommits(owner, repo, maxCommits = 1000) {
    let allCommits = [];
    let page = 1;
    const perPage = 100;

    try {
        while (allCommits.length < maxCommits) {
            const response = await axios.get(
                `https://api.github.com/repos/${owner}/${repo}/commits`,
                {
                    params: {
                        per_page: perPage,
                        page: page
                    },
                    headers: {
                        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                        Accept: "application/vnd.github.v3+json"
                    }
                }
            );

            const pageCommits = response.data;
            if (!pageCommits || pageCommits.length === 0) break;

            allCommits = [...allCommits, ...pageCommits];

            // If we got fewer than perPage, it's the last page
            if (pageCommits.length < perPage) break;

            page++;
        }

        return allCommits.slice(0, maxCommits);
    } catch (error) {
        console.error(`Error fetching commits for ${owner}/${repo}:`, error.message);
        return allCommits; // Return what we have so far
    }
}
