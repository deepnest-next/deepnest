---
name: Bug Report
about: Something does not work as expected
title: ':bug: <title>'
labels: bug
assignees: 'Dexus'

---

<!-- For Bugs only

For Questions, Support, Ideas, please use:

https://github.com/deepnest-next/deepnest/discussions
-->

**Describe the bug**

A clear and concise description of what the bug is.

**To Reproduce**

Steps to reproduce the behavior:

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**

A clear and concise description of what you expected to happen.

**Screenshots**

If applicable, add screenshots to help explain your problem.

**Desktop (please complete the following information):**

 - OS: [e.g. iOS]
 - Browser [e.g. chrome, safari]
 - Version [e.g. 22]

**Additional context**

Add any other context about the problem here.

**DEBUG information**

Open a new shell within the deepnest app folder.
Set a temporary environment `deepnest_debug=1` on windowns you can type: `$env:deepnest_debug=1` on mac and linux `export deepnest_debug=1` this should open 2 debug windows when you start now the `deepnest-v*.*.*` binary within the shell. Please provide the content from the shell and also the content from the `console` tab of the debug windows. please note, the debug windows for the background will go if you press `stop` on the deepnest nesting gui.
