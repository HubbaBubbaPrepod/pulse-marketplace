'use client';
import { useState } from 'react';
import { Icon } from './icon';
import { copy } from '../lib/copy.mjs';
const marker = '{"schemaVersion":1,"moduleId":"docker","packageAsset":"docker-module.json"}';
export function Developers({ lang }) {
  const t = copy[lang],
    [status, setStatus] = useState('');
  async function copyMarker() {
    try {
      await navigator.clipboard.writeText(marker);
      setStatus(t.copied);
    } catch {
      setStatus(t.copyFailed);
    }
  }
  return (
    <div className="developers-page">
      <div className="page-intro">
        <span className="eyebrow">BUILD / SHARE / EXTEND</span>
        <h1>{t.developerTitle}</h1>
        <p>{t.developerIntro}</p>
        <a
          className="button"
          href={`https://github.com/HubbaBubbaPrepod/pulse-monitor/blob/main/docs/MODULES${lang === 'en' ? '.en' : ''}.md`}
          target="_blank"
          rel="noreferrer"
        >
          {t.docs}
          <Icon name="external" size={17} />
        </a>
      </div>
      <div className="developer-steps">
        {t.steps.map((title, i) => (
          <section className="surface" key={title}>
            <span className="step-number">0{i + 1}</span>
            <h2>{title}</h2>
            <p>{t.stepTexts[i]}</p>
          </section>
        ))}
      </div>
      <section className="surface marker-section">
        <div>
          <h2>pulse-marketplace.json</h2>
          <p>{t.stepTexts[1]}</p>
        </div>
        <button className="button button-outline" onClick={copyMarker}>
          <Icon name="copy" size={16} />
          {t.copy}
        </button>
        <pre>
          <code>
            {
              '{\n  "schemaVersion": 1,\n  "moduleId": "docker",\n  "packageAsset": "docker-module.json"\n}'
            }
          </code>
        </pre>
        <p role="status" className="copy-status">
          {status}
        </p>
      </section>
      <section className="trust-section" id="trust">
        <Icon name="shield" size={32} />
        <div>
          <h2>{t.trustTitle}</h2>
          <p>{t.trustText}</p>
        </div>
      </section>
    </div>
  );
}
