import { SourceNode } from 'source-map';
import { Block, SFC } from './parser';
import { Config, Content } from './types';

const blocks = new Set(['module', 'setup', 'style', 'template']);

function createContent(id: string, source: string, { code }: Block): Content {
  const child = new SourceNode(
    code.line,
    code.column,
    id,
  );
  child.add(code.value);
  const node = new SourceNode(null, null, id);
  node.add(child);
  node.setSourceContent(id, source);

  const result = node.toStringWithSourceMap();

  return {
    code: result.code,
    map: result.map.toJSON(),
  };
}

function getLangAttribute(block: Block) {
  for (let i = 0, len = block.attributes.length; i < len; i += 1) {
    const attribute = block.attributes[i];
    if (attribute.id.value === 'lang') {
      return attribute.value;
    }
  }
  return undefined;
}

function preprocessBlock(id: string, source: string, block: Block, config: Config) {
  const blockType = block.type.value;
  const content = createContent(id, source, block);
  if (config.preprocessors) {
    // Find the "lang" attribute
    const lang = getLangAttribute(block);
    if (lang && lang.value) {
      // Get preprocessor
      if (blocks.has(blockType) && blockType in config.preprocessors) {
        return config.preprocessors[blockType][lang.value](id, content, config);
      }
    }
  }
  return content;
}

export type PreprocessResult = {
  [key: string]: Content[];
};

export default function preprocess(id: string, source: string, sfc: SFC, config: Config) {
  const codes: PreprocessResult = {};

  for (let i = 0, len = sfc.blocks.length; i < len; i += 1) {
    const block = sfc.blocks[i];
    const result = preprocessBlock(id, source, block, config);
    const blockType = block.type.value;
    if (codes[blockType]) {
      codes[blockType].push(result);
    } else {
      codes[blockType] = [result];
    }
  }

  return codes;
}
