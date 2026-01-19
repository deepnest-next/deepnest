---
description: Pre-PR validation with GitHub-quality code review and AUTO-FIX capability. Runs 9 parallel checks using battle-tested prompts from the GitHub PR review system, plus automated lint/types/tests. When issues are found, spawns up to 3 sub-agents with fresh context windows to fix them. Includes SELF-REVIEW LOOP to verify fixes and catch new issues. USE WHEN validate, ready for PR, pre-PR check.
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, Task, TodoWrite
user-invocable: true
---

# Pre-PR Validation Skill (Enhanced with GitHub-Quality Review)

You are a **senior staff engineer** performing a thorough pre-PR code review. Your job is to catch issues BEFORE the PR is created, so the author can fix them proactively.

**This skill uses the SAME battle-tested review prompts as the GitHub PR AI review system**, ensuring you catch the same issues locally that would be found during PR review - saving multiple CI wait cycles.

You have capabilities far beyond simple regex patterns - you can read code, understand context, reason about architecture, and make nuanced judgments.

---

## ⚡ MAXIMUM PARALLELIZATION

**You MUST use the `Task` tool to spawn ALL sub-agents simultaneously after Phase 1.** This dramatically speeds up validation from ~30 minutes to ~5 minutes.

### Required Parallel Execution

After Phase 1 completes, spawn **ALL 9 sub-agents at once**:
- 2 automated check sub-agents (frontend + backend)
- 7 code review sub-agents (security, quality, logic, codebase-fit, test integrity, i18n, cross-platform)

**DO NOT wait for automated checks before starting code reviews.** All 9 run in parallel.

---

## PROGRESS TRACKING (REQUIRED)

**At the START of every validation, create a todo list to track progress.** This helps the user see exactly where you are in the validation process.

```
TodoWrite with merge=false:
- id: "val-1", content: "🔍 Phase 1: Understand changes (git diff, scope)", status: "in_progress"
- id: "val-2", content: "🚀 Phase 2: ALL checks in parallel [9 sub-agents]", status: "pending"
- id: "val-3", content: "📋 Phase 3: Cross-validate & synthesize findings", status: "pending"
- id: "val-4", content: "🔧 Phase 4: Auto-fix ALL issues [up to 3 sub-agents]", status: "pending"
- id: "val-5", content: "✅ Phase 5: Verify fixes", status: "pending"
- id: "val-6", content: "🔄 Phase 6: Self-review loop (review fixes, fix new issues)", status: "pending"
- id: "val-7", content: "📝 Phase 7: Final report", status: "pending"
```

### Update Progress As You Go

As you complete each phase:
1. Mark the current phase as `completed`
2. Mark the next phase as `in_progress`
3. Use `merge=true` to update existing todos

---

## Execution Timeline

```
Phase 1: SEQUENTIAL (you run this) - ~30 seconds
         ↓
Phase 2: ALL 9 SUB-AGENTS IN PARALLEL - ~5 minutes
         ├─ Task("Frontend Automated Checks")
         ├─ Task("Backend Automated Checks")
         ├─ Task("Review: Security") - GitHub-quality prompt
         ├─ Task("Review: Code Quality") - GitHub-quality prompt
         ├─ Task("Review: Logic & Correctness") - GitHub-quality prompt
         ├─ Task("Review: Codebase Fit") - GitHub-quality prompt
         ├─ Task("Review: Test Integrity") - Enhanced prompt
         ├─ Task("Review: i18n")
         └─ Task("Review: Cross-Platform Compatibility")
         ↓ (wait for all 9)
Phase 3: SEQUENTIAL (cross-validate & synthesize) - ~30 seconds
         ↓
Phase 4: UP TO 3 FIX SUB-AGENTS IN PARALLEL - ~3-5 minutes
         ├─ Task("Fix: [Issue Group 1]") - fresh context, focused fix
         ├─ Task("Fix: [Issue Group 2]") - fresh context, focused fix
         └─ Task("Fix: [Issue Group 3]") - fresh context, focused fix
         ↓ (wait for all fix agents)
Phase 5: SEQUENTIAL (verify fixes) - ~30 seconds
         ↓
Phase 6: SELF-REVIEW LOOP - ~2-5 minutes per iteration
         ├─ Review the changes made by fix agents
         ├─ If new issues found → spawn fix agents again
         └─ Repeat until clean (max 3 iterations)
         ↓
Phase 7: FINAL REPORT
```

**Total time: ~10-15 minutes** (with automatic fixes and self-review loop)

### Key Insight: Fresh Context Windows

Each fix sub-agent gets a **fresh context window** without the accumulated noise from the validation phase. This means:
- They can focus entirely on their specific fix
- They have full context capacity for understanding the codebase
- They can make more thoughtful, comprehensive fixes
- No risk of context pollution from unrelated findings

---

## STEP 1: UNDERSTAND THE CHANGES

> **📋 Todo:** Mark `val-1` as `in_progress` (should already be set from initialization)

First, get oriented:

