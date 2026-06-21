// ESLint v9 flat config：对 src 下的 Node 代码做基础质量检查。
const js = require("@eslint/js");

module.exports = [
  js.configs.recommended,
  {
    files: ["src/**/*.js", "test/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "writable",
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "error",
      eqeqeq: "error",
      "no-var": "error",
      "prefer-const": "error",
      "no-dupe-keys": "error",
      "no-empty": "error",
      "no-unreachable": "error"
    }
  },
  {
    files: ["test/**/*.js"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        jest: "readonly"
      }
    }
  }
];
