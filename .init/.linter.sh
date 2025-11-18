#!/bin/bash
cd /home/kavia/workspace/code-generation/educonnect-learning-platform-268632-268641/lms_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

