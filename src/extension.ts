/* Copyright (c) 2026 Josh Daugherty. See LICENSE for license. */
import * as vscode from "vscode";
import { getCSSLanguageService } from "vscode-css-languageservice";
import { TextDocument } from "vscode-languageserver-textdocument";

const cssLs = getCSSLanguageService();

/** Regex for Antlers expressions {{ ... }} (non-greedy, allows newlines). */
const ANTLERS_EXPR = /\{\{[\s\S]*?\}\}/g;

/**
 * Replace each {{ ... }} with a same-length valid CSS identifier placeholder
 * so the CSS language service sees valid syntax (e.g. #xxx...:before, url("...")).
 * Using spaces caused "identifier expected" after # and in other contexts.
 */
function stripAntlersExpressions(cssContent: string): string {
  return cssContent.replace(ANTLERS_EXPR, (match) => "x".repeat(match.length));
}

/**
 * Find all <style>...</style> blocks and return [startOffset, endOffset, innerContent] for each.
 * Offsets are into the full document text.
 */
function findStyleBlocks(document: vscode.TextDocument): Array<{ start: number; end: number; content: string }> {
  const text = document.getText();
  const blocks: Array<{ start: number; end: number; content: string }> = [];
  const styleOpen = /<style\b[^>]*>/gi;
  const styleClose = /<\/style\s*>/gi;
  let openMatch: RegExpExecArray | null;
  while ((openMatch = styleOpen.exec(text)) !== null) {
    const openEnd = openMatch.index + openMatch[0].length;
    const afterOpen = text.slice(openEnd);
    const closeMatch = styleClose.exec(afterOpen);
    if (!closeMatch) break;
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
function toVscodeSeverity(lspSeverity: number): vscode.DiagnosticSeverity {
  const map: vscode.DiagnosticSeverity[] = [
    vscode.DiagnosticSeverity.Error,
    vscode.DiagnosticSeverity.Warning,
    vscode.DiagnosticSeverity.Information,
    vscode.DiagnosticSeverity.Hint,
  ];
  return map[Math.max(0, (lspSeverity as number) - 1)] ?? vscode.DiagnosticSeverity.Error;
}

/**
 * Validate CSS inside <style> blocks: strip Antlers, run CSS LS, map diagnostics to original doc.
 */
function validateAntlersDocument(document: vscode.TextDocument): vscode.Diagnostic[] {
  const allDiagnostics: vscode.Diagnostic[] = [];
  const styleBlocks = findStyleBlocks(document);

  for (const block of styleBlocks) {
    const preprocessed = stripAntlersExpressions(block.content);
    const virtualUri = `antlers-css://${document.uri.fsPath}#${block.start}.css`;
    const virtualDoc = TextDocument.create(
      virtualUri,
      "css",
      0,
      preprocessed
    );
    const stylesheet = cssLs.parseStylesheet(virtualDoc);
    const rawDiagnostics = cssLs.doValidation(virtualDoc, stylesheet);

    for (const d of rawDiagnostics) {
      const startOffset = virtualDoc.offsetAt({ line: d.range.start.line, character: d.range.start.character });
      const endOffset = virtualDoc.offsetAt({ line: d.range.end.line, character: d.range.end.character });
      const originalStart = block.start + startOffset;
      const originalEnd = block.start + endOffset;
      const range = new vscode.Range(
        document.positionAt(originalStart),
        document.positionAt(originalEnd)
      );
      allDiagnostics.push(
        new vscode.Diagnostic(range, d.message, toVscodeSeverity(d.severity as number))
      );
    }
  }

  return allDiagnostics;
}

export function activate(context: vscode.ExtensionContext): void {
  const collection = vscode.languages.createDiagnosticCollection("antlers-css");

  function updateDiagnostics(uri: vscode.Uri, document?: vscode.TextDocument): void {
    if (uri.scheme !== "file") return;
    const doc = document ?? vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString());
    if (!doc || doc.languageId !== "antlers") {
      collection.delete(uri);
      return;
    }
    const diagnostics = validateAntlersDocument(doc);
    collection.set(uri, diagnostics);
  }

  function refreshAll(): void {
    for (const doc of vscode.workspace.textDocuments) {
      if (doc.languageId === "antlers") updateDiagnostics(doc.uri);
    }
  }

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => {
      if (doc.languageId === "antlers") updateDiagnostics(doc.uri, doc);
    }),
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.languageId === "antlers") updateDiagnostics(e.document.uri, e.document);
    }),
    vscode.workspace.onDidCloseTextDocument((doc) => {
      collection.delete(doc.uri);
    }),
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor?.document.languageId === "antlers") updateDiagnostics(editor.document.uri, editor.document);
    })
  );

  refreshAll();
}

export function deactivate(): void {}
