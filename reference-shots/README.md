Reference source images for strict image-to-code studies.

Put the PNG files for the visual extraction pass in this folder and commit them to the repo so the CLI machine can read them with repo-relative paths.

Required first-pass filenames:

- `01-chip-panel.png`
- `03-lock-geometry.png`
- `06-japanese-signage.png`

Recommended later filenames:

- `02-mech-sentinel.png`
- `04-insignia-symbol.png`
- `05-explorer-hex.png`
- `07-isr-monitor.png`
- `08-binary-square.png`

Rules:

- Keep the original crop tight.
- Do not resize unless necessary.
- Prefer PNG.
- Use these exact filenames so prompts stay stable across machines.
- Commit the files to the repo before asking the CLI to process them.
