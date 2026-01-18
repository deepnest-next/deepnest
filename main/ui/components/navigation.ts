/**
 * Navigation Component
 * Handles tab switching logic for the sidebar navigation and dark mode toggle.
 * Extracted from page.js (lines 168-199)
 */

import {
  getElements,
  getElement,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
} from "../utils/dom-utils.js";

/**
 * DOM element selectors used by the navigation component
 */
const SELECTORS = {
  /** Side navigation list items */
  SIDENAV_TABS: "#sidenav li",
  /** Currently active tab in sidenav */
  ACTIVE_TAB: "#sidenav li.active",
  /** Currently active page */
  ACTIVE_PAGE: ".page.active",
} as const;

/**
 * CSS classes used by navigation
 */
const CSS_CLASSES = {
  ACTIVE: "active",
  DISABLED: "disabled",
  PAGE: "page",
  DARK_MODE: "dark-mode",
} as const;

/**
 * Local storage keys
 */
const STORAGE_KEYS = {
  DARK_MODE: "darkMode",
} as const;

/**
 * Special tab IDs that have custom behavior
 */
const SPECIAL_TABS = {
  DARK_MODE: "darkmode_tab",
} as const;

/**
 * Callback type for resize function
 * Called when switching to the home page to resize UI elements
 */
export type ResizeCallback = () => void;

/**
 * Options for navigation initialization
 */
export interface NavigationOptions {
  /** Callback to call when resizing is needed (e.g., switching to home tab) */
  resizeCallback?: ResizeCallback;
}

/**
 * Navigation Service class
 * Manages tab switching and dark mode toggle functionality
 */
export class NavigationService {
  /** Callback to resize UI elements when needed */
  private resizeCallback: ResizeCallback | null = null;

  /** Flag to track if navigation has been initialized */
  private initialized = false;

  /**
   * Create a new NavigationService instance
   * @param options - Optional configuration options
   */
  constructor(options?: NavigationOptions) {
    if (options?.resizeCallback) {
      this.resizeCallback = options.resizeCallback;
    }
  }

  /**
   * Set the resize callback function
   * @param callback - Function to call when resize is needed
   */
  setResizeCallback(callback: ResizeCallback): void {
    this.resizeCallback = callback;
  }

  /**
   * Initialize dark mode from local storage preference
   * Should be called early in the page lifecycle
   */
  initializeDarkMode(): void {
    const darkMode = localStorage.getItem(STORAGE_KEYS.DARK_MODE) === "true";
    if (darkMode) {
      addClass(document.body, CSS_CLASSES.DARK_MODE);
    }
  }

  /**
   * Check if dark mode is currently enabled
   * @returns True if dark mode is active
   */
  isDarkMode(): boolean {
    return hasClass(document.body, CSS_CLASSES.DARK_MODE);
  }

  /**
   * Toggle dark mode on/off
   * Persists the preference to local storage
   */
  toggleDarkMode(): void {
    toggleClass(document.body, CSS_CLASSES.DARK_MODE);
    localStorage.setItem(
      STORAGE_KEYS.DARK_MODE,
      hasClass(document.body, CSS_CLASSES.DARK_MODE).toString()
    );
  }

