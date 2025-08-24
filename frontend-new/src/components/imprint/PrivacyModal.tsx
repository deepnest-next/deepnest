import { Component } from 'solid-js';
import { useTranslation } from '@/utils/i18n';

interface PrivacyModalProps {
  onClose: () => void;
}

const PrivacyModal: Component<PrivacyModalProps> = (props) => {
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
            {t('privacy_policy')}
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
              {t('privacy_last_updated')}: {new Date().toLocaleDateString()}
            </div>

            <section class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {t('privacy_section_overview')}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-3">
                {t('privacy_overview_text')}
              </p>
            </section>

            <section class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {t('privacy_section_data_collection')}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-3">
                {t('privacy_data_collection_text')}
              </p>
              <ul class="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
                <li>{t('privacy_data_settings')}</li>
                <li>{t('privacy_data_preferences')}</li>
                <li>{t('privacy_data_projects')}</li>
                <li>{t('privacy_data_no_personal')}</li>
              </ul>
            </section>

            <section class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {t('privacy_section_data_storage')}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-3">
                {t('privacy_data_storage_text')}
              </p>
              <ul class="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
                <li>{t('privacy_storage_local')}</li>
                <li>{t('privacy_storage_no_transmission')}</li>
                <li>{t('privacy_storage_user_control')}</li>
              </ul>
            </section>

            <section class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {t('privacy_section_third_party')}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-3">
                {t('privacy_third_party_text')}
              </p>
              <ul class="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
                <li>{t('privacy_third_party_converter')}</li>
                <li>{t('privacy_third_party_optional')}</li>
                <li>{t('privacy_third_party_no_tracking')}</li>
              </ul>
            </section>

            <section class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {t('privacy_section_user_rights')}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-3">
                {t('privacy_user_rights_text')}
              </p>
              <ul class="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
                <li>{t('privacy_rights_access')}</li>
                <li>{t('privacy_rights_delete')}</li>
                <li>{t('privacy_rights_modify')}</li>
                <li>{t('privacy_rights_export')}</li>
              </ul>
            </section>

            <section class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {t('privacy_section_updates')}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-3">
                {t('privacy_updates_text')}
              </p>
            </section>

            <section class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {t('privacy_section_contact')}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-3">
                {t('privacy_contact_text')}
              </p>
              <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {t('privacy_contact_github')}: 
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

export default PrivacyModal;