@echo off
:: Check for Admin rights
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Administrator confirmed. Resetting password...
) else (
    echo Requesting Administrator privileges...
    powershell -Command "Start-Process '%~0' -Verb RunAs"
    exit /b
)

set HBA=C:\Program Files\PostgreSQL\16\data\pg_hba.conf
powershell -Command "(Get-Content '%HBA%') -replace 'scram-sha-256', 'trust' | Set-Content '%HBA%'"
net stop postgresql-x64-16
net start postgresql-x64-16
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "ALTER USER postgres WITH PASSWORD 'password';"
powershell -Command "(Get-Content '%HBA%') -replace 'trust', 'scram-sha-256' | Set-Content '%HBA%'"
net stop postgresql-x64-16
net start postgresql-x64-16
echo.
echo =======================================================
echo SUCCESS! Your database password is now 'password'
echo =======================================================
pause
