import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const font = Bricolage_Grotesque({ subsets: ["latin"] });

export const metadata = { title: "Nivasya", description: "Find a home anywhere in Australia" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={font.className}>{children}</body>
    </html>
  );
}