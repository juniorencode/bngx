import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { join, normalize } from 'path';
import * as fs from 'fs';

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

const deleteDirectoryRecursively = (path: string) => {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(file => {
      const curPath = join(path, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteDirectoryRecursively(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

export function deleteModule(_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const { name } = _options;

    if (!isAlphanumeric(name)) {
      _context.logger.info('');
      _context.logger.info(`El nombre del módulo es inválido.`);
      _context.logger.info('');
      return;
    }

    // variants
    const lowerName = name.toLowerCase();
    const dasherName = lowerName.replace(' ', '-');
    const className = camelize(lowerName, false);

    const _parentFolder = '/src';
    const toDelete = [
      `${_parentFolder}/app/domain/entities/${className}Entity.ts`,
      `${_parentFolder}/app/domain/dtos/${dasherName}/`,
      `${_parentFolder}/app/services/${dasherName}.service.ts`,
      `${_parentFolder}/app/services/${dasherName}.service.spec.ts`,
      `${_parentFolder}/stores/${dasherName}/${className}Store.ts`,
      `${_parentFolder}/app/pages/system/${dasherName}/`
    ];

    toDelete.forEach(filePath => {
      const normalizedPath = normalize(filePath);
      if (tree.exists(normalizedPath)) {
        const fileEntry = tree.get(normalizedPath);
        if (fileEntry) {
          if (fileEntry.path.endsWith('/')) {
            const dirPath = join(tree.root.path, normalizedPath);
            deleteDirectoryRecursively(dirPath);
          } else {
            tree.delete(normalizedPath);
          }
        }
      } else {
        _context.logger.warn(`El archivo o directorio ${filePath} no existe.`);
      }
    });

    return tree;
  };
}
