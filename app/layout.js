import './globals.css';

export const metadata = {
  title: 'AI Minecraft Plugin Forge',
  description: 'Production-grade multi-AI Minecraft plugin generation platform.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
