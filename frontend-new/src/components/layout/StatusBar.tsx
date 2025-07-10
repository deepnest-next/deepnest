import { Component, Show } from 'solid-js';
import { globalState } from '@/stores/global.store';

const StatusBar: Component = () => {
  return (
    <footer class="status-bar">
      <div class="status-left">
        <Show when={globalState.process.isNesting}>
          <div class="nesting-status">
            <span class="status-text">Nesting in progress...</span>
            <div class="progress-bar">
              <div 
                class="progress-fill"
                style={`width: ${globalState.process.progress * 100}%`}
              />
            </div>
            <span class="progress-text">
              {Math.round(globalState.process.progress * 100)}%
            </span>
          </div>
        </Show>
        
        <Show when={!globalState.process.isNesting && globalState.app.parts.length > 0}>
          <div class="parts-status">
            <span>{globalState.app.parts.length} parts loaded</span>
            <Show when={globalState.app.nests.length > 0}>
              <span> • {globalState.app.nests.length} nests available</span>
            </Show>
          </div>
        </Show>
      </div>
      
      <div class="status-right">
        <Show when={globalState.process.lastError}>
          <div class="error-status">
            <span class="error-icon">⚠️</span>
            <span class="error-text">{globalState.process.lastError}</span>
          </div>
        </Show>
        
        <div class="connection-status">
          <span class="connection-indicator">
            {globalState.process.workerStatus.isRunning ? '🟢' : '🔴'}
          </span>
          <span class="connection-text">
            {globalState.process.workerStatus.isRunning ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </footer>
  );
};

export default StatusBar;