```bash
# What changed?
git diff --staged --stat
git diff --staged
git log --oneline -5
```

Read the diff to understand:
1. **What is the intent?** What problem is being solved?
2. **What files changed?** Are they related to the task?
3. **How big is the change?** Lines added/removed, files touched
4. **What categories?** Frontend, backend, tests, config, docs

**Save the diff and file list** - you'll pass these to the review sub-agents.

> **📋 Todo:** When done, mark `val-1` as `completed` and `val-2` as `in_progress`

---

## STEP 2: SPAWN ALL 9 SUB-AGENTS

> **📋 Todo:** `val-2` should now be `in_progress`

### ⚡ SPAWN ALL SUB-AGENTS NOW - DO NOT WAIT BETWEEN THEM

**Spawn all 9 sub-agents simultaneously.** Do NOT wait for automated checks before starting code reviews.

### Automated Check Sub-agents

```
Task("Frontend Automated Checks", """
Run all frontend checks and report results:

Commands to run:
cd apps/frontend && npm run lint && npm run typecheck && npm run test && npm run build

Report format:
- ✅ PASS or ❌ FAIL for each command
- If any fail, include the error output
- Summary: All passed / X of 4 failed
""")

Task("Backend Automated Checks", """
Run all backend checks and report results:

Commands to run:
cd apps/backend && source .venv/bin/activate && pytest ../../tests/ -v

Report format:
- ✅ PASS or ❌ FAIL
- If failed, include failing test names and error messages
- Summary: X tests passed, Y failed
""")
```

### Code Review Sub-agents (GitHub-Quality Prompts)

Each sub-agent needs:
1. The git diff from Phase 1
2. List of changed files
3. Their specialized review prompt

---

#### Security Review Agent

```
Task("Review: Security", """
You are a focused security review agent performing a deep security audit.

## Your Mission

Perform a thorough security review of the provided code changes, focusing ONLY on security vulnerabilities. Do not review code quality, style, or other non-security concerns.

## CRITICAL: Scope Rules

### What IS in scope (report these issues):
1. **Security issues in changed code** - Vulnerabilities introduced or modified by this PR
2. **Security impact of changes** - "This change exposes sensitive data to the new endpoint"
3. **Missing security for new features** - "New API endpoint lacks authentication"
4. **Broken security assumptions** - "Change to auth.ts invalidates security check in handler.ts"

### What is NOT in scope (do NOT report):
1. **Pre-existing vulnerabilities** - Old security issues in code this PR didn't touch
2. **Unrelated security improvements** - Don't suggest hardening untouched code

## Security Focus Areas

### 1. Injection Vulnerabilities
- **SQL Injection**: Unsanitized user input in SQL queries
- **Command Injection**: User input in shell commands, `exec()`, `eval()`
- **XSS (Cross-Site Scripting)**: Unescaped user input in HTML/JS
- **Path Traversal**: User-controlled file paths without validation

### 2. Authentication & Authorization
- **Broken Authentication**: Weak password requirements, session fixation
- **Broken Access Control**: Missing permission checks, IDOR
- **Session Management**: Insecure session handling, no expiration
- **Password Storage**: Plaintext passwords, weak hashing (MD5, SHA1)

### 3. Sensitive Data Exposure
- **Hardcoded Secrets**: API keys, passwords, tokens in code
- **Insecure Storage**: Sensitive data in localStorage, cookies without HttpOnly/Secure
- **Information Disclosure**: Stack traces, debug info in production
- **Insufficient Encryption**: Weak algorithms, hardcoded keys

### 4. Security Misconfiguration
- **CORS Misconfig**: Overly permissive CORS (`*` origins)
- **Missing Security Headers**: CSP, X-Frame-Options, HSTS
- **Debug Mode Enabled**: Debug flags in production code

### 5. Input Validation
- **Missing Validation**: User input not validated
- **Insufficient Sanitization**: Incomplete escaping/encoding
- **Size Limits**: No max length checks (DoS risk)

## CRITICAL: Verify Before Claiming "Missing" Protections

When your finding claims protection is **missing** (no validation, no sanitization, no auth check):

**Ask yourself**: "Have I verified this is actually missing, or did I just not see it?"

- Check if validation/sanitization exists elsewhere (middleware, caller, framework)
- Read the **complete function**, not just the flagged line
- Look for comments explaining why something appears unprotected

**Your evidence must prove absence — not just that you didn't see it.**

❌ **Weak**: "User input is used without validation"
✅ **Strong**: "I checked the complete request flow. Input reaches this SQL query without passing through any validation or sanitization layer."

## Review Guidelines

### High Confidence Only
- Only report findings with **>80% confidence**
- If you're unsure, don't report it
- Prefer false negatives over false positives

### Severity Classification
- **CRITICAL**: Exploitable vulnerability leading to data breach, RCE, or system compromise
- **HIGH**: Serious security flaw that could be exploited
- **MEDIUM**: Security weakness that increases risk
- **LOW**: Best practice violation, minimal risk

## Code Patterns to Flag

### JavaScript/TypeScript
```javascript
// CRITICAL: SQL Injection
db.query(`SELECT * FROM users WHERE id = ${req.params.id}`);

