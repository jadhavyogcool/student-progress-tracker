# Student Progress Tracker

A full-stack dashboard for professors to track student projects hosted on GitHub. This application provides insights into student activity, including repository details, commit history, and activity trends.

## Features

-   **Dashboard Overview**: View total students, tracked repositories, total commits, and active commits (last 7 days).
-   **Student Management**: Add new students with their details and GitHub repository URLs.
-   **Repository Tracking**: Automatically links GitHub repositories to students.
-   **Commit Sync**: Manually sync commits from GitHub to update the dashboard with the latest data.
-   **Responsive Design**: Clean and modern UI built with React and Vanilla CSS.

## Tech Stack

-   **Frontend**: React, Vite, Vanilla CSS
-   **Backend**: Node.js, Express.js
-   **Database**: Supabase (PostgreSQL)
-   **External APIs**: GitHub REST API
-   **Deployment**: Render (Blueprint / YAML configuration)

## Folder Structure

```
/
├── backend/            # Express.js API server
│   ├── src/
│   │   ├── server.js   # Server entry point
│   │   ├── routes.js   # API routes definitions
│   │   ├── github.js   # GitHub API integration
│   │   └── supabase.js # Supabase client setup
│   ├── schema.sql      # Database schema definitions
│   └── .env.example    # Environment variables template
├── frontend/           # React application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── Dashboard.jsx # Main dashboard view
│   │   └── index.css   # Global styling
│   └── ...
├── render.yaml         # Render deployment configuration
└── .gitignore          # Git ignore rules
```

## Setup Instructions

### Prerequisites
-   Node.js installed
-   A Supabase account and project
-   A GitHub Personal Access Token (classic) with `repo` scope

### 1. Database Setup
1.  Go to your Supabase project dashboard -> SQL Editor.
2.  Run the contents of [backend/schema.sql](backend/schema.sql) to create the necessary tables (`students`, `repositories`, `commits`).

### 2. Environment Variables
Create a `.env` file in the `backend/` directory based on `.env.example`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
GITHUB_TOKEN=your_github_personal_access_token
PORT=3000
```

### 3. Running Locally

**Backend:**
```bash
cd backend
npm install
npm start
```
The server will start on port 3000.

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Access the frontend at the URL provided by Vite (usually http://localhost:5173).

## Deployment

The project is configured for deployment on [Render](https://render.com) using the `render.yaml` blueprint.

1.  Push this repository to GitHub.
2.  Login to Render and create a new **Blueprint**.
3.  Connect your repository.
4.  Render will create two services:
    -   `student-dashboard-backend` (Web Service)
    -   `student-dashboard-frontend` (Static Site)
5.  **Important**: In the Render dashboard, go to the **backend service** settings -> Environment, and add the variables: `SUPABASE_URL`, `SUPABASE_KEY`, and `GITHUB_TOKEN`.

## API Reference

-   `POST /api/student`: Add a new student and their repository.
-   `GET /api/summary`: Get dashboard statistics.
-   `GET /api/students`: List all students and their repositories.
-   `DELETE /api/student/:id`: Remove a student.
-   `POST /api/sync/:repoId`: Sync commits for a specific repository.

## License
MIT
