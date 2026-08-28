export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-bark-200/70 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-bark-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>&copy; {new Date().getFullYear()} Organics. Certified organic, farm to door.</p>
        <p>Free delivery on larger baskets.</p>
      </div>
    </footer>
  );
}
