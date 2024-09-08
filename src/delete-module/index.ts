import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as path from 'path';
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

const deleteEmptyDirectories = (
  dirPath: string,
  _context: SchematicContext
): void => {
  const normalizeDirPath = path.normalize(dirPath);
  if (fs.existsSync(normalizeDirPath)) {
    fs.readdirSync(normalizeDirPath).forEach(file => {
      const curPath = path.join(normalizeDirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteEmptyDirectories(curPath, _context);
      }
    });
    try {
      fs.rmdirSync(normalizeDirPath);
    } catch (error) {
      _context.logger.warn(
        `No se puede eliminar el directorio ${dirPath}. Puede que no esté vacío o haya un error de permisos.`
      );
    }
  } else {
    _context.logger.warn(`El directorio ${dirPath} no existe.`);
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

    // paths
    const _parentFolder = 'src';
    const path_route = '/src/app/pages/system/system.routes.ts';
    const path_navigation =
      '/src/app/pages/system/system-layout/system-layout.component.ts';
    const toDelete = [
      `${_parentFolder}/app/domain/entities/${className}Entity.ts`,
      `${_parentFolder}/app/domain/dtos/${dasherName}`,
      `${_parentFolder}/app/services/${dasherName}.service.ts`,
      `${_parentFolder}/app/services/${dasherName}.service.spec.ts`,
      `${_parentFolder}/stores/${dasherName}`,
      `${_parentFolder}/app/pages/system/${dasherName}`
    ];

    const deleteFile = (filePath: string) => {
      try {
        if (!tree.exists(filePath)) {
          const dirEntry = tree.getDir(filePath);

          if (!dirEntry.subdirs.length && !dirEntry.subfiles.length) {
            _context.logger.warn(`El directorio ${filePath} no existe.`);
          } else {
            dirEntry.subfiles.forEach(subFile => {
              deleteFile(`${filePath}/${subFile}`);
            });
            dirEntry.subdirs.forEach(subDir => {
              deleteFile(`${filePath}/${subDir}`);
            });
          }
        } else {
          tree.delete(filePath);
        }
      } catch (error) {
        _context.logger.warn(`No se puede eliminar ${filePath}`, error);
      }
    };

    toDelete.forEach(file => deleteFile(file));

    // UPDATE ROUTES FILE
    const routesBuffer = tree.read(path_route);

    if (routesBuffer) {
      let routesContent = routesBuffer.toString('utf-8');

      // IMPORTS
      const _import = `import { ${className}Component } from './${dasherName}/${dasherName}.component';`;
      if (routesContent.includes(_import)) {
        routesContent = routesContent.replace(_import, '');
      }

      // ROUTES
      const _routes = `{ path: '${dasherName}', component: ${className}Component },`;
      if (routesContent.includes(_routes)) {
        routesContent = routesContent.replace(_routes, '');
      }

      tree.overwrite(path_route, routesContent);
    }

    // UPDATE NAVIGATION
    const navigationBuffer = tree.read(path_navigation);

    if (navigationBuffer) {
      let navigationContent = navigationBuffer.toString('utf-8');

      const regex = new RegExp(`\\{[^}]*${dasherName}[^}]*\\},`, 'g');
      const _item = navigationContent.match(regex)?.[0] || null;
      console.log(_item);
      if (_item && navigationContent.includes(_item)) {
        navigationContent = navigationContent.replace(_item, '');
      }

      tree.overwrite(path_navigation, navigationContent);
    }

    return tree;
  };
}
