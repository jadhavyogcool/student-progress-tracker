-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Students table
create table students (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Repositories table
create table repositories (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references students(id) on delete cascade not null,
  repo_url text not null,
  owner text not null,
  repo_name text not null,
  synced_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Commits table
create table commits (
  id uuid default uuid_generate_v4() primary key,
  repo_id uuid references repositories(id) on delete cascade not null,
  sha text unique not null,
  author text,
  commit_date timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
