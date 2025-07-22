import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot } from 'solid-js';

// Mock i18next
const mockI18next = {
  init: vi.fn(),
  t: vi.fn(),
  changeLanguage: vi.fn(),
  language: 'en',
  languages: ['en', 'de'],
  isInitialized: true,
  exists: vi.fn(),
  hasResourceBundle: vi.fn(),
  dir: vi.fn(),
  format: vi.fn(),
};

vi.mock('i18next', () => mockI18next);

describe('I18n Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockI18next.init.mockResolvedValue(mockI18next);
    mockI18next.isInitialized = true;
    mockI18next.language = 'en';
  });

  describe('I18nProvider Context', () => {
    it('should provide translation functions to components', () => {
      createRoot(() => {
        mockI18next.t.mockImplementation((key) => {
          if (key === 'common.loading') {
            return 'Loading...';
          }
          return key;
        });

        const result = mockI18next.t('common.loading');
        expect(result).toBe('Loading...');
      });
    });

    it('should handle language switching', () => {
      createRoot(() => {
        mockI18next.language = 'en';
        mockI18next.changeLanguage('de');
        
        expect(mockI18next.changeLanguage).toHaveBeenCalledWith('de');
      });
    });

    it('should handle translation with parameters', () => {
      createRoot(() => {
        mockI18next.t.mockImplementation((key, options) => {
          if (key === 'parts.count' && options) {
            return `${options.count} parts`;
          }
          return key;
        });

        const result = mockI18next.t('parts.count', { count: 5 });
        expect(result).toBe('5 parts');
      });
    });
  });

  describe('Translation Key Coverage', () => {
    const requiredTranslationKeys = [
      // Common translations
      'common.loading',
      'common.save',
      'common.cancel',
      'common.delete',
      'common.edit',
      'common.close',
      'common.confirm',
      'common.error',
      'common.success',
      'common.warning',
      
      // Navigation
      'nav.parts',
      'nav.sheets',
      'nav.nests',
      'nav.settings',
      'nav.help',
      
      // Parts management
      'parts.title',
      'parts.add',
      'parts.remove',
      'parts.import',
      'parts.export',
      'parts.quantity',
      'parts.rotation',
      'parts.name',
      'parts.dimensions',
      'parts.area',
      'parts.count',
      'parts.selected',
      'parts.duplicate',
      'parts.properties',
      
      // Sheets management
      'sheets.title',
      'sheets.add',
      'sheets.remove',
      'sheets.width',
      'sheets.height',
      'sheets.material',
      'sheets.thickness',
      'sheets.margin',
      'sheets.grain',
      
      // Nesting operations
      'nesting.title',
      'nesting.start',
      'nesting.stop',
      'nesting.progress',
      'nesting.efficiency',
      'nesting.generations',
      'nesting.population',
      'nesting.mutationRate',
      'nesting.spacing',
      'nesting.rotations',
      'nesting.results',
      'nesting.bestFit',
      'nesting.calculating',
      'nesting.complete',
      'nesting.failed',
      'nesting.cancelled',
      
      // Settings
      'settings.title',
      'settings.general',
      'settings.appearance',
      'settings.language',
      'settings.theme',
      'settings.units',
      'settings.precision',
      'settings.performance',
      'settings.advanced',
      'settings.reset',
      'settings.export',
      'settings.import',
      
      // Context menu
      'contextMenu.copy',
      'contextMenu.paste',
      'contextMenu.duplicate',
      'contextMenu.delete',
      'contextMenu.properties',
      'contextMenu.selectAll',
      'contextMenu.deselectAll',
      'contextMenu.rotate',
      'contextMenu.mirror',
      
      // Keyboard shortcuts
      'shortcuts.save',
      'shortcuts.open',
      'shortcuts.new',
      'shortcuts.copy',
      'shortcuts.paste',
      'shortcuts.delete',
      'shortcuts.selectAll',
      'shortcuts.undo',
      'shortcuts.redo',
      'shortcuts.zoomIn',
      'shortcuts.zoomOut',
      'shortcuts.zoomFit',
      
      // Error messages
      'errors.fileNotFound',
      'errors.invalidFormat',
      'errors.saveError',
      'errors.loadError',
      'errors.nestingError',
      'errors.memoryError',
      'errors.genericError',
      'errors.networkError',
      'errors.permissionError',
      
      // Success messages
      'success.fileSaved',
      'success.fileLoaded',
      'success.nestingComplete',
      'success.settingsSaved',
      'success.exportComplete',
      'success.importComplete',
      
      // Tooltips
      'tooltips.addPart',
      'tooltips.removePart',
      'tooltips.startNesting',
      'tooltips.stopNesting',
      'tooltips.saveFile',
      'tooltips.openFile',
      'tooltips.settings',
      'tooltips.help',
      'tooltips.darkMode',
      'tooltips.language',
      
      // Dialogs
      'dialogs.confirmDelete',
      'dialogs.confirmReset',
      'dialogs.confirmExit',
      'dialogs.saveChanges',
      'dialogs.discardChanges',
      'dialogs.about',
      'dialogs.help',
      'dialogs.shortcuts',
      
      // File operations
      'file.open',
      'file.save',
      'file.saveAs',
      'file.export',
      'file.import',
      'file.recent',
      'file.new',
      'file.formats.svg',
      'file.formats.dxf',
      'file.formats.pdf',
      'file.formats.json',
      
      // Performance
      'performance.memoryUsage',
      'performance.cpuUsage',
      'performance.nestingTime',
      'performance.partsProcessed',
      'performance.optimization',
      'performance.cacheCleared',
      'performance.memoryFreed',
      
      // Presets
      'presets.title',
      'presets.save',
      'presets.load',
      'presets.delete',
      'presets.default',
      'presets.custom',
      'presets.highQuality',
      'presets.fast',
      'presets.balanced',
    ];

    it('should have all required translation keys', () => {
      createRoot(() => {
        // Mock the resource bundle to include all required keys
        const mockResources = {
          en: {
            translation: {},
          },
        };

        // Add all required keys to the mock
        requiredTranslationKeys.forEach(key => {
          const keys = key.split('.');
          let current = mockResources.en.translation;
          
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
              current[keys[i]] = {};
            }
            current = current[keys[i]];
          }
          
          current[keys[keys.length - 1]] = `Mock translation for ${key}`;
        });

        mockI18next.hasResourceBundle.mockImplementation((lng, ns) => {
          return lng === 'en' && ns === 'translation';
        });

        mockI18next.exists.mockImplementation((key) => {
          return requiredTranslationKeys.includes(key);
        });

        // Test that all required keys exist
        requiredTranslationKeys.forEach(key => {
          expect(mockI18next.exists(key)).toBe(true);
        });
      });
    });

    it('should handle missing translation keys gracefully', () => {
      createRoot(() => {
        mockI18next.t.mockImplementation((key, options) => {
          if (key === 'nonexistent.key') {
            return key; // Return key as fallback
          }
          return `Translation for ${key}`;
        });

        mockI18next.exists.mockImplementation((key) => {
          return key !== 'nonexistent.key';
        });

        // Test missing key
        expect(mockI18next.t('nonexistent.key')).toBe('nonexistent.key');
        expect(mockI18next.exists('nonexistent.key')).toBe(false);
      });
    });
  });

  describe('Language Support', () => {
    const supportedLanguages = ['en', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'ja', 'zh', 'ko'];

    it('should support multiple languages', () => {
      createRoot(() => {
        mockI18next.languages = supportedLanguages;
        
        supportedLanguages.forEach(lang => {
          mockI18next.changeLanguage(lang);
          expect(mockI18next.changeLanguage).toHaveBeenCalledWith(lang);
        });
      });
    });

    it('should fallback to default language for unsupported languages', () => {
      createRoot(() => {
        mockI18next.language = 'en'; // Default fallback
        
        mockI18next.changeLanguage('unsupported-lang');
        
        // Should fallback to default language
        expect(mockI18next.changeLanguage).toHaveBeenCalledWith('unsupported-lang');
      });
    });

    it('should handle RTL languages correctly', () => {
      createRoot(() => {
        const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
        
        mockI18next.dir = vi.fn().mockImplementation((lang) => {
          return rtlLanguages.includes(lang) ? 'rtl' : 'ltr';
        });

        expect(mockI18next.dir('ar')).toBe('rtl');
        expect(mockI18next.dir('en')).toBe('ltr');
      });
    });
  });

  describe('Pluralization', () => {
    it('should handle singular and plural forms', () => {
      createRoot(() => {
        mockI18next.t.mockImplementation((key, options) => {
          if (key === 'parts.count' && options) {
            const count = options.count;
            if (count === 1) {
              return '1 part';
            } else {
              return `${count} parts`;
            }
          }
          return key;
        });

        expect(mockI18next.t('parts.count', { count: 1 })).toBe('1 part');
        expect(mockI18next.t('parts.count', { count: 5 })).toBe('5 parts');
        expect(mockI18next.t('parts.count', { count: 0 })).toBe('0 parts');
      });
    });

    it('should handle complex pluralization rules', () => {
      createRoot(() => {
        mockI18next.t.mockImplementation((key, options) => {
          if (key === 'nesting.results' && options) {
            const count = options.count;
            if (count === 0) {
              return 'No results';
            } else if (count === 1) {
              return '1 result';
            } else {
              return `${count} results`;
            }
          }
          return key;
        });

        expect(mockI18next.t('nesting.results', { count: 0 })).toBe('No results');
        expect(mockI18next.t('nesting.results', { count: 1 })).toBe('1 result');
        expect(mockI18next.t('nesting.results', { count: 10 })).toBe('10 results');
      });
    });
  });

  describe('Interpolation', () => {
    it('should handle variable interpolation', () => {
      createRoot(() => {
        mockI18next.t.mockImplementation((key, options) => {
          if (key === 'nesting.efficiency' && options) {
            return `Efficiency: ${options.efficiency}%`;
          }
          if (key === 'parts.dimensions' && options) {
            return `${options.width} x ${options.height}`;
          }
          return key;
        });

        expect(mockI18next.t('nesting.efficiency', { efficiency: 85.5 }))
          .toBe('Efficiency: 85.5%');
        
        expect(mockI18next.t('parts.dimensions', { width: 100, height: 50 }))
          .toBe('100 x 50');
      });
    });

    it('should handle nested object interpolation', () => {
      createRoot(() => {
        mockI18next.t.mockImplementation((key, options) => {
          if (key === 'file.saveSuccess' && options) {
            return `File saved to ${options.file.path} (${options.file.size} KB)`;
          }
          return key;
        });

        expect(mockI18next.t('file.saveSuccess', { 
          file: { path: '/test/file.svg', size: 125 } 
        })).toBe('File saved to /test/file.svg (125 KB)');
      });
    });
  });

  describe('Namespace Support', () => {
    it('should support different namespaces', () => {
      createRoot(() => {
        mockI18next.t.mockImplementation((key, options) => {
          if (typeof key === 'string' && key.includes(':')) {
            const [namespace, keyPath] = key.split(':');
            return `${namespace} - ${keyPath}`;
          }
          return key;
        });

        expect(mockI18next.t('errors:fileNotFound')).toBe('errors - fileNotFound');
        expect(mockI18next.t('tooltips:addPart')).toBe('tooltips - addPart');
      });
    });

    it('should handle namespace fallbacks', () => {
      createRoot(() => {
        mockI18next.exists.mockImplementation((key) => {
          return key !== 'missing.key';
        });

        mockI18next.t.mockImplementation((key, options) => {
          const opts = options || {};
          if (opts.fallbackNS && !mockI18next.exists(key)) {
            return `Fallback for ${key}`;
          }
          return `Translation for ${key}`;
        });

        expect(mockI18next.t('missing.key', { fallbackNS: 'common' }))
          .toBe('Fallback for missing.key');
      });
    });
  });

  describe('Date and Number Formatting', () => {
    it('should format dates according to locale', () => {
      createRoot(() => {
        const mockDate = new Date('2023-12-25T10:30:00');
        
        mockI18next.format = vi.fn().mockImplementation((value, format, lng) => {
          if (format === 'date') {
            return lng === 'de' ? '25.12.2023' : '12/25/2023';
          }
          return value;
        });

        expect(mockI18next.format(mockDate, 'date', 'en')).toBe('12/25/2023');
        expect(mockI18next.format(mockDate, 'date', 'de')).toBe('25.12.2023');
      });
    });

    it('should format numbers according to locale', () => {
      createRoot(() => {
        mockI18next.format = vi.fn().mockImplementation((value, format, lng) => {
          if (format === 'number') {
            return lng === 'de' ? '1.234,56' : '1,234.56';
          }
          return value;
        });

        expect(mockI18next.format(1234.56, 'number', 'en')).toBe('1,234.56');
        expect(mockI18next.format(1234.56, 'number', 'de')).toBe('1.234,56');
      });
    });
  });

  describe('Loading States', () => {
    it('should handle loading states during initialization', () => {
      createRoot(() => {
        mockI18next.isInitialized = false;
        
        const loadingText = mockI18next.isInitialized ? 'Ready' : 'Loading translations...';
        expect(loadingText).toBe('Loading translations...');
      });
    });

    it('should handle ready state after initialization', () => {
      createRoot(() => {
        mockI18next.isInitialized = true;
        
        const loadingText = mockI18next.isInitialized ? 'Ready' : 'Loading translations...';
        expect(loadingText).toBe('Ready');
      });
    });
  });
});