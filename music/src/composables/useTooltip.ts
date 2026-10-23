import { type Directive, reactive, readonly } from "vue";

/** Id of the single tooltip element, referenced by `aria-describedby`. */
export const TOOLTIP_ID = "app-tooltip";

/**
 * Where and what the shared tooltip shows.
 * @property text - Content; empty when hidden
 * @property x - Horizontal centre of the anchor, in viewport pixels
 * @property top - Top edge of the anchor, in viewport pixels
 * @property bottom - Bottom edge of the anchor, in viewport pixels
 * @property visible - Whether the tooltip is shown
 */
interface TooltipState {
  text: string;
  x: number;
  top: number;
  bottom: number;
  visible: boolean;
}

const state = reactive<TooltipState>({
  text: "",
  x: 0,
  top: 0,
  bottom: 0,
  visible: false,
});
const texts = new WeakMap<Element, string>();
let anchor: Element | null = null;

/** Read-only view of the tooltip, for the component that draws it. */
export const tooltip = readonly(state);

/**
 * Shows the tooltip next to an element.
 * @param element - The anchor
 * @returns Nothing
 */
function show(element: Element): void {
  const text = texts.get(element);
  if (!text) return;
  const rect = element.getBoundingClientRect();
  anchor = element;
  Object.assign(state, {
    text,
    x: rect.left + rect.width / 2,
    top: rect.top,
    bottom: rect.bottom,
    visible: true,
  });
  element.setAttribute("aria-describedby", TOOLTIP_ID);
}

/**
 * Hides the tooltip if it belongs to an element (or unconditionally).
 * @param element - The anchor leaving, or undefined to hide anyway
 * @returns Nothing
 */
function hide(element?: Element): void {
  if (element && element !== anchor) return;
  anchor?.removeAttribute("aria-describedby");
  anchor = null;
  state.visible = false;
}

/**
 * Handles pointer and focus entering an anchor.
 * @param event - The DOM event
 * @returns Nothing
 */
function onEnter(event: Event): void {
  show(event.currentTarget as Element);
}

/**
 * Handles pointer and focus leaving an anchor.
 * @param event - The DOM event
 * @returns Nothing
 */
function onLeave(event: Event): void {
  hide(event.currentTarget as Element);
}

if (typeof window !== "undefined") {
  window.addEventListener("scroll", () => hide(), {
    passive: true,
    capture: true,
  });
  window.addEventListener(
    "keydown",
    (event) => event.key === "Escape" && hide(),
  );
}

/**
 * `v-tooltip="text"`: shows the themed tooltip on hover and keyboard focus.
 * Works on HTML and SVG elements; an empty value disables it.
 */
export const vTooltip: Directive<Element, string | undefined> = {
  mounted(element, binding) {
    texts.set(element, binding.value ?? "");
    element.addEventListener("pointerenter", onEnter);
    element.addEventListener("pointerleave", onLeave);
    element.addEventListener("focusin", onEnter);
    element.addEventListener("focusout", onLeave);
  },
  updated(element, binding) {
    texts.set(element, binding.value ?? "");
    if (element === anchor) state.text = binding.value ?? "";
  },
  beforeUnmount(element) {
    hide(element);
    element.removeEventListener("pointerenter", onEnter);
    element.removeEventListener("pointerleave", onLeave);
    element.removeEventListener("focusin", onEnter);
    element.removeEventListener("focusout", onLeave);
  },
};

declare module "vue" {
  /**
   * Makes `v-tooltip` known to templates and to vue-tsc.
   * @property vTooltip - The themed tooltip directive
   */
  interface GlobalDirectives {
    vTooltip: typeof vTooltip;
  }
}
