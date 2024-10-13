@echo off
setlocal

set LOGIN=%1
set PW=%2
set HOSTKEY=%3
set FILE=%4
set PORT=%5
set HOST=%6

"%~dp0\plink.exe" -batch -C -l %LOGIN% -pw %PW% -hostkey %HOSTKEY% -m %FILE% -p %PORT% %HOST%

exit /b %errorlevel%