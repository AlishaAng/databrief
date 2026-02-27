#!/bin/bash

echo ""
echo "🔍 DataBrief — Starting up..."
echo ""

# Check Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed."
    echo "   Download it from https://ollama.com/download then run this script again."
    exit 1
fi

# Check llama3 model is downloaded
if ! ollama list | grep -q "llama3"; then
    echo "⬇️  Downloading llama3 model (this only happens once, ~4GB)..."
    ollama pull llama3
fi

# Check Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed."
    echo "   Download it from https://www.python.org/downloads/"
    exit 1
fi

# Check Node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "   Download it from https://nodejs.org"
    exit 1
fi

# Install Python dependencies if needed
echo "⚙️  Checking Python dependencies..."
cd backend
if [ -f "../.venv/bin/pip" ]; then
    ../.venv/bin/pip install -r requirements.txt -q
elif [ -f "../.venv/bin/pip3" ]; then
    ../.venv/bin/pip3 install -r requirements.txt -q
else
    pip install -r requirements.txt -q
fi
cd ..

# Install Node dependencies if needed
echo "⚙️  Checking frontend dependencies..."
cd frontend
npm install --silent
cd ..

# Start Ollama
echo "🧠 Starting Ollama..."
ollama serve > /dev/null 2>&1 &

# Small delay to let Ollama start
sleep 2

# Start FastAPI backend
echo "⚙️  Starting backend..."
cd backend
if [ -f "../.venv/bin/uvicorn" ]; then
    ../.venv/bin/uvicorn main:app --reload > /dev/null 2>&1 &
else
    uvicorn main:app --reload > /dev/null 2>&1 &
fi
cd ..

# Start React frontend
echo "🎨 Starting frontend..."
echo ""
echo "✅ DataBrief is running — opening at http://localhost:5173"
echo "   Press Ctrl+C to stop."
echo ""
cd frontend
npm run dev