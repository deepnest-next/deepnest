import { Component } from 'solid-js';
import { useTranslation } from '@/utils/i18n';

interface LegalNoticeModalProps {
  onClose: () => void;
}

const LegalNoticeModal: Component<LegalNoticeModalProps> = (props) => {
  const [t] = useTranslation('imprint');

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose();
    }
  };

  return (
    <div 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('legal_notice')}
          </h2>
          <button
            onClick={props.onClose}
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <span class="sr-only">{t('close')}</span>
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto max-h-[70vh]">
          <div class="prose prose-gray dark:prose-invert max-w-none">
            <div class="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {t('legal_last_updated')}: {new Date().toLocaleDateString()}
            </div>

            <section class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {t('legal_section_software_info')}
              </h3>
              <div class="space-y-2 text-gray-600 dark:text-gray-400">
                <p><strong>{t('legal_software_name')}:</strong> DeepNest Next</p>
                <p><strong>{t('legal_software_version')}:</strong> 2.0.0</p>
                <p><strong>{t('legal_software_type')}:</strong> {t('legal_software_type_description')}</p>
                <p><strong>{t('legal_project_website')}:</strong> 
                  <a 
                    href="https://github.com/deepnest-next/deepnest" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                  >
                    https://github.com/deepnest-next/deepnest
                  </a>
                </p>
              </div>
            </section>

            <section class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {t('legal_section_license')}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-3">
                {t('legal_license_text')}
              </p>
              <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {t('legal_license_type')}: MIT License
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {t('legal_license_link')}: 
                  <a 
                    href="https://github.com/deepnest-next/deepnest/blob/main/LICENSE" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                  >
                    https://github.com/deepnest-next/deepnest/blob/main/LICENSE
                  </a>
                </p>
              </div>
            </section>

            <section class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {t('legal_section_disclaimer')}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-3">
                {t('legal_disclaimer_text')}
              </p>
              <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                <p class="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>{t('legal_disclaimer_warning')}:</strong> {t('legal_disclaimer_warning_text')}
                </p>
              </div>
            </section>

            <section class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {t('legal_section_third_party')}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-3">
                {t('legal_third_party_text')}
              </p>
              <div class="space-y-3">
                <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">Electron</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    MIT License - <a href="https://github.com/electron/electron" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">https://github.com/electron/electron</a>
                  </p>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">SolidJS</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    MIT License - <a href="https://github.com/solidjs/solid" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">https://github.com/solidjs/solid</a>
                  </p>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">Clipper Library</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Boost Software License - <a href="https://github.com/junmer/clipper-lib" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">https://github.com/junmer/clipper-lib</a>
                  </p>
                </div>
              </div>
            </section>

            <section class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {t('legal_section_attribution')}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-3">
                {t('legal_attribution_text')}
              </p>
              <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {t('legal_attribution_original')}: 
                  <a 
                    href="https://github.com/Jack000/SVGnest" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                  >
                    SVGnest by Jack000
                  </a>
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('legal_attribution_previous')}: 
                  <a 
                    href="https://github.com/deepnest-io/deepnest" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                  >
                    Deepnest by deepnest-io
                  </a>
                </p>
              </div>
            </section>

            <section class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {t('legal_section_contact')}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-3">
                {t('legal_contact_text')}
              </p>
              <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {t('legal_contact_github')}: 
                  <a 
                    href="https://github.com/deepnest-next/deepnest/issues" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                  >
                    https://github.com/deepnest-next/deepnest/issues
                  </a>
                </p>
              </div>
            </section>

          </div>
        </div>
        
        <div class="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={props.onClose}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalNoticeModal;