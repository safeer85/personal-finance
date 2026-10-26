import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Pocket · Personal finance', description: 'A clear view of your money, savings and debt.' };
export default function Layout({children}:{children:React.ReactNode}) {
  // Browser extensions can add attributes to html before React hydrates it.
  return <html lang="en" suppressHydrationWarning><body>{children}<noscript>Enable JavaScript to add records and navigate your finance tracker.</noscript></body></html>;
}