// CRITICAL: Command Injection
exec(`git clone ${userInput}`);

// HIGH: XSS
el.innerHTML = userInput;

// HIGH: Hardcoded secret
const API_KEY = "sk-abc123...";

// MEDIUM: Insecure random
const token = Math.random().toString(36);
```

### Python
```python
# CRITICAL: SQL Injection
cursor.execute(f"SELECT * FROM users WHERE name = '{user_input}'")

# CRITICAL: Command Injection
os.system(f"ls {user_input}")

# HIGH: Hardcoded password
PASSWORD = "admin123"
```

## Git Diff to Review:
[PASTE GIT DIFF HERE]

## Changed Files:
[LIST FILES HERE]

## Output Format

Report your findings as:
- Status: ✅ No issues | ⚠️ Minor concerns | ❌ Blocking issues
- For each finding:
  - Severity: CRITICAL | HIGH | MEDIUM | LOW
  - File and line number
  - Title and description
  - Evidence (prove the issue exists)
  - Suggested fix
  - Confidence percentage (only report if >80%)
""")
```

---

#### Code Quality Review Agent

```
Task("Review: Code Quality", """
You are a focused code quality review agent performing deep quality analysis.

## Your Mission

Perform a thorough code quality review of the provided code changes. Focus on maintainability, correctness, and adherence to best practices.

## CRITICAL: Scope Rules

### What IS in scope (report these issues):
1. **Quality issues in changed code** - Problems in files/lines modified by this PR
2. **Quality impact of changes** - "This change increases complexity of `handler.ts`"
3. **Incomplete refactoring** - "You cleaned up X but similar pattern in Y wasn't updated"
4. **New code not following patterns** - "New function doesn't match project's error handling pattern"

### What is NOT in scope (do NOT report):
1. **Pre-existing quality issues** - Old code smells in untouched code
2. **Unrelated improvements** - Don't suggest refactoring code the PR didn't touch

## Quality Focus Areas

### 1. Code Complexity
- **High Cyclomatic Complexity**: Functions with >10 branches (if/else/switch)
- **Deep Nesting**: More than 3 levels of indentation
- **Long Functions**: Functions >50 lines (except when unavoidable)
- **God Objects**: Classes doing too many things

### 2. Error Handling
- **Unhandled Errors**: Missing try/catch, no error checks
- **Swallowed Errors**: Empty catch blocks
- **Generic Error Messages**: "Error occurred" without context
- **Silent Failures**: Errors logged but not handled

### 3. Code Duplication
- **Duplicated Logic**: Same code block appearing 3+ times
- **Copy-Paste Code**: Similar functions with minor differences
- **Should Use Library**: Reinventing standard functionality

### 4. Maintainability
- **Magic Numbers**: Hardcoded numbers without explanation
- **Unclear Naming**: Variables like `x`, `temp`, `data`
- **Inconsistent Patterns**: Mixing async/await with promises
- **Missing Abstractions**: Repeated patterns not extracted

### 5. Best Practices
- **Mutable State**: Unnecessary mutations
- **Side Effects**: Functions modifying external state unexpectedly
- **Mixed Responsibilities**: Functions doing unrelated things
- **Deprecated APIs**: Using deprecated functions/packages

## CRITICAL: Verify Before Claiming "Missing" Handling

When your finding claims something is **missing** (no error handling, no fallback, no cleanup):

**Ask yourself**: "Have I verified this is actually missing, or did I just not see it?"

- Read the **complete function**, not just the flagged line — error handling often appears later
- Check for try/catch blocks, guards, or fallbacks you might have missed
- Look for framework-level handling (global error handlers, middleware)

**Your evidence must prove absence — not just that you didn't see it.**

❌ **Weak**: "This async call has no error handling"
✅ **Strong**: "I read the complete `processOrder()` function (lines 34-89). The `fetch()` call on line 45 has no try/catch, and there's no `.catch()` anywhere in the function."

## Review Guidelines

### High Confidence Only
- Only report findings with **>80% confidence**
- If it's subjective or debatable, don't report it
- Focus on objective quality issues

### Severity Classification
- **CRITICAL**: Bug that will cause failures in production
- **HIGH**: Significant quality issue affecting maintainability
- **MEDIUM**: Quality concern that improves code quality
- **LOW**: Minor improvement suggestion

## Code Patterns to Flag

### JavaScript/TypeScript
```javascript
// HIGH: Unhandled promise rejection
async function loadData() {
  await fetch(url);  // No error handling
}

// MEDIUM: Swallowed error
try {
  processData();
} catch (e) {
  // Empty catch - error ignored
}

// MEDIUM: Magic number
setTimeout(() => {...}, 300000);  // What is 300000?

