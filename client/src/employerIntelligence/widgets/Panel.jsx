export function Panel({ title, children }) {
  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      {title ? (
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{title}</h3>
      ) : null}
      {children}
    </section>
  );
}

export function EmptyHint({ children }) {
  return <p className="text-sm text-gray-500 dark:text-gray-400">{children}</p>;
}
