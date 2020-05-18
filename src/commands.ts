import * as vscode from "vscode";

export default class Commands {
  public static registerCommands() {
    // Command to hide / show annotations
    vscode.commands.registerCommand("phpannotations.toggle", () => {
      const currentState = vscode.workspace
        .getConfiguration("phpannotations")
        .get("enabled");
      vscode.workspace
        .getConfiguration("phpannotations")
        .update("enabled", !currentState, true);
    });
  }
}
