@echo off
setlocal
cd /d "%~dp0"

if not exist "node_modules\electron\dist\electron.exe" (
  echo Instalowanie wymaganych skladnikow ORBIT//04...
  call npm.cmd install
  if errorlevel 1 (
    echo.
    echo Instalacja nie powiodla sie. Zostaw to okno otwarte i wyslij jego tresc.
    pause
    exit /b 1
  )
)

call npm.cmd start
if errorlevel 1 (
  echo.
  echo Gra nie wystartowala. Zostaw to okno otwarte i wyslij jego tresc.
  pause
)
