"use client";
import { useEffect, useRef } from "react";
import { useNavigationLock } from "@/context/NavigationLockContext";

export default function NavigationGuard() {
  const { isLocked } = useNavigationLock();
  const originalPushRef = useRef<History["pushState"] | null>(null);
  const originalReplaceRef = useRef<History["replaceState"] | null>(null);

  useEffect(() => {
    document.body?.setAttribute("data-lock", isLocked ? "true" : "false");

    function resolveTarget(el: EventTarget | null): HTMLElement | null {
      const node = el as any;
      if (!node) return null;
      if (node.nodeType === 1) return node as HTMLElement; // Element
      if (node.nodeType === 3) return (node.parentElement ?? null) as HTMLElement; // Text -> parent
      return (node as HTMLElement) ?? null;
    }

    function isEditableTarget(el: HTMLElement | null): boolean {
      if (!el) return false;
      const editable = el.closest(
        'input, textarea, select, button, [contenteditable], [role="textbox"], [data-editable], [data-draggable], [data-handle], [data-toolbar]'
      );
      if (editable) return true;
      // Heuristic: allow dragging on blocks that contain an editable child and show grab cursor
      const fbRoot = el.closest('.flip-book-root');
      if (!fbRoot) return false;
      let node: HTMLElement | null = el as HTMLElement;
      while (node && node !== fbRoot) {
        const hasEditableChild = node.querySelector('[contenteditable]');
        if ((node as HTMLElement).isContentEditable) return true;
        if (hasEditableChild) {
          const cs = getComputedStyle(node);
          if (cs.cursor.includes('grab')) return true;
          if (node.hasAttribute('data-draggable') || node.getAttribute('draggable') === 'true') return true;
        }
        node = node.parentElement;
      }
      return false;
    }

    function onClick(e: MouseEvent) {
      if (!isLocked) return;
      const target = resolveTarget(e.target);
      if (!target) return;
      if (target.closest('.flip-book-root') && !target.closest('.z-10')) {
        if (isEditableTarget(target)) return;
        e.preventDefault();
        (e as any).stopImmediatePropagation?.();
        e.stopPropagation();
        return;
      }
    }

    function onAuxClick(e: MouseEvent) {
      if (!isLocked) return;
      if (e.button !== 1) return; // middle click
      const target = resolveTarget(e.target);
      // Only block middle-click inside editor surface
      if (target && target.closest('.flip-book-root') && !target.closest('.z-10')) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      // Never interfere with typing when focus is inside an editable element
      const ae = document.activeElement as HTMLElement | null;
      if (ae && (ae.isContentEditable || ae.closest('[contenteditable], input, textarea, [role="textbox"], [data-editable]'))) {
        return;
      }
      if (!isLocked) return;
      if ((e.ctrlKey || e.metaKey) && (e.key === "[" || e.key === "]")) {
        e.preventDefault();
        e.stopPropagation();
      }
      // Prevent Backspace from navigating when not typing in inputs
      const target = resolveTarget(e.target);
      const isEditable = !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || (target as HTMLElement).isContentEditable || isEditableTarget(target));
      if (!isEditable && e.key === "Backspace") {
        e.preventDefault();
        e.stopPropagation();
      }
      // Prevent common flip-book navigation keys
      const navKeys = ["ArrowLeft", "ArrowRight", "PageUp", "PageDown", "Home", "End"];
      if (!isEditable && navKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    // Low-level blockers for flip gestures
    function blockPointer(e: Event) {
      if (!isLocked) return;
      const target = resolveTarget(e.target);
      if (target && target.closest('.flip-book-root') && !target.closest('.z-10')) {
        if (isEditableTarget(target)) return;
        e.preventDefault();
        (e as any).stopImmediatePropagation?.();
        e.stopPropagation();
      }
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("mousedown", blockPointer);
    document.addEventListener("pointerdown", blockPointer);
    document.addEventListener("touchstart", blockPointer, { passive: false as any });
    document.addEventListener("auxclick", onAuxClick, true);
    window.addEventListener("keydown", onKeyDown, true);
    function onWheel(e: WheelEvent) {
      if (!isLocked) return;
      const target = resolveTarget(e.target);
      if (target && target.closest(".flip-book-root") && !isEditableTarget(target)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
    window.addEventListener("wheel", onWheel, { capture: true, passive: false });
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("mousedown", blockPointer);
      document.removeEventListener("pointerdown", blockPointer);
      document.removeEventListener("touchstart", blockPointer);
      document.removeEventListener("auxclick", onAuxClick, true);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("wheel", onWheel, true);
    };
  }, [isLocked]);

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!isLocked) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isLocked]);

  // Remove global History API interception; allow app navigations to work normally
  useEffect(() => {
    // If we had previously overridden history, restore it
    if (originalPushRef.current) history.pushState = originalPushRef.current;
    if (originalReplaceRef.current) history.replaceState = originalReplaceRef.current;
  }, [isLocked]);

  return null;
}
