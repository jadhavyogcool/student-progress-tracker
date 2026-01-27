import { useEffect, useState } from "react";

export default function Dashboard() {
    const [summary, setSummary] = useState({});
    const [students, setStudents] = useState([]);

    useEffect(() => {
        fetch("/api/summary").then(r => r.json()).then(setSummary);
        fetch("/api/students").then(r => r.json()).then(setStudents);
    }, []);

    return (
        <div>
            <h1>Student Project Dashboard</h1>

            <p>Total Students: {summary.students}</p>
            <p>Repositories: {summary.repositories}</p>
            <p>Total Commits: {summary.commits}</p>
            <p>Active (7 days): {summary.active}</p>

            <hr />

            {students.map(s => (
                <div key={s.id}>
                    <h3>{s.name}</h3>
                    {s.repositories.map(r => (
                        <a key={r.id} href={r.repo_url} target="_blank">
                            {r.repo_url}
                        </a>
                    ))}
                </div>
            ))}
        </div>
    );
}
