# 🚀 Vercel + Supabase Setup Instructions

## ✅ What We've Fixed:
- ✅ Added `vercel.json` configuration for full-stack deployment
- ✅ Added date autofill for task creation
- ✅ Fixed modal behavior (only closes with X button)
- ✅ Added category creation in task form
- ✅ Enhanced error handling

## 🗄️ Required Environment Variables in Vercel:

Go to your Vercel dashboard → Project Settings → Environment Variables and add:

```bash
DATABASE_URL=your_supabase_connection_string_here
NODE_ENV=production
PORT=5000
```

### Your Supabase Connection String should look like:
```
postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

## 🔄 After Setting Environment Variables:

1. **Redeploy** your Vercel project (it should auto-deploy after our git push)
2. **Initialize your database** by running this in Supabase SQL Editor:

```sql
-- This will create all the required tables
-- Prisma will handle this automatically once connected
```

## 🎯 Expected Results:
- ✅ Frontend loads at https://taskmaster-portfolio-app.vercel.app/
- ✅ Backend API responds at https://taskmaster-portfolio-app.vercel.app/api/health
- ✅ Database operations work (create/edit/delete tasks, categories, tags)
- ✅ Image uploads work (with Supabase storage)

## 🚨 If Still Getting 404 Errors:
1. Check Vercel build logs for any errors
2. Verify DATABASE_URL is correctly set in environment variables
3. Make sure your Supabase project is active and accessible

The API endpoints should now work:
- `/api/tasks` - Task management
- `/api/categories` - Category management  
- `/api/tags` - Tag management
- `/api/analytics` - Analytics data
- `/api/upload` - Image uploads 