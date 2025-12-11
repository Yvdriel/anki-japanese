import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Anki Tools - Japanese Flashcard Generator",
  description: "Create Anki flashcard decks from Japanese vocabulary lists",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <div className="min-h-screen flex flex-col">
            <header className="bg-blue-600 text-white shadow-md">
              <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <Link href="/" className="hover:opacity-90 transition">
                  <h1 className="text-2xl font-bold">Anki Tools</h1>
                  <p className="text-blue-100 text-sm">Japanese Flashcard Generator</p>
                </Link>
                <div className="flex items-center gap-4">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-blue-50 transition">
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition">
                        Sign Up
                      </button>
                    </SignUpButton>
                  </SignedOut>
                  <SignedIn>
                    <UserButton />
                  </SignedIn>
                </div>
              </div>
            </header>
            <main className="flex-1 container mx-auto px-4 py-8">
              {children}
            </main>
            <footer className="bg-gray-100 border-t">
              <div className="container mx-auto px-4 py-4 text-center text-sm text-gray-600">
                Built with Next.js and Anki-apkg-export
              </div>
            </footer>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
