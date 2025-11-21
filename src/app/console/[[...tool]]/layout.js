'use client'

export default function ConsoleLayout({ children }) {
  return (
    <>
      <style jsx global>{`
        header[data-ui="Navbar"],
        nav[data-ui="Navbar"],
        [class*="navbar"],
        footer {
          display: none !important;
        }
      `}</style>
      {children}
    </>
  );
}