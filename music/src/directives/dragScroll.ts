import type { Directive } from "vue";

/* Pointer travel, in pixels, after which a press counts as a drag, not a click. */
const DRAG_THRESHOLD = 5;

/**
 * Per-element drag state.
 * @property cleanup - Removes the listeners
 */
interface DragState {
  cleanup: () => void;
}

const states = new WeakMap<HTMLElement, DragState>();

/**
 * Lets a horizontally scrolling strip be dragged with the mouse. The strip
 * shows a grab cursor while it can scroll and a grabbing one during the
 * drag; a drag never triggers the click of the link it started on. Touch
 * and pen keep the browser's native scrolling.
 */
export const vDragScroll: Directive<HTMLElement> = {
  mounted(element) {
    let startX = 0;
    let startScroll = 0;
    let dragging = false;
    let moved = false;

    /**
     * Shows the grab cursor only when there is something to scroll.
     * @returns Nothing
     */
    const refresh = (): void => {
      element.classList.toggle(
        "is-draggable",
        element.scrollWidth > element.clientWidth + 1,
      );
    };

    /**
     * Starts a mouse drag.
     * @param event - The pointer press
     * @returns Nothing
     */
    const onDown = (event: PointerEvent): void => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      if (!element.classList.contains("is-draggable")) return;
      dragging = true;
      moved = false;
      startX = event.clientX;
      startScroll = element.scrollLeft;
    };

    /**
     * Scrolls with the pointer.
     * @param event - The pointer move
     * @returns Nothing
     */
    const onMove = (event: PointerEvent): void => {
      if (!dragging) return;
      const distance = event.clientX - startX;
      if (!moved && Math.abs(distance) < DRAG_THRESHOLD) return;
      if (!moved) {
        moved = true;
        element.setPointerCapture(event.pointerId);
        element.classList.add("is-dragging");
      }
      element.scrollLeft = startScroll - distance;
    };

    /**
     * Ends the drag.
     * @param event - The pointer release
     * @returns Nothing
     */
    const onUp = (event: PointerEvent): void => {
      if (!dragging) return;
      dragging = false;
      element.classList.remove("is-dragging");
      if (element.hasPointerCapture(event.pointerId))
        element.releasePointerCapture(event.pointerId);
    };

    /**
     * Swallows the click that ends a drag.
     * @param event - The click
     * @returns Nothing
     */
    const onClick = (event: MouseEvent): void => {
      if (!moved) return;
      moved = false;
      event.preventDefault();
      event.stopPropagation();
    };

    /**
     * Stops native image and link dragging, which would hijack the gesture.
     * @param event - The drag start
     * @returns Nothing
     */
    const onDragStart = (event: DragEvent): void => event.preventDefault();

    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(refresh);
    observer?.observe(element);
    refresh();
    element.addEventListener("pointerdown", onDown);
    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerup", onUp);
    element.addEventListener("pointercancel", onUp);
    element.addEventListener("click", onClick, true);
    element.addEventListener("dragstart", onDragStart);
    states.set(element, {
      cleanup: () => {
        observer?.disconnect();
        element.removeEventListener("pointerdown", onDown);
        element.removeEventListener("pointermove", onMove);
        element.removeEventListener("pointerup", onUp);
        element.removeEventListener("pointercancel", onUp);
        element.removeEventListener("click", onClick, true);
        element.removeEventListener("dragstart", onDragStart);
      },
    });
  },
  unmounted(element) {
    states.get(element)?.cleanup();
    states.delete(element);
  },
};

declare module "vue" {
  /**
   * Template typing for the globally registered directive.
   * @property vDragScroll - Mouse drag scrolling for horizontal strips
   */
  interface GlobalDirectives {
    vDragScroll: typeof vDragScroll;
  }
}
