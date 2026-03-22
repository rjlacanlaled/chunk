import { globalIgnores } from 'eslint/config';
import { configs, plugins } from 'eslint-config-airbnb-extended';

const eslintConfig = [
  plugins.stylistic,
  plugins.importX,
  plugins.react,
  plugins.reactA11y,
  plugins.reactHooks,
  plugins.next,
  plugins.typescriptEslint,
  ...configs.next.all,
  {
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/jsx-props-no-spreading': 'off',
      'import-x/prefer-default-export': 'off',
      'react/require-default-props': 'off',
      'no-console': 'warn',
    },
  },
  globalIgnores([
    'node_modules/**',
    '.next/**',
    'dist/**',
  ]),
];

export default eslintConfig;
