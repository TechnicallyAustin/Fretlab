import type { Metadata } from "next";
import { FretLabFrame } from "@/app/_screens/FretLabFrame";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;

  return {
    title: "FretLab — Practice one key. Know the whole neck.",
    description: "A focused guitar practice app for daily sessions, fretboard drills, key theory, routines, and progress.",
    openGraph: {
      title: "FretLab — Practice one key. Know the whole neck.",
      description: "Daily guitar practice that connects fretboard shapes, keys, theory, and timing.",
      type: "website",
      images: [{ url: imageUrl, width: 1536, height: 1024, alt: "FretLab — Practice one key. Know the whole neck." }],
    },
    twitter: {
      card: "summary_large_image",
      title: "FretLab — Practice one key. Know the whole neck.",
      description: "Daily guitar practice that connects fretboard shapes, keys, theory, and timing.",
      images: [imageUrl],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // The frame is the shell every route renders inside: phone chrome, the global
  // key, and the navigation. Routes supply only their screen.
  return (
    <html lang="en">
      <body>
        <FretLabFrame>{children}</FretLabFrame>
      </body>
    </html>
  );
}
