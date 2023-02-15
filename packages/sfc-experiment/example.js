import { tokenize, parse, preprocess } from 'sfc-experiment';

const code = `
setup {
  import { createSignal } from 'solid-js';

  const [count, setCount] = createSignal();

  function onClick() {
    setCount((c) => c + 1);
  }
}
style {
  button {
    padding: 1rem;
  }
}
template {
  <button onClick={onClick}>
    Count: {count()}
  </button>
}
`;

const tokens = tokenize(code);
const ast = parse(tokens);
const preprocessed = preprocess('example.solid', code, ast, {});


console.dir(preprocessed, {
  depth: null,
})