import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
const pluralize = require('pluralize');

const isAlphanumeric = (str: string) => {
  const alphanumericRegex = /^[a-zA-Z0-9\s]+$/;
  return alphanumericRegex.test(str.trim());
};

const camelize = (
  str: string,
  camel: boolean = true,
  spaces: boolean = false
) => {
  return str
    .toLowerCase()
    .split(/[^a-zA-Z0-9]+/)
    .map((word, index) =>
      index === 0 && camel ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(spaces ? ' ' : '');
};

export function createModule(_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const { nameEnglish, nameSpanish } = _options;

    if (!isAlphanumeric(nameEnglish)) {
      _context.logger.info('');
      _context.logger.info(`El nombre del módulo es inválido.`);
      _context.logger.info('');
      return;
    }

    // variants
    const name = camelize(nameEnglish, false, true);
    const lowerName = nameEnglish.toLowerCase();
    const pluralName = pluralize(lowerName).replace(' ', '-');
    const dasherName = lowerName.replace(' ', '-');
    const className = camelize(lowerName, false);
    const camelName = camelize(lowerName);

    console.log({
      nameSpanish,
      nameEnglish,
      name,
      lowerName,
      pluralName,
      dasherName,
      className,
      camelName
    });

    return tree;
  };
}
