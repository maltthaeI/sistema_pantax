import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "Pantax | Apuração Fiscal",
  description: "Sistema de apuração fiscal (ICMS / PIS-COFINS) para múltiplos clientes",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${montserrat.className} antialiased`}>
      <body className="bg-[#EDEFF0] dark:bg-darkBg text-[#454545] text-[13px] dark:text-[#EDEDED] min-h-screen selection:bg-brand selection:text-white tracking-tight">
        {children}
      </body>
    </html>
  );
}