  /**
   * Enable dark mode explicitly
   */
  enableDarkMode(): void {
    addClass(document.body, CSS_CLASSES.DARK_MODE);
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, "true");
  }

  /**
   * Disable dark mode explicitly
   */
  disableDarkMode(): void {
    removeClass(document.body, CSS_CLASSES.DARK_MODE);
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, "false");
  }

  /**
   * Switch to a specific tab by its page ID
   * @param pageId - The ID of the page to switch to (without # prefix)
   * @returns True if the tab was switched successfully
   */
  switchToTab(pageId: string): boolean {
    // Find the tab with the matching data-page attribute
    const tabs = getElements<HTMLLIElement>(SELECTORS.SIDENAV_TABS);
    const tabsArray = Array.from(tabs);
    const targetTab = tabsArray.find((tab) => tab.dataset.page === pageId);

    if (!targetTab) {
      return false;
    }

    // Check if tab is already active or disabled
    if (
      hasClass(targetTab, CSS_CLASSES.ACTIVE) ||
      hasClass(targetTab, CSS_CLASSES.DISABLED)
    ) {
      return false;
    }

    // Deactivate current tab and page
    const activeTab = getElement<HTMLLIElement>(SELECTORS.ACTIVE_TAB);
    const activePage = getElement<HTMLElement>(SELECTORS.ACTIVE_PAGE);

    if (activeTab) {
      activeTab.className = "";
    }
    if (activePage) {
      activePage.className = CSS_CLASSES.PAGE;
    }

    // Activate new tab and page
    targetTab.className = CSS_CLASSES.ACTIVE;
    const tabPage = getElement<HTMLElement>(`#${pageId}`);
    if (tabPage) {
      tabPage.className = `${CSS_CLASSES.PAGE} ${CSS_CLASSES.ACTIVE}`;

      // Call resize if switching to home tab
      if (pageId === "home" && this.resizeCallback) {
        this.resizeCallback();
      }
    }

    return true;
  }

  /**
   * Handle tab click events
   * @param tab - The tab element that was clicked
   * @returns False to prevent default behavior, undefined otherwise
   */
  private handleTabClick(tab: HTMLElement): boolean | undefined {
    // Dark mode handler
    if (tab.id === SPECIAL_TABS.DARK_MODE) {
      this.toggleDarkMode();
      return undefined;
    }

    // Check if tab is already active or disabled
    if (
      tab.className === CSS_CLASSES.ACTIVE ||
      tab.className === CSS_CLASSES.DISABLED
    ) {
      return false;
    }

    // Deactivate current tab and page
    const activeTab = getElement<HTMLLIElement>(SELECTORS.ACTIVE_TAB);
    const activePage = getElement<HTMLElement>(SELECTORS.ACTIVE_PAGE);

    if (activeTab) {
      activeTab.className = "";
    }
    if (activePage) {
      activePage.className = CSS_CLASSES.PAGE;
    }

    // Activate clicked tab
    tab.className = CSS_CLASSES.ACTIVE;

    // Activate corresponding page
    const pageId = (tab as HTMLElement).dataset.page;
    if (pageId) {
      const tabPage = getElement<HTMLElement>(`#${pageId}`);
      if (tabPage) {
        tabPage.className = `${CSS_CLASSES.PAGE} ${CSS_CLASSES.ACTIVE}`;

        // Call resize if switching to home tab
        if (tabPage.getAttribute("id") === "home" && this.resizeCallback) {
          this.resizeCallback();
        }
      }
    }

    return false;
  }

  /**
   * Bind click event handlers to all navigation tabs
   * Call this after the DOM is ready
   */
  bindEventHandlers(): void {
    if (this.initialized) {
      return;
    }

    const tabs = getElements<HTMLLIElement>(SELECTORS.SIDENAV_TABS);

    tabs.forEach((tab) => {
      tab.addEventListener("click", (event: MouseEvent) => {
        event.preventDefault();
        this.handleTabClick(tab);
      });
    });

    this.initialized = true;
  }

  /**
   * Initialize the navigation service
   * Sets up dark mode and binds event handlers
   */
  initialize(): void {
    this.initializeDarkMode();
    this.bindEventHandlers();
  }

  /**
   * Get the currently active tab element
   * @returns The active tab element or null
   */
  getActiveTab(): HTMLLIElement | null {
    return getElement<HTMLLIElement>(SELECTORS.ACTIVE_TAB);
  }

  /**
   * Get the currently active page ID
   * @returns The active page ID or null
   */
  getActivePageId(): string | null {
    const activePage = getElement<HTMLElement>(SELECTORS.ACTIVE_PAGE);
    return activePage?.id || null;
  }

  /**
   * Check if a specific tab is active
   * @param pageId - The page ID to check
   * @returns True if the tab is active
   */
  isTabActive(pageId: string): boolean {
    return this.getActivePageId() === pageId;
  }

  /**
   * Enable a previously disabled tab
   * @param pageId - The page ID of the tab to enable
   */
  enableTab(pageId: string): void {
    const tabs = getElements<HTMLLIElement>(SELECTORS.SIDENAV_TABS);
    tabs.forEach((tab) => {
      if (tab.dataset.page === pageId && hasClass(tab, CSS_CLASSES.DISABLED)) {
        removeClass(tab, CSS_CLASSES.DISABLED);
      }
    });
  }

  /**
   * Disable a tab to prevent switching to it
   * @param pageId - The page ID of the tab to disable
   */
  disableTab(pageId: string): void {
    const tabs = getElements<HTMLLIElement>(SELECTORS.SIDENAV_TABS);
    tabs.forEach((tab) => {
      if (tab.dataset.page === pageId && !hasClass(tab, CSS_CLASSES.DISABLED)) {
        addClass(tab, CSS_CLASSES.DISABLED);
      }
    });
  }

  /**
   * Create and return a new NavigationService instance
   * @param options - Optional configuration options
   * @returns New NavigationService instance
   */
  static create(options?: NavigationOptions): NavigationService {
    return new NavigationService(options);
  }
}

/**
 * Factory function to create a navigation service
 * @param options - Optional configuration options
 * @returns New NavigationService instance
 */
export function createNavigationService(
  options?: NavigationOptions
): NavigationService {
  return NavigationService.create(options);
}

/**
 * Initialize navigation with a simple functional API
 * For use cases where a full service instance is not needed
 *
 * @param resizeCallback - Optional resize callback for home tab
 * @returns The initialized NavigationService instance
 *
 * @example
 * // Simple initialization
 * const nav = initializeNavigation(() => resizePartsList());
 *
 * // Later, switch tabs programmatically
 * nav.switchToTab('config');
 */
export function initializeNavigation(
  resizeCallback?: ResizeCallback
): NavigationService {
  const service = new NavigationService({ resizeCallback });
  service.initialize();
  return service;
}
