@echo off
cd /d "%~dp0frontend"

if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
)

if not exist .env (
    echo Creating .env from .env.example...
    copy .env.example .env
)

echo Starting VBMS frontend on http://localhost:5173
call npm run dev

pause
