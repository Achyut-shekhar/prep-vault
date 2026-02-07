# Git Workflow Guide: Using Branches & Commits

This guide explains how to effectively work with Git branches to manage changes in the repository.

## Why Use Branches?
Branches allow you to develop features, fix bugs, or experiment with new ideas in a contained area of your repository without affecting the `main` codebase. This ensures that the `main` branch always remains stable.

## 1. Check Your Current Branch
Before starting any work, always check which branch you are currently on.

```bash
git branch
```
*   The output will list all local branches.
*   The current branch will be highlighted with an asterisk `*` (e.g., `* main`).

## 2. Switch to a Target Branch
If you need to work on an existing branch (e.g., `frontend`, `backend`, or `database`), use the `checkout` command:

```bash
# Switch to the frontend branch
git checkout frontend

# Switch to the backend branch
git checkout backend
```

## 3. Create a New Feature Branch
It's often best practice to create a specific branch for the feature you are building, based on the relevant category branch.

**Example:** If you are adding a login form to the frontend:
1.  Switch to the base branch: `git checkout frontend`
2.  Pull the latest changes: `git pull origin frontend`
3.  Create your new feature branch: `git checkout -b feature/login-form`

## 4. Make Your Changes
Edit files, add new code, or fix bugs in your project. These changes are now isolated to your current branch.

## 5. Stage and Commit Changes
Once you are happy with your work, you need to save (commit) it.

**Step 5a: Check Status**
See which files have been modified:
```bash
git status
```

**Step 5b: Stage Changes**
Prepare files for committing.
*   To stage **all** changes:
    ```bash
    git add .
    ```
*   To stage specific files:
    ```bash
    git add path/to/file.js
    ```

**Step 5c: Commit Changes**
Save the staged changes with a descriptive message.
```bash
git commit -m "feat: implemented login form validation"
```
*   **Tip:** Use clear messages starting with verbs (e.g., "fix:", "feat:", "docs:", "style:").

## 6. Push Changes to Remote
Upload your branch and commits to the remote repository (GitHub).

```bash
# If this is your first time pushing this branch:
git push -u origin <your-branch-name>

# For subsequent pushes:
git push
```

## Summary Workflow
Here is a quick cheat sheet for the daily workflow:

1.  `git checkout backend` (Go to the relevant branch)
2.  `git pull` (Get latest updates)
3.  `[Make your code changes]`
4.  `git add .` (Stage changes)
5.  `git commit -m "Added search api route"` (Save changes)
6.  `git push` (Upload changes)

## Merging (Optional)
When your feature is complete and tested:
1.  Switch to the branch you want to merge into (e.g., `main` or `frontend`).
    ```bash
    git checkout main
    ```
2.  Merge your feature branch.
    ```bash
    git merge <your-branch-name>
    ```
