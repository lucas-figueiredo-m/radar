module.exports = {
  '*.{ts,tsx}': filenames => {
    const filtered = filenames.filter(
      f => !f.includes('/examples/'),
    );
    if (filtered.length === 0) return [];
    return [
      `eslint --fix ${filtered.join(' ')}`,
      `prettier --write ${filtered.join(' ')}`,
    ];
  },
};
