import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "Pantax | Apuração Fiscal",
  description: "Sistema de apuração fiscal (ICMS / PIS-COFINS) para múltiplos clientes",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${hankenGrotesk.className} antialiased`}>
      <body className="bg-lightBg dark:bg-darkBg text-lightText text-[13px] dark:text-darkText min-h-screen selection:bg-brand selection:text-white tracking-tight">
        {children}
      </body>
    </html>
  );
}
