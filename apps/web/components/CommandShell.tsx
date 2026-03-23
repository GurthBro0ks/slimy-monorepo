// Stub for CommandShell component
export function CommandShell({ title, children }: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1>{title}</h1>
      {children}
    </div>
  );
}