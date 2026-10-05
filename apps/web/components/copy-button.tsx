"use client";
import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { Copy, Check } from "lucide-react";

export function CopyStatusIcon({
  copied,
  size = 14,
}: {
  copied: boolean;
  size?: number;
}) {
  return (
    <span
      className="copy-status-icon"
      data-copied={copied}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Copy className="copy-status-original" size={size} />
      <Check className="copy-status-check" size={size} />
    </span>
  );
}

export function CopyButton({
  onCopy,
  children,
  iconPosition = "start",
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "children"> & {
  onCopy: () => Promise<void> | void;
  children: ReactNode | ((copied: boolean) => ReactNode);
  iconPosition?: "start" | "end";
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const attempt = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  async function perform() {
    const sequence = ++attempt.current;
    try {
      await onCopy();
      if (!mounted.current || sequence !== attempt.current) return;
      setError(false);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      if (!mounted.current || sequence !== attempt.current) return;
      setCopied(false);
      setError(true);
    }
  }
  const renderChildren = typeof children === "function";
  return (
    <button
      type="button"
      {...props}
      aria-label={
        props["aria-label"] ??
        (typeof children === "string" ? children : undefined)
      }
      data-copied={copied}
      onClick={() => void perform()}
      title={error ? "Copy failed. Check clipboard permission." : props.title}
    >
      {renderChildren ? (
        children(copied)
      ) : (
        <>
          {iconPosition === "start" && <CopyStatusIcon copied={copied} />}
          {children}
          {iconPosition === "end" && <CopyStatusIcon copied={copied} />}
        </>
      )}
      <span className="sr-only" role="status">
        {error
          ? "Copy failed. Check clipboard permission."
          : copied
            ? "Copied to clipboard"
            : ""}
      </span>
    </button>
  );
}
