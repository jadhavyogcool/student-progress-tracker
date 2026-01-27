import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export async function fetchCommits(owner, repo) {
    try {
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/commits`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                    Accept: "application/vnd.github.v3+json"
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching commits:", error.message);
        return [];
    }
}
