import React from "react";
import { Link } from "react-router-dom";
import Breadcrumb from "./Breadcrumb";
import { slugify } from "../utils/slugify";

function CategoryMenu({
  title,
  breadcrumbs = [],
  categories = [],
  compact = false,
}) {
  return (
    <section className="min-h-screen bg-[#E5E5E5] text-[#000000]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbs} />

        {/* Title */}
        <header className="mb-12 mt-4 text-center">
          <h1 className="text-3xl font-black text-[#14213D] md:text-5xl">
            {title}
          </h1>
        </header>

        {/* Categories */}
        <div
          className={
            compact
              ? "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
              : "grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3"
          }
        >
          {categories.map((category) => {
            const categoryPath = `${category.linkPrefix ?? ""}/${category.slug}`;

            return compact ? (
              <Link
                key={category.slug}
                to={categoryPath}
                className="
                  group
                  flex
                  items-center
                  gap-5
                  rounded-2xl
                  border
                  border-gray-200
                  bg-white
                  p-6
                  shadow-sm
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:border-[#FCA311]
                  hover:shadow-lg
                "
              >
                <div
                  className="
                    flex
                    h-16
                    w-16
                    items-center
                    justify-center
                    rounded-full
                    bg-[#FFF7EA]
                    text-4xl
                    transition-transform
                    duration-300
                    group-hover:scale-110
                  "
                >
                  {category.icon}
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#14213D]">
                    {category.title}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {category.count} sản phẩm
                  </p>
                </div>
              </Link>
            ) : (
              <article
                key={category.slug}
                className="
                  overflow-hidden
                  rounded-2xl
                  border
                  border-gray-200
                  bg-white
                  shadow-sm
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:border-[#FCA311]
                  hover:shadow-lg
                "
              >
                <div className="grid min-h-[240px] lg:grid-cols-[180px_1fr]">

                  {/* Left */}
                  <Link
                    to={categoryPath}
                    className="
                      group
                      flex
                      flex-col
                      items-center
                      justify-center
                      border-b
                      border-gray-200
                      bg-[#fafafa]
                      p-6
                      transition-colors
                      hover:bg-[#f7f7f7]
                      lg:border-b-0
                      lg:border-r
                    "
                  >
                    <div
                      className="
                        mb-4
                        flex
                        h-20
                        w-20
                        items-center
                        justify-center
                        rounded-full
                        bg-[#FFF7EA]
                        text-5xl
                        transition-transform
                        duration-300
                        group-hover:scale-110
                      "
                    >
                      {category.icon}
                    </div>

                    <h3 className="text-center text-xl font-bold text-[#14213D]">
                      {category.title}
                    </h3>

                    <span className="mt-2 text-sm text-gray-500">
                      {category.count} sản phẩm
                    </span>
                  </Link>

                  {/* Right */}
                  <div className="flex p-6">
                    <ul className="w-full space-y-3">
                      {category.featured?.slice(0, 5).map((item) => (
                        <li key={item}>
                          <Link
                            to={`/products/${slugify(item)}`}
                            className="
                              flex
                              items-center
                              gap-3
                              rounded-lg
                              px-2
                              py-1.5
                              text-sm
                              text-gray-700
                              transition-colors
                              hover:bg-[#FFF7EA]
                              hover:text-[#FCA311]
                            "
                          >
                            <span className="text-xs text-[#FCA311]">
                              ●
                            </span>

                            <span className="truncate">
                              {item}
                            </span>
                          </Link>
                        </li>
                      ))}

                      {category.featured?.length > 5 && (
                        <li>
                          <Link
                            to={categoryPath}
                            className="
                              ml-5
                              text-sm
                              font-semibold
                              text-[#FCA311]
                              hover:underline
                            "
                          >
                            Xem tất cả →
                          </Link>
                        </li>
                      )}
                    </ul>
                  </div>

                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CategoryMenu;