/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["../../.eslintrc.cjs", "plugin:storybook/recommended"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off"
  }
};