# Kloudust Test Scripts

This repository contains test scripts designed to verify and validate features of the **Kloudust** platform.

All test case filenames should follow the format:  
    
    test_<testname>.js

## 🚀 How to Run Test Cases

### 1. Navigate to the Testing Directory

    cd <path-to-monkshu>/backend/server/testing

### 2. Run a Test Case
Use the Monkshu test case runner script:

    ./runTests.sh.bat <path-to-your-tests-directory OR current-directory> <test-case-name> <space-separated-test-case-params>

## 📁 conf Folder
constants.js
- This file holds commonly used constants for test execution.
- You can add your constants as needed.
- The AUTH_TOKEN constant is required for user identification. Ensure that you replace it with your test account’s valid access token.
- Ensure that the test user exists in the Kloudust database:
    <path-to-kloudust>/backend/apps/kloudust/dbs/kloudust.db

custom.js:
This file is used to run custom test cases that execute multiple predefined operations in a sequence.

Format of custom.js:

    [
        {
            "commandName": "<name-of-command>",
            "description": "<brief-description>",
            "params": ["param1", "param2", ...]
        }
    ]

🧪 How to Run Custom Test Cases

    ./runTests.sh.bat <path-to-your-tests-directory OR current-directory> custom [CSV_Report_File_Name] [Report_Output_Directory]

CLI Arguments for Custom Tests

Argument  |  Description

    argv[0]     Test name (always "custom" in this case) [required]
    argv[1]     CSV report file name (e.g., report.csv) [optional]
    argv[2]     Directory to save the generated CSV report (e.g., /home/user/Downloads) [optional]
If not provided, the report will be generated in the test directory.

✅ Example Commands
Run a single test case:

    ./runTests.sh.bat ./ test_login.js user@example.com myPassword

Run a custom test suite:

    ./runTests.sh.bat ./ custom ./custom.json myReport.csv ./reports/