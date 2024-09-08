import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

export function createModule(_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const { name } = _options;
    console.log(name);
    return tree;
  };
}
