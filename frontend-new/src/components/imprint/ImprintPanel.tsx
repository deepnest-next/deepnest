import { Component, createSignal, Show } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import { getVersionInfo } from '@/utils/version';
import PrivacyModal from './PrivacyModal';
import LegalNoticeModal from './LegalNoticeModal';

const ImprintPanel: Component = () => {
  const [t] = useTranslation('imprint');
  const [showPrivacyModal, setShowPrivacyModal] = createSignal(false);
  const [showLegalModal, setShowLegalModal] = createSignal(false);

  // Version info
  const versionInfo = getVersionInfo();

  return (
    <div class="h-full flex flex-col bg-white dark:bg-gray-900">
      <div class="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100">{t('imprint_title')}</h2>
      </div>

      <div class="flex-1 overflow-y-auto p-6">
        <div class="max-w-4xl mx-auto space-y-8">
          
          {/* Logo and Header */}
          <div class="text-center">
            <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900 mb-6">
              <span class="text-4xl">🔧</span>
            </div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              DeepNest Next
            </h1>
            <p class="text-lg text-gray-600 dark:text-gray-400 mb-4">
              {t('tagline')}
            </p>
            <div class="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{t('version')}: {versionInfo.version}</span>
              <span>•</span>
              <span>{t('build_date')}: {versionInfo.buildDate}</span>
            </div>
          </div>

          {/* About Section */}
          <section class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('about_title')}
            </h2>
            <div class="prose prose-gray dark:prose-invert max-w-none">
              <p class="mb-4">{t('about_description')}</p>
              <p class="mb-4">{t('about_features')}</p>
              <ul class="list-disc pl-6 space-y-2">
                <li>{t('feature_genetic_algorithm')}</li>
                <li>{t('feature_multiple_formats')}</li>
                <li>{t('feature_real_time_preview')}</li>
                <li>{t('feature_advanced_settings')}</li>
                <li>{t('feature_multi_language')}</li>
              </ul>
            </div>
          </section>

          {/* Technical Information */}
          <section class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('technical_info_title')}
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {t('frontend_technologies')}
                </h3>
                <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• SolidJS 1.8+</li>
                  <li>• TypeScript</li>
                  <li>• Tailwind CSS v4</li>
                  <li>• Vite</li>
                  <li>• i18next</li>
                </ul>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {t('backend_technologies')}
                </h3>
                <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• Electron</li>
                  <li>• Node.js</li>
                  <li>• C++ Native Modules</li>
                  <li>• Clipper Library</li>
                  <li>• Genetic Algorithm</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Project Information */}
          <section class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('project_info_title')}
            </h2>
            <div class="space-y-4">
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t('project_origin')}
                </h3>
                <p class="text-gray-600 dark:text-gray-400">{t('project_origin_description')}</p>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t('open_source')}
                </h3>
                <p class="text-gray-600 dark:text-gray-400">{t('open_source_description')}</p>
              </div>
              <div class="flex space-x-4">
                <a 
                  href="https://github.com/deepnest-next/deepnest" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="inline-flex items-center px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
                >
                  <span class="mr-2">📚</span>
                  {t('view_source')}
                </a>
                <a 
                  href="https://github.com/deepnest-next/deepnest/releases" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span class="mr-2">📦</span>
                  {t('releases')}
                </a>
              </div>
            </div>
          </section>

          {/* Legal Section */}
          <section class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('legal_title')}
            </h2>
            <div class="space-y-4">
              <p class="text-gray-600 dark:text-gray-400">{t('legal_description')}</p>
              <div class="flex space-x-4">
                <button
                  onClick={() => setShowPrivacyModal(true)}
                  class="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <span class="mr-2">🔒</span>
                  {t('privacy_policy')}
                </button>
                <button
                  onClick={() => setShowLegalModal(true)}
                  class="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <span class="mr-2">📋</span>
                  {t('legal_notice')}
                </button>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('contact_title')}
            </h2>
            <div class="space-y-4">
              <p class="text-gray-600 dark:text-gray-400">{t('contact_description')}</p>
              <div class="flex space-x-4">
                <a 
                  href="https://github.com/deepnest-next/deepnest/issues" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <span class="mr-2">🐛</span>
                  {t('report_issue')}
                </a>
                <a 
                  href="https://github.com/deepnest-next/deepnest/discussions" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <span class="mr-2">💬</span>
                  {t('discussions')}
                </a>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Modals */}
      <Show when={showPrivacyModal()}>
        <PrivacyModal onClose={() => setShowPrivacyModal(false)} />
      </Show>
      
      <Show when={showLegalModal()}>
        <LegalNoticeModal onClose={() => setShowLegalModal(false)} />
      </Show>
    </div>
  );
};

export default ImprintPanel;