# TaskMaster Database Setup Guide

## Step 1: Create .env file in backend directory
```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"
PORT=5000
NODE_ENV=development
```

## Step 2: Generate Prisma Client
```bash
cd backend
npx prisma generate
```

## Step 3: Push Schema to Supabase
```bash
npx prisma db push
```

## Step 4: (Optional) Seed with Sample Data
```bash
npx prisma db seed
```

## Step 5: Restart Development Server
```bash
cd ..
npm run dev
```

## Verification
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

## Troubleshooting
- If you get connection errors, verify your Supabase DATABASE_URL
- If you get 404 errors, make sure both frontend and backend servers are running
- Check console for any error messages during startup 