/* @flow */
import type { CreateTemplate } from '../../types';

module.exports = (createTemplate: CreateTemplate) => createTemplate`
{
  "parser": "babel-eslint",
  "rules": {
    "comma-dangle": 0,
    "no-cond-assign": [2, "always"],
    "no-extra-boolean-cast": 0,

    "curly": 2,
    "default-case": 2,
    "eqeqeq": 2,
    "no-case-declarations": 2,
    "no-else-return": 2,
    "no-fallthrough": 2,
    "no-redeclare": 2,
    "no-warning-comments": [1, { "terms": ["todo"], "location": "start" }],

    "no-undef": 2,
    "no-undef-init": 2,
    "no-undefined": 2,
    "no-unused-vars": 2,

    "eol-last": 2,
    "indent": [2, 2, {"SwitchCase": 1, "VariableDeclarator": { "var": 2, "let": 2, "const": 3}}],
    "jsx-quotes": [2, "prefer-double"],
    "linebreak-style": [2, "unix"],
    "no-trailing-spaces": 1,
    "quotes": [2, "double"],
    "semi": [2, "always"],

    "no-var": 2,
    "prefer-const": 2,

    "react/display-name": 0,
    "react/wrap-multilines": 2
  },
  "env": {
    "es6": true,
    "node": true,
    "browser": true,
    "jest": true
  },
  "extends": ["eslint:recommended", "plugin:react/recommended"],
  "ecmaFeatures": {
    "jsx": true,
    "experimentalObjectRestSpread": true
  },
  "plugins": [
    "react"
  ]
}
`;
