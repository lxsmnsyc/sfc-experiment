import { RawSourceMap } from 'source-map';

export type BuildMode = 'ssr' | 'dom';

export interface Content {
  code: string;
  map: RawSourceMap;
}

export type Preprocessor =
  (id: string, content: Content, config: Config) => Content;

export type Preprocessors = {
  [key: string]: Record<string, Preprocessor>;
}

export interface Config {
  preprocessors?: Preprocessors;
  generate?: BuildMode;
  dev?: boolean;
  hmr?: 'esm' | 'standard' | 'vite' | 'webpack5';
}
