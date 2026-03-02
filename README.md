# Antlers CSS Validation

VS Code extension that validates CSS inside `<style>` blocks in `.antlers.html` (Statamic Antlers) files. **Antlers template expressions** like `{{ 'module-' + id }}` and `{{ glide :src='...' }}` are treated as valid so you don’t get false “identifier expected” or “} expected” errors, while real CSS issues are still reported.

## How it works

- Contributes **`.antlers.html`** (and `.antlers.htm`) to the built-in **HTML** language, so those files keep full HTML behavior (validation, IntelliSense, Emmet, etc.) by default.
- Contributes a grammar for HTML that injects Antlers syntax (`{{ ... }}`) into `text.html.basic`, so you get HTML + Antlers highlighting without any settings.
- This extension activates on HTML and runs only for Antlers HTML files (by path). It finds every `<style>...</style>` block, replaces each `{{ ... }}` with a valid placeholder (to keep positions correct), runs the CSS language service on that preprocessed CSS, then maps diagnostics back to the original document.

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

## Built-in CSS validation

Because `.antlers.html` is treated as **HTML**, VS Code’s built-in validator also runs on `<style>` blocks. It doesn’t understand Antlers, so it reports false errors like “identifier expected” or “} expected” at `#{{ 'module-' + id }}`.

**This extension sets the default** `html.validate.styles` to **false** so the built-in validator is off. **This extension then validates `<style>` in all HTML files:** for `.antlers.html` it strips `{{ ... }}` first (Antlers-aware), for plain `.html` / `.htm` it validates the CSS as-is. So you keep full style validation for both Antlers and non-Antlers HTML; only the built-in run is disabled. After installing, reload the window if you still see duplicate CSS errors.

To turn the built-in validator back on (e.g. for plain `.html` files), set in your `settings.json`:

```json
"html.validate.styles": true
```

## Coexistence with Antlers Toolbox (Stillat)

This extension follows the same approach as [Antlers Toolbox](https://github.com/Stillat/vscode-antlers-language-server): it contributes `.antlers.html` to the **HTML** language and a grammar for HTML that includes Antlers. If both extensions are installed, `.antlers.html` remains HTML and both add their behavior (Toolbox: completions, formatting, diagnostics; this extension: CSS validation in `<style>`). Only one grammar applies to the `html` language (load order decides which).

## Requirements

- VS Code ^1.85.0
- `vscode-css-languageservice` and `vscode-languageserver-textdocument` (installed via `npm install`)