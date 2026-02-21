---
applyTo: '**/*.{py,java,sh,ts,c,cs,bt,go,rs,js,jsx,tsx,cpp,h,hpp,rb,php,swift,kt,scala,awk,bpftrace,bash,zsh,fish,ps1}'
description: General coding standards and best practices for code generation
---

## Testing

[unit testing instructions](./unit-testing.instructions.md)

## Coding Rules
- follow case conventions for the language.
- Don't use magic numbers. Define intent with named constants.
- Avoid using magic strings. Either parameterize or create constants.
- Avoid non-standard abbreviations. Use well-known acronyms and idiomatic short names when they improve clarity.
- Organize code files like a newspaper. Headlines (public API) towards the top, with private and helper functions following in the order they're used by the public functions above.
- Minimize the span: the number of lines between declaration and use of a variable.
- A line of code should not exceed 100 characters unless language/project rules require stricter limits.
- A function should typically stay under 40 lines. Longer functions are acceptable when cohesive and documented with a brief "why" comment.
- A file should not exceed 1000 lines (unless there's a compelling reason with "why" comment).
- Functions and methods should have cyclomatic complexity under 10.
- Apply command-query separation principle: functions should either perform an action (command) or return data (query), but not both.

### Comments
- Write docstrings for public classes, functions, and methods. Document private/internal code only when intent is not obvious.
- Use comments to explain "why" something is done, not "what" or "how" it is done.
- Use inline comments for non-obvious tradeoffs (hacks, workarounds, hard-coding, early-binding, limitations). Link known issues when relevant.
- Don't write apology, joke, banner, or version comments. Don't add license comments unless repo policy requires them.

### Code Nesting
- Avoid deeply nested code. Break down logic into smaller functions.
- Use 4 spaces for indentation
- Opening curly braces should be on the same line as the statement.

### Error Handling
- Use guard clauses to handle error cases early and keep the main logic less indented.
- Review for possible exceptions and add exception handling.
- Always catch a specific error instead of a generic one. Prefer standard library exceptions when possible. If you need to catch a generic exception, make sure to log it with enough context to understand the failure.
- Create specific exception classes. Add message with context information and unique identifiers to exceptions.
- If exceptions are related, make that explicit in cause chaining and exception hierarchies.  
- Log the error message with context references and stack trace.

### Terminal commands
- Don't automatically prefix every command with `cd`. Instead, check current working directory is expected before executing commands.
- Don't automatically prefix every script with `chmod +x`. Instead, check if the script is executable before executing it.
- Apply the principle of least privilege to Linux file permissions.
