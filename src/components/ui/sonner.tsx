import { Toaster as Sonner } from "sonner";
import {
  HiCheckCircle,
  HiInformationCircle,
  HiExclamationTriangle,
  HiXCircle,
} from "react-icons/hi2";
import { RiLoader4Line } from "react-icons/ri";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      closeButton
      offset="20px"
      duration={3500}
      icons={{
        success: (
          <HiCheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        ),
        info: (
          <HiInformationCircle className="h-5 w-5 text-primary dark:text-sky-400 shrink-0" />
        ),
        warning: (
          <HiExclamationTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400 shrink-0" />
        ),
        error: (
          <HiXCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
        ),
        loading: (
          <RiLoader4Line className="h-5 w-5 animate-spin text-primary shrink-0" />
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast !flex !items-start !gap-3 !rounded-2xl !py-3.5 !px-4 !border !shadow-2xl !backdrop-blur-xl transition-all duration-200 font-sans " +
            "!bg-white/95 !border-slate-200/90 !text-slate-900 !shadow-slate-900/10 " +
            "dark:!bg-card/95 dark:!border-border dark:!text-foreground dark:!shadow-black/40",
          icon: "!static !h-5 !w-5 !m-0 !mt-0.5 !shrink-0 !self-start !flex !items-center !justify-center",
          content: "!flex-1 !flex !flex-col !gap-1 !min-w-0 !pr-6",
          title: "!text-sm !font-bold !text-slate-900 dark:!text-foreground !leading-tight tracking-tight",
          description: "!text-xs !text-slate-600 !font-normal !leading-relaxed dark:!text-muted-foreground",
          actionButton:
            "!rounded-xl !bg-primary !px-3.5 !py-1.5 !text-xs !font-bold !text-white !shadow-sm hover:!bg-primary-hover transition-colors",
          cancelButton:
            "!rounded-xl !bg-slate-100 !px-3.5 !py-1.5 !text-xs !font-semibold !text-slate-700 hover:!bg-slate-200 dark:!bg-muted dark:!text-muted-foreground",
          closeButton:
            "!left-auto !right-3 !top-3 !rounded-full !border !border-slate-200/90 !bg-white !text-slate-400 hover:!text-slate-700 hover:!bg-slate-100 dark:!bg-card dark:!border-border dark:!text-muted-foreground transition-colors cursor-pointer !transform-none",
          success: "!border-emerald-200/90 dark:!border-emerald-900/50",
          error: "!border-rose-200/90 dark:!border-rose-900/50",
          warning: "!border-amber-200/90 dark:!border-amber-900/50",
          info: "!border-blue-200/90 dark:!border-blue-900/50",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
