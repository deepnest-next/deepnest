import { Component, createSignal, createEffect, For } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import { globalState, globalActions } from '@/stores/global.store';

const AlgorithmSettings: Component = () => {
  const [t] = useTranslation('settings');

  // Local signals for form state
  const [spaceBetweenParts, setSpaceBetweenParts] = createSignal(0);
  const [curveTolerance, setCurveTolerance] = createSignal(0.3);
  const [partRotations, setPartRotations] = createSignal(4);
  const [populationSize, setPopulationSize] = createSignal(10);
  const [mutationRate, setMutationRate] = createSignal(10);
  const [useHoles, setUseHoles] = createSignal(false);
  const [exploreConcave, setExploreConcave] = createSignal(false);
  const [mergeLines, setMergeLines] = createSignal(false);
  const [useRoughApproximation, setUseRoughApproximation] = createSignal(true);

  // Initialize from global state
  createEffect(() => {
    const config = globalState.config;
    setSpaceBetweenParts(config.spacing || 0);
    setCurveTolerance(config.curveTolerance || 0.3);
    setPartRotations(config.rotations || 4);
    setPopulationSize(config.populationSize || 10);
    setMutationRate(config.mutationRate || 10);
    setUseHoles(config.useHoles || false);
    setExploreConcave(config.exploreConcave || false);
    setMergeLines(config.mergeLines || false);
    setUseRoughApproximation(config.useRoughApproximation !== false);
  });

  const updateConfig = (updates: Partial<typeof globalState.config>) => {
    globalActions.updateConfig({
      ...globalState.config,
      ...updates
    });
  };

  const handleSpacingChange = (value: number) => {
    setSpaceBetweenParts(value);
    updateConfig({ spacing: value });
  };

  const handleCurveToleranceChange = (value: number) => {
    setCurveTolerance(value);
    updateConfig({ curveTolerance: value });
  };

  const handleRotationsChange = (value: number) => {
    setPartRotations(value);
    updateConfig({ rotations: value });
  };

  const handlePopulationSizeChange = (value: number) => {
    setPopulationSize(value);
    updateConfig({ populationSize: value });
  };

  const handleMutationRateChange = (value: number) => {
    setMutationRate(value);
    updateConfig({ mutationRate: value });
  };

  const rotationOptions = [
    { value: 0, label: t('no_rotation') },
    { value: 2, label: t('2_rotations') },
    { value: 4, label: t('4_rotations') },
    { value: 8, label: t('8_rotations') },
    { value: 12, label: t('12_rotations') },
    { value: 360, label: t('free_rotation') }
  ];

  return (
    <div class="space-y-6">
        {/* Nesting Parameters Section */}
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div class="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('nesting_parameters')}</h4>
          </div>
          
          {/* Space Between Parts */}
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('space_between_parts')} (mm)
            </label>
            <div class="space-y-3">
              <input
                type="range"
                min="0"
                max="20"
                step="0.1"
                value={spaceBetweenParts()}
                onInput={(e) => handleSpacingChange(parseFloat(e.currentTarget.value))}
                class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
              <div class="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.1"
                  value={spaceBetweenParts()}
                  onInput={(e) => handleSpacingChange(parseFloat(e.currentTarget.value) || 0)}
                  class="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
                />
                <span class="text-sm text-gray-500 dark:text-gray-400">mm</span>
              </div>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {t('spacing_description')}
            </p>
          </div>

          {/* Curve Tolerance */}
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('curve_tolerance')} (mm)
            </label>
            <div class="space-y-3">
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={curveTolerance()}
                onInput={(e) => handleCurveToleranceChange(parseFloat(e.currentTarget.value))}
                class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
              <div class="flex items-center gap-3">
                <input
                  type="number"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={curveTolerance()}
                  onInput={(e) => handleCurveToleranceChange(parseFloat(e.currentTarget.value) || 0.3)}
                  class="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
                />
                <span class="text-sm text-gray-500 dark:text-gray-400">mm</span>
              </div>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {t('curve_tolerance_description')}
            </p>
          </div>

          {/* Part Rotations */}
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('part_rotations')}
            </label>
            <select
              value={partRotations()}
              onChange={(e) => handleRotationsChange(parseInt(e.currentTarget.value))}
              class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
            >
              <For each={rotationOptions}>
                {(option) => (
                  <option value={option.value}>{option.label}</option>
                )}
              </For>
            </select>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {t('rotations_description')}
            </p>
          </div>
        </div>

        {/* Genetic Algorithm Section */}
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div class="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('genetic_algorithm')}</h4>
          </div>
          
          {/* Population Size */}
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('population_size')}
            </label>
            <div class="space-y-3">
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={populationSize()}
                onInput={(e) => handlePopulationSizeChange(parseInt(e.currentTarget.value))}
                class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
              <div class="flex items-center gap-3">
                <input
                  type="number"
                  min="5"
                  max="50"
                  step="1"
                  value={populationSize()}
                  onInput={(e) => handlePopulationSizeChange(parseInt(e.currentTarget.value) || 10)}
                  class="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
                />
                <span class="text-sm text-gray-500 dark:text-gray-400">individuals</span>
              </div>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {t('population_size_description')}
            </p>
          </div>

          {/* Mutation Rate */}
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('mutation_rate')} (%)
            </label>
            <div class="space-y-3">
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={mutationRate()}
                onInput={(e) => handleMutationRateChange(parseInt(e.currentTarget.value))}
                class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
              <div class="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="50"
                  step="1"
                  value={mutationRate()}
                  onInput={(e) => handleMutationRateChange(parseInt(e.currentTarget.value) || 10)}
                  class="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
                />
                <span class="text-sm text-gray-500 dark:text-gray-400">%</span>
              </div>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {t('mutation_rate_description')}
            </p>
          </div>
        </div>

        {/* Advanced Options Section */}
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div class="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div class="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('advanced_options')}</h4>
          </div>
          
          {/* Use Holes */}
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('use_holes')}
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {t('use_holes_description')}
                </p>
              </div>
              <input
                type="checkbox"
                checked={useHoles()}
                onChange={(e) => {
                  setUseHoles(e.currentTarget.checked);
                  updateConfig({ useHoles: e.currentTarget.checked });
                }}
                class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
              />
            </div>
          </div>

          {/* Explore Concave */}
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('explore_concave')}
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {t('explore_concave_description')}
                </p>
              </div>
              <input
                type="checkbox"
                checked={exploreConcave()}
                onChange={(e) => {
                  setExploreConcave(e.currentTarget.checked);
                  updateConfig({ exploreConcave: e.currentTarget.checked });
                }}
                class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
              />
            </div>
          </div>

          {/* Merge Lines */}
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('merge_common_lines')}
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {t('merge_lines_description')}
                </p>
              </div>
              <input
                type="checkbox"
                checked={mergeLines()}
                onChange={(e) => {
                  setMergeLines(e.currentTarget.checked);
                  updateConfig({ mergeLines: e.currentTarget.checked });
                }}
                class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
              />
            </div>
          </div>

          {/* Use Rough Approximation */}
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('use_rough_approximation')}
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {t('rough_approximation_description')}
                </p>
              </div>
              <input
                type="checkbox"
                checked={useRoughApproximation()}
                onChange={(e) => {
                  setUseRoughApproximation(e.currentTarget.checked);
                  updateConfig({ useRoughApproximation: e.currentTarget.checked });
                }}
                class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
              />
            </div>
          </div>
        </div>
    </div>
  );
};

export default AlgorithmSettings;