import Link from "next/link";
import { Fragment } from "react";
import type { Page } from "@/server/pagination";

type Props = {
  result: Page<unknown>;
  query: Record<string, string>;
  param?: string;
};

export function Pagination({ result: { page, pageSize, total }, query, param = "page" }: Props) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const href = (target: number) => `?${new URLSearchParams({ ...query, [param]: String(target) })}`;
  const shown = pagesAround(page, lastPage);

  return (
    <nav className="flex items-center justify-between py-3 text-sm text-gray-600">
      <span>{total} total</span>
      <span className="flex items-center gap-3">
        {page > 1 && <Link href={href(page - 1)}>Previous</Link>}
        {shown.map((target, index) => (
          <Fragment key={target}>
            {index > 0 && target - shown[index - 1] > 1 && <span>…</span>}
            {target === page ? (
              <span aria-current="page" className="font-semibold text-gray-900">
                {target}
              </span>
            ) : (
              <Link href={href(target)}>{target}</Link>
            )}
          </Fragment>
        ))}
        {page < lastPage && <Link href={href(page + 1)}>Next</Link>}
      </span>
    </nav>
  );
}

function pagesAround(page: number, lastPage: number) {
  const pages = new Set([1, page - 2, page - 1, page, page + 1, page + 2, lastPage]);
  return [...pages].filter((target) => target >= 1 && target <= lastPage).sort((a, b) => a - b);
}
