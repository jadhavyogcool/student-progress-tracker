# Deploying to Render

Follow these steps to deploy your Student Progress Tracker to Render.

## Prerequisites
- A [Render](https://render.com/) account.
- Your code pushed to a GitHub repository.

## Step 1: Connect GitHub to Render
1. Log in to your Render Dashboard.
2. Click **New +** and select **Blueprint**.
3. Connect your GitHub account and select the `student-progress-tracker` repository.

## Step 2: Configure Environment Variables
Render will detect the `render.yaml` file and ask you to fill in the following values for the **Backend Service**:

| Variable | Description |
| :--- | :--- |
| `SUPABASE_URL` | Your Supabase Project URL. |
| `SUPABASE_KEY` | Your Supabase Service Role key. |
| `GITHUB_TOKEN` | Your GitHub Personal Access Token. |
| `ADMIN_PASSWORD` | The password for the admin login. |
| `SESSION_SECRET` | A random string for session security. |
| `FRONTEND_URL` | **(Backend Setting)** The public URL of your frontend (e.g., `https://student-dashboard-frontend.onrender.com`). |
| `VITE_API_URL` | **(Frontend Setting)** The public URL of your backend (e.g., `https://student-dashboard-backend.onrender.com`). |

> [!IMPORTANT]
> Since Render provides random URLs, you might need to:
> 1. Deploy the services first with placeholders.
> 2. Copy the actual URLs Render gives you for each service.
> 3. Go to **Dashboard > Service > Settings > Env Vars** and update them.
> 4. Trigger a "Clear Cache and Redeploy".

## Step 3: Deployment
1. Click **Apply**.
2. Render will automatically build and deploy both the backend and frontend.
3. Once the frontend is deployed, copy its URL and update the `FRONTEND_URL` variable in the backend settings if necessary.

## Auto-Sync
The application is configured to:
- Sync all repositories automatically on startup.
- Sync every 15 minutes while the server is running.
