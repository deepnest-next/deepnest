# Contributing

Just follow the usual github work-flows.

- **Issues** are code-related, usually leading to an action
- **Discussions** are used for ideas, questions etc. (things are more casual)

## Maintainers

- keep instructions minimal (assume the target-audience knows what they're doing)
- do not close issues or PRs lightly. Ideally, the authors will close themselves.
- prefer cli reproducers

### Release

The release-process is currently semi-automated. You can try it out on your fork.

Follow those instructions:

- Edit version https://github.com/deepnest-io/Deepnest/blob/master/package.json#L3
- https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository
- create a distribution locally via `npm run w:dist` (add version to folder, then zip & upload it)
