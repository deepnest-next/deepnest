import type { Component } from 'solid-js';

const PrivacyPage: Component = () => {
  return (
    <div>
      <h1>Datenschutz</h1>
      <p>Rechtliche Informationen über diese Anwendung.</p>

      <div style={{ margin: '20px 0' }}>
        <h2>Kontaktinformationen</h2>
        <p>Deepnest GmbH</p>
        <p>Musterstraße 123</p>
        <p>12345 Musterstadt</p>
        <p>Deutschland</p>
      </div>
    </div>
  );
};

export default PrivacyPage;
