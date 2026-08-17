@echo off
setlocal
cd /d "%~dp0"

if not exist "node_modules\electron\dist\electron.exe" (
  echo Installing ORBIT//04 dependencies...
  call npm.cmd install
  if errorlevel 1 (
    echo.
    echo Installation failed. Keep this window open and include the complete output in a bug report.
    pause
    exit /b 1
  )
)

call npm.cmd start
if errorlevel 1 (
  echo.
  echo The game did not start. Keep this window open and include the complete output in a bug report.
  pause
)
