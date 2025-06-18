#!/bin/bash

echo "========================================"
echo "     TaskMaster Setup - Linux/Mac"
echo "========================================"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    echo "Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
echo "✅ Checking Node.js version..."
node --version

echo
echo "📦 Installing dependencies..."
echo

# Install root dependencies
echo "Installing root dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install root dependencies"
    exit 1
fi

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
cd ..

echo
echo "⚙️ Setting up environment..."

# Copy environment file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "Creating backend environment file..."
    cp backend/.env.example backend/.env 2>/dev/null || true
    echo "⚠️ Please edit backend/.env with your PostgreSQL database URL"
fi

# Make scripts executable
chmod +x setup-linux.sh
chmod +x run-dev.sh 2>/dev/null || true

echo
echo "🎉 Setup complete!"
echo
echo "Next steps:"
echo "1. Make sure PostgreSQL is running"
echo "2. Update backend/.env with your database URL"
echo "3. Run: npm run db:setup  (to initialize database)"
echo "4. Run: npm run dev       (to start both servers)"
echo
echo "Frontend will be available at: http://localhost:3000"
echo "Backend API will be available at: http://localhost:5000"
echo 