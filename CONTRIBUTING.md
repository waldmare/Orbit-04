# Contributing to ORBIT//04

Contributions should be limited to one clearly defined change. Runtime fixes must preserve existing gameplay behavior unless the change explicitly targets balance or progression.

## Development setup

GitHub Actions uses Node.js 22. On Windows, use `npm.cmd` when PowerShell prevents `npm.ps1` from running.

Windows:

```bat
npm.cmd install
npm.cmd test
npm.cmd start
```

macOS or Linux:

```bash
npm install
npm test
npm start
```

The `postinstall` script copies `phaser.min.js` from the pinned npm dependency into `vendor/`. The copied file is required for offline Electron startup and is excluded from Git.

## Change workflow

1. Create a branch with a short descriptive name.
2. Keep the diff focused on one fix or feature.
3. Add a regression test when the behavior can be checked automatically.
4. Run the full test suite.
5. Check the Electron runtime for changes that affect rendering, input, audio, or startup.
6. Document user-visible behavior and known limitations in the pull request.

## Project constraints

- Do not change balance values as part of an unrelated technical or visual fix.
- Preserve attack telegraphs, high-contrast display options, and reduced-motion behavior.
- Do not commit `node_modules/`, packaged builds, or `vendor/phaser.min.js`.
- Do not add assets without a verified license and an entry in `THIRD_PARTY.md` when applicable.
- Use screenshots captured from the running game. Label concept art or mockups explicitly and do not present them as implemented UI.
- Do not commit credentials, access tokens, personal data, or machine-specific paths.

## Testing

```bat
npm.cmd test
```

The test command runs syntax checks, gameplay regression tests, renderer checks, and the media integrity audit. The asset audit verifies runtime references, media signatures, image dimensions, and the local Phaser bundle.

## Bug reports

Use the GitHub bug report form. Include reproducible steps, operating system, launch method, and complete error output. Attach a runtime screenshot for rendering problems and terminal output for startup failures.
