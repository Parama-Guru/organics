import Link from "next/link";

/**
 * Plain GET controls.
 *
 * Both render into the URL, so an admin can bookmark a filtered view or paste
 * it to a colleague, and both work with JavaScript off. Neither needs client
 * state, so neither is a client component.
 */
export function AdminSearch({
  action,
  query,
  placeholder,
  hidden = {},
}: {
  action: string;
  query: string;
  placeholder: string;
  hidden?: Record<string, string>;
}) {
  return (
    <form method="get" action={action} className="mt-5 flex flex-wrap gap-2">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <label className="min-w-0 flex-1">
        <span className="sr-only">Search</span>
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder={placeholder}
          className="focus-ring min-h-12 w-full rounded-full border border-bark-200 bg-paper px-5"
        />
      </label>
      <button
        type="submit"
        className="min-h-12 rounded-full bg-inverse px-6 text-sm font-medium text-white"
      >
        Search
      </button>
      {query ? (
        <Link
          href={
            Object.keys(hidden).length
              ? `${action}?${new URLSearchParams(hidden).toString()}`
              : action
          }
          className="inline-flex min-h-12 items-center rounded-full border border-bark-200 bg-paper px-5 text-sm text-bark-600"
        >
          Clear
        </Link>
      ) : null}
    </form>
  );
}

export function Pager({
  basePath,
  page,
  pageSize,
  total,
  extra = {},
}: {
  basePath: string;
  page: number;
  pageSize: number;
  total: number;
  extra?: Record<string, string>;
}) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  if (lastPage === 1) return null;

  const href = (target: number) => {
    const params = new URLSearchParams(extra);
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const step =
    "inline-flex min-h-11 items-center rounded-xl border border-bark-200 bg-paper px-4 text-sm";

  return (
    <nav aria-label="Pages" className="mt-6 flex flex-wrap items-center gap-3">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={step}>
          ← Previous
        </Link>
      ) : (
        <span className={`${step} opacity-50`}>← Previous</span>
      )}
      <span className="text-sm text-bark-600">
        Page {page} of {lastPage} · {total} in total
      </span>
      {page < lastPage ? (
        <Link href={href(page + 1)} rel="next" className={step}>
          Next →
        </Link>
      ) : (
        <span className={`${step} opacity-50`}>Next →</span>
      )}
    </nav>
  );
}
