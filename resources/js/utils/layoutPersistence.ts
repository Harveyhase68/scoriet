// resources/js/utils/layoutPersistence.ts

export interface LayoutState {
  layout: any;
  timestamp: number;
  version: string;
  leftPanelWidth?: number;
}

export interface TabData {
  id: string;
  title?: string;
  preSelectedSchemaId?: number;
  [key: string]: any;
}

const LAYOUT_STORAGE_KEY = 'scoriet_dock_layout';
const LAYOUT_VERSION = '1.0';
const MAX_AGE_DAYS = 30; // Layout expires after 30 days

export class LayoutPersistenceService {

  /**
   * Save layout to localStorage
   */
  static saveLayout(layout: any, leftPanelWidth?: number): void {
    try {
      const layoutState: LayoutState = {
        layout: layout,
        timestamp: Date.now(),
        version: LAYOUT_VERSION,
        leftPanelWidth: leftPanelWidth
      };

      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layoutState));
    } catch {
      // Failed to save layout
    }
  }

  /**
   * Load layout from localStorage
   */
  static loadLayout(): { layout: any | null; leftPanelWidth: number } {
    try {
      const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (!stored) {
        return { layout: null, leftPanelWidth: 300 };
      }

      const layoutState: LayoutState = JSON.parse(stored);

      // Check version compatibility
      if (layoutState.version !== LAYOUT_VERSION) {
        this.clearLayout();
        return { layout: null, leftPanelWidth: 300 };
      }

      // Check if layout is too old
      const age = Date.now() - layoutState.timestamp;
      const maxAge = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
      if (age > maxAge) {
        this.clearLayout();
        return { layout: null, leftPanelWidth: 300 };
      }

      // Validate layout structure
      if (!this.isValidLayout(layoutState.layout)) {
        this.clearLayout();
        return { layout: null, leftPanelWidth: 300 };
      }

      return {
        layout: layoutState.layout,
        leftPanelWidth: layoutState.leftPanelWidth || 300
      };
    } catch {
      // Failed to load layout
      this.clearLayout();
      return { layout: null, leftPanelWidth: 300 };
    }
  }

  /**
   * Clear saved layout
   */
  static clearLayout(): void {
    try {
      localStorage.removeItem(LAYOUT_STORAGE_KEY);
    } catch {
      // Failed to clear layout
    }
  }

  /**
   * Validate layout structure
   */
  static isValidLayout(layout: any): boolean {
    if (!layout || typeof layout !== 'object') {
      return false;
    }

    // Check for required layout structure
    const requiredKeys = ['dockbox', 'floatbox', 'windowbox', 'maxbox'];
    for (const key of requiredKeys) {
      if (!layout[key] || typeof layout[key] !== 'object') {
        return false;
      }
    }

    return true;
  }

  /**
   * Extract tab data from layout for reconstruction
   */
  static extractTabsFromLayout(layout: any): TabData[] {
    const tabs: TabData[] = [];

    const extractFromNode = (node: any) => {
      if (!node) return;

      if (node.tabs && Array.isArray(node.tabs)) {
        node.tabs.forEach((tab: any) => {
          if (tab.id && tab.id !== 'navigation') { // Skip navigation panel
            tabs.push({
              id: tab.id,
              title: tab.title,
              // Extract any additional data that might be needed for reconstruction
              ...(tab.data || {})
            });
          }
        });
      }

      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(extractFromNode);
      }
    };

    // Extract from all layout boxes
    extractFromNode(layout.dockbox);
    extractFromNode(layout.floatbox);
    extractFromNode(layout.windowbox);
    extractFromNode(layout.maxbox);

    return tabs;
  }

  /**
   * Get tab statistics from saved layout
   */
  static getLayoutStats(): { hasLayout: boolean; tabCount: number; age: string } {
    try {
      const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (!stored) {
        return { hasLayout: false, tabCount: 0, age: 'none' };
      }

      const layoutState: LayoutState = JSON.parse(stored);
      const tabs = this.extractTabsFromLayout(layoutState.layout);
      const ageHours = Math.round((Date.now() - layoutState.timestamp) / (1000 * 60 * 60));

      return {
        hasLayout: true,
        tabCount: tabs.length,
        age: ageHours < 24 ? `${ageHours}h` : `${Math.round(ageHours / 24)}d`
      };
    } catch {
      return { hasLayout: false, tabCount: 0, age: 'invalid' };
    }
  }
}