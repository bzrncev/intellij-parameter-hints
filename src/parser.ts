var engine = require("php-parser");

var parser = new engine({
  parser: {
    extractDoc: true,
    php7: true,
  },
  ast: {
    withPositions: true,
  },
});

export function parse(code: string) {
  var parsedPhpCode: any = parser.parseEval(code.replace("<?php", ""));

  const expressions: any[] = [];

  function parsePhpObject(obj: any) {
    if (obj.children) {
      obj.children.forEach((children: any) => {
        return parsePhpObject(children);
      });
    }

    if (obj.body) {
      if (Array.isArray(obj.body)) {
        obj.body.forEach((children: any) => {
          return parsePhpObject(children);
        });
      } else {
        if (obj.body.children) {
          obj.body.children.forEach((children: any) => {
            return parsePhpObject(children);
          });
        }
      }
    }

    if (obj.expression) {
      if (obj.expression.arguments) {
        obj.expression.arguments.forEach((argument: any) => {
          if (argument.body || argument.children) {
            return parsePhpObject(argument);
          }
        });
      }
      expressions.push(obj.expression);
    }

    if (obj.expr) {
      expressions.push(obj.expr);
    }
  }

  parsePhpObject(parsedPhpCode);

  var phpArguments: any[] = [];

  function parsePhpExpression(expression: any): any {
    if (expression.arguments && expression.arguments.length > 0) {
      expression.arguments.forEach((arg: any, key: number) => {
        if (
          expression.what &&
          (expression.what.offset || expression.what.loc)
        ) {
          const startLoc: any = arg.loc.start;
          const endLoc: any = arg.loc.end;
          const expressionLoc = expression.what.offset
            ? expression.what.offset.loc.start
            : expression.what.loc.end;
          const argument: any = {
            expression: {
              line: parseInt(expressionLoc.line) - 1,
              character: parseInt(expressionLoc.column),
            },
            key: key,
            start: {
              line: parseInt(startLoc.line) - 1,
              character: parseInt(startLoc.column),
            },
            end: {
              line: parseInt(endLoc.line) - 1,
              character: parseInt(endLoc.column),
            },
          };

          return phpArguments.push(argument);
        }
      });
    }

    if (expression.what) {
      return parsePhpExpression(expression.what);
    }

    if (expression.right) {
      return parsePhpExpression(expression.right);
    }
  }

  expressions.forEach((expression) => {
    const test = parsePhpExpression(expression);
  });

  return phpArguments;
}
