import { readFileSync } from "fs";
import { join } from "path";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import { useMDXComponents } from "@/components/mdx-components";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

const DOCS_DIR = join(process.cwd(), "content/docs");

export async function generateStaticParams() {
  return [
    { slug: "getting-started" },
    { slug: "snail-tools" },
    { slug: "club-analytics" },
  ];
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  try {
    const filePath = join(DOCS_DIR, `${slug}.mdx`);
    const source = readFileSync(filePath, "utf-8");

    const { content, frontmatter } = await compileMDX({
      source,
      components: useMDXComponents({}),
      options: {
        parseFrontmatter: true,
        mdxOptions: {
          remarkPlugins: [remarkGfm, remarkFrontmatter],
          rehypePlugins: [
            rehypeSlug,
            [rehypeAutolinkHeadings, { behavior: "wrap" }],
          ],
        },
      },
    });

    const title = frontmatter?.title ? String(frontmatter.title) : null;

    return (
      <div>
        {title && <h1 className="mb-8 text-4xl font-bold">{title}</h1>}
        <div>{content}</div>
      </div>
    );
  } catch (error) {
    console.error(`Failed to load doc: ${slug}`, error);
    notFound();
  }
}
