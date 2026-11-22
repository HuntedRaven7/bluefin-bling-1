---
name: compass-extension-dev
version: "1.0"
last_updated: "2026-11-22"
id: compass-extension-dev
one_line_purpose: Build and validate Compass launcher extensions in compass-extensions/.
entry_point: docs/skills/compass-extension-dev.md
category: extension-development
mcp_compliance_level: partial
optimization_status: draft
status: active
dependencies: []
tags: [compass, vicinae, raycast, typescript, launcher]
description: >-
  Authoritative guidance for the TypeScript launcher extensions under
  compass-extensions/. Covers the Vicinae/Compass API, the worker sandbox,
  host-program access, preferences, and the discovery-based validation gate.
metadata:
  type: reference
  sources:
    - https://github.com/tuna-os/compass/blob/main/docs/extensions.md
    - https://docs.vicinae.com/extensions/introduction
    - https://github.com/tuna-os/compass/blob/main/extra/schemas/extension.json
---

# Compass Extension Development

## When to use

- Adding or changing anything under `compass-extensions/`.
- Deciding whether a feature belongs in a Compass extension, a Rhai script, or
  a shell script command.
- Debugging why an extension cannot run `podman`, `brew`, or a terminal, or why
  a preference has no effect.

These are **launcher extensions**, not GNOME Shell extensions. They are not
loaded by GNOME Shell, do not have `metadata.json`, and are deliberately kept
outside `extensions/` so the GNOME validation suite does not mistake them for
Shell extensions.

## Pick the smallest tier

Compass offers three tiers (see upstream `docs/extensions.md`):

| Need | Tier |
|---|---|
| One-shot command whose output is text | Script command (shell/Python) |
| Searchable list with actions, no dependencies or build step | Rhai script |
| React views, npm packages, forms, credentials | TypeScript extension |

This directory uses the TypeScript tier because the extensions need React
views, preferences, and structured results.

## Manifest invariants

`package.json` follows the
[`extra/schemas/extension.json`](https://github.com/tuna-os/compass/blob/main/extra/schemas/extension.json)
schema. The load-bearing rules:

- `license` must be the literal `MIT`.
- `name` is the slugged identifier and must equal the folder name.
- Each `commands[].name` maps to `src/<name>.ts` or `src/<name>.tsx`.
- `icon` is a path under `assets/`; ship a real 512×512 PNG.
- `preferences` and `commands[].preferences` share one namespace: a command
  preference with the same `name` overrides the extension-level one.
- Dropdown `default` must be one of its own `data[].value` entries. A default
  outside that list is silently ignored.

`tests/test_compass_extensions.py` discovers every folder under
`compass-extensions/` at call time. There is no list to edit when adding one.

## API facts that differ from Raycast

Compass implements the `@vicinae/api` surface, but a few things are missing or
behave differently. Verify against the shipped API source before relying on a
Raycast example:

- **`AI.ask()` and `AI.getModels()` throw "not implemented".** Compass does not
  have an AI subsystem yet. The `ai-command` extension therefore calls provider
  HTTP APIs with `fetch`. Do not import `AI` expecting it to work.
- **`Detail` has no `isLoading` prop.** Put a "Thinking…" message in its
  `markdown` while work is pending.
- **No `@raycast/utils`** such as `usePromise`. Use React `useState`,
  `useEffect`, and plain promises with cleanup.
- `showToast({ style, title, message })` and
  `showToast(Toast.Style.Success, title, message)` both work;
  `Toast.Style.Failure` exists.
- `runInTerminal(argv, { hold, title, workingDirectory })` exists and goes
  through the engine's `xdg-terminal-exec` support. It is the right choice for
  "show the user a long-running command"; it does not let the extension pick a
  specific emulator. To force a specific terminal, spawn it directly (see
  below).
- `List.Item` accepts `keywords`, `icon` (including emoji strings), and
  `actions`. Avoid props you have not verified in `components/list.tsx`.

## Sandbox and host programs

Each TypeScript worker runs behind Landlock:

- Read: the system (`/usr`, `/etc`, …) and its own extension directory. In
  `$HOME`, only a small allowlist (`~/.ssh/config`, password store, a few WM
  configs). Everything else in home is denied.
- Write: only its support and assets directories. Use `LocalStorage` or
  `environment.supportPath` for state. `/tmp` is private per extension via
  `TMPDIR`.
- Execute: Node and system programs under `/usr`, `/bin`, `/lib`, `/app`. So a
  worker can legitimately `spawnSync("podman", …)` or `spawnSync("brew", …)`.
- Network is allowed. `fetch` works with the worker's proxy environment.
- No session sockets are handed to the worker: D-Bus, Wayland, `XDG_RUNTIME_DIR`
  and `COMPASS_SOCKET` are withheld. Doing GUI things requires the engine APIs
  (`open`, `runInTerminal`, window-management), not direct socket access.
- Syscalls are filtered and memory is capped; avoid native addons and large
  buffers.

### Raycast shim overrides are a different mechanism

`extensions/raycast-linux-overrides.json` in the Compass repo lists host
programs that **Raycast-store** extensions may ask the engine to run (currently
just `brew`, for `store.raycast.brew`). Native extensions in this repo do not go
through that shim; they execute system programs directly inside the sandbox.
Do not add entries there expecting a local extension to gain permissions.

## Conventions in this repo

- **Terminal choice is a preference.** Keep the terminal launch template in a
  single module per extension. `{command}` is replaced by a fully shell-quoted
  command, then the result is run with `/bin/sh -c` in a detached child. Never
  build a command string from unquoted container names or package names.
- **Install commands go through `runInTerminal`,** so the user sees progress
  and can interact with prompts. The install argv is an array; no shell string
  interpolation.
- **Runtimes are discovered, not assumed.** Probe `podman`, `docker`,
  `distrobox`, and `brew` with `--version` before parsing their output, and
  skip a failing runtime rather than failing the whole search.
- **No API keys in source.** Keys live in `password` preferences.
- **No hardcoded extension lists.** README and tests discover folders.

## Validate

Run from the repo root:

```bash
python3 -m unittest discover -s tests -t tests -v
python3 -m unittest discover -s tests -t tests -v -p 'test_compass_extensions.py'
```

`tests/test_compass_extensions.py` checks manifests, entrypoints, icons,
preference wiring (including dead preferences), ESM/no-`eval` sources, and that
no extension calls the unimplemented `AI` APIs. It fails when zero extensions
are discovered so the gate cannot pass vacuously.

A type check with the real SDK is a separate, optional step inside an extension
folder (`npm install && npx tsc --noEmit`). CI does not install npm packages for
these extensions; keep the Python gate authoritative for repo CI.

## Red flags

- A dropdown default that is not in its `data` list — the preference silently
  falls back or is ignored.
- A preference declared in `package.json` but read under a different name in
  source — the gate catches this; do not "fix" it by removing the check.
- Calling `AI.ask()` because a Raycast example does — it throws here.
- Assuming `~/.config` or `~/.local/share` is readable from the worker — use
  `LocalStorage` or the support directory.
- Quoting a container or package name into a shell command without
  `shellQuote`-style escaping.