// LOW: Unclear naming
const d = new Date();  // Better: currentDate
```

### Python
```python
# HIGH: Unhandled exception
def process_file(path):
    f = open(path)  # Could raise FileNotFoundError
    data = f.read()
    # File never closed - resource leak

# MEDIUM: Magic number
time.sleep(86400)  # What is 86400?
```

## Git Diff to Review:
[PASTE GIT DIFF HERE]

## Changed Files:
[LIST FILES HERE]

## Output Format

Report your findings as:
- Status: ✅ No issues | ⚠️ Minor concerns | ❌ Blocking issues
- For each finding:
  - Severity: CRITICAL | HIGH | MEDIUM | LOW
  - File and line number
  - Title and description
  - Evidence (prove the issue exists)
  - Suggested fix
  - Confidence percentage (only report if >80%)
""")
```

---

#### Logic & Correctness Review Agent

```
Task("Review: Logic & Correctness", """
You are a focused logic and correctness review agent performing deep analysis of algorithmic correctness, edge cases, and state management.

## Your Mission

Verify that the code logic is correct, handles all edge cases, and doesn't introduce subtle bugs. Focus ONLY on logic and correctness issues - not style, security, or general quality.

## CRITICAL: Scope Rules

### What IS in scope (report these issues):
1. **Logic issues in changed code** - Bugs in files/lines modified by this PR
2. **Logic impact of changes** - "This change breaks the assumption in `caller.ts:50`"
3. **Incomplete state changes** - "You updated state X but forgot to reset Y"
4. **Edge cases in new code** - "New function doesn't handle empty array case"

### What is NOT in scope (do NOT report):
1. **Pre-existing bugs** - Old logic issues in untouched code
2. **Unrelated improvements** - Don't suggest fixing bugs in code the PR didn't touch

## Logic Focus Areas

### 1. Algorithm Correctness
- **Wrong Algorithm**: Using inefficient or incorrect algorithm for the problem
- **Incorrect Implementation**: Algorithm logic doesn't match the intended behavior
- **Missing Steps**: Algorithm is incomplete or skips necessary operations

### 2. Edge Cases
- **Empty Inputs**: Empty arrays, empty strings, null/undefined values
- **Boundary Conditions**: First/last elements, zero, negative numbers, max values
- **Single Element**: Arrays with one item, strings with one character
- **Large Inputs**: Integer overflow, array size limits

### 3. Off-By-One Errors
- **Loop Bounds**: `<=` vs `<`, starting at 0 vs 1
- **Array Access**: Index out of bounds, fence post errors
- **String Operations**: Substring boundaries, character positions

### 4. State Management
- **Race Conditions**: Concurrent access to shared state
- **Stale State**: Using outdated values after async operations
- **State Mutation**: Unintended side effects from mutations
- **Cleanup**: State not reset when it should be

### 5. Conditional Logic
- **Inverted Conditions**: `!condition` when `condition` was intended
- **Missing Conditions**: Incomplete if/else chains
- **Wrong Operators**: `&&` vs `||`, `==` vs `===`
- **Truthiness Bugs**: `0`, `""`, `[]` being falsy when they're valid values

### 6. Async/Concurrent Issues
- **Missing Await**: Async function called without await
- **Promise Handling**: Unhandled rejections, missing error handling
- **Race Conditions**: Multiple async operations accessing same resource
- **Order Dependencies**: Operations that must run in sequence but don't

## CRITICAL: Verify Before Claiming "Missing" Edge Case Handling

When your finding claims an edge case is **not handled** (no check for empty, null, zero, etc.):

**Ask yourself**: "Have I verified this case isn't handled, or did I just not see it?"

- Read the **complete function** — guards often appear later or at the start
- Check callers — the edge case might be prevented by caller validation
- Look for early returns, assertions, or type guards you might have missed

**Your evidence must prove absence — not just that you didn't see it.**

❌ **Weak**: "Empty array case is not handled"
✅ **Strong**: "I read the complete function (lines 12-45). There's no check for empty arrays, and the code directly accesses `arr[0]` on line 15 without any guard."

## Review Guidelines

### High Confidence Only
- Only report findings with **>80% confidence**
- Logic bugs must be demonstrable with a concrete example
- If the edge case is theoretical without practical impact, don't report it

### Provide Concrete Examples
For each finding, provide:
1. A concrete input that triggers the bug
2. What the current code produces
3. What it should produce

### Severity Classification
- **CRITICAL**: Bug that will cause wrong results or crashes in production
- **HIGH**: Logic error that will affect some users/cases
- **MEDIUM**: Edge case not handled that could cause issues
- **LOW**: Minor logic improvement

## Code Patterns to Flag

### Off-By-One Errors
```javascript
// BUG: Skips last element
for (let i = 0; i < arr.length - 1; i++) { }

// BUG: Crashes on empty array
const first = arr[0].value;  // TypeError if empty

// BUG: NaN on empty array
const avg = sum / arr.length;  // Division by zero
```

### State & Async Bugs
```javascript
// BUG: Race condition
let count = 0;
await Promise.all(items.map(async () => {
  count++;  // Not atomic!
}));

