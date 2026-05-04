module.exports = {
  '*.{ts,tsx}': filenames => {
    const filtered = filenames.filter(
      f => /\/(apps\/app|packages\/(database|devtools|mcp|types))\//.test(f),
    );
    if (filtered.length === 0) return [];
    return [
      `eslint --fix ${filtered.join(' ')}`,
      `prettier --write ${filtered.join(' ')}`,
    ];
  },
};
