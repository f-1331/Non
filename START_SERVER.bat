@echo off
title Tandir Non - Unified Server & Render Watchdog
cd /d "%~dp0"
echo =======================================================
echo   Tandir Non - Local Server + Auto Failback Watchdog
echo =======================================================
start "Render Auto-Watchdog" /min python render_failback_watchdog.py
python run_unified_server.py
pause