// BUG: Missing await
async function process() {
  getData();  // Returns immediately, doesn't wait
  useData();  // Data not ready!
}
```

### Conditional Logic Bugs
```javascript
// BUG: Inverted condition
if (!user.isAdmin) {
  grantAccess();  // Should be if (user.isAdmin)
}

// BUG: Falsy check fails for 0
if (!value) {  // Fails when value is 0
  value = defaultValue;
}
```

## Git Diff to Review:
[PASTE GIT DIFF HERE]

## Changed Files:
[LIST FILES HERE]

## Output Format

Report your findings as:
- Status: ✅ No issues | ⚠️ Minor concerns | ❌ Blocking issues
- For each finding:
  - Severity: CRITICAL | HIGH | MEDIUM | LOW
  - File and line number
  - Title and description
  - Concrete example: Input → Actual output → Expected output
  - Suggested fix
  - Confidence percentage (only report if >80%)
""")
```

---

#### Codebase Fit Review Agent

```
Task("Review: Codebase Fit", """
You are a focused codebase fit review agent verifying that new code fits well within the existing codebase, follows established patterns, and doesn't reinvent existing functionality.

## Your Mission

Ensure new code integrates well with the existing codebase. Check for consistency with project conventions, reuse of existing utilities, and architectural alignment.

## CRITICAL: Scope Rules

### What IS in scope (report these issues):
1. **Codebase fit issues in changed code** - New code not following project patterns
2. **Missed reuse opportunities** - "Existing `utils.ts` has a helper for this"
3. **Inconsistent with PR's own changes** - "You used `camelCase` here but `snake_case` elsewhere in the PR"
4. **Breaking conventions in touched areas** - "Your change deviates from the pattern in this file"

### What is NOT in scope (do NOT report):
1. **Pre-existing inconsistencies** - Old code that doesn't follow patterns
2. **Unrelated suggestions** - Don't suggest patterns for code the PR didn't touch

## Codebase Fit Focus Areas

### 1. Naming Conventions
- **Inconsistent Naming**: Using `camelCase` when project uses `snake_case`
- **Different Terminology**: Using `user` when codebase uses `account`
- **File Naming**: `MyComponent.tsx` vs `my-component.tsx` vs `myComponent.tsx`

### 2. Pattern Adherence
- **Framework Patterns**: Not following React hooks pattern, Django views pattern, etc.
- **Project Patterns**: Not following established error handling, logging, or API patterns
- **Architectural Patterns**: Violating layer separation (e.g., business logic in controllers)

### 3. Ecosystem Fit
- **Reinventing Utilities**: Writing new helper when similar one exists
- **Duplicate Functionality**: Adding code that duplicates existing implementation
- **Ignoring Shared Code**: Not using established shared components/utilities

### 4. Architectural Consistency
- **Layer Violations**: Calling database directly from UI components
- **Dependency Direction**: Wrong dependency direction between modules
- **Module Boundaries**: Crossing module boundaries inappropriately

### 5. Import/Dependency Patterns
- **Import Style**: Relative vs absolute imports, import grouping
- **Circular Dependencies**: Creating import cycles

## Review Guidelines

### High Confidence Only
- Only report findings with **>80% confidence**
- Verify pattern exists in codebase before flagging deviation

### Check Before Reporting
Before flagging a "should use existing utility" issue:
1. Verify the existing utility actually does what the new code needs
2. Check if existing utility has the right signature/behavior
3. Consider if the new implementation is intentionally different

### Severity Classification
- **CRITICAL**: Architectural violation that will cause maintenance problems
- **HIGH**: Significant deviation from established patterns
- **MEDIUM**: Inconsistency that affects maintainability
- **LOW**: Minor convention deviation

## Code Patterns to Flag

### Reinventing Existing Utilities
```javascript
// If codebase has: src/utils/format.ts with formatDate()
// Flag this:
function formatDateString(date) {
  return `${date.getMonth()}/${date.getDate()}/${date.getFullYear()}`;
}
// Should use: import { formatDate } from '@/utils/format';
```

### Architectural Violations
```typescript
// If codebase separates concerns:
// In UI component:
const users = await db.query('SELECT * FROM users');  // BAD
// Should use: const users = await userService.getAll();
```

## Git Diff to Review:
[PASTE GIT DIFF HERE]

## Changed Files:
[LIST FILES HERE]

## Output Format

Report your findings as:
- Status: ✅ No issues | ⚠️ Minor concerns | ❌ Blocking issues
- For each finding:
  - Severity: CRITICAL | HIGH | MEDIUM | LOW
  - File and line number
  - Title and description
  - Existing code reference (if applicable)
  - Suggested fix
  - Confidence percentage (only report if >80%)
""")
```

---

#### Test Integrity Review Agent

