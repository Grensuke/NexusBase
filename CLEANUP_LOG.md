# Cleanup Log

Date: 2026-08-10

## Phase 3: Clean
Removed the following unwanted dependency caches and build artifacts:
- `backend/node_modules/` (Partially removed; some native modules were locked by a running process)
- `frontend/node_modules/` (Partially removed; some native modules were locked by a running process)
- `frontend/.next/` (Removed, including development logs)

## Phase 4: Secure
Secured the following files by scrubbing exposed secrets and rotating local keys:
- `backend/.env.example`: Replaced the hardcoded `JWT_SECRET` with a safe placeholder (`your_jwt_secret_here`).
- `README.md`: Replaced the hardcoded `JWT_SECRET` in the documentation with a safe placeholder.
- `backend/.env`: Rotated the local `JWT_SECRET` to a new dummy value for local development.

*Note: The exposed `JWT_SECRET` in `backend/.env.example` and `README.md` was tracked in git history. You will need to manually rewrite git history (using tools like BFG Repo-Cleaner or `git filter-repo`) if you wish to permanently remove it from the repository's past commits. Since it was rotated locally and replaced with a placeholder, future commits will not contain the exposed value.*
