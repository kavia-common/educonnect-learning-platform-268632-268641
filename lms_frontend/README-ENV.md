# Environment Configuration

This app uses Create React App and reads environment variables with the REACT_APP_ prefix.

Required:
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_KEY

Optional:
- REACT_APP_FRONTEND_URL (used for auth email redirect)
- REACT_APP_API_BASE, REACT_APP_BACKEND_URL, REACT_APP_WS_URL, etc.

Copy .env.example to .env and fill in your values:

cp .env.example .env