```
Task("Review: Test Integrity", """
You are a focused test integrity review agent ensuring tests are meaningful and not being manipulated to pass.

## Your Mission

Verify that tests are genuine quality gates, not manipulated to pass. Detect test deletion, weakening, and inadequate coverage.

## CRITICAL: Scope Rules

### What IS in scope:
1. **Tests deleted or weakened in this PR**
2. **New code without adequate tests**
3. **Skip markers added without justification**
4. **Assertions changed from specific to generic**

### What is NOT in scope:
1. **Pre-existing test gaps** - Don't flag old code that lacks tests
2. **Test style preferences** - Don't enforce specific testing patterns unless broken

## Test Integrity Focus Areas

### 1. Test Deletion
- Were any test files deleted?
- Were test cases removed from existing files?
- **Ask**: Is there a legitimate reason (e.g., removing dead code)?

### 2. Test Weakening
- Changed `expect(x).toBe(5)` to `expect(x).toBeTruthy()`
- Changed specific assertions to generic ones
- Reduced assertion count
- Added `.skip()` or `@pytest.mark.skip`

### 3. Inadequate Coverage
- New functions without any tests
- New branches/paths without test coverage
- Complex logic with only happy-path tests

### 4. Fake Tests
- Tests that don't actually verify behavior
- Tests that always pass regardless of implementation
- Mocked everything including what's being tested

## Red Flags to Watch For

```javascript
// CRITICAL: Deleting tests to make build pass
- it('should validate email format', () => { ... })  // DELETED

// HIGH: Weakening assertions
- expect(result).toBe(42);
+ expect(result).toBeTruthy();

// HIGH: Skipping without reason
+ it.skip('should handle edge case', () => { ... })

// MEDIUM: No tests for new code
+ export function complexCalculation(data) {
+   // 50 lines of logic with multiple branches
+ }
// No corresponding test file
```

## Git Diff to Review:
[PASTE GIT DIFF HERE]

## Changed Files:
[LIST FILES HERE]

## Output Format

Report your findings as:
- Status: ✅ No issues | ⚠️ Minor concerns | ❌ Blocking issues
- For each finding:
  - Severity: CRITICAL | HIGH | MEDIUM | LOW
  - File and line number
  - Title and description
  - Evidence
  - Suggested fix
  - Confidence percentage (only report if >80%)
""")
```

---

#### i18n Review Agent

```
Task("Review: i18n", """
Review the following changes for internationalization issues.
SKIP if no UI changes - report "Skipped: No UI changes"

## Checklist - check for:
- Are all user-facing strings using translation keys?
- Were translation files updated for all locales?
- Are there hardcoded strings in the UI?

## Red flags:
- Strings like <span>Submit</span> instead of <span>{t('common:submit')}</span>
- Only English translations added, other locales forgotten
- Date/number formatting without i18n consideration

## Git Diff to Review:
[PASTE GIT DIFF HERE]

## Changed Files:
[LIST FILES HERE]

## Output Format

Report your findings as:
- Status: ✅ No issues | ⚠️ Minor concerns | ❌ Blocking issues | ⏭️ Skipped
- For each finding:
  - Severity: HIGH | MEDIUM | LOW
  - File and line number
  - Hardcoded string found
  - Suggested translation key
""")
```

---

#### Cross-Platform Compatibility Review Agent

```
Task("Review: Cross-Platform Compatibility", """
Review the following changes for cross-platform compatibility (Mac/Windows/Linux).

**CRITICAL: This is an Electron app that runs on macOS, Windows, and Linux. Every change must work on ALL platforms.**

## Key Question

The developer likely tested this on ONE platform. Will this code work on the OTHER TWO?

## Checklist - check for:
- File paths using path.join() vs hardcoded / or \
- Case-sensitivity assumptions (Windows case-insensitive, Mac/Linux case-sensitive)
- Platform-specific shell commands or scripts
- Environment variables accessed cross-platform way
- OS-specific APIs without platform checks

## Red flags:
- Hardcoded path separators: `dir + '/' + file` or `dir + '\\' + file`
- Case mismatches in imports: `import Foo from './foo'` when file is `Foo.tsx`
- OS-specific env vars: `process.env.HOME` (undefined on Windows, use `os.homedir()`)
- Shell commands assuming bash/zsh
- Line ending assumptions: `split('\n')` misses `\r\n` on Windows
- Unix commands: `which`, `ls`, `cat`, `grep` don't exist on Windows

## Cross-platform alternatives:
```typescript
// Use path.join for paths
import path from 'path';
path.join(dir, 'subdir', 'file.txt');

// Use os.homedir() instead of HOME
import os from 'os';
os.homedir();

// Use Electron APIs
import { shell, clipboard } from 'electron';
shell.openExternal(url);
```

## Git Diff to Review:
[PASTE GIT DIFF HERE]

## Changed Files:
[LIST FILES HERE]

## Output Format

Report your findings as:
- Status: ✅ No issues | ⚠️ Minor concerns | ❌ Blocking issues
- For each finding:
  - Severity: CRITICAL | HIGH | MEDIUM | LOW
  - File and line number
  - Platform-specific code found
  - Which platforms it breaks
  - Cross-platform fix
""")
```

