import Link from "next/link";
import type { Page } from "@/server/pagination";

type Props = {
  result: Page<unknown>;
  query: Record<string, string>;
  param?: string;
};

export function Pagination({ result: { page, pageSize, total }, query, param = "page" }: Props) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const href = (target: number) => `?${new URLSearchParams({ ...query, [param]: String(target) })}`;

  return (
    <nav className="flex items-center justify-between py-3 text-sm text-gray-600">
      <span>
        Page {page} of {lastPage} · {total} total
      </span>
      <span className="flex gap-4">
        {page > 1 && <Link href={href(page - 1)}>Previous</Link>}
        {page < lastPage && <Link href={href(page + 1)}>Next</Link>}
      </span>
    </nav>
  );
}
