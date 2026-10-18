# Project Guidelines

These rules apply to all work in this repository.

## 1. English User Interface

- All pages and user-facing interface text must be in English, including navigation, buttons, forms, instructions, notifications, and error messages.

## 2. Testing Before Delivery

- After every change, run the tests and checks relevant to the affected functionality.
- Add or update tests when needed to cover new or changed behavior.
- Fix failures and confirm that the affected functionality works before delivering the change.
- For documentation-only changes, review the changed content and check formatting and whitespace.
- In the delivery message, report what was verified and clearly identify anything that could not be tested. Do not claim unverified functionality is working.

## 3. Commit and Push Every Completed Change

- After each completed change has passed its relevant tests and checks, create a corresponding Git commit with a clear message.
- Push the commit to this project's GitHub repository before delivery.
- Do not include unrelated changes or secrets in a commit.
- If a commit or push fails, resolve the issue before delivery, or clearly report the blocker if it cannot be resolved.
