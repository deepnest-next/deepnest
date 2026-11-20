# Releasing deepnest

The workflow `.github/workflows/build_release.yml` builds deepnest for Linux (x64, arm64), macOS (x64, arm64) and Windows (x64) and attaches the files to a GitHub release. There are two ways to start it:

- **A. By hand** (recommended): pick the version in a form. The workflow bumps it, tags it, builds, and publishes the release only when every build has succeeded.
- **B. Publish a release on GitHub**: you create the tag and the release, and the workflow attaches the files a few minutes later.

## Version scheme

Versions follow [SemVer](https://semver.org). The tag is `v` + the version.

| Kind | Example tag | Meaning |
|---|---|---|
| Release | `v1.6.0` | stable, becomes "Latest" |
| Pre-release | `v1.6.0-beta.1`, `v1.6.0-rc.1` | test build for 1.6.0, never "Latest" |

A version with a suffix (`-beta.1`, `-rc.1`, …) is always a pre-release. It sorts before the final version: `1.6.0-beta.1` < `1.6.0`.

Do **not** use four numbers such as `v1.6.0.1-beta`. They are not SemVer, and npm and electron-builder refuse them, so the build fails.

## A. Run the workflow by hand

GitHub → **Actions** → **build release** → **Run workflow**. Choose the branch (normally `main`) and fill in the form:

| Field | Meaning |
|---|---|
| `bump` | `patch`, `minor`, `major`: bump the version in `package.json`. `prerelease`: next beta number. `custom`: use the `version` field. |
| `version` | Only for `custom`, e.g. `1.6.0` or `1.6.0-rc.1` |
| `prerelease` | Checked: `patch`/`minor`/`major` create a beta (`-beta.0`) instead of a release |

Starting from `1.5.6`:

| `bump` | `prerelease` unchecked | `prerelease` checked |
|---|---|---|
| `patch` | `1.5.7` | `1.5.7-beta.0` |
| `minor` | `1.6.0` | `1.6.0-beta.0` |
| `major` | `2.0.0` | `2.0.0-beta.0` |
| `prerelease` | `1.5.7-beta.0` | `1.5.7-beta.0` |
| `custom` | the `version` field | the `version` field (it must have a suffix) |

A typical beta cycle for 1.6.0:

1. `minor` + `prerelease` checked → `v1.6.0-beta.0`
2. `prerelease` → `v1.6.0-beta.1`, `v1.6.0-beta.2`, …
3. `patch` (or `minor`), unchecked → `v1.6.0`. On a beta version, both drop the suffix.

What the run does:

1. **prepare**: computes the version (`helper_scripts/release_version.js`), commits `chore: release v<version>` (`package.json`, `package-lock.json`) to the chosen branch, pushes the tag, and creates a **draft** release with generated notes. The draft is marked as a pre-release if the version has a suffix.
2. **build** (5 runners in parallel): each one builds the tag and uploads its files to the draft.
3. **publish**: makes the draft public, only after all builds succeeded. Until then nobody sees the release.

## B. Release on GitHub

GitHub → **Releases** → **Draft a new release**:

1. Create a new tag, e.g. `v1.6.0` or `v1.6.0-beta.1`, on `main`.
2. For a beta, check **Set as a pre-release**.
3. **Publish release**. Saving as a draft starts nothing; only publishing does.

The workflow then builds that tag and attaches the files. The release is visible without files until the builds finish (about 10–15 minutes).

The builds take the version from the tag, so the files and the app show the right version. In this path, though, `package.json` in the repo is **not** bumped. Bump it in a normal commit afterwards, or use path A, which does it for you.

## Where a pre-release shows up

| Place | Release | Pre-release |
|---|---|---|
| GitHub release list | yes, marked "Latest" | yes, marked "Pre-release" |
| `releases/latest` (README link) | yes | no |
| In-app update notice (`notification-service.js`, reads `releases/latest`) | yes | no |
| Website deepnest.net (`_data/githubData.js` skips pre-releases) | yes | no |

Testers get a pre-release from its release page, e.g. `https://github.com/deepnest-next/deepnest/releases/tag/v1.6.0-beta.1`.

## Files of a release

The names have stayed the same since v1.5.6, so links and the website keep working:

| OS | Files |
|---|---|
| Windows | `deepnest-v<version>-win32-x64.zip` |
| macOS | `deepnest-v<version>-darwin-<arch>.zip`, the same zip as `deepnest-v<version>-mac-<arch>.zip`, `deepnest-v<version>-mac-<arch>.dmg`, `deepnest-v<version>-mac-<arch>.pkg` |
| Linux | `deepnest-v<version>-linux-<arch>.zip`, `.deb`, `.rpm` |

`<arch>` is `x64` or `arm64` (the `.deb`/`.rpm` use their own names: `amd64`/`x86_64`). The program inside is always called `deepnest` (`deepnest.exe`, `deepnest.app`).

## Signed Windows build

CI builds are not signed. The signed zip needs the Certum token on the developer machine:

```sh
git checkout v<version>
npm run dist-all-signed
# rename dist/deepnest-v<version>-win32-x64.zip to deepnest-v<version>-win32-x64_signed.zip, then:
gh release upload v<version> dist/deepnest-v<version>-win32-x64_signed.zip
```

## When something goes wrong

- **A build failed in a manual run:** the release stays a draft and nobody sees it. Fix the cause, then use **Re-run failed jobs** on the run. The publish job follows.
- **Abandon a manual run:** `gh release delete v<version> --cleanup-tag`, then revert the `chore: release v<version>` commit.
- **The tag is not SemVer (path B):** the step "Set version from tag" fails. Delete the release and the tag, then create a correct one.
