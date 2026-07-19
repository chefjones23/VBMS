@echo off
cd /d "%~dp0backend"

if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
)

if not exist .env (
    echo Creating .env from .env.example...
    copy .env.example .env
)

echo Seeding demo accounts (safe to re-run)...
call node seed.js

echo Starting VBMS backend on http://localhost:5000
call npm start

pause