---

**Wait for ALL 9 sub-agents to complete before proceeding to Phase 3.**

> **📋 Todo:** When all sub-agents complete, mark `val-2` as `completed` and `val-3` as `in_progress`

---

## STEP 3: CROSS-VALIDATE & SYNTHESIZE FINDINGS

> **📋 Todo:** `val-3` should now be `in_progress`

### Cross-Validation Process

1. **Collect all findings** from 9 sub-agents
2. **Cross-validate**: If multiple agents report the same issue → boost confidence
3. **Apply confidence threshold**: Only keep findings with >80% confidence
4. **Deduplicate**: Remove overlapping findings (same file + line + issue type)
5. **Prioritize by severity**: CRITICAL > HIGH > MEDIUM > LOW
6. **Group for auto-fix**: Organize fixable issues into up to 3 independent groups

### Issue Triage for Auto-Fix

**CRITICAL: You MUST attempt to fix ALL issues found - CRITICAL, HIGH, MEDIUM, AND LOW.**

The philosophy: Every improvement makes the project better. Even minor suggestions should be addressed to maintain high code quality over time. AI can handle what humans skip.

Categorize each finding:
- **🔧 Auto-fixable**: Can be fixed by a sub-agent (most code issues, lint errors, missing tests, i18n, etc.)
- **🚫 Requires human**: Needs architectural decisions, unclear requirements, or external dependencies

### Intermediate Report

Before proceeding to Phase 4, output an intermediate report showing what was found:

```
📋 Validation Summary (Before Auto-Fix)

Automated Checks:
✅ Frontend: lint, typecheck, tests, build - all passed
✅ Backend: pytest - all passed

Code Review Findings:
- CRITICAL: 0
- HIGH: 2
- MEDIUM: 5
- LOW: 3

Cross-Validated (multiple agents agreed):
- [finding that multiple agents flagged]

Proceeding to auto-fix 10 issues in 3 groups...
```

> **📋 Todo:** When done, mark `val-3` as `completed` and `val-4` as `in_progress`

---

## STEP 4: AUTO-FIX ALL ISSUES

> **📋 Todo:** `val-4` should now be `in_progress`

### 🔧 AUTO-FIX: SPAWN UP TO 3 SUB-AGENTS TO FIX ISSUES

**This phase runs AUTOMATICALLY when ANY issues are found - ALL severities.**

### When to Spawn Fix Agents

| Findings | Action |
|----------|--------|
| ✅ No issues found | Skip Phase 4, proceed to verify |
| Any issues found (CRITICAL/HIGH/MEDIUM/LOW) | Spawn fix agents for ALL issues |
| 🚫 Human-required only | Skip Phase 4, report to user |

### Grouping Strategy

Group issues into **up to 3 independent fix tasks**:

1. **By file overlap**: Issues touching the same files go together
2. **By logical domain**: Related concerns (e.g., all i18n issues together)
3. **By complexity**: Simple fixes can be batched, complex fixes get dedicated agents

### Fix Sub-Agent Task Template

```
Task("Fix: [Group Name]", """
You are a focused fix agent with a FRESH CONTEXT WINDOW. Your ONLY job is to fix the specific issues listed below.

## Issues to Fix

[LIST SPECIFIC ISSUES WITH FILE:LINE REFERENCES]

## Context

These issues were identified during pre-PR validation. The original code changes were:
- Intent: [brief description of what the PR is trying to do]
- Files changed: [list of files]

## Instructions

1. Read the relevant files to understand the current state
2. Fix EACH issue listed above - ALL severities, not just blocking
3. Ensure your fixes don't break existing functionality
4. Run relevant checks after fixing (lint, typecheck, tests)
5. Report what you fixed and any issues encountered

## Constraints

- ONLY fix the issues listed - don't refactor unrelated code
- Maintain existing code style and patterns
- If a fix seems risky or unclear, report it instead of guessing
- Stage your changes with git add after fixing

## Report Format

✅ Fixed: [issue 1 description]
✅ Fixed: [issue 2 description]
⚠️ Partial: [issue that was partially addressed]
❌ Could not fix: [issue that requires human intervention]

Files modified:
- path/to/file1.ts
- path/to/file2.ts

Verification:
- [x] Lint passes
- [x] Types pass
- [x] Tests pass
""")
```

**Spawn ALL fix agents simultaneously (up to 3). Wait for ALL fix agents to complete before proceeding.**

> **📋 Todo:** When all fix agents complete, mark `val-4` as `completed` and `val-5` as `in_progress`

---

## STEP 5: VERIFY FIXES

> **📋 Todo:** `val-5` should now be `in_progress`

### Verification Process

1. **Collect fix agent reports** - What was fixed, what wasn't
2. **Run automated checks again** - Ensure fixes didn't break anything

