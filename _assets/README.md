# Deepnest Build & Signing Setup

This document describes the required secrets and environment variables needed for building, signing, and releasing Deepnest using Electron Forge.

---

## Environment Overview

Deepnest supports builds for:
- **Regular macOS builds (Developer ID)**
- **Mac App Store (MAS) builds**
- Other platforms (Windows, Linux)

Builds are managed via GitHub Actions (CI) and local development. In CI the environment variables are injected via the workflow YAML files; for local development, configure your system accordingly.

---

## Required Secrets (GitHub Actions)

Set these secrets in your repository under *Settings > Secrets and variables > Actions*:

| Secret Name                  | Description                                                           | Example Value                                                 |
|------------------------------|-----------------------------------------------------------------------|---------------------------------------------------------------|
| `APPLE_KEYCHAIN`             | Name of the temporary keychain for signing                           | `deepnest-keychain`                                           |
| `APPLE_KEYCHAIN_PASS`        | Password for the temporary keychain                                  | `mykeychainpass123`                                           |
| `APPLE_MAC_CERT`             | Base64-encoded p12 file containing both the Developer and Installer certificates | *(Base64 string)*                                             |
| `APPLE_MAC_CERT_PASS`        | Password for the p12 file                                              | `mycertpass123`                                               |
| `APPLE_API_KEY`              | Base64-encoded Apple API key (.p8) for notarization                    | *(Base64 string)*                                             |
| `APPLE_API_KEY_ID`           | Apple API key ID                                                      | `ABCDEF1234`                                                  |
| `APPLE_API_ISSUER`           | Apple API issuer ID                                                   | `00000000-1111-2222-3333-444444444444`                          |
| `APPLE_PROVISIONING_PROFILE` | Base64-encoded provisioning profile for MAS builds                     | *(Base64 string)*                                             |

---

## Identity Secrets

Define these secrets explicitly (ohne Fallbacks):

| Secret Name                      | Description                                                                                      | Example Value                                                  |
|----------------------------------|--------------------------------------------------------------------------------------------------|----------------------------------------------------------------|
| `APPLE_DEVELOPER_ID_APPLICATION` | Developer ID Application certificate name for regular macOS builds                              | `Developer ID Application: Your Name (TEAMID)`                 |
| `APPLE_DEVELOPER_ID_INSTALLER`     | Developer ID Installer certificate name for signing pkg installers in regular macOS builds         | `Developer ID Installer: Your Name (TEAMID)`                   |
| `APPLE_MAS_IDENTITY`               | Mac App Store signing certificate name for MAS app builds                                        | `Apple Distribution: Your Name (TEAMID)`                       |
| `APPLE_MAS_INSTALLER_IDENTITY`     | Mac App Store installer signing certificate name for signing MAS pkg installers                  | `3rd Party Mac Developer Installer: Your Name (TEAMID)`          |

## Using a Single p12 Certificate File

If you use one p12 file that contains both signing certificates (for the app and the installer):
- Set the base64-encoded content of this single p12 file as the secret for `APPLE_MAC_CERT`.
- The build process will use this same certificate file for both application and installer signing.
- Ensure that the certificate file in your Keychain contains both the Developer ID Application and Installer certificates.

---

## Environment Variables (GitHub Actions)

Within your workflows, environment variables include:

- `CI`: `"true"`
- `BUILD_NUMBER`: GitHub run number.
- `MAKER_ARCH`: Architecture (e.g., `x64`, `arm64`).
- `MAKER_PLATFORM`: Build platform (`""` for regular builds, `"mas"` for MAS builds).
- `NOTARIZATION_KEY_PATH`: Path to the decoded Apple API key file.
- `APPLE_KEYCHAIN_PATH`: Path to the temporary keychain.
- Identity secrets are passed to the build steps using their distinct names listed above.

---

## Setup Instructions

### 1. Certificates & Keys
- **Exporting Certificates (.p12):**
  1. Use Keychain Access to export your Developer ID Application and Installer certificates in one p12 file.
  2. Convert the p12 file to base64:
     ```bash
     base64 -i CombinedCertificates.p12 | tr -d '\n'
     ```
  3. Set the resulting base64 string as the secret for `APPLE_MAC_CERT`.

- **Apple API Key (.p8):**
  1. Create and download an API key from the Apple Developer portal.
  2. Convert it to base64:
     ```bash
     base64 -i AuthKey_KEYID.p8 | tr -d '\n'
     ```
  3. Set the resulting base64 string as the secret for `APPLE_API_KEY`.

### 2. Provisioning Profile (for MAS Builds)
- Create a MAS-distribution provisioning profile in your Apple Developer portal.
- Convert it to base64:
  ```bash
  base64 -i your_profile.provisionprofile | tr -d '\n'
  ```
- Set this as `APPLE_PROVISIONING_PROFILE`.

### 3. Set Up Secrets in GitHub
- Go to **Settings > Secrets and variables > Actions** in your repository.
- Add each secret exactly as listed above.

---

## Local Development vs CI Environment

- **Local Development (macOS):**  
  Your local system’s default keychain and certificates will be used if CI-specific variables are not defined. Ensure your certificates are installed in your Keychain.

- **GitHub Actions (CI):**  
  All the required secrets and environment variables will be injected automatically as per your workflow files.

---

Ensure that all these setup steps are correctly followed to avoid build or signing issues.
