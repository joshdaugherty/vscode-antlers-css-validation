"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const vscode_css_languageservice_1 = require("vscode-css-languageservice");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const cssLs = (0, vscode_css_languageservice_1.getCSSLanguageService)();
/** Regex for Antlers expressions {{ ... }} (non-greedy, allows newlines). */
const ANTLERS_EXPR = /\{\{[\s\S]*?\}\}/g;
/**
 * Replace each {{ ... }} in cssContent with spaces so length is preserved
 * and the CSS language service sees valid (empty) tokens.
 */
function stripAntlersExpressions(cssContent) {
    return cssContent.replace(ANTLERS_EXPR, (match) => " ".repeat(match.length));
}
/**
 * Find all <style>...</style> blocks and return [startOffset, endOffset, innerContent] for each.
 * Offsets are into the full document text.
 */
function findStyleBlocks(document) {
    const text = document.getText();
    const blocks = [];
    const styleOpen = /<style\b[^>]*>/gi;
    const styleClose = /<\/style\s*>/gi;
    let openMatch;
    while ((openMatch = styleOpen.exec(text)) !== null) {
        const openEnd = openMatch.index + openMatch[0].length;
        const afterOpen = text.slice(openEnd);
        const closeMatch = styleClose.exec(afterOpen);
        if (!closeMatch)
            break;
        const contentStart = openEnd;
        const contentEnd = openEnd + closeMatch.index;
        const content = text.slice(contentStart, contentEnd);
        blocks.push({
            start: contentStart,
            end: contentEnd,
            content,
        });
    }
    return blocks;
}
/** LSP DiagnosticSeverity (1=Error, 2=Warning, …) to VS Code DiagnosticSeverity (0=Error, 1=Warning, …). */
function toVscodeSeverity(lspSeverity) {
    const map = [
        vscode.DiagnosticSeverity.Error,
        vscode.DiagnosticSeverity.Warning,
        vscode.DiagnosticSeverity.Information,
        vscode.DiagnosticSeverity.Hint,
    ];
    return map[Math.max(0, lspSeverity - 1)] ?? vscode.DiagnosticSeverity.Error;
}
/**
 * Validate CSS inside <style> blocks: strip Antlers, run CSS LS, map diagnostics to original doc.
 */
function validateAntlersDocument(document) {
    const allDiagnostics = [];
    const styleBlocks = findStyleBlocks(document);
    for (const block of styleBlocks) {
        const preprocessed = stripAntlersExpressions(block.content);
        const virtualUri = `antlers-css://${document.uri.fsPath}#${block.start}.css`;
        const virtualDoc = vscode_languageserver_textdocument_1.TextDocument.create(virtualUri, "css", 0, preprocessed);
        const stylesheet = cssLs.parseStylesheet(virtualDoc);
        const rawDiagnostics = cssLs.doValidation(virtualDoc, stylesheet);
        for (const d of rawDiagnostics) {
            const startOffset = virtualDoc.offsetAt({ line: d.range.start.line, character: d.range.start.character });
            const endOffset = virtualDoc.offsetAt({ line: d.range.end.line, character: d.range.end.character });
            const originalStart = block.start + startOffset;
            const originalEnd = block.start + endOffset;
            const range = new vscode.Range(document.positionAt(originalStart), document.positionAt(originalEnd));
            allDiagnostics.push(new vscode.Diagnostic(range, d.message, toVscodeSeverity(d.severity)));
        }
    }
    return allDiagnostics;
}
function activate(context) {
    const collection = vscode.languages.createDiagnosticCollection("antlers-css");
    function updateDiagnostics(uri, document) {
        if (uri.scheme !== "file")
            return;
        const doc = document ?? vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString());
        if (!doc || doc.languageId !== "antlers") {
            collection.delete(uri);
            return;
        }
        const diagnostics = validateAntlersDocument(doc);
        collection.set(uri, diagnostics);
    }
    function refreshAll() {
        for (const doc of vscode.workspace.textDocuments) {
            if (doc.languageId === "antlers")
                updateDiagnostics(doc.uri);
        }
    }
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument((doc) => {
        if (doc.languageId === "antlers")
            updateDiagnostics(doc.uri, doc);
    }), vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.document.languageId === "antlers")
            updateDiagnostics(e.document.uri, e.document);
    }), vscode.workspace.onDidCloseTextDocument((doc) => {
        collection.delete(doc.uri);
    }), vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor?.document.languageId === "antlers")
            updateDiagnostics(editor.document.uri, editor.document);
    }));
    refreshAll();
}
function deactivate() { }
//# sourceMappingURL=extension.js.map