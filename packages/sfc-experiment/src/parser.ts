import {
  BaseToken,
  CodeToken,
  EmptyToken,
  IdentifierToken,
  StringToken,
  Token,
} from './tokenizer';

export interface Attribute extends BaseToken {
  id: IdentifierToken;
  value?: StringToken;
}

export interface Block extends BaseToken {
  type: IdentifierToken;
  attributes: Attribute[];
  code: CodeToken;
}

export interface SFC {
  blocks: Block[];
}

export default function parse(tokens: Token[]): SFC {
  let cursor = 0;
  const size = tokens.length;

  const blocks: Block[] = [];

  function getNextValidToken(): Exclude<Token, EmptyToken> | undefined {
    for (; cursor < size; cursor += 1) {
      const current = tokens[cursor];
      if (!(current.type === 'Comment' || current.type === 'MultilineComment' || current.type === 'Whitespace')) {
        return current;
      }
    }
    return undefined;
  }

  while (cursor < size) {
    const current = getNextValidToken();

    if (!current) {
      break;
    }

    if (current.type === 'Identifier') {
      const id = current;
      const attributes: Attribute[] = [];

      cursor += 1;

      const operand = getNextValidToken();
      if (!operand) {
        throw new Error(`Expected "(" or code at ${id.end}`);
      }
      if (operand.type === 'Operator') {
        if (operand.value === '(') {
          cursor += 1;
          // Collect attributes
          let requireComma = false;
          while (true) {
            const next = getNextValidToken();
            if (!next) {
              throw new Error(`Expected ")" or code at ${id.end}`);
            }
            if (requireComma) {
              if (next.type === 'Operator') {
                if (next.value === ',') {
                  cursor += 1;
                } else if (next.value === ')') {
                  cursor += 1;
                  break;
                }
              } else {
                throw new Error(`Unexpected ${next.type} at ${next.start}:${next.end}`);
              }
            }
            if (next.type === 'Identifier') {
              cursor += 1;
              const assignment = getNextValidToken();
              if (!assignment) {
                throw new Error(`Expected "=" or ")" at ${next.end}`);
              }
              if (assignment.type === 'Operator') {
                if (assignment.value === '=') {
                  cursor += 1;
                  const value = getNextValidToken();
                  if (!value) {
                    throw new Error(`Expected string at ${assignment.end}`);
                  }
                  if (value.type === 'String') {
                    attributes.push({
                      id: next,
                      value,
                      start: next.start,
                      end: value.end,
                      line: next.line,
                      column: next.column,
                    });
                    cursor += 1;
                    requireComma = true;
                  } else {
                    throw new Error(`Unexpected ${value.type} at ${value.start}:${value.end}`);
                  }
                } else if (assignment.value === ')') {
                  attributes.push({
                    id: next,
                    start: next.start,
                    end: next.end,
                    line: next.line,
                    column: next.column,
                  });
                  break;
                }
              }
            } else if (next.type === 'Operator') {
              if (next.value === ')') {
                cursor += 1;
                break;
              } else {
                throw new Error(`Unexpected '${next.value}' at ${next.start}:${next.end}`);
              }
            } else {
              throw new Error(`Unexpected ${next.type} at ${next.start}:${next.end}`);
            }
          }
        } else {
          throw new Error(`Unexpected '${operand.value}' at ${operand.start}:${operand.end}.`);
        }
      }

      const code = getNextValidToken();
      if (!code) {
        throw new Error(`Expected code at ${id.end}`);
      }
      if (code.type === 'Code') {
        blocks.push({
          type: id,
          attributes,
          code,
          start: id.start,
          end: code.end,
          line: id.line,
          column: id.column,
        });
        cursor += 1;
      }
    } else {
      throw new Error(`Unexpected ${current.type} at ${current.start}:${current.end}`);
    }
  }

  return {
    blocks,
  };
}
