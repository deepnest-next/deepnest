import type { Component } from 'solid-js';

const SettingsPage: Component = () => {
  return (
    <div>
      <h1>Einstellungen</h1>
      <p>Hier können Sie Ihre Anwendungseinstellungen anpassen.</p>

      <div style={{ margin: '20px 0' }}>
        <h2>Allgemeine Einstellungen</h2>
        {/* Settings controls would go here */}
      </div>
    </div>
  );
};

export default SettingsPage;
