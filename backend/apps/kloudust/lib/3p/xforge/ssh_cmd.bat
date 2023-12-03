@echo off
setlocal

set LOGIN=%1
set PW=%2
set HOSTKEY=%3
set FILE=%4
set HOST=%5

"%~dp0\plink.exe" -batch -C -l %LOGIN% -pw %PW% -hostkey %HOSTKEY% -m %FILE% %HOST%

exit /b %errorlevel%