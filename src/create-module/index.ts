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

    const _parentFolder = '/src';

    // content
    const contents = {
      entity: `export type ${className}Entity = {
  id: number;
};`,
      dtoCreate: `export interface Dto${className}Create {
  name: string;
}`,
      dtoEdit: `import { Dto${className}Create } from './Dto${className}Create';

export type Dto${className}Edit = Dto${className}Create & {
  id: number;
};`,
      dtoResponse: `import { ${className}Entity } from '../../entities/${className}Entity';

export type DtoResponse${className} = ${className}Entity & {};`,
      dtoResponseList: `import { DtoResponse${className} } from './DtoResponse${className}';

export type DtoResponse${className}List = DtoResponse${className}[];`,
      store: `import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { DtoResponse${className}List } from '@/app/domain/dtos/${dasherName}/DtoResponse${className}List';
import { ${className}Service } from '@/app/services/${dasherName}.service';

export type ${className}State = {
  entities: DtoResponse${className}List;
};

const initialState: ${className}State = {
  entities: [],
};

export const ${className}Store = signalStore(
  { providedIn: 'root' },
  withState<${className}State>(initialState),
  withMethods((state, ${camelName}Service = inject(${className}Service)) => ({
    doList(isLoading?: any) {

      if (isLoading && !state.entities().length) isLoading.set(true);

      ${camelName}Service.list().subscribe({
        next: (entities) => {
          if (isLoading) isLoading.set(false);
          patchState(state, { entities });
        },
        error: (error) => {
          console.error({ error });
          if (isLoading) isLoading.set(false);
        },
      });
    },
  }))
);`,
      service: `import { Injectable } from '@angular/core';
import { environment } from '@/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Dto${className}Create } from '../domain/dtos/${dasherName}/Dto${className}Create';
import { Dto${className}Edit } from '../domain/dtos/${dasherName}/Dto${className}Edit';
import { DtoResponse${className} } from '../domain/dtos/${dasherName}/DtoResponse${className}';
import { DtoResponse${className}List } from '../domain/dtos/${dasherName}/DtoResponse${className}List';

@Injectable({
  providedIn: 'root',
})
export class ${className}Service {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<DtoResponse${className}List>(
      \`\${environment.apiUrl}/${pluralName}/list\`
    );
  }

  store(values: Dto${className}Create) {
    return this.http.post<{ message: string; created: DtoResponse${className} }>(
      \`\${environment.apiUrl}/${pluralName}/store\`,
      values
    );
  }

  update(values: Dto${className}Edit) {
    return this.http.post<{ message: string; created: DtoResponse${className} }>(
      \`\${environment.apiUrl}/${pluralName}/update\`,
      values
    );
  }

  delete(id: number) {
    return this.http.post<{ message: string }>(
      \`\${environment.apiUrl}/${pluralName}/delete\`,
      { id }
    );
  }
}`,
      serviceSpec: `import { TestBed } from '@angular/core/testing';

import { ${className}Service } from './${dasherName}.service';

describe('${className}Service', () => {
  let service: ${className}Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(${className}Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});`,
      mainCSS: '',
      mainHTML: `<p-breadcrumb styleClass="px-0 pt-2 pb-1 bg-transparent" [model]="items">
  <ng-template pTemplate="item" let-item>
    <ng-container *ngIf="item.route; else elseBlock">
      <a [routerLink]="item.route" class="p-menuitem-link">
        <span [ngClass]="[item.icon ? item.icon : '', 'text-color']"></span>
        <span class="text-primary font-semibold">{{ item.label }}</span>
      </a>
    </ng-container>
    <ng-template #elseBlock>
      <a [href]="item.url">
        <span class="text-color">{{ item.label }}</span>
      </a>
    </ng-template>
  </ng-template>
</p-breadcrumb>

<div class="flex items-center justify-between w-full">
  <h1 class="text-4xl">${nameSpanish.toUpperCase()}</h1>
  <p-button
    label="NUEVO"
    icon="pi pi-save"
    size="large"
    (click)="onOpenModal()"
  />
</div>

<p-card styleClass="mt-4">
  <ng-template pTemplate="header">
    <div class="flex justify-end m-3">
      <p-iconField [style]="{ width: '100%', maxWidth: '300px' }">
        <p-inputIcon styleClass="pi pi-search" />
        <input
          pInputText
          type="text"
          size="small"
          placeholder="Buscador"
          (input)="dt1.filterGlobal($any($event.target).value, 'contains')"
        />
      </p-iconField>
    </div>
  </ng-template>

  <p-table
    #dt1
    [style]="{ 'border-top': 'solid 1px #E4E4E4' }"
    styleClass="p-datatable-striped"
    [rows]="10"
    dataKey="id"
    selectionMode="single"
    [paginator]="true"
    [loading]="isLoading()"
    [value]="${camelName}Store.entities()"
    [showCurrentPageReport]="true"
    [rowsPerPageOptions]="[5, 10, 25, 50]"
    currentPageReportTemplate="Visualizar {first} a {last} de {totalRecords} registros"
    [globalFilterFields]="['id', 'name']"
  >
    <ng-template pTemplate="header">
      <tr>
        <th style="width: 50px">N°</th>
        <th pSortableColumn="name">Nombre <p-sortIcon field="name" /></th>
        <th style="width: 160px" pSortableColumn="created_at">
          Fecha de creación <p-sortIcon field="created_at" />
        </th>
        <th class="text-center" style="width: 80px">Opciones</th>
      </tr>
    </ng-template>

    <ng-template pTemplate="body" let-${camelName} let-rowIndex="rowIndex">
      <tr *ngIf="!isLoading()" [pSelectableRow]="${camelName}">
        <td>
          {{ rowIndex + 1 }}
        </td>
        <td>
          {{ ${camelName}.name }}
        </td>
        <td class="py-1 text-center">
          <p-button
            (click)="onOpenMenuOptionsRowTable($event, menu, ${camelName})"
            [rounded]="true"
            [text]="true"
            icon="pi pi-ellipsis-v"
          />
          <p-menu #menu [model]="options()" appendTo="body" [popup]="true" />
        </td>
      </tr>
    </ng-template>

    <ng-template pTemplate="loadingbody">
      <tr *ngFor="let i of [].constructor(10)">
        <td><p-skeleton width="2rem" height="1.5rem"></p-skeleton></td>
        <td><p-skeleton width="16rem" height="1.5rem"></p-skeleton></td>
        <td><p-skeleton width="5rem" height="1.5rem"></p-skeleton></td>
      </tr>
    </ng-template>

    <ng-template pTemplate="emptymessage">
      <tr>
        <td class="text-center" colspan="3">No se encontraron registros.</td>
      </tr>
    </ng-template>
  </p-table>
</p-card>

<app-${dasherName}-create />
<app-${dasherName}-edit />
`,
      mainTS: `import { CommonModule } from '@angular/common';
import { Component, inject, signal, ViewChild } from '@angular/core';
import { CardModule } from 'primeng/card';
import { MenuModule } from 'primeng/menu';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { DtoResponse${className} } from '@/app/domain/dtos/${dasherName}/DtoResponse${className}';
import { ${className}Entity } from '@/app/domain/entities/${className}Entity';
import { ${className}Service } from '@/app/services/${dasherName}.service';
import { HelperStore } from '@/stores/HelpersStore';
import { ${className}Store } from '@/stores/${dasherName}/${className}Store';
import { ${className}CreateComponent } from './create/${dasherName}-create.component';
import { ${className}EditComponent } from './edit/${dasherName}-edit.component';

@Component({
  selector: 'app-${dasherName}',
  standalone: true,
  imports: [
    MenuModule,
    CardModule,
    TableModule,
    CommonModule,
    ButtonModule,
    SkeletonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    BreadcrumbModule,
    ${className}EditComponent,
    ${className}CreateComponent,
  ],
  templateUrl: './${dasherName}.component.html',
  styleUrl: './${dasherName}.component.css',
  providers: [MessageService],
})
export class ${className}Component {
  @ViewChild(${className}CreateComponent) createComponent!: ${className}CreateComponent;
  @ViewChild(${className}EditComponent) editComponent!: ${className}EditComponent;

  items: MenuItem[] = [
    { icon: 'pi pi-home', route: '/' },
    { label: '${nameSpanish}', route: '/${dasherName}' },
  ];

  helperStore = inject(HelperStore);
  ${camelName}Store = inject(${className}Store);
  ${camelName}Service = inject(${className}Service);
  confirmationService = inject(ConfirmationService);

  isLoading = signal<boolean>(false);
  selectedRow = signal<DtoResponse${className} | null>(null);
  options = signal([
    {
      label: 'Opciones',
      items: [
        {
          label: 'Editar',
          icon: 'pi pi-pen-to-square',
          command: () => {
            this.onEdit(this.selectedRow());
          },
        },
        {
          label: 'Eliminar',
          icon: 'pi pi-trash',
          command: () => {
            this.onDelete(this.selectedRow());
          },
        },
      ],
    },
  ]);

  ngOnInit() {
    this.${camelName}Store.doList(this.isLoading);
  }

  onOpenModal() {
    this.createComponent.onOpenModal();
  }

  onOpenMenuOptionsRowTable(event: MouseEvent, menu: any, row: any) {
    this.selectedRow.update(() => row);
    menu.toggle(event);
  }

  private onEdit(entity: DtoResponse${className} | null) {
    if (entity) {
      this.editComponent.onOpenModal(entity);
    } else {
      console.warn('No se ha seleccionado un registro', entity);
    }
  }

  private onDelete(entity: ${className}Entity | null) {
    if (entity) {
      this.confirmationService.confirm({
        message: '¿Estás seguro de que quieres continuar?',
        header: 'Confirmación',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Si',
        rejectLabel: 'No',
        acceptIcon: 'none',
        rejectIcon: 'none',
        rejectButtonStyleClass: 'p-button-text',
        accept: () => this.delete${className}(entity.id),
        reject: () => {
          this.helperStore.showToast({
            severity: 'warn',
            summary: 'Cancelado',
            detail: 'Ha cancelado la eliminación',
          });
        },
      });
    } else {
      console.warn('No se ha seleccionado ningún registro.');
    }
  }

  private delete${className}(${camelName}Id: number) {
    this.${camelName}Service.delete(${camelName}Id).subscribe({
      next: (response) => {
        this.${camelName}Store.doList();
        this.helperStore.showToast({
          severity: 'success',
          summary: 'Eliminado',
          detail: response.message,
        });
      },
      error: (error) => {
        console.error(error);
        this.helperStore.showToast({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar',
        });
      },
    });
  }
}
`,
      mainSpecTS: `import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ${className}Component } from './${dasherName}.component';

describe('${className}Component', () => {
  let component: ${className}Component;
  let fixture: ComponentFixture<${className}Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [${className}Component],
    }).compileComponents();

    fixture = TestBed.createComponent(${className}Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
`,
      createCSS: '',
      createHTML: `<p-dialog
  header="Crear Registro"
  [modal]="true"
  [breakpoints]="{ '575px': '100vw' }"
  [style]="{ width: '500px', maxHeight: '100%' }"
  [draggable]="false"
  [resizable]="false"
  [visible]="isOpen()"
  (visibleChange)="onCloseModal()"
>
  <form class="grid grid-cols-12 gap-x-4 pt-2" [formGroup]="formData">
    <div class="col-span-12">
      <p-floatLabel>
        <input
          pInputText
          id="name"
          formControlName="name"
          class="w-full"
          [ngClass]="{ 'ng-invalid ng-dirty': getErrorMessage('name') }"
        />
        <label for="name">Nombre *</label>
      </p-floatLabel>
      <small
        class="block text-xs text-right text-[#B00020]"
        style="height: 1rem"
      >
        {{ getErrorMessage("name") }}
      </small>
    </div>
  </form>
  <ng-template pTemplate="footer">
    <div class="flex justify-between">
      <p-button [outlined]="true" label="Cancelar" (onClick)="onCloseModal()" />
      <button
        pButton
        class="flex items-center py-2"
        type="button"
        label="Guardar"
        [icon]="!isLoading() ? 'pi pi-save' : ''"
        (click)="handleSubmit()"
      >
        <p-progressSpinner
          *ngIf="isLoading()"
          styleClass="mr-4 w-[17px] h-[17px]"
          strokeWidth="5"
        >
        </p-progressSpinner>
      </button>
    </div>
  </ng-template>
</p-dialog>
`,
      createTS: `import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { Dto${className}Create } from '@/app/domain/dtos/${dasherName}/Dto${className}Create';
import { ${className}Service } from '@/app/services/${dasherName}.service';
import { ${className}Store } from '@/stores/${dasherName}/${className}Store';
import { HelperStore } from '@/stores/HelpersStore';
import { getErrorByKey, getErrosOnControls } from '@/helpers';

@Component({
  selector: 'app-${dasherName}-create',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    FloatLabelModule,
    ReactiveFormsModule,
  ],
  templateUrl: './${dasherName}-create.component.html',
  styleUrl: './${dasherName}-create.component.css',
})
export class ${className}CreateComponent {
  helperStore = inject(HelperStore);
  formBuilder = inject(FormBuilder);
  ${camelName}Store = inject(${className}Store);
  ${camelName}Service = inject(${className}Service);

  formData = this.formBuilder.group({
    name: new FormControl<string>('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  isOpen = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  private handleError(error: any) {
    console.error(error);
  }

  onCloseModal() {
    this.isOpen.set(false);
    this.isLoading.set(false);
    this.formData.reset();
  }

  onOpenModal() {
    this.isOpen.set(true);
  }

  handleSubmit() {
    this.formData.markAllAsTouched();

    if (this.formData.valid) {
      this.isLoading.set(true);
      const values = this.formData.getRawValue();
      this.${camelName}Service.store(values as Dto${className}Create).subscribe({
        next: (response) => {
          this.onCloseModal();
          this.helperStore.showToast({
            severity: 'success',
            summary: 'Registrado',
            detail: response.message,
          });
          this.${camelName}Store.doList();
        },
        error: (error) => this.handleError(error),
      });
    } else {
      console.log(getErrosOnControls(this.formData));
    }
  }

  getErrorMessage(controlName: string): string {
    return getErrorByKey(controlName, this.formData.get(controlName));
  }
}
`,
      createSpecTS: `import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ${className}CreateComponent } from './${dasherName}-create.component';

describe('${className}CreateComponent', () => {
  let component: ${className}CreateComponent;
  let fixture: ComponentFixture<${className}CreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [${className}CreateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(${className}CreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
`,
      editCSS: '',
      editHTML: `<p-dialog
  header="Editar Registro"
  [modal]="true"
  [breakpoints]="{ '575px': '100vw' }"
  [style]="{ width: '500px', maxHeight: '100%' }"
  [draggable]="false"
  [resizable]="false"
  [visible]="isOpen()"
  (visibleChange)="onCloseModal()"
>
  <form class="grid grid-cols-12 gap-x-4 pt-2" [formGroup]="formData">
    <div class="col-span-12">
      <p-floatLabel>
        <input
          pInputText
          id="name"
          formControlName="name"
          class="w-full"
          [ngClass]="{ 'ng-invalid ng-dirty': getErrorMessage('name') }"
        />
        <label for="name">Nombre *</label>
      </p-floatLabel>
      <small
        class="block text-xs text-right text-[#B00020]"
        style="height: 1rem"
      >
        {{ getErrorMessage("name") }}
      </small>
    </div>
  </form>
  <ng-template pTemplate="footer">
    <div class="flex justify-between">
      <p-button [outlined]="true" label="Cancelar" (onClick)="onCloseModal()" />
      <button
        pButton
        class="flex items-center py-2"
        type="button"
        label="Guardar"
        [icon]="!isLoading() ? 'pi pi-save' : ''"
        (click)="handleSubmit()"
      >
        <p-progressSpinner
          *ngIf="isLoading()"
          styleClass="mr-4 w-[17px] h-[17px]"
          strokeWidth="5"
        >
        </p-progressSpinner>
      </button>
    </div>
  </ng-template>
</p-dialog>
`,
      editTS: `import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { Dto${className}Edit } from '@/app/domain/dtos/${dasherName}/Dto${className}Edit';
import { DtoResponse${className} } from '@/app/domain/dtos/${dasherName}/DtoResponse${className}';
import { ${className}Service } from '@/app/services/${dasherName}.service';
import { ${className}Store } from '@/stores/${dasherName}/${className}Store';
import { HelperStore } from '@/stores/HelpersStore';
import { getErrorByKey, getErrosOnControls } from '@/helpers';

@Component({
  selector: 'app-${dasherName}-edit',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    FloatLabelModule,
    ReactiveFormsModule,
  ],
  templateUrl: './${dasherName}-edit.component.html',
  styleUrl: './${dasherName}-edit.component.css',
})
export class ${className}EditComponent {
  helperStore = inject(HelperStore);
  formBuilder = inject(FormBuilder);
  ${camelName}Store = inject(${className}Store);
  ${camelName}Service = inject(${className}Service);

  formData = this.formBuilder.group({
    id: new FormControl<number>(0, {
      validators: [Validators.min(1)],
      nonNullable: true,
    }),
    name: new FormControl<string>('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  isOpen = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  private handleError(error: any) {
    console.error(error);
  }

  onCloseModal() {
    this.isOpen.set(false);
    this.isLoading.set(false);
    this.formData.reset();
  }

  onOpenModal(entity: DtoResponse${className}) {
    this.isOpen.set(true);

    if (entity) {
      this.formData.patchValue({ ...entity });
    }
  }

  handleSubmit() {
    this.formData.markAllAsTouched();

    if (this.formData.valid) {
      this.isLoading.set(true);
      const values = this.formData.getRawValue();
      this.${camelName}Service.update(values as Dto${className}Edit).subscribe({
        next: (response) => {
          this.onCloseModal();
          this.helperStore.showToast({
            severity: 'success',
            summary: 'Registrado',
            detail: response.message,
          });
          this.${camelName}Store.doList();
        },
        error: (error) => this.handleError(error),
      });
    } else {
      console.log(getErrosOnControls(this.formData));
    }
  }

  getErrorMessage(controlName: string): string {
    return getErrorByKey(controlName, this.formData.get(controlName));
  }
}
`,
      editSpecTS: `import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ${className}EditComponent } from './${dasherName}-edit.component';

describe('${className}EditComponent', () => {
  let component: ${className}EditComponent;
  let fixture: ComponentFixture<${className}EditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [${className}EditComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(${className}EditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
`
    };

    const createFile = (path: string, content: string, type: string) => {
      if (!tree.exists(path)) {
        tree.create(path, content);
      } else {
        _context.logger.info('');
        _context.logger.info(`El ${type} para ${name} ya existe.`);
        _context.logger.info('');
      }
    };

    // ROUTES
    const path_entity = `${_parentFolder}/app/domain/entities`;
    const path_dto = `${_parentFolder}/app/domain/dtos/${dasherName}`;
    const path_service = `${_parentFolder}/app/services`;
    const path_store = `${_parentFolder}/stores/${dasherName}`;
    const path_main = `${_parentFolder}/app/pages/system/${dasherName}`;
    const path_create = `${_parentFolder}/app/pages/system/${dasherName}/create`;
    const path_edit = `${_parentFolder}/app/pages/system/${dasherName}/edit`;
    const path_route = '/src/app/pages/system/system.routes.ts';
    const path_navigation =
      '/src/app/pages/system/system-layout/system-layout.component.ts';

    // ENTITY
    createFile(
      `${path_entity}/${className}Entity.ts`,
      contents.entity,
      'entity'
    );

    // DTO
    createFile(
      `${path_dto}/Dto${className}Create.ts`,
      contents.dtoCreate,
      'Dto Create'
    );
    createFile(
      `${path_dto}/Dto${className}Edit.ts`,
      contents.dtoEdit,
      'Dto Edit'
    );
    createFile(
      `${path_dto}/DtoResponse${className}.ts`,
      contents.dtoResponse,
      'Dto Response'
    );
    createFile(
      `${path_dto}/DtoResponse${className}List.ts`,
      contents.dtoResponseList,
      'Dto Response List'
    );

    // SERVICE
    createFile(
      `${path_service}/${dasherName}.service.ts`,
      contents.service,
      'Service'
    );
    createFile(
      `${path_service}/${dasherName}.service.spec.ts`,
      contents.serviceSpec,
      'Service Spec'
    );

    // STORE
    createFile(`${path_store}/${className}Store.ts`, contents.store, 'Store');

    // MAIN
    createFile(
      `${path_main}/${dasherName}.component.css`,
      contents.mainCSS,
      'Main Component CSS'
    );
    createFile(
      `${path_main}/${dasherName}.component.html`,
      contents.mainHTML,
      'Main Component HTML'
    );
    createFile(
      `${path_main}/${dasherName}.component.ts`,
      contents.mainTS,
      'Main Component TS'
    );
    createFile(
      `${path_main}/${dasherName}.component.spec.ts`,
      contents.mainSpecTS,
      'Main Component SPEC TS'
    );

    // CREATE
    createFile(
      `${path_create}/${dasherName}-create.component.css`,
      contents.createCSS,
      'Create Component CSS'
    );
    createFile(
      `${path_create}/${dasherName}-create.component.html`,
      contents.createHTML,
      'Create Component HTML'
    );
    createFile(
      `${path_create}/${dasherName}-create.component.ts`,
      contents.createTS,
      'Create Component TS'
    );
    createFile(
      `${path_create}/${dasherName}-create.component.spec.ts`,
      contents.createSpecTS,
      'Create Component SPEC TS'
    );

    // EDIT
    createFile(
      `${path_edit}/${dasherName}-edit.component.css`,
      contents.editCSS,
      'Edit Component CSS'
    );
    createFile(
      `${path_edit}/${dasherName}-edit.component.html`,
      contents.editHTML,
      'Edit Component HTML'
    );
    createFile(
      `${path_edit}/${dasherName}-edit.component.ts`,
      contents.editTS,
      'Edit Component TS'
    );
    createFile(
      `${path_edit}/${dasherName}-edit.component.spec.ts`,
      contents.editSpecTS,
      'Edit Component SPEC TS'
    );

    // UPDATE ROUTES FILE
    const routesBuffer = tree.read(path_route);

    if (routesBuffer) {
      console.log('system.routes.ts');
      let routesContent = routesBuffer.toString('utf-8');

      // IMPORTS
      const _import = `import { ${className}Component } from './${dasherName}/${dasherName}.component';`;
      if (
        !routesContent.includes(_import) &&
        routesContent.includes('// >> INI ROUTE IMPORTS')
      ) {
        routesContent = routesContent.replace(
          '// >> INI ROUTE IMPORTS',
          '// >> INI ROUTE IMPORTS\n' + _import
        );
      }

      // ROUTES
      const _routes = `{ path: '${dasherName}', component: ${className}Component },`;
      if (
        !routesContent.includes(_routes) &&
        routesContent.includes('// >> INI ROUTE MODULES')
      ) {
        routesContent = routesContent.replace(
          '// >> INI ROUTE MODULES',
          `// >> INI ROUTE MODULES
      ${_routes}`
        );
      }

      tree.overwrite(path_route, routesContent);
    }

    // UPDATE NAVIGATION
    const navigationBuffer = tree.read(path_navigation);

    if (navigationBuffer) {
      console.log('system-layout.component.ts');
      let navigationContent = navigationBuffer.toString('utf-8');

      const _item = `{
          label: '${nameSpanish}',
          icon: 'pi pi-fw pi-list-check',
          routerLink: ['/${dasherName}'],
        },`;
      if (
        !navigationContent.includes(_item) &&
        navigationContent.includes('// >> INI LAYOUT NAVIGATION')
      ) {
        navigationContent = navigationContent.replace(
          '// >> INI LAYOUT NAVIGATION',
          `// >> INI LAYOUT NAVIGATION
        ${_item}`
        );
      }

      tree.overwrite(path_navigation, navigationContent);
    }

    return tree;
  };
}
