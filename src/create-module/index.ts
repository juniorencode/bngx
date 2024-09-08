import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
const pluralize = require('pluralize');

export function createModule(_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const { name } = _options;
    console.log(pluralize(name));
    return tree;
  };
}
