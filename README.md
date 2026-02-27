# Antlers CSS Validation

VS Code extension that validates CSS inside `<style>` blocks in `.antlers.html` (Statamic Antlers) files. **Antlers template expressions** like `{{ 'module-' + id }}` and `{{ glide :src='...' }}` are treated as valid so you don’t get false “identifier expected” or “} expected” errors, while real CSS issues are still reported.

## How it works

- Registers the language **Antlers** for `*.antlers.html`.
- When you open such a file, the built-in HTML/CSS validator does **not** run (the file is no longer treated as HTML).
- This extension finds every `<style>...</style>` block, replaces each `{{ ... }}` with spaces (to keep positions correct), runs the CSS language service on that preprocessed CSS, then maps diagnostics back to the original document.

## Installation (no marketplace)

### Install from GitHub Release (no clone or build)

1. Open the [Releases](https://github.com/joshdaugherty/vscode-antlers-css-validation/releases) page and download the latest `.vsix` from the release assets.
2. In VS Code: **Ctrl+Shift+P** (or **Cmd+Shift+P** on Mac) → **Extensions: Install from VSIX…**
3. Select the downloaded `.vsix` file.

To update: download the new `.vsix` from a newer release and install again (or install over the existing extension).

### Install from folder (clone + build)

1. Clone the repo (e.g. into a folder you keep for extensions):
   ```bash
   git clone https://github.com/joshdaugherty/vscode-antlers-css-validation.git
   cd vscode-antlers-css-validation
   ```
2. Build the extension:
   ```bash
   npm install
   npm run compile
   ```
3. In VS Code: **Ctrl+Shift+P** (or **Cmd+Shift+P** on Mac) → run **Developer: Install Extension from Location…**
4. Select the `vscode-antlers-css-validation` folder. The extension is installed for your user and will work in any project.

To update after pulling changes: run `npm run compile` in the extension folder, then run **Developer: Install Extension from Location…** again and select the same folder (or reload the window).

### Build a VSIX locally (portable / shareable)

1. In the extension folder, install the packaging tool once: `npm install -g @vscode/vsce` (or use `npx @vscode/vsce package`).
2. Build and package:
   ```bash
   npm install
   npm run compile
   vsce package
   ```
3. In VS Code: **Ctrl+Shift+P** → **Extensions: Install from VSIX…** → choose the generated `.vsix` file.

You can reuse the same `.vsix` on other machines or back up the file; re-run `vsce package` when you update the extension.

### Run from source (development)

1. Open this folder in VS Code.
2. Run `npm install` then `npm run compile`.
3. Press **F5** (or **Run > Start Debugging**) to open a new window with the extension loaded.
4. In that window, open a `.antlers.html` file to test.

## File association

If `.antlers.html` files still open as “HTML”, add to your user or workspace settings:

```json
"files.associations": {
  "**/*.antlers.html": "antlers"
}
```

## Requirements

- VS Code ^1.85.0
- `vscode-css-languageservice` and `vscode-languageserver-textdocument` (installed via `npm install`)