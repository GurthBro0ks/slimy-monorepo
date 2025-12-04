import { Project, Node } from "ts-morph";

const project = new Project({
  skipAddingFilesFromTsConfig: true,
});

project.addSourceFileAtPath("apps/web/app/page.tsx");
project.addSourceFileAtPath("packages/shared-codes/src/index.ts");

const sourceFile = project.getSourceFile("apps/web/app/page.tsx");
if (sourceFile) {
  console.log("File found:", sourceFile.getFilePath());
  const imports = sourceFile.getImportDeclarations();
  console.log("Number of imports:", imports.length);
  
  for (const imp of imports) {
    console.log("Import from:", imp.getModuleSpecifierValue());
    for (const namedImport of imp.getNamedImports()) {
      console.log("  - Named import:", namedImport.getName());
      const symbol = namedImport.getSymbol();
      console.log("  - Symbol found:", !!symbol);
      
      if (symbol) {
        const declarations = symbol.getDeclarations();
        console.log("  - Declarations:", declarations.length);
        
        for (const declaration of declarations) {
          console.log("  - Declaration type:", declaration.getKindName());
          if (Node.isJSDocable(declaration)) {
            const jsDocs = declaration.getJsDocs();
            console.log("  - JSDocs found:", jsDocs.length);
            for (const doc of jsDocs) {
              console.log("  - JSDoc text:", doc.getInnerText());
              const tags = doc.getTags();
              console.log("  - Tags:", tags.map(t => t.getTagName()));
            }
          }
        }
      }
    }
  }
}
