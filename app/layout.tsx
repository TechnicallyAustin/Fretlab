import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;

  return {
    title: "Jada — Commercial Product Leadership",
    description: "A personalized Knowledge OS for building commercial product leadership judgment through learning, practice, evidence, and reflection.",
    openGraph: {
      title: "Jada — Commercial Product Leadership",
      description: "Build the judgment to lead products.",
      type: "website",
      images: [{ url: imageUrl, width: 1536, height: 1024, alt: "Jada — Build the judgment to lead products." }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Jada — Commercial Product Leadership",
      description: "Build the judgment to lead products.",
      images: [imageUrl],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
