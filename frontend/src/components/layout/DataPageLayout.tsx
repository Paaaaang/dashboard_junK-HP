import React from "react";
import { PageHeader } from "./PageHeader";

interface DataPageLayoutProps {
  title: string;
  headerActions?: React.ReactNode;
  filterBar?: React.ReactNode;
  children: React.ReactNode; // The main table content
  pagination?: React.ReactNode;
  floatingBar?: React.ReactNode;
  drawer?: React.ReactNode;
  modals?: React.ReactNode;
}

/**
 * DataPageLayout
 * A shared layout for "Data-Dense" management pages.
 * Focuses on reducing "boxed-in" feel by using subtle spacing and shadows 
 * instead of heavy borders where possible.
 */
export function DataPageLayout({
  title,
  headerActions,
  filterBar,
  children,
  pagination,
  floatingBar,
  drawer,
  modals,
}: DataPageLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen pb-20 animate-in fade-in duration-500">
      {/* Page Header Area */}
      <PageHeader title={title} actions={headerActions} />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
        {/* Top Filter/Search Section */}
        {filterBar && (
          <div className="animate-in slide-in-from-top-2 duration-300">
            {filterBar}
          </div>
        )}

        {/* Table/Main Content Section */}
        <section className="bg-surface rounded-[32px] shadow-soft overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          {/* Main Content */}
          <div className="min-h-[400px]">
            {children}
          </div>

          {/* Pagination Footer (Optional) */}
          {pagination && (
            <div className="border-t border-border/40 bg-surface-subtle/50 px-6 py-4">
              {pagination}
            </div>
          )}
        </section>
      </main>

      {/* Floating Elements */}
      {floatingBar}
      {drawer}
      {modals}
    </div>
  );
}
