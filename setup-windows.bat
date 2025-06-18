@echo off
echo ========================================
echo      TaskMaster Setup - Windows
echo ========================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ and try again.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

:: Check Node.js version
echo ✅ Checking Node.js version...
node --version

echo.
echo 📦 Installing dependencies...
echo.

:: Install root dependencies
echo Installing root dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install root dependencies
    pause
    exit /b 1
)

:: Install backend dependencies
echo Installing backend dependencies...
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..

:: Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo ⚙️ Setting up environment...

:: Copy environment file if it doesn't exist
if not exist "backend\.env" (
    echo Creating backend environment file...
    copy "backend\.env.example" "backend\.env" >nul 2>nul
    echo ⚠️ Please edit backend\.env with your PostgreSQL database URL
)

echo.
echo 🎉 Setup complete! 
echo.
echo Next steps:
echo 1. Make sure PostgreSQL is running
echo 2. Update backend\.env with your database URL
echo 3. Run: npm run db:setup  (to initialize database)
echo 4. Run: npm run dev       (to start both servers)
echo.
echo Frontend will be available at: http://localhost:3000
echo Backend API will be available at: http://localhost:5000
echo.
pause 