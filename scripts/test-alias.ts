import { Project, Node } from "ts-morph";

const project = new Project({
  skipAddingFilesFromTsConfig: true,
});

project.addSourceFileAtPath("apps/web/app/page.tsx");
project.addSourceFileAtPath("packages/shared-codes/src/index.ts");

const sourceFile = project.getSourceFile("apps/web/app/page.tsx");
if (sourceFile) {
  const imports = sourceFile.getImportDeclarations();
  
  for (const imp of imports) {
    for (const namedImport of imp.getNamedImports()) {
      console.log("Named import:", namedImport.getName());
      const symbol = namedImport.getSymbol();
      
      if (symbol) {
        console.log("Symbol name:", symbol.getName());
        const aliasedSymbol = symbol.getAliasedSymbol();
        console.log("Has aliased symbol:", !!aliasedSymbol);
        
        if (aliasedSymbol) {
          const aliasedDeclarations = aliasedSymbol.getDeclarations();
          console.log("Aliased declarations:", aliasedDeclarations.length);
          
          for (const decl of aliasedDeclarations) {
            console.log("Declaration kind:", decl.getKindName());
            console.log("Declaration file:", decl.getSourceFile().getFilePath());
            
            if (Node.isJSDocable(decl)) {
              const jsDocs = decl.getJsDocs();
              console.log("JSDocs:", jsDocs.length);
              for (const doc of jsDocs) {
                console.log("JSDoc text:", doc.getInnerText());
                const tags = doc.getTags();
                console.log("Tags:", tags.map(t => t.getTagName()));
              }
            }
          }
        }
      }
    }
  }
}
