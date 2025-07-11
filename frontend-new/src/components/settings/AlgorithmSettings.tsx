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
    <div class="algorithm-settings">
      <div class="section-header">
        <h3>{t('algorithm_settings')}</h3>
      </div>

      <div class="settings-sections">
        <div class="settings-section">
          <h4>{t('nesting_parameters')}</h4>
          
          <div class="setting-group">
            <label class="setting-label">
              {t('space_between_parts')} (mm)
            </label>
            <div class="input-with-slider">
              <input
                type="range"
                min="0"
                max="20"
                step="0.1"
                value={spaceBetweenParts()}
                onInput={(e) => handleSpacingChange(parseFloat(e.currentTarget.value))}
                class="slider"
              />
              <input
                type="number"
                min="0"
                max="20"
                step="0.1"
                value={spaceBetweenParts()}
                onInput={(e) => handleSpacingChange(parseFloat(e.currentTarget.value) || 0)}
                class="number-input"
              />
            </div>
            <div class="setting-description">
              {t('spacing_description')}
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">
              {t('curve_tolerance')} (mm)
            </label>
            <div class="input-with-slider">
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={curveTolerance()}
                onInput={(e) => handleCurveToleranceChange(parseFloat(e.currentTarget.value))}
                class="slider"
              />
              <input
                type="number"
                min="0.1"
                max="2"
                step="0.1"
                value={curveTolerance()}
                onInput={(e) => handleCurveToleranceChange(parseFloat(e.currentTarget.value) || 0.3)}
                class="number-input"
              />
            </div>
            <div class="setting-description">
              {t('curve_tolerance_description')}
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">
              {t('part_rotations')}
            </label>
            <select
              value={partRotations()}
              onChange={(e) => handleRotationsChange(parseInt(e.currentTarget.value))}
              class="setting-select"
            >
              <For each={rotationOptions}>
                {(option) => (
                  <option value={option.value}>{option.label}</option>
                )}
              </For>
            </select>
            <div class="setting-description">
              {t('rotations_description')}
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h4>{t('genetic_algorithm')}</h4>
          
          <div class="setting-group">
            <label class="setting-label">
              {t('population_size')}
            </label>
            <div class="input-with-slider">
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={populationSize()}
                onInput={(e) => handlePopulationSizeChange(parseInt(e.currentTarget.value))}
                class="slider"
              />
              <input
                type="number"
                min="5"
                max="50"
                step="1"
                value={populationSize()}
                onInput={(e) => handlePopulationSizeChange(parseInt(e.currentTarget.value) || 10)}
                class="number-input"
              />
            </div>
            <div class="setting-description">
              {t('population_size_description')}
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">
              {t('mutation_rate')} (%)
            </label>
            <div class="input-with-slider">
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={mutationRate()}
                onInput={(e) => handleMutationRateChange(parseInt(e.currentTarget.value))}
                class="slider"
              />
              <input
                type="number"
                min="1"
                max="50"
                step="1"
                value={mutationRate()}
                onInput={(e) => handleMutationRateChange(parseInt(e.currentTarget.value) || 10)}
                class="number-input"
              />
            </div>
            <div class="setting-description">
              {t('mutation_rate_description')}
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h4>{t('advanced_options')}</h4>
          
          <div class="setting-group">
            <label class="checkbox-setting">
              <input
                type="checkbox"
                checked={useHoles()}
                onChange={(e) => {
                  setUseHoles(e.currentTarget.checked);
                  updateConfig({ useHoles: e.currentTarget.checked });
                }}
              />
              <span class="checkmark"></span>
              <span class="setting-label">{t('use_holes')}</span>
            </label>
            <div class="setting-description">
              {t('use_holes_description')}
            </div>
          </div>

          <div class="setting-group">
            <label class="checkbox-setting">
              <input
                type="checkbox"
                checked={exploreConcave()}
                onChange={(e) => {
                  setExploreConcave(e.currentTarget.checked);
                  updateConfig({ exploreConcave: e.currentTarget.checked });
                }}
              />
              <span class="checkmark"></span>
              <span class="setting-label">{t('explore_concave')}</span>
            </label>
            <div class="setting-description">
              {t('explore_concave_description')}
            </div>
          </div>

          <div class="setting-group">
            <label class="checkbox-setting">
              <input
                type="checkbox"
                checked={mergeLines()}
                onChange={(e) => {
                  setMergeLines(e.currentTarget.checked);
                  updateConfig({ mergeLines: e.currentTarget.checked });
                }}
              />
              <span class="checkmark"></span>
              <span class="setting-label">{t('merge_common_lines')}</span>
            </label>
            <div class="setting-description">
              {t('merge_lines_description')}
            </div>
          </div>

          <div class="setting-group">
            <label class="checkbox-setting">
              <input
                type="checkbox"
                checked={useRoughApproximation()}
                onChange={(e) => {
                  setUseRoughApproximation(e.currentTarget.checked);
                  updateConfig({ useRoughApproximation: e.currentTarget.checked });
                }}
              />
              <span class="checkmark"></span>
              <span class="setting-label">{t('use_rough_approximation')}</span>
            </label>
            <div class="setting-description">
              {t('rough_approximation_description')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlgorithmSettings;