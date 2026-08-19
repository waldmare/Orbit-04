# ORBIT//04 — Steam release runbook

Version `0.64.0` produces a validated, offline Windows package. Publishing still requires a Steamworks partner account, a paid app credit, assigned App/depot IDs, completed store and content forms, and Valve review.

## Supported launch target

| Field | Value |
|---|---|
| Operating system | Windows 10/11, 64-bit |
| Executable | `ORBIT-04.exe` |
| Package directory | `out/ORBIT-04-win32-x64/` |
| Network requirement | None during play |
| Save location | Electron application data, local profile with automatic backup |
| Input | Keyboard, mouse, standard gamepad |

Do not advertise macOS, Linux, online multiplayer, Steam achievements, cloud saves, or trading features until each item is implemented and tested in a Steam build.

## Local release gate

Use Command Prompt on Windows:

Use Node.js 22 or 24 LTS. Newer experimental Node releases are outside the verified build matrix.

```bat
npm.cmd ci
npm.cmd run release:check
```

The release check runs syntax, gameplay, renderer, asset, and version tests; regenerates the Windows application icon; creates the packaged app; and verifies the executable and ASAR payload. It fails instead of silently accepting missing release files.

Run the packaged executable directly before uploading:

```bat
out\ORBIT-04-win32-x64\ORBIT-04.exe
```

Complete at least one fresh-profile 12-minute run and one restart. Verify pause/resume, audio sliders and mute, fullscreen, resizing, keyboard, mouse, gamepad, save persistence, save export/import, and offline launch.

## Steam store media

Generate the five real gameplay captures:

```bat
npm.cmd run screenshot:steam
```

The files in `steam/store/screenshots/` are produced by the active Electron/WebGL renderer at 1920 × 1080. They use controlled game state for repeatability but no mock UI or concept artwork. Inspect every image before upload.

Create final capsule artwork against Valve's current templates. Required common sizes include:

- header capsule: 920 × 430
- small capsule: 462 × 174
- main capsule: 1232 × 706
- vertical capsule: 748 × 896

Base capsules may contain the game artwork, product name, and official subtitle only. Keep the logo legible at native size. Store screenshots must depict actual gameplay. Verify the current rules before submission: [Steam graphical assets](https://partner.steamgames.com/doc/store/assets/standard) and [graphical asset rules](https://partner.steamgames.com/doc/store/assets/rules).

## Steamworks configuration

1. Create the app and record its App ID and Windows depot ID.
2. Complete the content survey, supported-language data, system requirements, pricing, legal, tax, and payout information.
3. Configure a Windows launch option for `ORBIT-04.exe`.
4. Prepare store copy using only implemented features.
5. Upload the store capsules, real screenshots, library assets, and icon.
6. Publish the Coming Soon page at least two weeks before release.
7. Replace placeholders in private copies of `steam/scripts/*_TEMPLATE.vdf`.
8. Upload a SteamPipe preview build, inspect its manifest, and place it on a password-protected test branch.
9. Install the build through the Steam client on a clean Windows account and repeat the release gate.
10. Submit the store page and build for Valve review, allowing at least seven business days of schedule margin.

Valve reviews the store page and build separately. The build must launch on every operating system advertised on the store page. See the current [review process](https://partner.steamgames.com/doc/store/review_process), [release process](https://partner.steamgames.com/doc/store/releasing), [SteamPipe upload guide](https://partner.steamgames.com/doc/sdk/uploading), and [Steamworks SDK documentation](https://partner.steamgames.com/doc/sdk).

## Release decision

Do not press **Release App** until all of these are true:

- Steam client installation and launch pass on a clean Windows machine;
- no blocker or crash remains from external playtests;
- late-run performance has been measured on the minimum target hardware;
- store text, screenshots, and supported-feature declarations match the uploaded build;
- third-party audio and software notices have been reviewed;
- the Coming Soon and Valve review timing requirements are satisfied;
- the intended SteamPipe build is set live on the default branch.
