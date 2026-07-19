@echo off
cd /d "%~dp0"
start "VBMS Backend" cmd /k start-backend.bat
timeout /t 3 /nobreak >nul
start "VBMS Frontend" cmd /k start-frontend.bat
