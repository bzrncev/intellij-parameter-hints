import {
  DecorationInstanceRenderOptions,
  ThemeColor,
  DecorationOptions,
  Range,
  workspace,
} from "vscode";

export class Annotations {
  public static paramAnnotation(
    message: string,
    range: Range
  ): DecorationOptions {
    return {
      range,
      renderOptions: {
        before: {
          color: new ThemeColor("phpannotations.annotationForeground"),
          backgroundColor: new ThemeColor(
            "phpannotations.annotationBackground"
          ),
          contentText: message,
          margin:
            "0px " +
            workspace.getConfiguration("phpannotations").get("margin") +
            "px;padding: 0 3px;",
          height: "-10px",
          fontStyle: workspace
            .getConfiguration("phpannotations")
            .get("fontStyle"),
          fontWeight:
            workspace.getConfiguration("phpannotations").get("fontWeight") +
            ";font-size:" +
            workspace.getConfiguration("phpannotations").get("fontSize") +
            "px;",
        },
      } as DecorationInstanceRenderOptions,
    } as DecorationOptions;
  }
}
