export const testRunnerT = {
  "backToWorkspace": "Back to Workspace",
  "title": "Launch Auto Test",
  "subtitle": "Upload a .zip file containing your source code. The system will store it in your workspace, extract it, and prepare it for automated analysis.",
  "dropzone": {
    "title": "Drag & drop your .zip source code here",
    "subtitle": "or click to browse from your computer",
    "supported": "Supported: .zip",
    "remove": "Remove file"
  },
  "testType": "Test Type",
  "types": [
    {
      "label": "UI Testing",
      "desc": "Test the user interface with Playwright"
    },
    {
      "label": "API Testing",
      "desc": "Test backend API endpoints"
    },
    {
      "label": "Functional Testing",
      "desc": "Test business logic and functionality"
    }
  ],
  "startBtn": "Start Test",
  "starting": "Starting...",
  "toasts": {
    "selectZip": "Please select a .zip source code file",
    "fileSelected": "File selected",
    "uploadFirst": "Please upload a .zip source code file to get started!",
    "pipelineStarted": "Test pipeline started!",
    "uploadError": "An error occurred while uploading source code"
  }
};

export const testProgressT = {
  "backToWorkspace": "Back to Workspace",
  "title": "Auto Test Progress",
  "status": "Status",
  "currentStage": "Current stage",
  "loading": "Loading...",
  "stageLabels": {
    "queued": "Queued",
    "initializing": "Initializing",
    "detector": "Detector",
    "analyzer": "Analyzer",
    "planner": "Planner",
    "filter": "Filter",
    "coder": "Coder",
    "validator": "Validator",
    "debugger": "Debugger",
    "executor": "Executor",
    "reporter": "Reporter",
    "completed": "Completed",
    "failed": "Failed"
  },
  "messages": {
    "initializing": "Initializing test pipeline.",
    "reconnecting": "Reconnecting to the test job status...",
    "stillReconnecting": "Still reconnecting to the test job status. The backend may be waking up or restarting.",
    "loadFailed": "Failed to load pipeline status."
  },
  "dryRun": "Running in dry-run mode — no real pipeline has been triggered.",
  "report": "Report",
  "failureDetails": "Failure details",
  "noErrorMessage": "The pipeline stopped before returning an error message.",
  "viewReport": "View report",
  "goToWorkspace": "Go to Workspace",
  "signInRequired": "Please sign in to view test progress"
};

export const testReportT = {
  "backToWorkspace": "Back to Workspace",
  "title": "Final test report",
  "testResult": "Test Result",
  "summary": {
    "executionTime": "Execution time",
    "passed": "Passed",
    "failed": "Failed",
    "totalTests": "Total tests",
    "finishedAt": "Finished at"
  },
  "issues": {
    "title": "Detected issues",
    "unit": "issue(s)",
    "none": "No issues were reported in the final result."
  },
  "loading": "Loading report...",
  "notAvailable": "Report is not available",
  "notAvailableHint": "The test run has not produced a final report yet.",
  "toasts": {
    "signInRequired": "Please sign in to view the report",
    "loadFailed": "Failed to load test report"
  }
};
