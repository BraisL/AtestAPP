@echo off
setlocal

rem Launcher local para AtestApp (doble clic)
rem 1) Intenta abrir con Google Chrome en modo app
rem 2) Si no encuentra Chrome, abre index.html con el navegador predeterminado

set "BASE=%~dp0"
set "INDEX=%BASE%index.html"
set "INDEX_URL=file:///%INDEX:\=/%"
set "CHROME_EXE="

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  set "CHROME_EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
)

if not defined CHROME_EXE if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
  set "CHROME_EXE=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
)

if not defined CHROME_EXE if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
  set "CHROME_EXE=%LocalAppData%\Google\Chrome\Application\chrome.exe"
)

if not exist "%INDEX%" (
  echo No se encontro index.html junto al lanzador.
  echo Ruta esperada: %INDEX%
  pause
  exit /b 1
)

if defined CHROME_EXE (
  rem Pasamos URL file:/// para que Chrome abra el index local de forma fiable.
  rem Añadimos la URL también como argumento normal por compatibilidad.
  start "" "%CHROME_EXE%" --app="%INDEX_URL%" "%INDEX_URL%"
  exit /b 0
)

start "" "%INDEX%"
exit /b 0
