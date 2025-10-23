import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  step?: number;
  isNewButton?: boolean;
  onNewClick?: () => void;
};

export default function SectionCard({ title, children, isNewButton, onNewClick }: SectionCardProps) {
  return (
    <section className="rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40 sm:p-8">
      <div className="flex items-center justify-between gap-4 pb-6">
      
          <div className="flex w-full justify-between gap-3">
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              {title}
            </h2>

            {isNewButton && (
              <button
                type="button"
                onClick={() => onNewClick && onNewClick()}
                className="inline-flex font-bold items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm  px-3 py-1.5 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                NEW +
              </button>
            )}
            
          
        </div>
      </div>
      <div className="space-y-6">{children}</div>{" "}
    </section>
  );
}
