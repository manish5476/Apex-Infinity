const { Project, SyntaxKind } = require('ts-morph');
const path = require('path');

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: false,
});

project.addSourceFilesAtPaths('src/app/**/*.ts');

const sourceFiles = project.getSourceFiles();

let fixedCount = 0;

for (const sourceFile of sourceFiles) {
  // We only care about files with .subscribe that need cleanup
  const text = sourceFile.getFullText();
  if (!text.includes('.subscribe(')) continue;
  if (text.includes('takeUntil(') || text.includes('.unsubscribe(') || text.includes('takeUntilDestroyed(')) {
    continue; // Already has some form of cleanup handling
  }

  // Only act on files that define at least one Angular class
  const classes = sourceFile.getClasses().filter(c => 
    c.getDecorators().some(d => ['Component', 'Directive', 'Injectable'].includes(d.getName())) &&
    !c.isAbstract()
  );

  if (classes.length === 0) continue;

  let fileModified = false;

  for (const classDec of classes) {
    // Find all .subscribe() calls inside this class
    const subscribeCalls = classDec.getDescendantsOfKind(SyntaxKind.CallExpression)
      .filter(call => {
        const expression = call.getExpression();
        return expression.getKind() === SyntaxKind.PropertyAccessExpression &&
               expression.getName() === 'subscribe';
      });

    if (subscribeCalls.length === 0) continue;

    fileModified = true;

    // 1. Implements OnDestroy
    if (!classDec.getImplements().some(i => i.getText() === 'OnDestroy')) {
      classDec.addImplements('OnDestroy');
    }

    // 2. Add destroy$ property
    if (!classDec.getProperty('destroy$')) {
      classDec.insertProperty(0, {
        name: 'destroy$',
        scope: 'private',
        isReadonly: true,
        initializer: 'new Subject<void>()'
      });
    }

    // 3. Add or update ngOnDestroy method
    let ngOnDestroy = classDec.getMethod('ngOnDestroy');
    if (!ngOnDestroy) {
      classDec.addMethod({
        name: 'ngOnDestroy',
        returnType: 'void',
        statements: [
          'this.destroy$.next();',
          'this.destroy$.complete();'
        ]
      });
    } else {
      const body = ngOnDestroy.getBody() || ngOnDestroy.addBody();
      if (body) {
        if (!body.getText().includes('this.destroy$.next()')) {
          ngOnDestroy.addStatements([
            'this.destroy$.next();',
            'this.destroy$.complete();'
          ]);
        }
      }
    }

    // 4. Inject `.pipe(takeUntil(this.destroy$))` into every `.subscribe()` call
    for (const subCall of subscribeCalls) {
      const propAccess = subCall.getExpression();
      const baseExpression = propAccess.getExpression();
      
      const baseText = baseExpression.getText();
      
      // If base is ALREADY a .pipe() call, add takeUntil as the final argument
      if (baseExpression.getKind() === SyntaxKind.CallExpression) {
        const nestedPropAccess = baseExpression.getExpression();
        if (nestedPropAccess.getKind() === SyntaxKind.PropertyAccessExpression && nestedPropAccess.getName() === 'pipe') {
           // It is an explicit `.pipe(...)`
           baseExpression.addArgument('takeUntil(this.destroy$)');
           continue;
        }
      }
      
      // Otherwise, wrap the base expression in a .pipe
      baseExpression.replaceWithText(`${baseText}.pipe(takeUntil(this.destroy$))`);
    }
  }

  if (fileModified) {
    // Inject imports
    const ngCoreImport = sourceFile.getImportDeclaration(decl => decl.getModuleSpecifierValue() === '@angular/core');
    if (ngCoreImport) {
      if (!ngCoreImport.getNamedImports().some(n => n.getName() === 'OnDestroy')) {
        ngCoreImport.addNamedImport('OnDestroy');
      }
    } else {
      sourceFile.addImportDeclaration({
        namedImports: ['OnDestroy'],
        moduleSpecifier: '@angular/core'
      });
    }

    const rxjsImport = sourceFile.getImportDeclaration(decl => decl.getModuleSpecifierValue() === 'rxjs');
    if (rxjsImport) {
      if (!rxjsImport.getNamedImports().some(n => n.getName() === 'Subject')) {
        rxjsImport.addNamedImport('Subject');
      }
    } else {
      sourceFile.addImportDeclaration({
        namedImports: ['Subject'],
        moduleSpecifier: 'rxjs'
      });
    }

    const rxOpsImport = sourceFile.getImportDeclaration(decl => decl.getModuleSpecifierValue() === 'rxjs/operators');
    if (rxOpsImport) {
      if (!rxOpsImport.getNamedImports().some(n => n.getName() === 'takeUntil')) {
        rxOpsImport.addNamedImport('takeUntil');
      }
    } else {
      sourceFile.addImportDeclaration({
        namedImports: ['takeUntil'],
        moduleSpecifier: 'rxjs/operators'
      });
    }

    sourceFile.saveSync();
    fixedCount++;
    console.log(`[FIXED] ${sourceFile.getBaseName()}`);
  }
}

console.log(`\nOperation Complete. Successfully secured ${fixedCount} files from RxJS memory leaks.`);
