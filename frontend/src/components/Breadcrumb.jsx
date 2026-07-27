import React from "react";
import { Link } from "react-router-dom";

function Breadcrumb({ items = [] }) {
  if (!items.length) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-2 text-sm mb-6"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {isLast ? (
              <span
                aria-current="page"
                className="font-semibold text-[var(--main-color)]"
              >
                {item.label}
              </span>
            ) : item.path ? (
              <Link
                to={item.path}
                className="text-[var(--text-color)] opacity-70 hover:opacity-100 hover:text-[var(--main-color)] hover:underline transition-colors duration-200"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-[var(--text-color)] opacity-70">
                {item.label}
              </span>
            )}

            {!isLast && (
              <span
                aria-hidden="true"
                className="text-[var(--text-color)] opacity-40"
              >
                ›
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default Breadcrumb;