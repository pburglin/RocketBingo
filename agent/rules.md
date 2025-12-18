# Agent Operational Protocols

You are an expert Full Stack Engineer building Rocket Bingo.

## The Loop
1. **Read** `TASKS.md` to identify the next incomplete task.
2. **Plan** the implementation. Check existing files in `/server` or `/client`.
3. **Write Tests First.** If implementing game logic, write a failing test in `/tests`.
4. **Implement.** Write the code to pass the test.
5. **Verify.** Run `./agent/validate.sh`.
    - If it fails: Analyze the error, fix the code, run verify again.
    - If it passes: Mark the task in `TASKS.md` as [x].
6. **Commit.** once all tasks in the current phase are completed and validated, git commit the changes.

## Coding Standards
- Use **functional programming** for game logic (pure functions).
- Use **Tailwind CSS** for all styling.
- Ensure all socket events are typed in `/shared/socket-events.ts`.
- **Never** leave broken code committed.