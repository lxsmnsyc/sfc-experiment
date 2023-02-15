export interface BaseToken {
  start: number;
  end: number;
  column: number;
  line: number;
}

export interface Whitespace extends BaseToken {
  type: 'Whitespace';
  value: string;
}

export interface CommentToken extends BaseToken {
  type: 'Comment';
  value: string;
}

export interface StringToken extends BaseToken {
  type: 'String';
  value: string;
}

export interface MultilineCommentToken extends BaseToken {
  type: 'MultilineComment';
  value: string;
}

export interface CodeToken extends BaseToken {
  type: 'Code';
  value: string;
}

export interface IdentifierToken extends BaseToken {
  type: 'Identifier';
  value: string;
}

export interface OperatorToken extends BaseToken {
  type: 'Operator';
  value: string;
}

export type EmptyToken =
  | CommentToken
  | MultilineCommentToken
  | Whitespace;

export type Token =
  | Whitespace
  | CommentToken
  | MultilineCommentToken
  | StringToken
  | CodeToken
  | IdentifierToken
  | OperatorToken;

function getLineAndColumn(input: string, start: number) {
  const result = input.substring(0, start).split('\n');
  return {
    line: result.length,
    column: result[result.length - 1].length,
  };
}

export default function tokenize(input: string): Token[] {
  let cursor = 0;
  const size = input.length;
  const tokens: Token[] = [];
  while (cursor < size) {
    const current = input.substring(cursor);
    if (/^\s+/.test(current)) {
      const start = cursor;
      const match = current.match(/^\s+/)?.[0] ?? '';
      cursor += match.length;
      tokens.push({
        type: 'Whitespace',
        value: match,
        start,
        end: cursor,
        ...getLineAndColumn(input, start),
      });
    } else if (/^[a-zA-Z]+/.test(current)) {
      const start = cursor;
      const match = current.match(/^[a-zA-Z]+/)?.[0] ?? '';
      cursor += match.length;
      tokens.push({
        type: 'Identifier',
        value: match,
        start,
        end: cursor,
        ...getLineAndColumn(input, start),
      });
    } else if (/[()=,]/.test(input[cursor])) {
      const start = cursor;
      const value = input[cursor];
      cursor += 1;
      tokens.push({
        type: 'Operator',
        value,
        start,
        end: cursor,
        ...getLineAndColumn(input, start),
      });
    } else if (current.startsWith('//')) {
      let value = '';
      const start = cursor;
      cursor += 2;
      while (input[cursor] !== '\n') {
        value += input[cursor];
        cursor += 1;
      }
      // Skip new line
      cursor += 1;
      tokens.push({
        type: 'Comment',
        value,
        start,
        end: cursor,
        ...getLineAndColumn(input, start),
      });
    } else if (current.startsWith('/*')) {
      let stack = 1;
      let value = '';
      const start = cursor;
      cursor += 2;
      while (stack > 0 && cursor < size) {
        const next = input.substring(cursor);
        if (next.startsWith('/*')) {
          stack += 1;
          value += '/*';
          cursor += 2;
        } else if (next.startsWith('*/')) {
          stack -= 1;
          if (stack > 0) {
            value += '*/';
            cursor += 2;
          }
        } else {
          value += input[cursor];
          cursor += 1;
        }
      }
      cursor += 2;
      tokens.push({
        type: 'MultilineComment',
        value,
        start,
        end: cursor,
        ...getLineAndColumn(input, start),
      });
    } else if (input[cursor] === '"' || input[cursor] === "'") {
      const delimiter = input[cursor];

      let value = '';
      const start = cursor;
      cursor += 1;

      while (input[cursor] !== delimiter && cursor < size) {
        if (input[cursor] === '\\' && input[cursor + 1] === delimiter) {
          value += delimiter;
          cursor += 1;
        } else {
          value += input[cursor];
        }
        cursor += 1;
      }

      cursor += 1;

      tokens.push({
        type: 'String',
        value,
        start,
        end: cursor,
        ...getLineAndColumn(input, start),
      });
    } else if (input[cursor] === '{') {
      let value = '';
      let stack = 1;
      const start = cursor;
      cursor += 1;

      while (stack > 0 && cursor < size) {
        // Skip comment
        if (input.substring(cursor, 2) === '//') {
          value += '//';
          cursor += 2;
          while (input[cursor] !== '\n' && cursor < size) {
            value += input[cursor];
            cursor += 1;
          }
          value += '\n';
          cursor += 1;
        // Skip multi-line comment
        } else if (input.substring(cursor, 2) === '/*') {
          value += '/*';
          cursor += 2;
          while (input[cursor] !== '*/' && cursor < size) {
            value += input[cursor];
            cursor += 1;
          }
          value += '*/';
          cursor += 2;
        // Skip strings
        } else if (
          input[cursor] === '"'
          || input[cursor] === "'"
          || input[cursor] === '`'
        ) {
          const delimiter = input[cursor];
          cursor += 1;
          value += delimiter;

          while (input[cursor] !== delimiter && cursor < size) {
            if (input[cursor] === '\\' && input[cursor + 1] === delimiter) {
              value += '\\';
              value += delimiter;
              cursor += 1;
            } else {
              value += input[cursor];
            }
            cursor += 1;
          }

          value += delimiter;
          cursor += 1;
        } else if (input[cursor] === '\\' && input[cursor + 1] === '{') {
          value += '{';
          cursor += 2;
        } else if (input[cursor] === '\\' && input[cursor + 1] === '}') {
          value += '}';
          cursor += 2;
        } else if (input[cursor] === '{') {
          stack += 1;
          value += '{';
          cursor += 1;
        } else if (input[cursor] === '}') {
          stack -= 1;
          if (stack > 0) {
            value += '}';
            cursor += 1;
          }
        } else {
          value += input[cursor];
          cursor += 1;
        }
      }

      cursor += 1;
      tokens.push({
        type: 'Code',
        value,
        start,
        end: cursor,
        ...getLineAndColumn(input, start),
      });
    }
  }
  return tokens;
}
