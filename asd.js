
function getLineAndColumn(input, start) {
  const result = input.substring(0, start).split('\n');
  return {
    line: result.length,
    column:result[result.length - 1].length,
  };
}

const code = `
module(lang="ts") {
  import { createSignal } from 'solid-js';
}
setup(lang="ts") {
  const [count, setCount] = createSignal(0);

  function increment() {
    setCount((c) => c + 1);
  }
}
style {
  button {
    color: blue;
  }
}
template {
  <button onClick={increment}>
    Count: {count()}
  </button>
}
`;

console.log(getLineAndColumn(code, code.indexOf('onClick')));