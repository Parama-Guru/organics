export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-white/60 bg-white/55 backdrop-blur-xl">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6">
        <div>
          <p className="flex items-center gap-2 font-display text-lg">
            <span aria-hidden>&#127807;</span> Organics
          </p>
          <p className="mt-1 text-sm text-bark-600">
            &copy; {new Date().getFullYear()} Organics. Certified organic, farm to door.
          </p>
        </div>
        <p className="inline-flex items-center gap-2 justify-self-start rounded-full bg-leaf-100 px-4 py-2 text-sm font-medium text-leaf-800 sm:justify-self-end">
          <span aria-hidden>&#128666;</span> Free delivery on larger baskets
        </p>
      </div>
    </footer>
  );
}
