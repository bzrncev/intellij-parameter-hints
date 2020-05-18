import * as vscode from "vscode";
import Commands from "./commands";
import * as parser from "./parser";
import { Annotations } from "./annotationProvider";

const hintDecorationType = vscode.window.createTextEditorDecorationType({});

function getAttrName(
  editor: vscode.TextEditor,
  position: vscode.Position,
  key: number
) {
  return new Promise(async (resolve, reject) => {
    var args: vscode.Location[] = [];
    var hoverCommand: any = await vscode.commands.executeCommand<
      vscode.Hover[]
    >("vscode.executeHoverProvider", editor.document.uri, position);

    if (hoverCommand && hoverCommand.length > 0) {
      try {
        const regEx = /(?<=@param.+)(\$[a-zA-Z0-9_]+)/g;
        args = hoverCommand[0].contents[0].value.match(regEx);
      } catch (err) {}
    }
    if (args) {
      resolve(args[key]);
    }

    reject();
  });
}

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {
  let timeout: NodeJS.Timer | undefined = undefined;

  let activeEditor = vscode.window.activeTextEditor;

  if (activeEditor && activeEditor.document.languageId !== "php") {
    return;
  }

  async function updateDecorations() {
    if (!activeEditor) {
      return;
    }

    const isEnabled = vscode.workspace
      .getConfiguration("phpannotations")
      .get("enabled");

    if (!isEnabled) {
      activeEditor.setDecorations(hintDecorationType, []);
      return;
    }

    const text = activeEditor.document.getText();
    let phpArguments = [];
    try {
      phpArguments = parser.parse(text);
    } catch (err) {}

    if (phpArguments.length === 0) {
      return;
    }

    const phpFunctions: vscode.DecorationOptions[] = [];

    for (let index = 0; index < phpArguments.length; index++) {
      var argument = phpArguments[index];

      const start = new vscode.Position(
        argument.start.line,
        argument.start.character
      );
      const end = new vscode.Position(
        argument.end.line,
        argument.end.character
      );

      let args: any;
      try {
        args = await getAttrName(
          activeEditor,
          new vscode.Position(
            argument.expression.line,
            argument.expression.character
          ),
          argument.key
        );
      } catch (err) {}

      if (args) {
        const decorationPHP = Annotations.paramAnnotation(
          args.replace("$", "  ") + ":  ",
          new vscode.Range(start, end)
        );

        phpFunctions.push(decorationPHP);
      }
    }

    activeEditor.setDecorations(hintDecorationType, phpFunctions);
  }

  function triggerUpdateDecorations(timer: boolean = true) {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
    timeout = setTimeout(updateDecorations, timer ? 2500 : 10);
  }

  vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration("phpannotations")) {
      triggerUpdateDecorations(false);
    }
  });

  Commands.registerCommands();

  vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      activeEditor = editor;
      if (editor) {
        triggerUpdateDecorations();
      }
    },
    null,
    context.subscriptions
  );

  vscode.workspace.onDidChangeTextDocument(
    (event) => {
      if (activeEditor && event.document === activeEditor.document) {
        triggerUpdateDecorations(false);
      }
    },
    null,
    context.subscriptions
  );

  if (activeEditor) {
    triggerUpdateDecorations();
  }
}
