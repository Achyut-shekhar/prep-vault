# Environment Variables Setup Guide

## ⚠️ CRITICAL SECURITY RULES

**NEVER commit `.env` files with real credentials to Git!**

## Setup Instructions

### Backend Setup

1. **Copy the example file:**
   ```bash
   cp backend/.env.example backend/.env.local
   ```

2. **Edit `backend/.env.local` with YOUR credentials:**
   ```
   PORT=5000
   MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.zdsurm8.mongodb.net/?appName=Cluster0
   JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
   ```

3. **DO NOT commit this file** - `.gitignore` already excludes `.env.local`

### Frontend Setup

1. **Copy the example file:**
   ```bash
   cp frontend/.env.example frontend/.env.development
   ```

2. **Edit `frontend/.env.development` as needed** (this typically has no secrets)

## Getting MongoDB Credentials

1. Go to https://cloud.mongodb.com/v2/6988c2dc524912a87d75a507#/security/database
2. Create a new database user with a strong password
3. Copy the connection string and update `backend/.env.local`

## Team Guidelines

- Never add `.env` files to Git
- Always use `.env.example` as a template
- Rotate credentials regularly
- If credentials are exposed, immediately reset them in MongoDB Atlas
- Use `.env.local`, `.env.production`, or `.env.development` for actual credentials

## Git Policy for .env Files

The following are already in `.gitignore` and will be ignored:
- `.env` - Don't create this; use `.env.local` instead
- `.env.*.local` - For local development overrides
- `.env.production.local` - For production secrets (keep locally only)

## References

- MongoDB Atlas Security: https://cloud.mongodb.com/v2/6988c2dc524912a87d75a507#/security/database
- Best Practices: Never commit sensitive credentials to version control
