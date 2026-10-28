import { type Directive, reactive, readonly } from "vue";

/** Id of the single tooltip element, referenced by `aria-describedby`. */
export const TOOLTIP_ID = "app-tooltip";

/**
 * A rich tooltip: a title with an optional picture and detail line, e.g. a
 * playlist's cover, name and date.
 * @property text - Main line, also the accessible description
 * @property image - Picture URL shown before the text
 * @property detail - Secondary line under the text
 */
export interface TooltipContent {
  text: string;
  image?: string | null;
  detail?: string;
}

/** What `v-tooltip` accepts: plain text, rich content or nothing. */
export type TooltipValue = string | TooltipContent | undefined | null;

/**
 * Normalises a directive value.
 * @param value - The bound value
 * @returns Rich content; empty text disables the tooltip
 */
function contentOf(value: TooltipValue): TooltipContent {
  if (!value) return { text: "" };
  return typeof value === "string" ? { text: value } : value;
}

/**
 * Where and what the shared tooltip shows.
 * @property text - Content; empty when hidden
 * @property image - Optional picture
 * @property detail - Optional secondary line
 * @property x - Horizontal centre of the anchor, in viewport pixels
 * @property top - Top edge of the anchor, in viewport pixels
 * @property bottom - Bottom edge of the anchor, in viewport pixels
 * @property visible - Whether the tooltip is shown
 */
interface TooltipState {
  text: string;
  image: string | null;
  detail: string;
  x: number;
  top: number;
  bottom: number;
  visible: boolean;
}

const state = reactive<TooltipState>({
  text: "",
  image: null,
  detail: "",
  x: 0,
  top: 0,
  bottom: 0,
  visible: false,
});
const texts = new WeakMap<Element, TooltipContent>();
let anchor: Element | null = null;

/** Read-only view of the tooltip, for the component that draws it. */
export const tooltip = readonly(state);

/**
 * Shows the tooltip next to an element.
 * @param element - The anchor
 * @returns Nothing
 */
function show(element: Element): void {
  const content = texts.get(element);
  if (!content?.text) return;
  const rect = element.getBoundingClientRect();
  anchor = element;
  Object.assign(state, {
    text: content.text,
    image: content.image ?? null,
    detail: content.detail ?? "",
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
 * `v-tooltip="text"` or `v-tooltip="{ text, image, detail }"`: shows the
 * themed tooltip on hover and keyboard focus. Works on HTML and SVG
 * elements; an empty value disables it.
 */
export const vTooltip: Directive<Element, TooltipValue> = {
  mounted(element, binding) {
    texts.set(element, contentOf(binding.value));
    element.addEventListener("pointerenter", onEnter);
    element.addEventListener("pointerleave", onLeave);
    element.addEventListener("focusin", onEnter);
    element.addEventListener("focusout", onLeave);
  },
  updated(element, binding) {
    const content = contentOf(binding.value);
    texts.set(element, content);
    if (element === anchor)
      Object.assign(state, {
        text: content.text,
        image: content.image ?? null,
        detail: content.detail ?? "",
      });
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