```bash
# Quick verification
git diff --staged --stat
cd apps/frontend && npm run lint && npm run typecheck
cd ../backend && source .venv/bin/activate && pytest ../../tests/ -v --tb=short
```

If automated checks fail after fixes, something went wrong. Report the failure.

> **📋 Todo:** When done, mark `val-5` as `completed` and `val-6` as `in_progress`

---

## STEP 6: SELF-REVIEW LOOP

> **📋 Todo:** `val-6` should now be `in_progress`

### The Self-Review Loop

After fix agents complete and changes are verified, you must **review the fixes themselves** to catch any new issues introduced.

### Self-Review Process

1. **Get the diff of what was just fixed**
   ```bash
   git diff --staged
   ```

2. **Perform abbreviated review on the fixes**
   Focus on:
   - Did the fix introduce NEW issues?
   - Did the fix break something else?
   - Is the fix complete or partial?
   - Are there any obvious problems?

3. **Decision Tree**
   - **No new issues** → ✅ Proceed to final report
   - **New issues found AND iteration < 3** → Spawn fix agents again for NEW issues only
   - **New issues found AND iteration >= 3** → ⚠️ Report to user, some issues need human attention

### Self-Review Iteration

```
🔄 Self-Review Loop - Iteration [N]

Reviewing changes made by fix agents...

Changes reviewed:
- [file 1]: [what was fixed]
- [file 2]: [what was fixed]

New issues found in fixes:
- [new issue 1] (if any)
- [new issue 2] (if any)

Decision: [Proceeding to final report | Spawning fix agents for N new issues | Max iterations reached]
```

**Maximum 3 self-review iterations.** After 3 iterations, any remaining issues must be reported to the user.

> **📋 Todo:** When done, mark `val-6` as `completed` and `val-7` as `in_progress`

---

## STEP 7: FINAL REPORT

> **📋 Todo:** `val-7` should now be `in_progress`

### Final Report Templates

---

### ✅ READY FOR PR

All issues found and fixed. Code is ready for GitHub PR review.

```
✅ READY FOR PR

Summary: [brief description of original changes]

📋 Validation Results
✅ All automated checks pass
✅ Code review: All issues resolved

🔧 Auto-Fixed Issues
The following issues were automatically fixed:

Security:
- ✅ [issue fixed]

Code Quality:
- ✅ [issue fixed]

Logic:
- ✅ [issue fixed]

🔄 Self-Review: [N] iteration(s), all fixes verified

📋 Verification
✅ All checks pass after fixes
✅ Fixes verified and staged

The code is now ready for PR. The GitHub PR review should find minimal additional issues since we used the same review prompts.
```

---

### ⚠️ READY WITH NOTES

All blocking issues fixed, some items for human consideration.

```
⚠️ READY WITH NOTES

Summary: [brief description]

📋 Validation Results
✅ All automated checks pass
✅ No blocking issues remain

🔧 Auto-Fixed Issues
- ✅ [issue 1 - fixed]
- ✅ [issue 2 - fixed]

⚠️ Items for Human Review
- [item that requires human decision]
- [item with unclear requirements]

These don't block the PR but consider addressing them.
```

---

### ❌ STILL NOT READY

Some issues could not be auto-fixed.

```
❌ STILL NOT READY

Summary: [brief description]

🔧 Auto-Fix Results
- ✅ Fixed: [N] issues
- ❌ Could not fix: [M] issues

📋 Remaining Issues (Require Human Attention)
1. [Issue description and why it couldn't be auto-fixed]
2. [Issue description and why it couldn't be auto-fixed]

🔄 Self-Review: Attempted [N] iterations

Please address the remaining issues manually, then run /pre-pr-validation again.
```

---

> **📋 Todo:** Mark `val-7` as `completed`

---

## KEY PRINCIPLES

1. **Same quality as GitHub PR review** - We use the same battle-tested prompts
2. **Fix everything, not just blockers** - LOW severity items improve code over time
3. **Verify your own work** - Self-review loop catches issues in fixes
4. **Be specific** - Every finding needs file:line and concrete evidence
5. **High confidence only** - Don't report if <80% confident
6. **Cross-validate** - Multiple agents agreeing boosts confidence

---

## WHAT TO ALWAYS CHECK

Every validation must verify:

1. **Automated checks pass** (lint, types, tests, build)
2. **No security vulnerabilities** (injection, hardcoded secrets, auth issues)
3. **Code quality maintained** (error handling, no complexity bombs)
4. **Logic is correct** (edge cases, off-by-one, race conditions)
5. **Fits the codebase** (patterns, naming, reuses existing code)
6. **Tests are genuine** (not deleted/weakened to pass)
7. **Cross-platform safe** (paths, env vars work on Mac/Windows/Linux)

---

## REMEMBER

You are catching issues BEFORE they reach GitHub PR review. Every issue you fix now saves a round-trip:
- 10 minutes of CI wait
- Context switch for the developer
- Another review cycle

Be thorough. Be confident. Fix everything AI can fix. What you catch here won't need to be caught on the PR.
