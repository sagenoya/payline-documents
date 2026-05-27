'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
  showCloseButton?: boolean;
  disableOutsideClick?: boolean;
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
  '2xl': 'sm:max-w-3xl',
  full: 'sm:max-w-[95vw]',
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'sm',
  className,
  showCloseButton = true,
  disableOutsideClick = true,
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const [show, setShow] = React.useState(open);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const checkScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasMore = el.scrollHeight - el.scrollTop - el.clientHeight > 8;
    setCanScrollDown(hasMore);
  }, []);

  React.useEffect(() => {
    if (open) {
      setShow(true);
      document.body.style.overflow = 'hidden';
      // Reset scroll
      const timer = setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
        checkScroll();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setShow(false), 120);
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }
  }, [open, checkScroll]);

  // Cleanup overflow on unmount
  React.useEffect(() => {
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!mounted || (!open && !show)) return null;

  return createPortal(
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/35 transition-opacity duration-150 ease-out",
        open ? "opacity-100" : "opacity-0"
      )}
      onClick={(e) => {
        if (!disableOutsideClick && e.target === e.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <div 
        className={cn(
          "relative z-50 flex w-full max-h-[90vh] flex-col overflow-hidden rounded-xl bg-background p-0 text-left shadow-xl transition-all duration-150 ease-out m-4 border ring-1 ring-foreground/5",
          sizeClasses[size],
          className,
          open ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-2 opacity-0"
        )}
      >
        {(title || description || showCloseButton) && (
          <div className="flex flex-col gap-2 p-5 border-b bg-muted/20">
            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-col gap-1.5">
                {title && <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>}
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
              </div>
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full hover:bg-muted/50"
                  onClick={() => onOpenChange(false)}
                >
                  <XIcon className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="relative flex-1 overflow-hidden">
          <div 
            ref={scrollRef}
            onScroll={checkScroll}
            className="h-full max-h-[70vh] overflow-y-auto p-5"
          >
            {children}
          </div>
          <div
            className={cn(
              'pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent transition-opacity duration-300',
              canScrollDown ? 'opacity-100' : 'opacity-0'
            )}
          />
        </div>

        {footer && (
          <div className="border-t bg-muted/20 p-5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
