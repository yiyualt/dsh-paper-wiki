;(() => {
const paperWikiStyles = ".dsh-paper-wiki-page {\n  --wiki-paper: var(--dsw-alias-bg-base);\n  --wiki-canvas: color-mix(in srgb, var(--dsw-alias-bg-module-platform) 56%, var(--wiki-paper));\n  --wiki-ink: var(--dsw-alias-label-primary);\n  --wiki-muted: var(--dsw-alias-label-secondary);\n  --wiki-line: var(--dsw-alias-border-l2);\n  --wiki-accent: color-mix(in srgb, var(--dsw-alias-link) 77%, #6f52bf);\n  --wiki-accent-ink: color-mix(in srgb, var(--wiki-accent) 78%, var(--wiki-ink));\n  --wiki-accent-fill: color-mix(in srgb, var(--wiki-accent) 11%, transparent);\n  --wiki-accent-line: color-mix(in srgb, var(--wiki-accent) 19%, transparent);\n  --wiki-gutter: clamp(16px, 3.25vw, 48px);\n  flex: 1; min-width: 0; min-height: 0; overflow: auto;\n  background: var(--wiki-canvas); color: var(--wiki-ink); font-family: var(--dsw-font-family);\n}\n.dsh-paper-wiki-page * { box-sizing: border-box; }\n.dsh-paper-wiki-shell { max-width: 1344px; margin-inline: auto; padding: 0 var(--wiki-gutter) 48px; container: dsh-paper-wiki / inline-size; }\n.dsh-paper-wiki-bar { display: flex; align-items: center; justify-content: space-between; min-height: 68px; gap: 12px; border-bottom: 1px solid var(--wiki-line); margin-bottom: 24px; }\n.dsh-paper-wiki-page:not([data-reading]) .dsh-paper-wiki-bar { max-width: 860px; margin-inline: auto; }\n.dsh-paper-wiki-brand { display: inline-flex; align-items: center; gap: 11px; min-width: 0; margin: 0; color: var(--wiki-ink); font-size: 21px; font-weight: 690; line-height: 1.4; }\n.dsh-paper-wiki-brand-icon, .dsh-paper-wiki-history-icon { display: grid; place-items: center; flex: none; width: 37px; height: 37px; border-radius: 9px; background: var(--wiki-accent-fill); color: var(--wiki-accent-ink); }\n.dsh-paper-wiki-breadcrumb { display: flex; align-items: center; gap: 8px; min-width: 0; font-size: 14px; color: var(--wiki-muted); }\n.dsh-paper-wiki-breadcrumb > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--wiki-ink); font-weight: 650; }\n.dsh-paper-wiki-breadcrumb > svg { flex: none; }\n.dsh-paper-wiki-breadcrumb > button { flex: none; padding: 8px; margin-left: -8px; border: 0; border-radius: 7px; color: var(--wiki-accent-ink); background: transparent; font: inherit; font-weight: 630; cursor: pointer; }\n.dsh-paper-wiki-breadcrumb > button:hover { background: var(--wiki-accent-fill); }\n.dsh-paper-wiki-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }\n.dsh-paper-wiki-bar > .dsh-paper-wiki-actions { flex: none; }\n.dsh-paper-wiki-page button { font-family: inherit; }\n.dsh-paper-wiki-actions button, .dsh-paper-wiki-bar > button { min-height: 35px; border-radius: 8px; font-weight: 620; white-space: nowrap; }\n.dsh-paper-wiki-library, .dsh-paper-wiki-reading { display: grid; gap: 18px; min-width: 0; }\n.dsh-paper-wiki-library { max-width: 860px; margin-inline: auto; }\n.dsh-paper-wiki-history h2 { margin: 4px 0 10px; font-size: 15px; font-weight: 660; line-height: 1.5; }\n.dsh-paper-wiki-library-status { margin: 0 0 10px; color: var(--wiki-muted); font-size: 13px; }\n.dsh-paper-wiki-library-status[role='alert'] { color: var(--dsw-alias-state-error-primary); }\n.dsh-paper-wiki-library-empty { display: grid; justify-items: center; gap: 10px; padding: clamp(30px, 6cqi, 56px) 20px; border: 1px solid var(--wiki-line); border-radius: 12px; background: var(--wiki-paper); color: var(--wiki-muted); text-align: center; }\n.dsh-paper-wiki-library-empty p { margin: 0; color: var(--wiki-ink); font-size: 14px; font-weight: 600; }\n.dsh-paper-wiki-history-list { margin: 0; padding: 4px; border: 1px solid var(--wiki-line); border-radius: 12px; background: var(--wiki-paper); list-style: none; }\n.dsh-paper-wiki-history-row { display: grid; grid-template-columns: minmax(0, 1fr) 46px; align-items: center; gap: 1px; }\n.dsh-paper-wiki-history-row + .dsh-paper-wiki-history-row { border-top: 1px solid var(--wiki-line); }\n.dsh-paper-wiki-history-item { display: grid; grid-template-columns: 37px minmax(0, 1fr) auto; align-items: center; gap: 12px; width: 100%; min-height: 73px; padding: 10px 9px 10px 12px; border: 0; border-radius: 8px; background: transparent; color: var(--wiki-muted); text-align: left; font: inherit; cursor: pointer; }\n.dsh-paper-wiki-history-item:hover, .dsh-paper-wiki-history-item[aria-busy='true'] { background: var(--wiki-accent-fill); }\n.dsh-paper-wiki-history-item[aria-busy='true'] { cursor: wait; }\n.dsh-paper-wiki-history-copy { display: grid; gap: 5px; min-width: 0; }\n.dsh-paper-wiki-history-copy strong { color: var(--wiki-ink); font-size: 14px; font-weight: 650; line-height: 1.4; overflow-wrap: anywhere; }\n.dsh-paper-wiki-history-meta { display: flex; flex-wrap: wrap; gap: 3px 12px; font-size: 12px; line-height: 1.5; }\n.dsh-paper-wiki-ready { color: var(--wiki-accent-ink); }\n.dsh-paper-wiki-delete { display: grid; place-items: center; justify-self: center; width: 36px; height: 36px; padding: 0; border: 0; border-radius: 7px; background: transparent; color: var(--wiki-muted); cursor: pointer; }\n.dsh-paper-wiki-delete:hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 9%, transparent); color: var(--dsw-alias-state-error-primary); }\n.dsh-paper-wiki-page button:disabled { cursor: not-allowed; opacity: .55; }\n.dsh-paper-wiki-form-card { padding: clamp(19px, 4cqi, 34px); border: 1px solid var(--wiki-line); border-radius: 12px; background: var(--wiki-paper); }\n.dsh-paper-wiki-form-title { margin: 0 0 19px; font-size: clamp(19px, 3cqi, 24px); font-weight: 680; line-height: 1.3; }\n.dsh-paper-wiki-form { display: flex; flex-wrap: wrap; align-items: end; gap: 11px; }\n.dsh-paper-wiki-form > button[type='submit'] { min-height: 38px; border-radius: 9px; font-weight: 600; }\n.dsh-paper-wiki-file-field { display: flex; flex: 1 1 220px; align-items: center; flex-wrap: wrap; gap: 8px; min-width: 0; min-height: 38px; }\n.dsh-paper-wiki-file-field > span { min-width: 0; color: var(--wiki-muted); font-size: 13px; overflow-wrap: anywhere; }\n.dsh-paper-wiki-form-title:focus { outline: none; }\n.dsh-paper-wiki-feedback { margin: 0; padding: 11px 14px; border-radius: 9px; background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent); color: var(--dsw-alias-state-error-primary); font-size: 13px; line-height: 1.6; overflow-wrap: anywhere; }\n.dsh-paper-wiki-confirm-delete { --dsw-alias-button-primary-fill: var(--dsw-alias-state-error-primary); --dsw-alias-button-primary-hover: var(--dsw-alias-state-error-primary); }\n.dsh-paper-wiki-error { color: var(--dsw-alias-state-error-primary); }\n.dsh-paper-wiki-reader { min-width: 0; }\n.dsh-paper-wiki-reader-heading { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 18px; padding: 4px 0 22px; }\n.dsh-paper-wiki-reader-heading > div:first-child { flex: 1 1 280px; min-width: 0; }\n.dsh-paper-wiki-eyebrow { margin: 0 0 8px; color: var(--wiki-accent-ink); font-size: 12px; font-weight: 600; }\n.dsh-paper-wiki-reader-heading h1 { margin: 0; color: var(--wiki-ink); font-size: clamp(23px, 3.2cqi, 34px); font-weight: 700; line-height: 1.3; letter-spacing: -.02em; overflow-wrap: anywhere; }\n.dsh-paper-wiki-reader-heading h1:focus { outline: none; }\n.dsh-paper-wiki-file-name { margin: 9px 0 0; color: var(--wiki-muted); font-size: 12px; overflow-wrap: anywhere; }\n.dsh-paper-wiki-warning { border: 1px solid var(--wiki-accent-line); border-radius: 9px; background: var(--wiki-accent-fill); padding: 10px 13px; margin-bottom: 16px; font-size: 12px; color: var(--wiki-muted); line-height: 1.65; }\n.dsh-paper-wiki-warning p { margin: 0; }\n.dsh-paper-wiki-warning p + p { margin-top: 6px; }\n.dsh-paper-wiki-columns { display: grid; grid-template-columns: minmax(0, 1fr); align-items: start; gap: 12px; }\n.dsh-paper-wiki-sidebar { min-width: 0; }\n.dsh-paper-wiki-rail-label, .dsh-paper-wiki-chapter-list { display: none; }\n.dsh-paper-wiki-rail-label { margin: 0 0 9px; padding-inline: 11px; font-size: 12px; font-weight: 650; color: var(--wiki-muted); }\n.dsh-paper-wiki-chapter-list { gap: 4px; padding: 0; margin: 0; list-style: none; }\n.dsh-paper-wiki-chapter-button { display: block; width: 100%; min-height: 38px; padding: 9px 11px; border: 0; border-radius: 7px; background: transparent; color: var(--wiki-muted); text-align: left; font: inherit; font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; cursor: pointer; }\n.dsh-paper-wiki-chapter-button:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--wiki-ink); }\n.dsh-paper-wiki-chapter-button[aria-current='page'] { background: var(--wiki-accent-fill); color: var(--wiki-accent-ink); font-weight: 650; }\n.dsh-paper-wiki-chapter-picker { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 10px; padding: 9px 10px; border: 1px solid var(--wiki-line); border-radius: 9px; background: var(--wiki-paper); font-size: 12px; color: var(--wiki-muted); }\n.dsh-paper-wiki-chapter-picker select { width: 100%; min-width: 0; min-height: 34px; padding: 4px 8px; border: 1px solid var(--wiki-line); border-radius: 7px; color: var(--wiki-ink); background: var(--wiki-canvas); font: inherit; }\n.dsh-paper-wiki-article { --wiki-reading-pad: clamp(17px, 3.3cqi, 35px); min-width: 0; border: 1px solid var(--wiki-line); border-radius: 12px; background: var(--wiki-paper); }\n.dsh-paper-wiki-article-header { padding: clamp(20px, 3.25cqi, 33px) var(--wiki-reading-pad) 23px; border-bottom: 1px solid var(--wiki-line); overflow-wrap: anywhere; }\n.dsh-paper-wiki-article-title { margin: 0; font-size: clamp(24px, 3.55cqi, 37px); line-height: 1.23; letter-spacing: -.026em; font-weight: 700; }\n.dsh-paper-wiki-meta { display: flex; flex-wrap: wrap; gap: 8px 13px; margin-top: 15px; font-size: 12px; line-height: 1.5; color: var(--wiki-muted); }\n.dsh-paper-wiki-prose { padding: 24px var(--wiki-reading-pad) 30px; min-width: 0; font-size: 15px; line-height: 1.85; overflow-wrap: anywhere; }\n.dsh-paper-wiki-prose a { color: var(--wiki-accent-ink); }\n.dsh-paper-wiki-prose pre { max-width: 100%; overflow-x: auto; }\n.dsh-paper-wiki-prose table { display: block; max-width: 100%; overflow-x: auto; }\n.dsh-paper-wiki-prose :is(h1,h2,h3,h4) { line-height: 1.4; }\n.dsh-paper-wiki-page :is(button,input,select,summary,a):focus-visible { outline: 2px solid var(--wiki-accent); outline-offset: 2px; }\n@container dsh-paper-wiki (min-width: 705px) {\n  .dsh-paper-wiki-columns { grid-template-columns: minmax(165px, 210px) minmax(0, 1fr); gap: clamp(18px, 2.7cqi, 32px); }\n  .dsh-paper-wiki-sidebar { position: sticky; top: 20px; max-height: calc(100dvh - 90px); overflow-y: auto; padding: 12px 9px; border: 1px solid var(--wiki-line); border-radius: 12px; background: var(--wiki-paper); }\n  .dsh-paper-wiki-rail-label { display: block; }\n  .dsh-paper-wiki-chapter-list { display: grid; }\n  .dsh-paper-wiki-chapter-picker { display: none; }\n}\n@container dsh-paper-wiki (max-width: 440px) {\n  .dsh-paper-wiki-bar { min-height: 58px; margin-bottom: 16px; }\n  .dsh-paper-wiki-history-row { grid-template-columns: minmax(0, 1fr) 34px; }\n  .dsh-paper-wiki-history-item { gap: 8px; padding-left: 6px; }\n  .dsh-paper-wiki-history-item > svg { display: none; }\n}\n.dsh-paper-wiki-explanation-empty { padding-block: 10px; }\n\n.dsh-paper-wiki-lesson-section { min-width: 0; scroll-margin-top: 20px; }\n.dsh-paper-wiki-lesson-section + .dsh-paper-wiki-lesson-section { border-top: 1px solid var(--wiki-line); }\n.dsh-paper-wiki-lesson-section .dsh-paper-wiki-article-title:focus { outline: none; }\n.dsh-paper-wiki-page[data-guide] { display: flex; flex-direction: column; overflow: hidden; }\n.dsh-paper-wiki-page[data-guide] .dsh-paper-wiki-shell { display: flex; flex: 1; flex-direction: column; width: 100%; max-width: none; min-height: 0; padding: 0; }\n.dsh-paper-wiki-page[data-guide] .dsh-paper-wiki-bar { flex: none; min-height: 58px; margin: 0; padding: 0 24px; }\n.dsh-paper-wiki-page[data-guide] .dsh-paper-wiki-reading { display: flex; flex: 1; flex-direction: column; min-height: 0; gap: 0; }\n.dsh-paper-wiki-guide-reader { display: flex; flex: 1; flex-direction: column; min-width: 0; min-height: 0; }\n.dsh-paper-wiki-guide-frame { display: block; flex: 1; width: 100%; height: 100%; min-height: 0; border: 0; background: #f5f6fa; }\n.dsh-paper-wiki-page[data-guide] .dsh-paper-wiki-warning { flex: none; margin: 8px 16px; }\n@media (max-width: 540px) {\n  .dsh-paper-wiki-page[data-guide] .dsh-paper-wiki-bar { flex-wrap: wrap; gap: 4px 8px; padding: 8px 12px; }\n  .dsh-paper-wiki-page[data-guide] .dsh-paper-wiki-breadcrumb { flex-basis: 100%; font-size: 12px; }\n}\n\n.dsh-paper-wiki-generation {\n  position: relative;\n  padding: clamp(18px, 4cqi, 34px);\n  border: 1px solid var(--wiki-accent-line);\n  border-radius: 18px;\n  background: linear-gradient(145deg, color-mix(in srgb, var(--wiki-accent) 8%, var(--wiki-paper)), var(--wiki-paper) 65%);\n  box-shadow: 0 2px 5px rgb(16 25 56 / 4%);\n}\n\n.dsh-paper-wiki-generation-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 14px;\n}\n\n.dsh-paper-wiki-generation-header > div:first-child {\n  min-width: 0;\n}\n\n.dsh-paper-wiki-generation-repo {\n  margin: 0 0 6px;\n  color: var(--wiki-accent-ink);\n  font-family: var(--ds-font-family-code);\n  font-size: 13px;\n  font-weight: 600;\n  overflow-wrap: anywhere;\n}\n\n.dsh-paper-wiki-generation-header h2 {\n  margin: 0;\n  color: var(--wiki-ink);\n  font-size: clamp(20px, 4.3cqi, 30px);\n  font-weight: 680;\n  line-height: 1.25;\n}\n\n.dsh-paper-wiki-clock {\n  display: grid;\n  flex: none;\n  gap: 2px;\n  min-inline-size: 84px;\n  padding: 8px 12px;\n  border: 1px solid var(--wiki-accent-line);\n  border-radius: 12px;\n  background: var(--wiki-paper);\n  color: var(--wiki-muted);\n  text-align: center;\n  font-size: 11px;\n  line-height: 1.4;\n}\n\n.dsh-paper-wiki-clock time {\n  color: var(--wiki-accent-ink);\n  font-family: var(--ds-font-family-code);\n  font-size: clamp(20px, 4.4cqi, 26px);\n  font-variant-numeric: tabular-nums;\n  font-weight: 650;\n  line-height: 1.2;\n}\n\n.dsh-paper-wiki-progressbar {\n  position: relative;\n  block-size: 10px;\n  margin-block-start: 26px;\n  overflow: hidden;\n  border-radius: 999px;\n  background: color-mix(in srgb, var(--wiki-accent) 17%, var(--wiki-paper));\n}\n\n.dsh-paper-wiki-progressbar::before {\n  content: '';\n  position: absolute;\n  inset-block: 0;\n  inline-size: 36%;\n  border-radius: inherit;\n  background: linear-gradient(90deg, var(--wiki-accent-ink), var(--wiki-accent));\n  animation: dsh-paper-wiki-progress 1.9s ease-in-out infinite alternate;\n}\n\n@keyframes dsh-paper-wiki-progress {\n  from { transform: translateX(0); }\n  to { transform: translateX(178%); }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .dsh-paper-wiki-progressbar::before {\n    inline-size: 100%;\n    animation: none;\n    background: repeating-linear-gradient(135deg, var(--wiki-accent) 0 10px, transparent 10px 20px);\n  }\n}\n\n.dsh-paper-wiki-generation-stages {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: clamp(8px, 2cqi, 18px);\n  margin: 13px 0 0;\n  padding: 0;\n  list-style: none;\n}\n\n.dsh-paper-wiki-generation-stages li {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  color: var(--wiki-muted);\n  font-size: 12px;\n  line-height: 1.4;\n}\n\n.dsh-paper-wiki-stage-marker {\n  box-sizing: border-box;\n  display: grid;\n  place-items: center;\n  flex-shrink: 0;\n  inline-size: 16px;\n  block-size: 16px;\n  border: 1px solid currentColor;\n  border-radius: 50%;\n  opacity: 0.55;\n}\n\n.dsh-paper-wiki-generation-stages li[data-state='done'] .dsh-paper-wiki-stage-marker {\n  border-color: transparent;\n  background: var(--wiki-accent-fill);\n  color: var(--wiki-accent-ink);\n  opacity: 1;\n}\n\n.dsh-paper-wiki-generation-stages li[data-state='active'] {\n  color: var(--wiki-accent-ink);\n  font-weight: 700;\n}\n\n.dsh-paper-wiki-generation-stages li[data-state='active'] .dsh-paper-wiki-stage-marker {\n  border: 5px solid var(--wiki-accent);\n  opacity: 1;\n}\n\n.dsh-paper-wiki-generation-detail,\n.dsh-paper-wiki-generation-background {\n  margin: 19px 0 0;\n  color: var(--wiki-muted);\n  font-size: 13px;\n  line-height: 1.55;\n}\n\n.dsh-paper-wiki-generation-background {\n  margin-block-start: 4px;\n  font-size: 12px;\n}\n\n.dsh-paper-wiki-generation-done {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  padding: 12px 14px;\n  border: 1px solid var(--wiki-accent-line);\n  border-radius: 12px;\n  background: var(--wiki-accent-fill);\n}\n\n.dsh-paper-wiki-generation-done p {\n  display: flex;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: 4px 7px;\n  min-width: 0;\n  margin: 0;\n  color: var(--wiki-accent-ink);\n  font-size: 13px;\n  font-weight: 650;\n}\n\n.dsh-paper-wiki-generation-done p span {\n  color: var(--wiki-muted);\n  font-size: 12px;\n  font-weight: 400;\n  overflow-wrap: anywhere;\n}\n\n.dsh-paper-wiki-generation-done button {\n  flex: none;\n}\n\n.dsh-paper-wiki-generation-actions {\n  display: flex;\n  justify-content: flex-end;\n  margin-block-start: 16px;\n}\n\n.dsh-paper-wiki-generation-done[data-state='failed'] p {\n  color: var(--dsw-alias-state-error-primary);\n}\n\n.dsh-paper-wiki-content-paragraph { margin: 0 0 19px; white-space: pre-line; }\n.dsh-paper-wiki-content-references { color: var(--wiki-muted); font-size: 12px; font-weight: 400; white-space: normal; }\n.dsh-paper-wiki-content-block { min-width: 0; margin: 24px 0; padding: 19px; border: 1px solid var(--wiki-line); border-radius: 10px; background: var(--wiki-paper); }\n.dsh-paper-wiki-content-block > .dsh-paper-wiki-content-references { display: block; margin-top: 12px; line-height: 1.5; }\n.dsh-paper-wiki-content-heading { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 12px; margin-bottom: 15px; }\n.dsh-paper-wiki-content-heading h3,\n.dsh-paper-wiki-content-title { margin: 0; color: var(--wiki-ink); font-size: 16px; font-weight: 650; line-height: 1.5; }\n.dsh-paper-wiki-example-mode { color: var(--wiki-muted); font-size: 12px; line-height: 1.5; }\n.dsh-paper-wiki-example-panel { min-width: 0; }\n.dsh-paper-wiki-example-code { min-width: 0; max-width: 100%; overflow-x: auto; border: 1px solid var(--wiki-line); border-radius: 8px; background: var(--wiki-canvas); font-size: 13px; line-height: 1.7; }\n.dsh-paper-wiki-example-code pre { margin: 0; white-space: pre; overflow-wrap: normal; word-break: normal; }\n.dsh-paper-wiki-prose .dsh-paper-wiki-example-code pre code { font-family: var(--ds-font-family-code); font-size: 13px; line-height: 1.7; white-space: pre; overflow-wrap: normal; word-break: normal; }\n.dsh-paper-wiki-example-explanation { margin: 12px 0 0; color: var(--wiki-ink); font-size: 13px; line-height: 1.8; white-space: pre-line; }\n.dsh-paper-wiki-table-scroll { max-width: 100%; overflow-x: auto; }\n.dsh-paper-wiki-content-table table { display: table; width: 100%; max-width: none; border-collapse: collapse; font-size: 13px; line-height: 1.65; }\n.dsh-paper-wiki-content-table caption { padding: 0 0 14px; color: var(--wiki-ink); font-size: 16px; font-weight: 650; line-height: 1.5; text-align: left; }\n.dsh-paper-wiki-content-table th { background: var(--wiki-canvas); color: var(--wiki-ink); font-size: 12px; font-weight: 650; text-align: left; vertical-align: top; }\n.dsh-paper-wiki-content-table th,\n.dsh-paper-wiki-content-table td { min-width: 85px; padding: 10px 12px; border: 1px solid var(--wiki-line); overflow-wrap: anywhere; }\n.dsh-paper-wiki-content-table td { color: var(--wiki-ink); vertical-align: top; }\n.dsh-paper-wiki-content-chart { margin-inline: 0; }\n.dsh-paper-wiki-chart-context { margin: 8px 0 0; color: var(--wiki-muted); font-size: 13px; line-height: 1.7; }\n.dsh-paper-wiki-chart-metric { margin: 9px 0 17px; color: var(--wiki-muted); font-size: 12px; line-height: 1.5; }\n.dsh-paper-wiki-chart-data { display: grid; gap: 16px; margin: 0; padding: 0; list-style: none; }\n.dsh-paper-wiki-chart-data li { min-width: 0; }\n.dsh-paper-wiki-chart-row-heading { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 2px 10px; margin-bottom: 6px; font-size: 13px; line-height: 1.65; }\n.dsh-paper-wiki-chart-row-heading > span:first-child { min-width: 0; overflow-wrap: anywhere; }\n.dsh-paper-wiki-chart-value { flex: none; max-width: 100%; font-family: var(--ds-font-family-code); font-variant-numeric: tabular-nums; color: var(--wiki-ink); overflow-wrap: anywhere; }\n.dsh-paper-wiki-chart-value .dsh-paper-wiki-content-references { margin-left: 5px; font-family: var(--dsw-font-family); font-size: 11px; }\n.dsh-paper-wiki-chart-track { position: relative; height: 12px; overflow: visible; border-radius: 3px; background: var(--wiki-canvas); }\n.dsh-paper-wiki-chart-fill { position: absolute; top: 0; bottom: 0; border-radius: 2px; background: var(--wiki-accent); }\n.dsh-paper-wiki-chart-fill[data-negative] { background: color-mix(in srgb, var(--wiki-accent) 55%, var(--wiki-muted)); }\n.dsh-paper-wiki-chart-zero { position: absolute; top: -2px; bottom: -2px; width: 1px; background: color-mix(in srgb, var(--wiki-ink) 48%, transparent); }\n.dsh-paper-wiki-chart-axis { display: flex; justify-content: space-between; gap: 12px; margin-top: 6px; color: var(--wiki-muted); font-family: var(--ds-font-family-code); font-size: 11px; line-height: 1.5; }\n.dsh-paper-wiki-chart-axis > span { flex: 1; min-width: 0; overflow-wrap: anywhere; }\n.dsh-paper-wiki-chart-axis > span + span { text-align: right; }\n.dsh-paper-wiki-content-block :is(button,[tabindex]):focus-visible { outline: 2px solid var(--wiki-accent); outline-offset: 3px; }\n@container dsh-paper-wiki (max-width: 440px) {\n  .dsh-paper-wiki-content-block { padding: 14px; }\n  .dsh-paper-wiki-chart-row-heading { flex-wrap: wrap; gap: 2px 10px; }\n  .dsh-paper-wiki-content-table th, .dsh-paper-wiki-content-table td { padding: 8px; }\n}\n\n.dsh-paper-wiki-example-sequence, .dsh-paper-wiki-flow-sequence { margin: 0; padding: 0; list-style: none; }\n.dsh-paper-wiki-example-sequence { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: 18px; }\n.dsh-paper-wiki-example-step { min-width: 0; }\n.dsh-paper-wiki-example-step:last-child:nth-child(odd) { grid-column: 1 / -1; }\n.dsh-paper-wiki-example-step h4, .dsh-paper-wiki-flow-step h4 { display: flex; align-items: baseline; gap: 8px; margin: 0 0 10px; font-size: 14px; font-weight: 650; line-height: 1.6; }\n.dsh-paper-wiki-sequence-number { flex: none; color: var(--wiki-accent-ink); font-family: var(--ds-font-family-code); font-size: 12px; }\n.dsh-paper-wiki-flow-sequence { display: grid; gap: 0; margin-top: 17px; }\n.dsh-paper-wiki-flow-step { position: relative; min-width: 0; padding: 0 0 22px 18px; border-left: 2px solid var(--wiki-accent-line); }\n.dsh-paper-wiki-flow-step:last-child { padding-bottom: 0; }\n.dsh-paper-wiki-flow-step::before { content: ''; position: absolute; left: -5px; top: 8px; width: 8px; height: 8px; border: 2px solid var(--wiki-paper); border-radius: 50%; background: var(--wiki-accent); }\n.dsh-paper-wiki-flow-step dl { display: grid; grid-template-columns: 30px minmax(0, 1fr); gap: 6px 12px; margin: 0; font-size: 13px; line-height: 1.75; }\n.dsh-paper-wiki-flow-step dt { color: var(--wiki-muted); font-size: 12px; }\n.dsh-paper-wiki-flow-step dd { min-width: 0; margin: 0; white-space: pre-line; overflow-wrap: anywhere; }\n.dsh-paper-wiki-term-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 20px; margin: 17px 0 0; }\n.dsh-paper-wiki-term { min-width: 0; }\n.dsh-paper-wiki-term dt { margin: 0 0 7px; color: var(--wiki-accent-ink); font-size: 15px; font-weight: 650; line-height: 1.6; }\n.dsh-paper-wiki-term dd { margin: 0; font-size: 13px; line-height: 1.8; white-space: pre-line; }\n.dsh-paper-wiki-term .dsh-paper-wiki-term-example { display: grid; gap: 4px; margin: 10px 0; padding: 10px 12px; border-left: 2px solid var(--wiki-accent-line); border-radius: 0 6px 6px 0; background: var(--wiki-accent-fill); color: var(--wiki-ink); overflow-wrap: anywhere; }\n.dsh-paper-wiki-term-example > span, .dsh-paper-wiki-term-role > span { display: block; color: var(--wiki-muted); font-size: 11px; }\n.dsh-paper-wiki-term .dsh-paper-wiki-term-contrast { margin-top: 8px; color: var(--wiki-muted); font-size: 12px; }\n.dsh-paper-wiki-diagram-description, .dsh-paper-wiki-evidence-question { margin: 0 0 13px; color: var(--wiki-ink); font-size: 13px; line-height: 1.8; white-space: pre-line; }\n.dsh-paper-wiki-diagram-stages { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }\n.dsh-paper-wiki-diagram-stages button { min-width: 0; max-width: 100%; min-height: 34px; padding: 6px 11px; border: 1px solid var(--wiki-line); border-radius: 7px; background: var(--wiki-paper); color: var(--wiki-muted); font: inherit; font-size: 12px; line-height: 1.5; overflow-wrap: anywhere; cursor: pointer; }\n.dsh-paper-wiki-diagram-stages button[aria-pressed='true'] { border-color: var(--wiki-accent-line); background: var(--wiki-accent-fill); color: var(--wiki-accent-ink); font-weight: 650; }\n.dsh-paper-wiki-diagram-scroll { max-width: 100%; overflow-x: auto; border: 1px solid var(--wiki-line); border-radius: 8px; background: var(--wiki-canvas); }\n.dsh-paper-wiki-diagram-canvas { position: relative; isolation: isolate; }\n.dsh-paper-wiki-diagram-wires { position: absolute; inset: 0; }\n.dsh-paper-wiki-diagram-column { position: absolute; top: 18px; color: var(--wiki-muted); font-size: 12px; font-weight: 600; text-align: center; line-height: 1.5; }\n.dsh-paper-wiki-diagram-edge { color: var(--wiki-muted); }\n.dsh-paper-wiki-diagram-edge[data-active] { color: var(--wiki-accent-ink); }\n.dsh-paper-wiki-diagram-edge-label-bg { fill: var(--wiki-canvas); }\n.dsh-paper-wiki-diagram-edge text { fill: currentColor; stroke: var(--wiki-canvas); stroke-width: 2px; paint-order: stroke; stroke-linejoin: round; font-family: var(--ds-font-family-code), ui-monospace, monospace; font-size: 11px; }\n.dsh-paper-wiki-diagram-node { position: absolute; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden; padding: 11px 13px; border: 1px solid var(--wiki-line); border-radius: 8px; background: var(--wiki-paper); color: var(--wiki-ink); font: inherit; font-size: 13px; line-height: 1.55; text-align: center; overflow-wrap: anywhere; cursor: pointer; }\n.dsh-paper-wiki-diagram-node[data-active] { border-color: var(--wiki-accent); background: color-mix(in srgb, var(--wiki-accent) 8%, var(--wiki-paper)); }\n.dsh-paper-wiki-diagram-node[aria-pressed='true'] { outline: 2px solid var(--wiki-accent); outline-offset: 2px; }\n.dsh-paper-wiki-diagram-detail, .dsh-paper-wiki-evidence-detail { margin-top: 13px; padding: 12px 14px; border-left: 2px solid var(--wiki-accent-line); border-radius: 0 6px 6px 0; background: var(--wiki-accent-fill); }\n.dsh-paper-wiki-diagram-detail h4, .dsh-paper-wiki-evidence-detail h4 { margin: 0 0 5px; font-size: 13px; font-weight: 650; }\n.dsh-paper-wiki-diagram-detail p, .dsh-paper-wiki-evidence-detail p { margin: 0; font-size: 13px; line-height: 1.8; white-space: pre-line; }\n.dsh-paper-wiki-diagram-relations { display: grid; gap: 5px; margin: 13px 0 0; padding: 0; list-style: none; font-size: 12px; line-height: 1.7; color: var(--wiki-muted); }\n.dsh-paper-wiki-diagram-relations [data-active] { color: var(--wiki-accent-ink); }\n.dsh-paper-wiki-evidence-budget { margin: 0 0 14px; color: var(--wiki-muted); font-size: 12px; }\n.dsh-paper-wiki-evidence-states { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 16px; }\n.dsh-paper-wiki-evidence-state { min-width: 0; padding: 14px; border: 1px solid var(--wiki-line); border-radius: 8px; }\n.dsh-paper-wiki-evidence-state h4 { margin: 0 0 11px; color: var(--wiki-ink); font-size: 14px; font-weight: 650; line-height: 1.6; }\n.dsh-paper-wiki-evidence-slots { display: grid; gap: 7px; margin: 0; padding: 0; list-style: none; }\n.dsh-paper-wiki-evidence-slots li { display: grid; grid-template-columns: 14px minmax(0, 1fr); align-items: center; gap: 7px; min-height: 40px; }\n.dsh-paper-wiki-evidence-position { color: var(--wiki-muted); font-family: var(--ds-font-family-code); font-size: 11px; }\n.dsh-paper-wiki-evidence-slots button { display: flex; align-items: center; justify-content: space-between; gap: 6px; min-width: 0; min-height: 40px; padding: 8px 10px; border: 1px solid var(--wiki-line); border-radius: 6px; background: var(--wiki-canvas); color: var(--wiki-ink); font: inherit; font-size: 12px; line-height: 1.6; text-align: left; overflow-wrap: anywhere; cursor: pointer; }\n.dsh-paper-wiki-evidence-slots button[aria-expanded='true'] { border-color: var(--wiki-accent); }\n.dsh-paper-wiki-evidence-slots [data-added] button { border-color: var(--wiki-accent-line); background: var(--wiki-accent-fill); }\n.dsh-paper-wiki-evidence-added { flex: none; color: var(--wiki-accent-ink); font-size: 11px; font-weight: 650; }\n.dsh-paper-wiki-evidence-empty { color: var(--wiki-muted); font-size: 12px; }\n.dsh-paper-wiki-evidence-removed { margin: 10px 0 0; color: var(--wiki-muted); font-size: 12px; line-height: 1.6; }\n.dsh-paper-wiki-evidence-coverage { margin: 13px 0 5px; color: var(--wiki-ink); font-size: 12px; font-weight: 650; }\n.dsh-paper-wiki-evidence-requirements { margin: 0; padding: 0; list-style: none; font-size: 11px; line-height: 1.8; color: var(--wiki-muted); }\n.dsh-paper-wiki-evidence-requirements [data-covered] { color: var(--wiki-accent-ink); }\n.dsh-paper-wiki-evidence-explanation { margin: 11px 0 0; font-size: 12px; line-height: 1.8; white-space: pre-line; }\n.dsh-paper-wiki-calculation-formula { margin: 0 0 17px; padding: 12px 14px; border: 1px solid var(--wiki-line); border-radius: 7px; background: var(--wiki-canvas); color: var(--wiki-ink); font-family: var(--ds-font-family-code); font-size: 13px; line-height: 1.7; white-space: pre-wrap; overflow-wrap: anywhere; }\n.dsh-paper-wiki-calculation-inputs { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 14px; }\n.dsh-paper-wiki-calculation-input { min-width: 0; }\n.dsh-paper-wiki-calculation-input-heading { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; font-size: 12px; }\n.dsh-paper-wiki-calculation-input-heading label { color: var(--wiki-ink); font-weight: 650; }\n.dsh-paper-wiki-calculation-input-heading code { color: var(--wiki-muted); font-size: 11px; }\n.dsh-paper-wiki-calculation-input-heading output { margin-left: auto; font-family: var(--ds-font-family-code); font-variant-numeric: tabular-nums; color: var(--wiki-accent-ink); }\n.dsh-paper-wiki-calculation-input > p { margin: 5px 0 0; color: var(--wiki-muted); font-size: 12px; line-height: 1.7; white-space: pre-line; }\n.dsh-paper-wiki-calculation-controls { display: flex; align-items: center; gap: 11px; margin-top: 9px; }\n.dsh-paper-wiki-calculation-controls input[type='range'] { width: 100%; min-width: 0; accent-color: var(--wiki-accent); cursor: pointer; }\n.dsh-paper-wiki-calculation-controls input[type='number'] { width: 82px; min-width: 0; min-height: 32px; padding: 5px 7px; border: 1px solid var(--wiki-line); border-radius: 6px; background: var(--wiki-paper); color: var(--wiki-ink); font: inherit; font-family: var(--ds-font-family-code); font-size: 12px; }\n.dsh-paper-wiki-calculation-result { display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px; margin-top: 18px; padding: 13px 16px; border-radius: 8px; background: var(--wiki-accent-fill); }\n.dsh-paper-wiki-calculation-result > span { color: var(--wiki-muted); font-size: 12px; }\n.dsh-paper-wiki-calculation-result output { color: var(--wiki-accent-ink); font-family: var(--ds-font-family-code); font-size: 25px; font-weight: 650; line-height: 1.4; overflow-wrap: anywhere; }\n.dsh-paper-wiki-calculation-result p { margin: 0; color: var(--wiki-muted); font-size: 12px; line-height: 1.7; }\n.dsh-paper-wiki-calculation-interpretation { margin: 12px 0 0; font-size: 13px; line-height: 1.8; white-space: pre-line; }\n.dsh-paper-wiki-calculation-reset { margin-top: 10px; padding: 5px 9px; border: 1px solid var(--wiki-line); border-radius: 6px; background: var(--wiki-paper); color: var(--wiki-muted); font: inherit; font-size: 12px; cursor: pointer; }\n@container dsh-paper-wiki (max-width: 440px) {\n  .dsh-paper-wiki-example-sequence { grid-template-columns: minmax(0, 1fr); }\n  .dsh-paper-wiki-evidence-state { padding: 11px; }\n}\n@media (pointer: coarse) {\n  .dsh-paper-wiki-diagram-stages button,\n  .dsh-paper-wiki-evidence-slots button { min-height: 44px; }\n}\n"
const paperExportStyles = ":root { color-scheme: light; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"PingFang SC\", \"Microsoft YaHei\", sans-serif; color: #292735; background: #f6f5f9; }\n* { box-sizing: border-box; }\nbody { margin: 0; line-height: 1.8; }\nbutton, input { font: inherit; }\nbutton { color: inherit; }\n.paper-export { max-width: 1016px; margin: 0 auto; padding: 48px clamp(18px, 5vw, 56px) 80px; }\n.pe-header { border-bottom: 1px solid #dedbe6; padding-bottom: 24px; }\n.pe-eyebrow { color: #7753a7; font-size: 13px; letter-spacing: .08em; }\nh1 { margin: 10px 0; font-size: clamp(26px, 4.5vw, 42px); line-height: 1.4; overflow-wrap: anywhere; }\n.pe-file-name { color: #746e7e; font-size: 13px; overflow-wrap: anywhere; }\n.pe-directory { display: flex; flex-wrap: wrap; gap: 8px 20px; padding: 24px 0; font-size: 14px; }\n.pe-directory a { color: #6e4c95; text-decoration-thickness: 1px; text-underline-offset: 4px; }\n.pe-chapter { min-width: 0; margin-top: 40px; scroll-margin-top: 20px; }\n.pe-chapter > h2 { display: flex; align-items: baseline; gap: 14px; margin-bottom: 24px; font-size: 25px; line-height: 1.5; }\n.pe-chapter > h2 > span { color: #a095b0; font-weight: 400; font-size: 18px; }\nh3, figcaption { margin: 0 0 14px; font-weight: 650; font-size: 20px; line-height: 1.5; }\nh4 { margin: 0 0 12px; font-size: 16px; line-height: 1.6; }\nh2, h3, h4, figcaption, dt, dd, .pe-directory a { overflow-wrap: anywhere; }\np { margin: 10px 0 16px; overflow-wrap: anywhere; }\n.pe-paragraph > p { white-space: pre-line; }\n.pe-block { margin: 28px 0; padding: clamp(18px, 3vw, 28px); border: 1px solid #e2dfeb; border-radius: 13px; background: #fff; min-width: 0; }\n.pe-references { margin: 12px 0 0; color: #85798f; font-size: 12px; }\n.pe-mode { display: inline-block; margin: 0 0 12px; padding: 2px 9px; border-radius: 5px; background: #f0eaf8; color: #70528f; font-size: 12px; }\npre { max-width: 100%; margin: 12px 0; padding: 16px; overflow-x: auto; border: 1px solid #e4e1ec; border-radius: 8px; background: #f7f6fa; white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.65; font-size: 13px; }\ncode { font-family: \"SFMono-Regular\", Consolas, \"Liberation Mono\", monospace; }\np > code, li > code, td > code { padding: 1px 4px; background: #f1eef6; border-radius: 3px; }\ndl, dd { margin: 0; }\n.pe-terms dl > div { display: grid; grid-template-columns: minmax(90px, .9fr) minmax(0, 3fr); gap: 14px; padding: 18px 0; border-top: 1px solid #ebe8f0; }\n.pe-terms dt { color: #60447e; font-weight: 650; }\n.pe-terms dd p { margin: 0 0 8px; }\n.pe-terms dd strong { font-weight: 550; }\n.pe-steps { list-style: none; padding: 0; margin: 0; }\n.pe-steps > li { padding: 20px 0 20px 16px; border-left: 3px solid #e5dfed; }\n.pe-steps > li + li { margin-top: 8px; border-top: 1px solid #eeeaf4; }\n.pe-steps button, .pe-evidence-state h4 button { padding: 0; border: 0; background: transparent; text-align: left; font-weight: 650; cursor: pointer; }\n[data-selectable][data-active=\"true\"] { border-color: #9270b3; background: #fbf9fe; }\n.pe-flow dl { display: grid; grid-template-columns: 46px 1fr; gap: 8px 12px; }\n.pe-flow dt { color: #8b7e99; }\n.pe-flow dd { overflow-wrap: anywhere; }\n.pe-table-scroll { max-width: 100%; overflow-x: auto; }\ntable { width: 100%; border-collapse: collapse; font-size: 14px; }\ncaption { text-align: left; padding-bottom: 16px; font-size: 20px; font-weight: 650; }\nth, td { min-width: 92px; padding: 12px; text-align: left; vertical-align: top; border-bottom: 1px solid #e8e3ef; overflow-wrap: anywhere; }\nth { color: #69597a; background: #f6f2fa; font-weight: 600; }\n.pe-diagram-scroll { max-width: 100%; overflow-x: auto; border: 1px solid #e6e0ee; border-radius: 9px; background: #faf8fd; }\n.pe-diagram svg { display: block; width: 100%; min-width: 650px; }\n.pe-column-label { fill: #8d7e9a; font-size: 13px; font-weight: 600; text-anchor: middle; }\n.pe-edge path { stroke: #b7a9c6; stroke-width: 1.6; fill: none; }\n.pe-edge-label text { fill: #7d7089; font-size: 10px; text-anchor: middle; paint-order: stroke; stroke: #faf8fd; stroke-width: 2px; stroke-linejoin: round; }\n.pe-edge-label-box { fill: #faf8fd; stroke: #e5dcec; stroke-width: .7; }\n.pe-edge-label-leader { fill: none; stroke: #bfb0ce; stroke-width: 1; stroke-dasharray: 2 3; }\n.pe-edge-label[data-active=\"true\"] text { fill: #6b438e; font-weight: 600; }\n.pe-edge-label[data-active=\"true\"] .pe-edge-label-box { fill: #f2eafa; stroke: #b49bc8; }\n.pe-diagram marker path { fill: #957cae; }\n.pe-edge[data-active=\"true\"] path { stroke: #7851a1; stroke-width: 3; }\n.pe-node { cursor: pointer; outline: none; }\n.pe-node rect { fill: #fff; stroke: #cfc1dc; stroke-width: 1.4; }\n.pe-node text { fill: #4a3b59; font-size: 13px; text-anchor: middle; }\n.pe-node[data-active=\"true\"] rect { fill: #eae0f4; stroke: #9c7db7; }\n.pe-node[data-selected=\"true\"] rect, .pe-node:focus-visible rect { stroke: #67418c; stroke-width: 3; }\n.pe-diagram-controls { display: flex; flex-wrap: wrap; gap: 8px; margin: 18px 0; }\n.pe-diagram-controls button { border: 1px solid #e2daea; background: #fff; padding: 5px 11px; border-radius: 6px; font-size: 13px; cursor: pointer; }\n.pe-diagram-controls button[aria-pressed=\"true\"] { color: #67448d; border-color: #bba4d1; background: #f1eaf8; }\n.pe-diagram-explanations { padding-left: 24px; }\n.pe-diagram-explanations li { padding: 8px 10px; border-radius: 6px; }\n.pe-diagram-explanations li[data-active=\"true\"] { background: #f5eefb; }\n.pe-diagram-explanations p { margin: 4px 0; }\n.pe-node-details { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 20px 0; }\n.pe-node-details > div { padding: 12px; border: 1px solid #e7e0ed; border-radius: 7px; }\n.pe-node-details > div[data-selected=\"true\"] { border-color: #9d7ab9; background: #f5eefb; }\n.pe-node-details dt { font-weight: 600; color: #675076; }\n.pe-node-details dd { margin-top: 4px; font-size: 14px; overflow-wrap: anywhere; }\n.pe-edge-details { font-size: 13px; color: #7c6b8a; padding-left: 20px; }\n.pe-evidence-states { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 16px; }\n.pe-evidence-state { padding: 16px; border: 1px solid #e3dce9; border-radius: 9px; min-width: 0; }\n.pe-evidence-count { font-size: 13px; color: #786982; }\n.pe-evidence-slots { list-style: none; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; padding: 0; }\n.pe-evidence-slot { padding: 10px; border: 1px solid #e5dfeb; border-radius: 7px; background: #f8f6fb; min-width: 0; font-size: 13px; overflow-wrap: anywhere; }\n.pe-evidence-slot p { margin: 6px 0; font-size: 12px; }\n.pe-evidence-slot small { display: block; color: #87798f; }\n.pe-evidence-slot[data-added=\"true\"] { background: #ecf7f1; border-color: #a6c8b6; }\n.pe-evidence-slot[data-added=\"true\"] > small { color: #3c8061; }\n.pe-slot-empty { color: #a096ab; border-style: dashed; }\n.pe-removed { color: #a36268; font-size: 13px; }\n.pe-coverage { list-style: none; padding: 0; font-size: 12px; }\n.pe-coverage [data-covered=\"true\"] { color: #3e7b60; }\n.pe-coverage [data-covered=\"false\"] { color: #a26766; }\n.pe-candidate-details { margin-top: 20px; color: #786b82; font-size: 13px; }\n.pe-candidate-details dl > div { padding: 8px 0; border-bottom: 1px solid #eee9f3; }\n.pe-candidate-details dt { font-weight: 600; }\n.pe-formula { padding: 12px 14px; background: #f5f1f9; border-radius: 7px; white-space: pre-wrap; }\n.pe-calculation-inputs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }\n.pe-calculation-input { display: grid; grid-template-columns: 1fr auto; gap: 6px 12px; align-items: baseline; min-width: 0; }\n.pe-calculation-input label { font-weight: 600; }\n.pe-calculation-input p { grid-column: 1 / -1; margin: 0; font-size: 13px; color: #897a95; }\n.pe-calculation-input input { grid-column: 1 / -1; width: 100%; accent-color: #8861aa; }\n.pe-fixed-value { color: #a092ac; font-size: 12px; }\n.pe-calculation-result { display: flex; flex-wrap: wrap; align-items: baseline; gap: 16px; padding-top: 22px; border-top: 1px solid #eee7f4; }\n.pe-calculation-result > output { font-size: 32px; color: #78539c; font-weight: 650; font-variant-numeric: tabular-nums; }\n.pe-calculation-result > output[data-state=\"error\"] { color: #a46869; font-size: 16px; }\n.pe-chart ol { list-style: none; padding: 0; }\n.pe-chart li { padding: 9px 0; }\n.pe-chart-label { display: flex; justify-content: space-between; align-items: baseline; gap: 14px; font-size: 14px; }\n.pe-chart-label strong { font-variant-numeric: tabular-nums; }\n.pe-chart-track { position: relative; height: 15px; margin-top: 8px; background: #f2edf7; border-radius: 4px; overflow: hidden; }\n.pe-chart-bar { position: absolute; top: 0; bottom: 0; background: #a082be; }\n.pe-chart-bar[data-negative=\"true\"] { background: #c79aa6; }\n.pe-chart-zero { position: absolute; top: 0; bottom: 0; border-left: 1px solid #6f5b80; }\n.pe-chart-axis { display: flex; justify-content: space-between; font-size: 12px; color: #8e7f9c; }\nbutton:focus-visible, a:focus-visible, input:focus-visible, [tabindex]:focus-visible { outline: 2px solid #8861aa; outline-offset: 4px; }\n@media (max-width: 560px) { .paper-export { padding-top: 28px; } .pe-terms dl > div, .pe-node-details, .pe-calculation-inputs { grid-template-columns: 1fr; } .pe-chapter > h2 { font-size: 22px; } .pe-block { margin: 20px 0; } }\n@media print { :root { background: #fff; } .paper-export { max-width: none; padding: 0; } .pe-directory { font-size: 11px; } .pe-chapter { break-before: auto; } h2, h3, h4, figcaption { break-after: avoid; } .pe-block, .pe-steps > li { box-shadow: none; } .pe-steps > li, .pe-evidence-state { break-inside: avoid; } .pe-diagram svg { min-width: 0; } .pe-diagram-scroll, .pe-table-scroll { overflow: visible; } .pe-calculation-input input { display: none; } button { border: 0; } }\n"
const paperExportBehavior = "(() => {\n  const documentRoot = document\n  let calculationRows = []\n  try { calculationRows = JSON.parse(documentRoot.getElementById('paper-export-calculations')?.textContent || '[]') }\n  catch { calculationRows = [] }\n  const calculations = new Map(Array.isArray(calculationRows) ? calculationRows.map(row => [row.id, row.block]) : [])\n  const all = (root, selector) => Array.from(root.querySelectorAll(selector))\n  const strings = value => {\n    try { const parsed = JSON.parse(value || '[]'); return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : [] }\n    catch { return [] }\n  }\n  function selectCard(button) {\n    const group = button.closest('[data-export-selection]')\n    if (!group) return\n    for (const card of all(group, '[data-selectable]')) card.dataset.active = String(card.id === button.dataset.targetId)\n    for (const control of all(group, 'button[data-export-action]')) control.setAttribute('aria-pressed', String(control === button))\n  }\n  function selectDiagramStep(button) {\n    const group = button.closest('[data-diagram]')\n    if (!group) return\n    const nodes = new Set(strings(button.dataset.activeNodes)), edges = new Set(strings(button.dataset.activeEdges))\n    for (const node of all(group, '[data-node-id]')) node.dataset.active = String(nodes.has(node.dataset.nodeId))\n    for (const edge of all(group, '[data-edge-id]')) edge.dataset.active = String(edges.has(edge.dataset.edgeId))\n    for (const label of all(group, '[data-edge-label-id]')) label.dataset.active = String(edges.has(label.dataset.edgeLabelId))\n    for (const control of all(group, 'button[data-export-action]')) control.setAttribute('aria-pressed', String(control === button))\n    for (const item of all(group, '[data-diagram-explanation]')) item.dataset.active = String(item.dataset.diagramExplanation === button.dataset.stepIndex)\n  }\n  function selectDiagramNode(node) {\n    const group = node.closest('[data-diagram]')\n    if (!group) return\n    for (const other of all(group, '[data-node-id]')) {\n      other.dataset.selected = String(other === node)\n      other.setAttribute('aria-pressed', String(other === node))\n    }\n    for (const detail of all(group, '[data-node-detail]')) detail.dataset.selected = String(detail.dataset.nodeDetail === node.dataset.nodeId)\n  }\n  function activate(target) {\n    if (target.dataset.exportAction === 'select-card') selectCard(target)\n    else if (target.dataset.exportAction === 'diagram-step') selectDiagramStep(target)\n    else if (target.dataset.exportAction === 'diagram-node') selectDiagramNode(target)\n  }\n  documentRoot.addEventListener('click', event => {\n    const target = event.target?.closest?.('[data-export-action]')\n    if (target) activate(target)\n  })\n  documentRoot.addEventListener('keydown', event => {\n    const target = event.target?.closest?.('[data-export-action]')\n    if (!target) return\n    if (target.dataset.exportAction === 'diagram-node' && ['Enter', ' '].includes(event.key)) {\n      event.preventDefault(); selectDiagramNode(target); return\n    }\n    const group = target.closest('[data-export-controls]')\n    if (!group) return\n    const controls = all(group, 'button[data-export-action]'), index = controls.indexOf(target)\n    if (index < 0) return\n    const next = { ArrowRight: (index + 1) % controls.length, ArrowDown: (index + 1) % controls.length,\n      ArrowLeft: (index + controls.length - 1) % controls.length, ArrowUp: (index + controls.length - 1) % controls.length,\n      Home: 0, End: controls.length - 1 }[event.key]\n    if (next === undefined) return\n    event.preventDefault(); activate(controls[next]); controls[next].focus()\n  })\n  documentRoot.addEventListener('input', event => {\n    const input = event.target\n    if (!input?.matches?.('input[data-calc-input]')) return\n    const group = input.closest('[data-calculation]'), block = calculations.get(group?.id)\n    if (!group || !block || block.mode !== 'illustrative') return\n    const result = group.querySelector('[data-calculation-result]'), overrides = Object.create(null)\n    for (const slider of all(group, 'input[data-calc-input]')) {\n      const value = Number(slider.value)\n      overrides[slider.dataset.calcInput] = value\n      for (const output of all(group, '[data-calc-input-value]')) if (output.dataset.calcInputValue === slider.dataset.calcInput) output.textContent = String(value)\n    }\n    try {\n      const value = evaluatePaperCalculation(block, overrides)\n      result.textContent = value.toFixed(block.precision); result.dataset.rawValue = String(value); result.dataset.state = 'ready'\n    } catch {\n      result.textContent = '当前参数无法计算。'; result.dataset.rawValue = ''; result.dataset.state = 'error'\n    }\n  })\n})()\n"
const paperGuideStyles = ":root{--bg:#f5f6fa;--panel:#fff;--ink:#1e2230;--ink2:#3d4457;--muted:#737b8f;--line:#e4e7f0;--line2:#eef0f6;--accent:#4f46e5;--accent-soft:#eef0ff;--accent-line:#c9cdfb;--green:#137a4b;--green-bg:#e6f5ed;--red:#b3271b;--red-bg:#fdecea;--amber:#9a6700;--amber-bg:#fff4d6;--blue:#1c5fa8;--blue-bg:#e8f1fb;--mono:\"SF Mono\",Menlo,Consolas,monospace;--sans:-apple-system,BlinkMacSystemFont,\"PingFang SC\",\"Microsoft YaHei\",sans-serif}\n*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:14px;line-height:1.7}button,input{font:inherit}button{cursor:pointer}button:focus-visible,a:focus-visible,summary:focus-visible,input:focus-visible{outline:2px solid var(--accent);outline-offset:3px}a{color:var(--accent);text-decoration:none}button,summary,a{-webkit-tap-highlight-color:transparent}[hidden]{display:none!important}\n.pg-hero{background:linear-gradient(180deg,#fff,#f8f9fd);border-bottom:1px solid var(--line)}.pg-hero-inner{max-width:1460px;margin:0 auto;padding:30px 32px 0}.pg-kicker{display:inline-flex;align-items:center;font-size:11px;font-weight:700;letter-spacing:.08em;color:var(--accent);background:var(--accent-soft);border:1px solid var(--accent-line);border-radius:999px;padding:4px 12px}.pg-hero h1{margin:14px 0 4px;font-size:30px;line-height:1.3;letter-spacing:-.02em;overflow-wrap:anywhere}.pg-paper-title{color:var(--muted);font-size:12px;font-family:var(--mono);margin:0 0 14px;overflow-wrap:anywhere}.pg-tldr{background:#fff;border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:8px;padding:12px 16px;margin:0 0 18px;max-width:980px;color:var(--ink2)}.pg-tldr b{color:var(--accent);margin-right:8px}.pg-nav{display:flex;flex-wrap:wrap;gap:4px;border-bottom:1px solid var(--line);margin:0 -32px;padding:0 32px}.pg-nav a{padding:10px 12px;color:var(--muted);font-size:12px;font-weight:600;border-bottom:2px solid transparent;white-space:nowrap}.pg-nav a:hover,.pg-nav a[aria-current]{color:var(--accent);border-bottom-color:var(--accent-line);background:var(--accent-soft)}\n.pg-wrap{max-width:1460px;margin:0 auto;padding:24px 32px 60px}.pg-grid{display:grid;grid-template-columns:430px minmax(0,1fr);gap:24px;align-items:start}.pg-left{position:sticky;top:16px;min-width:0}.pg-right{min-width:0}.pg-section{background:#fff;border:1px solid var(--line);border-radius:12px;padding:22px 24px;margin-bottom:18px;box-shadow:0 3px 14px rgba(30,34,48,.035);scroll-margin-top:16px}.pg-section h2{margin:0 0 12px;font-size:19px;line-height:1.45;letter-spacing:-.01em;display:flex;align-items:center;gap:10px}.pg-section h2>span{display:inline-flex;align-items:center;justify-content:center;flex:0 0 26px;height:26px;border-radius:7px;background:var(--accent-soft);color:var(--accent);font-size:12px;font-family:var(--mono);font-weight:800}.pg-section h3{font-size:14px;margin:18px 0 9px;line-height:1.5}.pg-section p{margin:8px 0}.pg-paragraph{font-size:13px;line-height:1.75;color:var(--ink2);white-space:pre-line;overflow-wrap:anywhere}.pg-ref{display:inline;color:var(--muted);font-size:10px;white-space:nowrap;margin-left:7px}.pg-block>.pg-ref{display:block;text-align:right;margin:6px 0 0}.pg-note{font-size:11px;color:var(--muted);border-left:2px solid var(--line);padding-left:10px;margin:8px 0;line-height:1.65;overflow-wrap:anywhere}.pg-block{margin:14px 0}.pg-block>h3:first-child{margin-top:0}.pg-block-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.pg-block-head h3{margin:0;min-width:0;overflow-wrap:anywhere}.pg-tag{flex:none;display:inline-block;font-size:9px;font-weight:700;padding:2px 7px;border-radius:5px;background:var(--accent-soft);color:var(--accent);border:1px solid var(--accent-line)}.pg-terms{display:grid;gap:0;margin:10px 0}.pg-term{min-width:0;padding:8px 0;border-bottom:1px solid var(--line2);font-size:12px;color:var(--ink2);overflow-wrap:anywhere}.pg-term:last-of-type{border-bottom:0}.pg-term .pg-term-definition{display:flex;flex-wrap:wrap;align-items:baseline;column-gap:9px;row-gap:1px;margin:0}.pg-term-definition strong{color:var(--accent);font-weight:700}.pg-term-definition span{flex:1 1 220px;min-width:0}.pg-term .pg-term-example{color:var(--ink2);background:#f7f8fc;padding:4px 8px;margin:5px 0 0;border-radius:4px;font-size:11px;line-height:1.6}.pg-term-detail{margin-top:4px;font-size:11px;color:var(--muted)}.pg-term-detail summary{cursor:pointer;width:fit-content}.pg-term-detail p{margin:4px 0;color:var(--ink2)}.pg-detail{font-size:12px;margin:8px 0}.pg-detail summary{cursor:pointer;color:var(--muted)}.pg-detail p{color:var(--ink2)}\n.pg-codewin{display:flex;flex-direction:column;max-height:calc(100vh - 32px);background:#172325;border:1px solid #293638;border-radius:12px;overflow:hidden;box-shadow:0 8px 26px rgba(24,37,40,.18);color:#e4efea}.pg-winbar{flex-shrink:0;display:flex;align-items:center;gap:7px;padding:10px 14px;background:#1b2b2e;border-bottom:1px solid #293638}.pg-winbar>i{width:9px;height:9px;border-radius:50%;background:#f0716a;flex:none}.pg-winbar>i:nth-child(2){background:#e2b93b}.pg-winbar>i:nth-child(3){background:#5fb987}.pg-winbar>span{font-family:var(--mono);font-size:11px;color:#9ab2ad;margin-left:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pg-steps{flex-shrink:0;display:flex;gap:6px;padding:12px 14px 0}.pg-steps button{flex:1;min-width:0;text-align:center;font-size:10.5px;font-weight:700;color:#9ab2ad;padding:6px 3px;border:1px solid #293638;border-radius:6px;background:#1b2b2e;line-height:1.5}.pg-steps button[aria-pressed=true]{background:#24403d;border-color:#68cdb6;color:#b6e8d8}.pg-tabs{flex-shrink:0;display:flex;background:#1b2b2e;border-bottom:1px solid #293638;overflow-x:auto;margin-top:10px}.pg-tabs button{flex:0 0 auto;padding:9px 12px;font-family:var(--mono);font-size:11px;color:#9ab2ad;border:0;border-right:1px solid #293638;border-bottom:2px solid transparent;background:#1b2b2e;white-space:nowrap}.pg-tabs button[aria-pressed=true]{background:#172325;color:#68cdb6;border-bottom-color:#68cdb6;font-weight:600}.pg-code{margin:0;padding:12px 0 14px;background:#172325;color:#e4efea;font-family:var(--mono);font-size:12px;line-height:1.62;overflow:auto;flex:1 1 auto;min-height:120px;max-height:min(360px,calc(100vh - 390px))}.pg-line{display:grid;grid-template-columns:3em minmax(max-content,1fr);align-items:start;width:100%;padding:2px 13px 2px 0;border:0;border-inline-start:3px solid transparent;background:transparent;text-align:left;font:inherit;line-height:inherit;white-space:pre;color:inherit}.pg-line-annotated{border-inline-start-color:#385e56}.pg-line-annotated:hover,.pg-line[aria-pressed=true]{background:#24403d;border-inline-start-color:#68cdb6}.pg-line-no{color:#9ab2ad;text-align:right;padding-right:.85em;user-select:none}.pg-source{color:#e4efea}.pg-token-key{color:#9de1ff}.pg-token-string{color:#bce3ad}.pg-token-number,.pg-token-literal{color:#ffce97}.pg-token-punctuation{color:#9ab2ad}.pg-expbox{flex-shrink:0;border-top:1px solid #293638;background:#1b2b2e;padding:12px 14px;min-height:56px}.pg-expbox p{margin:0;font-size:12px;color:#c6dad4;line-height:1.65;overflow-wrap:anywhere}.pg-code-hint{flex-shrink:0;font-size:10px;color:#9ab2ad;padding:0 14px 12px;margin:0;background:#1b2b2e}.pg-code-hint .pg-ref{color:#9ab2ad}.pg-codewin ::-webkit-scrollbar{width:8px;height:8px}.pg-codewin ::-webkit-scrollbar-thumb{background:#5b736d;border-radius:6px}.pg-codewin ::-webkit-scrollbar-track{background:#172325}.pg-case-link{display:flex;gap:8px;align-items:center;font-size:11px;color:var(--muted)}.pg-case-link button{border:1px solid var(--accent-line);border-radius:6px;background:var(--accent-soft);color:var(--accent);padding:5px 8px;font-size:12px}\n.pg-flow{display:flex;align-items:flex-start;gap:6px;margin:10px 0;overflow-x:auto;padding:3px}.pg-flow-step{flex:1;min-width:110px;border:1px solid var(--line);border-radius:8px;background:#fcfcfe;padding:9px 10px;font-size:11px}.pg-flow-step summary{cursor:pointer;font-weight:700;list-style:none;line-height:1.6}.pg-flow-step summary>span{color:var(--accent);font-family:var(--mono);margin-right:5px}.pg-flow-value{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;margin-top:5px;color:var(--accent);font:600 11px/1.6 var(--mono);white-space:pre-line;overflow-wrap:anywhere}.pg-flow-step dl{margin:8px 0 0}.pg-flow-step dt{font-size:10px;color:var(--muted);font-weight:700}.pg-flow-step dd{margin:0 0 5px;white-space:pre-line;overflow-wrap:anywhere}.pg-flow-arrow{color:var(--accent);font-weight:800;padding-top:10px}.pg-table-scroll{overflow-x:auto;border:1px solid var(--line);border-radius:9px;margin-top:10px}table{border-collapse:collapse;width:100%;font-size:11.5px;line-height:1.6}th{background:#f7f8fc;color:var(--muted);font-size:10.5px;font-weight:800;text-align:left;padding:9px 11px;border-bottom:1px solid var(--line)}td{padding:8px 11px;border-bottom:1px solid var(--line2);color:var(--ink2);vertical-align:top;min-width:60px}td:first-child{font-weight:600;color:var(--ink)}tr:last-child td{border-bottom:0}tbody tr:hover{background:#fafaff}.pg-numeric{text-align:right;font-family:var(--mono);background:rgba(79,70,229,.035)}.pg-minibar{height:3px;background:#e9ecf4;border-radius:3px;margin-top:3px;overflow:hidden;min-width:40px}.pg-minibar i{display:block;height:100%;background:var(--accent);border-radius:3px}.pg-toggle{display:inline-flex;flex-wrap:wrap;gap:0;border:1px solid var(--line);border-radius:7px;overflow:hidden;background:#fff;max-width:100%;margin:4px 0 9px}.pg-toggle button{border:0;background:#fff;padding:6px 10px;font-size:11px;color:var(--muted);font-family:var(--sans);border-right:1px solid var(--line)}.pg-toggle button[aria-pressed=true]{background:var(--accent);color:#fff;font-weight:700}.pg-toggle button:last-child{border-right:0}\n.pg-segments{display:flex;flex-direction:column;gap:6px;margin:10px 0}.pg-segment{display:grid;grid-template-columns:16px auto minmax(0,1fr);gap:5px 9px;align-items:start;border:1px solid var(--line);border-radius:8px;padding:9px 11px;background:#fff;font-size:11.5px;cursor:pointer;line-height:1.65}.pg-segment:has(input:checked){background:var(--accent-soft);border-color:var(--accent-line)}.pg-segment input{accent-color:var(--accent);margin:2px 0 0}.pg-segment strong{font-family:var(--mono);color:var(--accent);font-size:11px}.pg-segment>span{overflow-wrap:anywhere;color:var(--ink2)}.pg-segment small{grid-column:3;color:var(--muted);font-size:10px}.pg-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0 8px}.pg-stat{border:1px solid var(--line);border-radius:8px;padding:8px 10px;background:#fcfcfe}.pg-stat>span{font-size:10px;color:var(--muted);font-weight:700;display:block}.pg-stat strong{font-family:var(--mono);font-size:19px;color:var(--accent);display:block}.pg-stat small{font-size:10px;color:var(--muted)}.pg-verdict{border:1px solid #b9e3cd;border-radius:8px;padding:10px 12px;background:var(--green-bg);font-size:12px;color:var(--green)}.pg-verdict[data-status=missing]{background:var(--amber-bg);border-color:#f0dfae;color:var(--amber)}.pg-verdict[data-status=over-budget]{background:var(--red-bg);border-color:#f4c9c3;color:var(--red)}.pg-formula{font:11.5px/1.6 var(--mono);background:#f7f8fc;border:1px solid var(--line);border-radius:6px;padding:8px 10px;color:var(--ink2);overflow-wrap:anywhere;white-space:pre-wrap}.pg-calc-inputs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:10px 0}.pg-calc-input{display:grid;gap:4px;font-size:11px;min-width:0}.pg-calc-input>span{font-weight:600;color:var(--ink2)}.pg-calc-input output{float:right;font-family:var(--mono);color:var(--accent)}.pg-calc-input input{width:100%;min-width:0;accent-color:var(--accent)}.pg-calc-input small{font-size:10px;color:var(--muted)}.pg-calc-input>strong{font:14px var(--mono);color:var(--ink2)}.pg-calc-result{display:flex;align-items:baseline;gap:12px;padding:9px 12px;background:var(--accent-soft);border:1px solid var(--accent-line);border-radius:8px}.pg-calc-result>span{font-size:11px;color:var(--ink2)}.pg-calc-result>output{font:700 22px var(--mono);color:var(--accent)}.pg-calc-result>output[data-error=true]{font-size:12px;color:var(--red)}.pg-reset{border:0;background:transparent;padding:4px 0;color:var(--muted);font-size:10px;text-decoration:underline}.pg-bars{margin:12px 0}.pg-brow{display:grid;grid-template-columns:minmax(90px,150px) minmax(0,1fr) 52px;align-items:center;gap:10px;margin:7px 0;font-size:11.5px}.pg-brow>span{font-weight:600;color:var(--ink2);overflow-wrap:anywhere}.pg-btrack{height:14px;background:#f0f2f8;border-radius:4px;overflow:hidden;position:relative}.pg-btrack>i{position:absolute;height:100%;background:linear-gradient(90deg,#7c74ee,#4f46e5);border-radius:4px}.pg-btrack>i[data-negative]{background:linear-gradient(90deg,#e99a91,#b3271b)}.pg-zero{position:absolute;height:100%;width:1px;background:#b8bfd2}.pg-brow>strong{font-family:var(--mono);text-align:right;font-size:11px}\n.pg-diagram-scroll{overflow:auto;max-width:100%;max-height:520px;border:1px solid var(--line);border-radius:8px;background:#fcfcfe;padding:6px}.pg-diagram svg{display:block;max-width:none;flex:none;margin-inline:auto}.pg-diagram-scroll:focus-visible{outline:2px solid var(--accent);outline-offset:3px}.pg-column-label{fill:var(--muted);font-size:11px;font-weight:600;text-anchor:middle}.pg-edge{fill:none;stroke:#bdc4d4;stroke-width:1.5}.pg-edge[data-active=true]{stroke:var(--accent);stroke-width:2}.pg-diagram marker path{fill:#8d95a9}.pg-node{cursor:pointer}.pg-node rect{fill:#fff;stroke:var(--line)}.pg-node[data-active=true] rect{fill:var(--accent-soft);stroke:var(--accent)}.pg-node[aria-pressed=true] rect{stroke-width:2.5}.pg-node text{font:12px var(--sans);fill:var(--ink2);text-anchor:middle}.pg-diagram-explanation{white-space:pre-line;overflow-wrap:anywhere;font-size:11.5px;color:var(--ink2);background:var(--accent-soft);border-left:2px solid var(--accent-line);padding:8px 10px;border-radius:0 6px 6px 0;line-height:1.65}\n@media(max-width:1080px){.pg-grid{grid-template-columns:1fr}.pg-left{position:static}.pg-codewin{max-height:none}.pg-code{min-height:220px;max-height:380px}.pg-nav{margin:0;padding:0 0 8px;border-bottom:0}}\n@media(max-width:600px){.pg-hero-inner{padding:20px 16px 0}.pg-hero h1{font-size:23px}.pg-wrap{padding:16px 12px 36px}.pg-section{padding:17px 15px}.pg-section h2{font-size:17px}.pg-nav a{padding:8px;font-size:11px}.pg-calc-inputs{grid-template-columns:1fr}.pg-segment{grid-template-columns:16px minmax(0,1fr)}.pg-segment>span,.pg-segment small{grid-column:2}.pg-brow{grid-template-columns:90px minmax(0,1fr) 42px;gap:6px}.pg-steps{padding:10px 10px 0;gap:4px}.pg-steps button{font-size:10px}.pg-tabs button{padding:8px 9px;font-size:10px}.pg-flow{flex-direction:column;overflow:visible}.pg-flow-step{width:100%}.pg-flow-arrow{display:none}}\n@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}\n"
const paperGuideBehavior = "(function paperGuideBehavior() {\n  'use strict'\n  const dataNode = document.getElementById('paper-guide-data')\n  if (!dataNode) return\n  let data\n  try { data = JSON.parse(dataNode.textContent) } catch { return }\n  const all = selector => Array.from(document.querySelectorAll(selector))\n  const find = selector => document.querySelector(selector)\n  const list = value => Array.isArray(value) ? value : []\n  const make = (tag, className = '', text = '') => {\n    const node = document.createElement(tag)\n    if (className) node.className = className\n    node.textContent = String(text)\n    return node\n  }\n  const evidence = new Map(list(data.evidence).map(block => [block.id, block]))\n  const calculations = new Map(list(data.calculations).map(block => [block.id, block]))\n  const diagrams = new Map(list(data.diagrams).map(block => [block.id, block]))\n  const chosen = new Map(), calculationInputs = new Map()\n  let stage = 0\n  function appendSourceLine(parent, source, language) {\n    if (language !== 'json') { parent.textContent = source || ' '; return }\n    const pattern = /\"(?:\\\\.|[^\"\\\\])*\"|-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?|\\b(?:true|false|null)\\b|[{}\\[\\],:]/g\n    let end = 0\n    for (const match of source.matchAll(pattern)) {\n      if (match.index > end) parent.append(make('span', '', source.slice(end, match.index)))\n      const token = match[0]\n      const kind = token.startsWith('\"') ? (/^\\s*:/.test(source.slice(match.index + token.length)) ? 'key' : 'string')\n        : /^-?\\d/.test(token) ? 'number' : /^(true|false|null)$/.test(token) ? 'literal' : 'punctuation'\n      parent.append(make('span', 'pg-token-' + kind, token)); end = match.index + token.length\n    }\n    if (end < source.length || !source.length) parent.append(make('span', '', source.slice(end) || ' '))\n  }\n  function renderCase() {\n    const step = data.steps[stage], code = find('[data-case-code]'), explanation = find('[data-case-explanation]')\n    if (!step || !code) return\n    const scrollTop = code.scrollTop, scrollLeft = code.scrollLeft\n    const lines = step.code.split('\\n').map((source, index) => {\n      const annotated = list(step.annotations).some(annotation => annotation.line === index + 1)\n      const line = make(annotated ? 'button' : 'div', annotated ? 'pg-line pg-line-annotated' : 'pg-line')\n      if (annotated) {\n        line.setAttribute('type', 'button'); line.setAttribute('data-action', 'code-line'); line.setAttribute('data-line', String(index + 1)); line.setAttribute('aria-pressed', 'false')\n      }\n      line.append(make('span', 'pg-line-no', index + 1))\n      const text = make('span', 'pg-source'); appendSourceLine(text, source, step.language); line.append(text)\n      return line\n    })\n    code.replaceChildren(...lines)\n    code.scrollTop = scrollTop; code.scrollLeft = scrollLeft\n    if (explanation) explanation.textContent = step.explanation\n    for (const button of all('[data-action=\"case-stage\"]')) button.setAttribute('aria-pressed', String(Number(button.dataset.index) === stage))\n  }\n  function selectStage(index) {\n    if (!Number.isInteger(index) || index < 0 || index >= data.steps.length) return\n    stage = index; renderCase()\n  }\n  function selectChapter(chapterId) {\n    for (const link of all('[data-action=\"nav-chapter\"]')) {\n      if (link.dataset.chapter === chapterId) link.setAttribute('aria-current', 'location')\n      else link.removeAttribute('aria-current')\n    }\n  }\n  function selectTableGroup(id, rawIndex) {\n    if (!/^[0-3]$/.test(rawIndex ?? '')) return\n    const group = document.getElementById(id), index = Number(rawIndex), count = Number(group?.dataset.tableGroupCount)\n    if (!group || !Number.isInteger(count) || count < 2 || count > 4 || index >= count) return\n    for (const row of group.querySelectorAll('[data-table-group]')) row.hidden = Number(row.dataset.tableGroup) !== index\n    for (const button of group.querySelectorAll('[data-action=\"table-group\"]')) button.setAttribute('aria-pressed', String(Number(button.dataset.index) === index))\n  }\n  function stat(label, value, description) {\n    const node = make('div', 'pg-stat')\n    node.append(make('span', '', label), make('strong', '', value), make('small', '', description))\n    return node\n  }\n  function renderEvidence(id) {\n    const block = evidence.get(id); if (!block) return\n    const selected = chosen.get(id) || new Set(list(block.states[0]?.ids))\n    chosen.set(id, selected)\n    const selectedItems = block.items.filter(item => selected.has(item.id)), required = list(block.required)\n    const covered = new Set(selectedItems.flatMap(item => list(item.supports)).filter(relation => required.includes(relation)))\n    const missing = required.filter(relation => !covered.has(relation)), overBudget = selected.size > block.budget\n    const group = document.getElementById(id), stats = find('[data-evidence-stats=\"' + id + '\"]'), verdict = find('[data-evidence-verdict=\"' + id + '\"]')\n    if (group) for (const input of group.querySelectorAll('[data-evidence-input]')) input.checked = selected.has(input.value)\n    if (stats) stats.replaceChildren(stat('所选条目', selected.size + ' / ' + block.budget, overBudget ? '已超过预算' : '固定预算'),\n      stat('关系覆盖', covered.size + ' / ' + required.length, '按样例提供的关系计算'), stat('缺失关系', missing.length, missing.length ? missing.join('、') : '已覆盖全部所需关系'))\n    if (verdict) {\n      verdict.setAttribute('data-status', overBudget ? 'over-budget' : missing.length ? 'missing' : 'covered')\n      verdict.textContent = overBudget ? '超出预算 ' + (selected.size - block.budget) + ' 项；这组选择不满足约束。'\n        : missing.length ? '仍缺少：' + missing.join('、') + '。' : '在预算内覆盖了全部所需关系。'\n    }\n    for (const button of all('[data-action=\"evidence-preset\"]')) {\n      if (button.dataset.block !== id) continue\n      const ids = list(block.states[Number(button.dataset.index)]?.ids)\n      button.setAttribute('aria-pressed', String(ids.length === selected.size && ids.every(key => selected.has(key))))\n    }\n  }\n  function renderCalculation(id) {\n    const group = calculations.get(id); if (!group) return\n    const overrides = calculationInputs.get(id) || {}, block = group.block\n    calculationInputs.set(id, overrides)\n    const output = find('[data-calc-result=\"' + id + '\"]')\n    let result, error\n    try { result = evaluatePaperCalculation(block, overrides) }\n    catch { error = '当前参数无法计算。' }\n    if (output) { output.textContent = error || result.toFixed(block.precision); output.setAttribute('data-error', String(!!error)) }\n    for (const input of block.inputs) {\n      const value = Object.hasOwn(overrides, input.id) ? overrides[input.id] : input.value\n      const shown = find('[data-input-value=\"' + id + ':' + input.id + '\"]'); if (shown) shown.textContent = String(value)\n      const range = all('[data-calc-input=\"' + id + '\"]').find(node => node.dataset.input === input.id); if (range) range.value = String(value)\n    }\n  }\n  function renderDiagram(id, index = 0, nodeId) {\n    const block = diagrams.get(id), group = document.getElementById(id); if (!block || !group) return\n    const step = block.steps[index] || block.steps[0], activeNodes = new Set(list(step?.activeNodes)), activeEdges = new Set(list(step?.activeEdges))\n    for (const node of group.querySelectorAll('[data-action=\"diagram-node\"]')) {\n      node.setAttribute('data-active', String(activeNodes.has(node.dataset.node))); node.setAttribute('aria-pressed', String(node.dataset.node === nodeId))\n    }\n    for (const edge of group.querySelectorAll('[data-edge]')) edge.setAttribute('data-active', String(activeEdges.has(edge.dataset.edge.slice(id.length + 1))))\n    for (const button of group.querySelectorAll('[data-action=\"diagram-step\"]')) button.setAttribute('aria-pressed', String(Number(button.dataset.index) === index))\n    const explanation = find('[data-diagram-explanation=\"' + id + '\"]')\n    if (explanation) explanation.textContent = describePaperGuideDiagram(block, index, nodeId)\n    group.setAttribute('data-step', String(index))\n  }\n  document.addEventListener('click', event => {\n    const button = event.target?.closest?.('[data-action]'); if (!button) return\n    const action = button.dataset.action, id = button.dataset.block\n    if (action === 'case-stage') selectStage(Number(button.dataset.index))\n    else if (action === 'table-group') selectTableGroup(id, button.dataset.index)\n    else if (action === 'code-line') {\n      const line = Number(button.dataset.line), step = data.steps[stage]\n      const code = find('[data-case-code]'), scrollTop = code?.scrollTop, scrollLeft = code?.scrollLeft\n      for (const row of all('[data-action=\"code-line\"]')) row.setAttribute('aria-pressed', String(row === button))\n      const annotation = list(step.annotations).find(item => item.line === line), output = find('[data-case-explanation]')\n      if (output) output.textContent = annotation?.explanation || step.explanation\n      if (code) { code.scrollTop = scrollTop; code.scrollLeft = scrollLeft }\n    } else if (action === 'nav-chapter') {\n      event.preventDefault()\n      selectChapter(button.dataset.chapter)\n      document.getElementById('chapter-' + button.dataset.chapter)?.scrollIntoView({ block: 'start', behavior: 'smooth' })\n    }\n    else if (action === 'case-chapter') find('.pg-left')?.scrollIntoView({ block: 'start', behavior: 'smooth' })\n    else if (action === 'evidence-preset') {\n      const block = evidence.get(id), preset = block?.states[Number(button.dataset.index)]\n      if (preset) { chosen.set(id, new Set(preset.ids)); renderEvidence(id) }\n    } else if (action === 'calculation-reset') { calculationInputs.set(id, {}); renderCalculation(id) }\n    else if (action === 'diagram-step') renderDiagram(id, Number(button.dataset.index))\n    else if (action === 'diagram-node') renderDiagram(id, Number(document.getElementById(id)?.dataset.step || 0), button.dataset.node)\n  })\n  document.addEventListener('input', event => {\n    const input = event.target\n    if (input?.dataset?.evidenceInput) {\n      const id = input.dataset.evidenceInput, block = evidence.get(id)\n      if (!block || !block.items.some(item => item.id === input.value)) return\n      const selected = chosen.get(id) || new Set()\n      if (input.checked) selected.add(input.value); else selected.delete(input.value)\n      chosen.set(id, selected); renderEvidence(id)\n    } else if (input?.dataset?.calcInput) {\n      const id = input.dataset.calcInput, group = calculations.get(id), variable = group?.block.inputs.find(item => item.id === input.dataset.input)\n      if (!variable || group.block.mode !== 'illustrative' || !Object.hasOwn(variable, 'min')) return\n      const numeric = input.value.trim() ? Number(input.value) : NaN\n      calculationInputs.set(id, { ...(calculationInputs.get(id) || {}), [variable.id]: numeric }); renderCalculation(id)\n    }\n  })\n  document.addEventListener('keydown', event => {\n    const target = event.target?.closest?.('[data-action=\"diagram-node\"]')\n    if (target && ['Enter', ' '].includes(event.key)) {\n      event.preventDefault(); renderDiagram(target.dataset.block, Number(document.getElementById(target.dataset.block)?.dataset.step || 0), target.dataset.node)\n    }\n  })\n  renderCase()\n  for (const id of evidence.keys()) renderEvidence(id)\n  for (const id of calculations.keys()) renderCalculation(id)\n  for (const id of diagrams.keys()) renderDiagram(id)\n})()\n"
/** Shared trusted arithmetic for the reader and standalone HTML exports. No string evaluation. */
function evaluatePaperCalculation(block, overrides = {}) {
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key)
  const fail = message => { throw new Error(message) }
  const finite = (value, label, bounded = false) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || bounded && Math.abs(value) > 1e6) fail(label + '必须是有效范围内的有限数值。')
    return value
  }
  if (!record(block) || block.type !== 'calculation' || !['paper', 'illustrative'].includes(block.mode)) fail('计算示例格式或来源类型无效。')
  if (!Number.isInteger(block.precision) || block.precision < 0 || block.precision > 6) fail('计算结果精度必须为 0 至 6。')
  if (!Array.isArray(block.inputs) || block.inputs.length < 2 || block.inputs.length > 10) fail('计算示例需要 2 至 10 个参数。')
  if (!record(overrides)) fail('计算参数修改格式无效。')
  const inputs = new Map()
  for (const input of block.inputs) {
    if (!record(input) || typeof input.id !== 'string' || !/^[A-Za-z0-9_-]{1,40}$/.test(input.id) || inputs.has(input.id)) fail('计算参数编号无效或重复。')
    finite(input.value, '参数初始值', true)
    const rangeKeys = ['min', 'max', 'step'].filter(key => own(input, key))
    if (rangeKeys.length && (block.mode !== 'illustrative' || rangeKeys.length !== 3)) fail('仅构造示例可设置完整的 min、max、step 参数范围。')
    if (rangeKeys.length) {
      finite(input.min, '参数最小值', true)
      finite(input.max, '参数最大值', true)
      finite(input.step, '参数步长', true)
      if (input.min >= input.max || input.step <= 0 || input.step > input.max - input.min
        || input.value < input.min || input.value > input.max) fail('参数范围、步长或初始值无效。')
    }
    inputs.set(input.id, input)
  }
  for (const id of Object.keys(overrides)) {
    const input = inputs.get(id)
    if (!input) fail('修改包含未知计算参数。')
    if (block.mode !== 'illustrative' || !own(input, 'min')) fail('此参数为固定值，不能修改。')
    finite(overrides[id], '修改后的参数值', true)
    if (overrides[id] < input.min || overrides[id] > input.max) fail('修改后的参数值超出允许范围。')
  }
  let nodes = 0
  function calculate(node, depth) {
    if (++nodes > 64) fail('计算表达式超过 64 个节点。')
    if (depth > 6) fail('计算表达式超过 6 层。')
    if (!record(node)) fail('计算表达式节点格式无效。')
    const keys = Object.keys(node)
    if (own(node, 'input')) {
      if (keys.length !== 1 || typeof node.input !== 'string' || !inputs.has(node.input)) fail('表达式包含未知或不明确的参数引用。')
      return own(overrides, node.input) ? overrides[node.input] : inputs.get(node.input).value
    }
    if (own(node, 'number')) {
      if (keys.length !== 1) fail('计算常量节点格式无效。')
      return finite(node.number, '计算常量')
    }
    if (keys.length !== 2 || !own(node, 'op') || !own(node, 'args') || !['add', 'subtract', 'multiply', 'divide'].includes(node.op)) fail('计算只支持加、减、乘、除运算。')
    const binary = node.op === 'subtract' || node.op === 'divide'
    if (!Array.isArray(node.args) || node.args.length < 2 || node.args.length > (binary ? 2 : 8)) fail('计算运算的参数数量无效。')
    const values = []
    for (const argument of node.args) values.push(calculate(argument, depth + 1))
    let result
    if (node.op === 'add') result = values.reduce((sum, value) => sum + value, 0)
    else if (node.op === 'subtract') result = values[0] - values[1]
    else if (node.op === 'multiply') result = values.reduce((product, value) => product * value, 1)
    else {
      if (values[1] === 0) fail('分母不能为零。')
      result = values[0] / values[1]
    }
    return finite(result, '计算结果')
  }
  return calculate(block.expression, 1)
}

function createPaperGenerationProgress(React, primitives) {
  const { createElement: h, useEffect, useId, useState } = React
  const { Button, IconCheckOutlineRegular } = primitives
  const terminal = new Set(['completed', 'failed', 'cancelled'])
  const stages = [
    { phase: 'reading', label: '读取论文', status: '正在读取论文', detail: '读取论文文本。' },
    { phase: 'writing', label: '撰写讲解', status: '正在撰写讲解', detail: '组织章节与论文引用。' },
    { phase: 'reviewing', label: '核对内容', status: '正在核对内容', detail: '核对内容与引用。' },
    { phase: 'saving', label: '保存讲解', status: '正在保存讲解', detail: '保存讲解。' },
  ]

  function durationLabel(milliseconds) {
    const seconds = Math.floor(Math.max(0, Number(milliseconds) || 0) / 1000)
    const minutes = Math.floor(seconds / 60)
    return (minutes ? `${minutes} 分 ` : '') + `${seconds % 60} 秒`
  }

  function GenerationClock({ elapsedMs, receivedAt }) {
    const [now, setNow] = useState(() => Date.now())
    useEffect(() => {
      const timer = setInterval(() => setNow(Date.now()), 250)
      return () => clearInterval(timer)
    }, [])
    const elapsed = Math.max(0, Number(elapsedMs) || 0)
    const seconds = Math.floor((elapsed + (Number.isFinite(receivedAt) ? Math.max(0, now - receivedAt) : 0)) / 1000)
    const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
    return h('div', { className: 'dsh-paper-wiki-clock' },
      h('span', null, '已耗时'),
      h('time', { role: 'timer', 'aria-label': '生成耗时', dateTime: `PT${seconds}S` },
        minutes + ':' + String(seconds % 60).padStart(2, '0')))
  }

  return function GenerationProgress({ generation, offline, store }) {
    const titleId = useId()
    if (generation.phase === 'completed') return null
    const index = stages.findIndex(stage => stage.phase === generation.phase)
    const stage = stages[index]
    const title = generation.title || generation.fileName || '论文'
    if (terminal.has(generation.phase)) {
      const failed = generation.phase === 'failed'
      const state = store.getSnapshot?.()
      const busy = Boolean(state?.generating || state?.importing || state?.preparing
        || state?.generation && !terminal.has(state.generation.phase))
      return h('div', { className: 'dsh-paper-wiki-generation-done', 'data-state': generation.phase },
        h('p', { role: failed ? 'alert' : 'status' },
          failed ? generation.error || '本次讲解未完成。' : '已取消讲解',
          h('span', null, title + ' · 用时 ' + durationLabel(generation.elapsedMs))),
        generation.paperId && h(Button, { size: 'sm', variant: 'outline', disabled: busy,
          onClick: () => void store.generate(generation.paperId) }, '重新尝试'))
    }

    return h('section', { className: 'dsh-paper-wiki-generation', 'aria-labelledby': titleId },
      h('div', { className: 'dsh-paper-wiki-generation-header' },
        h('div', null,
          h('p', { className: 'dsh-paper-wiki-generation-repo' }, title),
          h('h2', { id: titleId, role: 'status' }, stage?.status ?? '正在提交任务')),
        h(GenerationClock, { elapsedMs: generation.elapsedMs, receivedAt: generation.receivedAt })),
      h('div', { className: 'dsh-paper-wiki-progressbar', role: 'progressbar', 'aria-labelledby': titleId }),
      h('ol', { className: 'dsh-paper-wiki-generation-stages', 'aria-label': '生成阶段' },
        stages.map(({ phase, label }, i) => h('li', {
          key: phase,
          'data-state': i < index ? 'done' : i === index ? 'active' : 'waiting',
          'aria-current': i === index ? 'step' : undefined,
        },
        h('span', { className: 'dsh-paper-wiki-stage-marker', 'aria-hidden': true },
          i < index && h(IconCheckOutlineRegular, { size: 13 })),
        label))),
      offline && h('p', { className: 'dsh-paper-wiki-generation-detail' }, '正在重新连接，稍后会同步进度。'),
      h('div', { className: 'dsh-paper-wiki-generation-actions' },
        h(Button, { size: 'sm', variant: 'outline', onClick: () => void store.cancelGeneration() }, '取消讲解')))
  }
}


function createPaperContentRenderer(React, primitives) {
  const { createElement: h, useId, useState } = React
  const { MarkdownText } = primitives

  function References({ references, className = '' }) {
    const pages = [...new Set((references || []).map(ref => ref?.page).filter(page => Number.isInteger(page) && page > 0))]
    return pages.length ? h('span', { className: 'dsh-paper-wiki-content-references ' + className },
      '（第 ' + pages.join('、') + ' 页）') : null
  }

  function compactJsonWhitespace(value) {
    let result = '', quoted = false, escaped = false
    for (const character of value) {
      if (quoted) {
        result += character
        if (escaped) escaped = false
        else if (character === '\\') escaped = true
        else if (character === '"') quoted = false
      } else if (character === '"') {
        quoted = true
        result += character
      } else if (![' ', '\t', '\r', '\n'].includes(character)) result += character
    }
    return result
  }

  function fencedCode(code, language) {
    if (language === 'json') {
      try {
        const parsed = JSON.parse(code)
        if (compactJsonWhitespace(code) === compactJsonWhitespace(JSON.stringify(parsed))) code = JSON.stringify(parsed, null, 2)
      } catch { /* Preserve readable legacy examples. */ }
    }
    const runs = String(code).match(/`+/g) || []
    const fence = '`'.repeat(Math.max(3, ...runs.map(run => run.length + 1)))
    const tag = ['json', 'python', 'text'].includes(language) ? language : 'text'
    return fence + tag + '\n' + code + '\n' + fence
  }

  function ModeLabel({ mode, calculation = false }) {
    return h('span', { className: 'dsh-paper-wiki-example-mode' }, calculation
      ? mode === 'illustrative' ? '构造计算（非实测）' : '基于论文数值'
      : mode === 'illustrative' ? '构造示例' : '论文实例')
  }

  function ExampleBlock({ block, labels }) {
    const prefix = useId()
    return h('section', { className: 'dsh-paper-wiki-content-block dsh-paper-wiki-example', 'aria-labelledby': prefix + '-title' },
      h('div', { className: 'dsh-paper-wiki-content-heading' }, h('h3', { id: prefix + '-title' }, block.title), h(ModeLabel, { mode: block.mode })),
      h('ol', { className: 'dsh-paper-wiki-example-sequence', 'aria-label': block.title + '：完整示例' }, block.steps.map((step, index) =>
        h('li', { key: index, className: 'dsh-paper-wiki-example-step' }, h('h4', null,
          h('span', { className: 'dsh-paper-wiki-sequence-number' }, String(index + 1)), step.label),
          h('div', { className: 'dsh-paper-wiki-example-code', role: 'region', tabIndex: 0, 'aria-label': step.label + '：代码' },
            h(MarkdownText, { text: fencedCode(step.code, step.language), labels, omitHtml: true })),
          h('p', { className: 'dsh-paper-wiki-example-explanation' }, step.explanation)))),
      h(References, { references: block.references }))
  }

  function FlowBlock({ block }) {
    const prefix = useId()
    return h('section', { className: 'dsh-paper-wiki-content-block dsh-paper-wiki-method-flow', 'aria-labelledby': prefix + '-title' },
      h('h3', { id: prefix + '-title', className: 'dsh-paper-wiki-content-title' }, block.title),
      h('ol', { className: 'dsh-paper-wiki-flow-sequence', 'aria-label': block.title + '：全部方法步骤' }, block.steps.map((step, index) =>
        h('li', { key: index, className: 'dsh-paper-wiki-flow-step' }, h('h4', null,
          h('span', { className: 'dsh-paper-wiki-sequence-number' }, String(index + 1)), step.title),
          h('dl', null, [['输入', step.input], ['处理', step.operation], ['输出', step.output]].flatMap(([label, text]) => [
            h('dt', { key: label + '-label' }, label), h('dd', { key: label + '-text' }, text),
          ]))))),
      h(References, { references: block.references }))
  }

  function TermsBlock({ block }) {
    const prefix = useId()
    return h('section', { className: 'dsh-paper-wiki-content-block dsh-paper-wiki-terms', 'aria-labelledby': prefix + '-title' },
      h('h3', { className: 'dsh-paper-wiki-content-title', id: prefix + '-title' }, block.title),
      h('dl', { className: 'dsh-paper-wiki-term-list' }, block.items.map((item, index) => h('div', { key: index, className: 'dsh-paper-wiki-term' },
        h('dt', null, item.term), h('dd', { className: 'dsh-paper-wiki-term-meaning' }, item.meaning),
        h('dd', { className: 'dsh-paper-wiki-term-example' }, h('span', null, '具体例子'), item.example),
        h('dd', { className: 'dsh-paper-wiki-term-role' }, h('span', null, '在这里的作用'), item.role),
        item.contrast && h('dd', { className: 'dsh-paper-wiki-term-contrast' }, item.contrast)))),
      h(References, { references: block.references }))
  }

  function DiagramBlock({ block }) {
    const [selectedStep, selectStep] = useState(0), [selectedNode, selectNode] = useState(null)
    const prefix = useId().replace(/[^a-zA-Z0-9_-]/g, '-')
    const stepIndex = Math.min(selectedStep, block.steps.length - 1), step = block.steps[stepIndex]
    const activeNodes = new Set(step.activeNodes), activeEdges = new Set(step.activeEdges)
    const nodeWidth = 190, nodeHeight = 74, stride = 280
    const positions = new Map(), rowCounts = []
    block.columns.forEach((column, columnIndex) => {
      const nodes = block.nodes.filter(node => node.column === column.id)
      rowCounts.push(nodes.length)
      nodes.forEach((node, row) => positions.set(node.id, { ...node, x: 24 + columnIndex * stride, y: 62 + row * 122, columnIndex }))
    })
    const width = Math.max(400, block.columns.length * stride + 36), height = Math.max(212, Math.max(...rowCounts) * 122 + 74)
    const detail = positions.get(selectedNode)
    const markerId = prefix + '-arrow', activeMarkerId = prefix + '-arrow-active'
    const labelBoxes = []
    function shortLabel(value, boxWidth) {
      const characters = Array.from(value.replace(/\s+/g, ' ').trim())
      const maximum = Math.max(4, Math.min(12, Math.floor((boxWidth - 10) / 6.6)))
      const units = character => /^[\x20-\x7e]$/.test(character) ? 1 : 2
      const lines = []
      let position = 0
      for (let line = 0; line < 2 && position < characters.length; line++) {
        while (characters[position] === ' ') position++
        const text = []
        let size = 0
        while (position < characters.length && size + units(characters[position]) <= maximum) {
          size += units(characters[position]); text.push(characters[position++])
        }
        if (line === 1 && position < characters.length) {
          while (text.length && size + 2 > maximum) size -= units(text.pop())
          text.push('…')
        }
        lines.push(text.join('').trim())
      }
      return lines.length ? lines : ['']
    }
    function labelFor(edge, index) {
      const from = positions.get(edge.from), to = positions.get(edge.to)
      const sameColumn = from.columnIndex === to.columnIndex
      const direction = from.columnIndex < to.columnIndex ? 1 : -1
      const gap = stride - nodeWidth
      const gapLeft = sameColumn || direction > 0 ? from.x + nodeWidth : from.x - gap
      const boxWidth = Math.min(76, gap - 12), lines = shortLabel(edge.label, boxWidth)
      const boxHeight = lines.length * 14 + 8
      const middleY = (from.y + to.y + nodeHeight) / 2
      const preferred = middleY - (sameColumn ? 0 : direction * (boxHeight / 2 + 12 + index % 2 * 4))
      const x = gapLeft + (gap - boxWidth) / 2
      const candidates = [0, 1, -1, 2, -2, 3, -3].map(offset =>
        Math.max(8, Math.min(height - boxHeight - 8, preferred - boxHeight / 2 + offset * (boxHeight + 7))))
      const overlaps = (y, box) => x < box.x + box.width + 4 && x + boxWidth + 4 > box.x
        && y < box.y + box.height + 4 && y + boxHeight + 4 > box.y
      const y = candidates.find(candidate => labelBoxes.every(box => !overlaps(candidate, box))) ?? candidates[0]
      const box = { x, y, width: boxWidth, height: boxHeight, lines }
      labelBoxes.push(box)
      return box
    }
    function pathFor(edge, index) {
      const from = positions.get(edge.from), to = positions.get(edge.to)
      const sy = from.y + nodeHeight / 2, ey = to.y + nodeHeight / 2
      if (from.columnIndex === to.columnIndex) {
        const sx = from.x + nodeWidth, ex = to.x + nodeWidth, outside = sx + 34 + index % 3 * 13
        return { d: `M${sx},${sy} C${outside},${sy} ${outside},${ey} ${ex},${ey}`, x: outside - 2, y: (sy + ey) / 2 - 5, anchor: 'end' }
      }
      const direction = from.x < to.x ? 1 : -1
      const sx = from.x + (direction > 0 ? nodeWidth : 0), ex = to.x + (direction > 0 ? 0 : nodeWidth)
      const bend = direction * (18 + index % 3 * 12)
      const middle = (sx + ex) / 2
      return { d: `M${sx},${sy} C${middle},${sy - bend} ${middle},${ey - bend} ${ex},${ey}`,
        x: middle, y: (sy + ey) / 2 - bend * .75 - 7, anchor: 'middle' }
    }
    const edgeViews = block.edges.map((edge, index) => ({ edge, path: pathFor(edge, index),
      label: labelFor(edge, index), active: activeEdges.has(edge.id) }))
    return h('section', { className: 'dsh-paper-wiki-content-block dsh-paper-wiki-diagram', 'aria-labelledby': prefix + '-title' },
      h('div', { className: 'dsh-paper-wiki-content-heading' }, h('h3', { id: prefix + '-title' }, block.title), h(ModeLabel, { mode: block.mode })),
      h('p', { className: 'dsh-paper-wiki-diagram-description' }, block.description),
      h('div', { className: 'dsh-paper-wiki-diagram-stages', role: 'group', 'aria-label': block.title + '：图解步骤' },
        block.steps.map((item, index) => h('button', { type: 'button', key: index, 'aria-pressed': index === stepIndex,
          onClick: () => { selectStep(index); selectNode(null) } }, item.label))),
      h('div', { className: 'dsh-paper-wiki-diagram-scroll', role: 'region', tabIndex: 0, 'aria-label': block.title + '：关系图' },
        h('div', { className: 'dsh-paper-wiki-diagram-canvas', style: { width, height } },
          h('svg', { width, height, viewBox: `0 0 ${width} ${height}`, className: 'dsh-paper-wiki-diagram-wires', 'aria-hidden': true },
            h('defs', null, [[markerId, 'var(--wiki-muted)'], [activeMarkerId, 'var(--wiki-accent-ink)']].map(([id, color]) =>
              h('marker', { key: id, id, markerWidth: 7, markerHeight: 7, refX: 6, refY: 3.5, orient: 'auto', viewBox: '0 0 7 7' },
                h('path', { d: 'M0 0L7 3.5L0 7Z', fill: color })))),
            edgeViews.map(({ edge, path, active }) => h('g', { key: edge.id, className: 'dsh-paper-wiki-diagram-edge', 'data-active': active || undefined },
                h('title', null, edge.label),
                h('path', { d: path.d, fill: 'none', stroke: 'currentColor', strokeWidth: active ? 2.5 : 1.5,
                  markerEnd: `url(#${active ? activeMarkerId : markerId})` }))),
            edgeViews.map(({ edge, label, active }) => h('g', { key: edge.id + '-label',
                className: 'dsh-paper-wiki-diagram-edge dsh-paper-wiki-diagram-label-group', 'data-active': active || undefined },
                h('title', null, edge.label),
                h('rect', { className: 'dsh-paper-wiki-diagram-edge-label-bg', x: label.x, y: label.y,
                  width: label.width, height: label.height, rx: 4 }),
                h('text', { className: 'dsh-paper-wiki-diagram-edge-label', textAnchor: 'middle' }, label.lines.map((line, lineIndex) =>
                  h('tspan', { key: lineIndex, x: label.x + label.width / 2, y: label.y + 14 + lineIndex * 14 }, line)))))),
          block.columns.map((column, index) => h('div', { key: column.id, className: 'dsh-paper-wiki-diagram-column', style: { left: 24 + index * stride, width: nodeWidth } }, column.label)),
          [...positions.values()].map(node => h('button', { type: 'button', key: node.id, className: 'dsh-paper-wiki-diagram-node',
            style: { left: node.x, top: node.y, width: nodeWidth, height: nodeHeight },
            'data-active': activeNodes.has(node.id) || undefined, 'aria-pressed': selectedNode === node.id,
            'aria-controls': prefix + '-detail', onClick: () => selectNode(node.id), title: node.label }, node.label)))),
      h('div', { className: 'dsh-paper-wiki-diagram-detail', id: prefix + '-detail', 'aria-live': 'polite' },
        detail && h('h4', null, detail.label), h('p', null, detail ? detail.detail : step.explanation)),
      h('ul', { className: 'dsh-paper-wiki-diagram-relations', 'aria-label': '图中关系' }, block.edges.map(edge =>
        h('li', { key: edge.id, 'data-active': activeEdges.has(edge.id) || undefined },
          positions.get(edge.from).label, ' → ', positions.get(edge.to).label, '：', edge.label))),
      h(References, { references: block.references }))
  }

  function EvidenceBlock({ block }) {
    const [selection, select] = useState(null)
    const prefix = useId(), items = new Map(block.items.map(item => [item.id, item]))
    const selected = selection && items.get(selection.id)
    return h('section', { className: 'dsh-paper-wiki-content-block dsh-paper-wiki-evidence', 'aria-labelledby': prefix + '-title' },
      h('div', { className: 'dsh-paper-wiki-content-heading' }, h('h3', { id: prefix + '-title' }, block.title), h(ModeLabel, { mode: block.mode })),
      h('p', { className: 'dsh-paper-wiki-evidence-question' }, block.question),
      h('p', { className: 'dsh-paper-wiki-evidence-budget' }, '阅读预算：' + block.budget + ' 段'),
      h('div', { className: 'dsh-paper-wiki-evidence-states' }, block.states.map((state, index) => {
        const previous = index > 0 ? block.states[index - 1].ids : [], current = new Set(state.ids)
        const added = new Set(index > 0 ? state.ids.filter(id => !previous.includes(id)) : [])
        const removed = previous.filter(id => !current.has(id))
        const covered = new Set(state.ids.flatMap(id => items.get(id).supports))
        return h('section', { className: 'dsh-paper-wiki-evidence-state', key: index, 'aria-labelledby': prefix + '-state-' + index },
          h('h4', { id: prefix + '-state-' + index }, state.label),
          h('ol', { className: 'dsh-paper-wiki-evidence-slots', 'aria-label': state.label + '：阅读段落' },
            Array.from({ length: block.budget }, (_, slot) => {
              const id = state.ids[slot], item = items.get(id), active = selection?.state === index && selection.id === id
              return h('li', { key: slot, 'data-added': added.has(id) || undefined }, h('span', { className: 'dsh-paper-wiki-evidence-position' }, String(slot + 1)),
                item ? h('button', { type: 'button', 'aria-expanded': active, 'aria-controls': prefix + '-item-detail',
                  onClick: () => select(active ? null : { state: index, id }) }, h('span', null, item.label),
                  added.has(id) && h('span', { className: 'dsh-paper-wiki-evidence-added' }, '新增'))
                  : h('span', { className: 'dsh-paper-wiki-evidence-empty' }, '空位'))
            })),
          removed.length > 0 && h('p', { className: 'dsh-paper-wiki-evidence-removed' }, '移除：' + removed.map(id => items.get(id).label).join('、')),
          h('p', { className: 'dsh-paper-wiki-evidence-coverage' }, '已提供关系：' + block.required.filter(need => covered.has(need)).length + ' / ' + block.required.length),
          h('ul', { className: 'dsh-paper-wiki-evidence-requirements' }, block.required.map(need =>
            h('li', { key: need, 'data-covered': covered.has(need) || undefined }, covered.has(need) ? '已具备：' : '尚缺：', need))),
          h('p', { className: 'dsh-paper-wiki-evidence-explanation' }, state.explanation))
      })),
      h('div', { className: 'dsh-paper-wiki-evidence-detail', id: prefix + '-item-detail', 'aria-live': 'polite', hidden: !selected },
        selected && h('h4', null, selected.label), selected && h('p', null, selected.detail)),
      h(References, { references: block.references }))
  }

  function CalculationBlock({ block }) {
    const [overrides, change] = useState({})
    const prefix = useId(), illustrative = block.mode === 'illustrative'
    let result, error = '', changed = false
    const numbers = Object.create(null)
    for (const input of block.inputs) if (Object.hasOwn(overrides, input.id)) {
      const raw = overrides[input.id], value = typeof raw === 'string' && !raw.trim() ? NaN : Number(raw)
      changed ||= value !== input.value
      if (!Number.isFinite(value)) error = '请输入有效数字。'
      else if (value < input.min || value > input.max) error = '输入数值超出允许范围。'
      else numbers[input.id] = value
    }
    if (!error) {
      try { result = evaluatePaperCalculation(block, numbers); if (!Number.isFinite(result)) error = '当前输入无法得到有限结果。' }
      catch { error = '当前输入无法完成计算，请调整数值。' }
    }
    return h('section', { className: 'dsh-paper-wiki-content-block dsh-paper-wiki-calculation', 'aria-labelledby': prefix + '-title' },
      h('div', { className: 'dsh-paper-wiki-content-heading' }, h('h3', { id: prefix + '-title' }, block.title), h(ModeLabel, { mode: block.mode, calculation: true })),
      h('p', { className: 'dsh-paper-wiki-calculation-formula' }, block.formula),
      h('div', { className: 'dsh-paper-wiki-calculation-inputs' }, block.inputs.map(input => {
        const editable = illustrative && Number.isFinite(input.min) && Number.isFinite(input.max) && input.min < input.max
        const raw = Object.hasOwn(overrides, input.id) ? overrides[input.id] : input.value
        const numeric = Number(raw)
        const quotient = (numeric - input.min) / input.step
        const domStep = Number.isFinite(quotient)
          && Math.abs(quotient - Math.round(quotient)) > 1e-8 * Math.max(1, Math.abs(quotient))
          ? 'any' : input.step || 'any'
        return h('div', { className: 'dsh-paper-wiki-calculation-input', key: input.id },
          h('div', { className: 'dsh-paper-wiki-calculation-input-heading' }, h('label', { htmlFor: editable ? prefix + '-' + input.id : undefined }, input.label),
            h('code', null, input.id), !editable && h('output', null, String(input.value))),
          h('p', null, input.meaning),
          editable && h('div', { className: 'dsh-paper-wiki-calculation-controls' },
            h('input', { type: 'range', min: input.min, max: input.max, step: domStep,
              value: Number.isFinite(numeric) ? Math.max(input.min, Math.min(input.max, numeric)) : input.value,
              'aria-label': input.label + '：调节数值', onChange: event => change(previous => ({ ...previous, [input.id]: event.target.value })) }),
            h('input', { id: prefix + '-' + input.id, type: 'number', min: input.min, max: input.max, step: domStep, value: raw,
              onChange: event => change(previous => ({ ...previous, [input.id]: event.target.value })) })))
      })),
      h('div', { className: 'dsh-paper-wiki-calculation-result', 'aria-live': 'polite' }, h('span', null, block.resultLabel),
        error ? h('p', { role: 'status' }, error) : h('output', null, result.toFixed(block.precision))),
      h('p', { className: 'dsh-paper-wiki-calculation-interpretation' }, illustrative ? '初始值说明：' : '', block.interpretation),
      illustrative && changed && h('button', { type: 'button', className: 'dsh-paper-wiki-calculation-reset', onClick: () => change({}) }, '恢复初始值'),
      h(References, { references: block.references }))
  }

  function TableBlock({ block }) {
    const captionId = useId()
    return h('section', { className: 'dsh-paper-wiki-content-block dsh-paper-wiki-content-table' },
      h('div', { className: 'dsh-paper-wiki-table-scroll', role: 'region', 'aria-labelledby': captionId, tabIndex: 0 },
        h('table', null,
          h('caption', { id: captionId }, block.title),
          h('thead', null, h('tr', null, block.columns.map((column, i) => h('th', { key: i, scope: 'col' }, column)))),
          h('tbody', null, block.rows.map((row, i) => h('tr', { key: i }, row.map((cell, j) => h('td', { key: j }, cell))))))),
      h(References, { references: block.references }))
  }

  function ChartBlock({ block }) {
    const prefix = useId()
    const magnitude = Math.max(...block.data.map(datum => Math.abs(datum.value))) || 1
    const minimum = Math.min(0, ...block.data.map(datum => datum.value))
    const maximum = Math.max(0, ...block.data.map(datum => datum.value))
    const low = minimum / magnitude, high = maximum / magnitude
    const range = high - low || 1
    const zero = Math.max(0, -low / range * 100)
    const zeroScale = minimum === 0 && maximum === 0
    return h('figure', { className: 'dsh-paper-wiki-content-block dsh-paper-wiki-content-chart',
      'aria-labelledby': prefix + '-title', 'aria-describedby': prefix + '-context' },
      h('figcaption', { id: prefix + '-title', className: 'dsh-paper-wiki-content-title' }, block.title),
      h('p', { id: prefix + '-context', className: 'dsh-paper-wiki-chart-context' }, block.context),
      h('p', { className: 'dsh-paper-wiki-chart-metric' }, block.metric + (block.unit ? '（' + block.unit + '）' : ''),
        ' · ' + (block.direction === 'lower' ? '越低越好' : '越高越好')),
      h('ol', { className: 'dsh-paper-wiki-chart-data', 'aria-label': block.metric + '比较' }, block.data.map((datum, i) => {
        const value = datum.value / magnitude
        const left = Math.max(0, (Math.min(value, 0) - low) / range * 100)
        const width = Math.max(0, Math.abs(value) / range * 100)
        return h('li', { key: i },
          h('div', { className: 'dsh-paper-wiki-chart-row-heading' }, h('span', null, datum.label),
            h('span', { className: 'dsh-paper-wiki-chart-value' }, datum.display, h(References, { references: [datum.reference] }))),
          h('div', { className: 'dsh-paper-wiki-chart-track', 'aria-hidden': true },
            h('span', { className: 'dsh-paper-wiki-chart-fill', 'data-negative': datum.value < 0 || undefined,
              style: { left: left + '%', width: width + '%' } }),
            h('span', { className: 'dsh-paper-wiki-chart-zero', style: { left: zero + '%' } })))
      })),
      h('div', { className: 'dsh-paper-wiki-chart-axis', 'aria-hidden': true }, h('span', null, String(minimum)),
        !zeroScale && h('span', null, String(maximum))),
      h(References, { references: block.references }))
  }

  return function PaperContent({ chapter, labels }) {
    if (!Array.isArray(chapter?.blocks)) return null
    return h(React.Fragment, null, chapter.blocks.map((block, index) => {
      const key = (chapter.id || 'chapter') + '-' + index
      if (block.type === 'paragraph') return h('p', { className: 'dsh-paper-wiki-content-paragraph', key },
        block.text, h(References, { references: block.references }))
      if (block.type === 'example') return h(ExampleBlock, { key, block, labels })
      if (block.type === 'flow') return h(FlowBlock, { key, block })
      if (block.type === 'table') return h(TableBlock, { key, block })
      if (block.type === 'chart') return h(ChartBlock, { key, block })
      if (block.type === 'terms') return h(TermsBlock, { key, block })
      if (block.type === 'diagram') return h(DiagramBlock, { key, block })
      if (block.type === 'evidence') return h(EvidenceBlock, { key, block })
      if (block.type === 'calculation') return h(CalculationBlock, { key, block })
      return null
    }))
  }
}


const guideList = value => Array.isArray(value) ? value : []
const guideText = value => typeof value === 'string' ? value : ''
const guideEscape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const guideJson = value => JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))
const guidePageNote = refs => {
  const pages = [...new Set(guideList(refs).map(ref => ref?.page).filter(page => Number.isInteger(page) && page > 0 && page <= 150))]
  return pages.length ? '<span class="pg-ref">第 ' + pages.join('、') + ' 页</span>' : ''
}
const guideMode = mode => mode === 'illustrative' ? '构造示例' : '论文实例'
const guideButton = (label, action, attrs = '') => '<button type="button" data-action="' + action + '" ' + attrs + '>' + guideEscape(label) + '</button>'
const guideShort = (value, length = 21) => [...guideText(value)].slice(0, length).join('') + ([...guideText(value)].length > length ? '…' : '')

function guideLabelLines(value, width = 146, fontSize = 12, maximum = 3) {
  const glyphWidth = character => /\s/u.test(character) ? fontSize * .34
    : /[ilI1|.,:;'!]/u.test(character) ? fontSize * .32
      : /[MW@#%&]/u.test(character) || character.codePointAt(0) > 0x2ff ? fontSize : fontSize * .62
  let remaining = [...guideText(value).replace(/\s+/gu, ' ').trim()]
  const lines = []
  while (remaining.length && lines.length < maximum) {
    if (remaining.reduce((sum, character) => sum + glyphWidth(character), 0) <= width) {
      lines.push(remaining.join('')); remaining = []; break
    }
    let end = 0, used = 0
    const budget = lines.length === maximum - 1 ? width - glyphWidth('…') : width
    while (end < remaining.length && used + glyphWidth(remaining[end]) <= budget) used += glyphWidth(remaining[end++])
    if (!end) end = 1
    if (end < remaining.length && lines.length < maximum - 1) {
      let boundary = end
      while (boundary > 0 && remaining[boundary] !== ' ') boundary--
      if (boundary > 0) end = boundary
    }
    lines.push(remaining.slice(0, end).join('').trimEnd())
    remaining = remaining.slice(end)
    while (remaining[0] === ' ') remaining.shift()
  }
  if (remaining.length) lines[lines.length - 1] += '…'
  return lines.length ? lines : ['']
}

/** One visible description for the current graph state, shared by HTML and offline interaction. */
function describePaperGuideDiagram(diagram, index = 0, nodeId) {
  const list = value => Array.isArray(value) ? value : []
  const nodes = list(diagram.nodes), step = list(diagram.steps)[index] || list(diagram.steps)[0] || {}
  const selected = nodes.find(node => node.id === nodeId), names = new Map(nodes.map(node => [node.id, node.label]))
  const active = new Set(list(step.activeEdges))
  const relations = list(diagram.edges).filter(edge => active.has(edge.id)
    && (!selected || edge.from === selected.id || edge.to === selected.id))
    .map(edge => (names.get(edge.from) || edge.from) + ' → ' + edge.label + ' → ' + (names.get(edge.to) || edge.to))
  const detail = selected ? selected.label + '：' + selected.detail : step.explanation || ''
  return [detail, ...new Set(relations)].filter(Boolean).join('\n')
}

const guideMetricColumn = value => /\b(?:F[_\s]?1|precision|recall|accuracy|MRR|NDCG|MAP|RI(?:[_\s-]?[LH])?|AR(?:@\d+)?)\b|准确率|精确率|召回率|命中率|插入精度|[Δδ]/iu.test(guideText(value))

function guideTableGroups(columns, rows) {
  if (rows.length <= 6) return null
  const collectionWords = new Set(['集合', '数据集', 'dataset', 'collection', 'benchmark'])
  const header = guideText(columns[0]).trim().toLowerCase().split(/[\/／]/).map(part => part.trim())
  if (!collectionWords.has(header[0]) || header.length > 2 || header.length === 2 && !header[1]) return null
  const combined = header.length === 2, labels = [], rowGroups = [], counts = []
  for (const row of rows) {
    const cell = guideText(row[0]).trim(), separator = cell.search(/[\/／]/)
    if (!cell || combined && (separator < 1 || !cell.slice(separator + 1).trim())) return null
    const label = combined ? cell.slice(0, separator).trim() : cell
    if (!label) return null
    let index = labels.indexOf(label)
    if (index < 0) { index = labels.length; labels.push(label); counts.push(0) }
    if (labels.length > 4) return null
    rowGroups.push(index); counts[index]++
  }
  return labels.length >= 2 && counts.every(count => count >= 2) ? { labels, rowGroups } : null
}

function guideExpression(node, depth = 0) {
  if (!node || typeof node !== 'object' || depth > 6) return null
  if (typeof node.input === 'string') return { input: node.input }
  if (typeof node.number === 'number') return { number: node.number }
  return { op: node.op, args: guideList(node.args).map(child => guideExpression(child, depth + 1)) }
}
function guideCalculation(block) {
  const value = { type: 'calculation', mode: block.mode, precision: block.precision,
    inputs: guideList(block.inputs).map(input => ({ id: input.id, label: input.label, meaning: input.meaning, value: input.value,
      ...(Object.hasOwn(input, 'min') ? { min: input.min, max: input.max, step: input.step } : {}) })),
    expression: guideExpression(block.expression), resultLabel: guideText(block.resultLabel) }
  try { evaluatePaperCalculation(value); return value } catch { return null }
}
function guideBlock(block, id, chapterId, payload) {
  const e = guideEscape, refs = guidePageNote(block.references), title = '<h3>' + e(block.title) + '</h3>'
  if (block.type === 'paragraph') return '<p class="pg-paragraph">' + e(block.text) + refs + '</p>'
  if (block.type === 'terms') return '<div class="pg-terms">' + guideList(block.items).map(item => '<div class="pg-term"><p class="pg-term-definition"><strong>' + e(item.term) + '</strong><span>' + e(item.meaning) + '</span></p><p class="pg-term-example">' + e(item.example) + '</p>' + (item.role || item.contrast ? '<details class="pg-term-detail"><summary>' + (item.contrast ? '作用与区别' : '作用') + '</summary>' + (item.role ? '<p>' + e(item.role) + '</p>' : '') + (item.contrast ? '<p>' + e(item.contrast) + '</p>' : '') + '</details>' : '') + '</div>').join('') + refs + '</div>'
  if (block.type === 'example') return '<div class="pg-case-link">' + guideButton(block.title || '查看案例', 'case-chapter', 'data-chapter="' + e(chapterId) + '"') + '<span>在案例窗口查看输入与输出</span></div>'
  if (block.type === 'flow') return '<div class="pg-block">' + title + '<div class="pg-flow">' + guideList(block.steps).map((step, index) => '<details class="pg-flow-step"><summary><span>' + (index + 1) + '</span>' + e(step.title) + '<strong class="pg-flow-value" title="' + e(step.output) + '">' + e(guideShort(step.output, 70)) + '</strong></summary><dl><dt>输入</dt><dd>' + e(step.input) + '</dd><dt>操作</dt><dd>' + e(step.operation) + '</dd><dt>输出</dt><dd>' + e(step.output) + '</dd></dl></details>').join('<span class="pg-flow-arrow" aria-hidden="true">→</span>') + '</div>' + refs + '</div>'
  if (block.type === 'table') {
    const rows = guideList(block.rows), columns = guideList(block.columns)
    const grouping = guideTableGroups(columns, rows)
    const cells = rows.map(row => row.map(cell => {
      const token = String(cell).trim(), value = Number(token.replace('%', ''))
      return /^[-+]?\d+(?:\.\d+)?%?$/.test(token) && Number.isFinite(value) ? { value, unit: token.endsWith('%') ? '%' : '' } : null
    }))
    const numbers = cells.map(row => row.map(cell => cell?.value ?? null))
    const scales = columns.map((column, index) => index > 0 && rows.length > 1 && guideMetricColumn(column)
      && cells.every(row => row[index] && row[index].value >= 0)
      && new Set(cells.map(row => row[index].unit)).size === 1
      ? Math.max(0, ...numbers.map(row => row[index])) : 0)
    return '<div class="pg-block"' + (grouping ? ' id="' + e(id) + '" data-table-group-count="' + grouping.labels.length + '"' : '') + '>' + title
      + (grouping ? '<div class="pg-toggle" aria-label="数据集">' + grouping.labels.map((label, index) => guideButton(label, 'table-group', 'data-block="' + e(id) + '" data-index="' + index + '" aria-pressed="' + (index === 0) + '"')).join('') + '</div>' : '')
      + '<div class="pg-table-scroll" tabindex="0"><table><thead><tr>' + columns.map(column => '<th scope="col">' + e(column) + '</th>').join('') + '</tr></thead><tbody>' + rows.map((row, rowIndex) => '<tr' + (grouping ? ' data-table-group="' + grouping.rowGroups[rowIndex] + '"' + (grouping.rowGroups[rowIndex] ? ' hidden' : '') : '') + '>' + row.map((cell, column) => {
      const value = numbers[rowIndex][column], numeric = value !== null && column > 0, percentage = numeric && scales[column] ? value / scales[column] * 100 : 0
      return '<td' + (numeric ? ' class="pg-numeric"' : '') + '>' + e(cell) + (numeric && scales[column] > 0 ? '<div class="pg-minibar" aria-hidden="true"><i style="width:' + percentage + '%"></i></div>' : '') + '</td>'
    }).join('') + '</tr>').join('') + '</tbody></table></div>' + refs + '</div>'
  }
  if (block.type === 'chart') {
    const data = guideList(block.data), minimum = Math.min(0, ...data.map(d => d.value)), maximum = Math.max(0, ...data.map(d => d.value)), range = maximum - minimum || 1
    return '<figure class="pg-block pg-chart">' + title + '<p class="pg-note">' + e(block.context) + ' · ' + e(block.metric) + (block.unit ? '（' + e(block.unit) + '）' : '') + ' · ' + (block.direction === 'lower' ? '越低越好' : '越高越好') + '</p><div class="pg-bars">' + data.map(d => '<div class="pg-brow"><span>' + e(d.label) + '</span><div class="pg-btrack"><i style="left:' + ((Math.min(d.value, 0) - minimum) / range * 100) + '%;width:' + (Math.abs(d.value) / range * 100) + '%"' + (d.value < 0 ? ' data-negative="true"' : '') + '></i><b class="pg-zero" style="left:' + (-minimum / range * 100) + '%"></b></div><strong>' + e(d.display) + '</strong></div>').join('') + '</div>' + refs + '</figure>'
  }
  if (block.type === 'evidence') {
    const value = { id, title: guideText(block.title), budget: block.budget, required: guideList(block.required).map(guideText),
      items: guideList(block.items).map(item => ({ id: item.id, label: item.label, detail: item.detail, supports: guideList(item.supports).map(guideText) })),
      states: guideList(block.states).map(state => ({ label: state.label, ids: guideList(state.ids).map(guideText), explanation: state.explanation })) }
    payload.evidence.push(value)
    const selected = new Set(value.states[0]?.ids || [])
    return '<div class="pg-block pg-evidence" data-evidence="' + e(id) + '" id="' + e(id) + '">' + title + '<p class="pg-note">' + e(block.question) + ' · ' + guideMode(block.mode) + '</p><div class="pg-toggle">' + value.states.map((state, index) => guideButton(state.label, 'evidence-preset', 'data-block="' + e(id) + '" data-index="' + index + '" aria-pressed="' + (index === 0) + '"')).join('') + '</div><div class="pg-segments">' + value.items.map(item => '<label class="pg-segment"><input type="checkbox" data-evidence-input="' + e(id) + '" value="' + e(item.id) + '"' + (selected.has(item.id) ? ' checked' : '') + '><strong>' + e(item.label) + '</strong><span>' + e(item.detail) + '</span><small>' + (item.supports.length ? e(item.supports.join(' · ')) : '未覆盖所需关系') + '</small></label>').join('') + '</div><div class="pg-stats" data-evidence-stats="' + e(id) + '" aria-live="polite"></div><p class="pg-verdict" data-evidence-verdict="' + e(id) + '" aria-live="polite"></p><p class="pg-note">选择只用于检查教学样例，不运行论文模型。</p>' + refs + '</div>'
  }
  if (block.type === 'calculation') {
    const value = guideCalculation(block)
    if (!value) return '<div class="pg-block">' + title + '<p class="pg-note">当前参数无法计算。</p>' + refs + '</div>'
    payload.calculations.push({ id, title: guideText(block.title), block: value })
    const initial = evaluatePaperCalculation(value)
    return '<div class="pg-block pg-calculation" data-calculation="' + e(id) + '" id="' + e(id) + '"><div class="pg-block-head">' + title + '<span class="pg-tag">' + (value.mode === 'illustrative' ? '构造计算' : '论文数值') + '</span></div><p class="pg-formula">' + e(block.formula) + '</p><div class="pg-calc-inputs">' + value.inputs.map(input => {
      const editable = value.mode === 'illustrative' && Object.hasOwn(input, 'min'), quotient = editable ? (input.value - input.min) / input.step : 0
      const domStep = Math.abs(quotient - Math.round(quotient)) <= 1e-8 ? input.step : 'any'
      return '<label class="pg-calc-input"><span>' + e(input.label) + '<output data-input-value="' + e(id + ':' + input.id) + '">' + e(input.value) + '</output></span>' + (editable ? '<input type="range" aria-label="' + e(input.label) + '" data-calc-input="' + e(id) + '" data-input="' + e(input.id) + '" min="' + input.min + '" max="' + input.max + '" step="' + domStep + '" value="' + input.value + '">' : '<strong>' + e(input.value) + '</strong>') + '<small>' + e(input.meaning) + '</small></label>'
    }).join('') + '</div><div class="pg-calc-result"><span>' + e(block.resultLabel) + '</span><output data-calc-result="' + e(id) + '" aria-live="polite">' + initial.toFixed(value.precision) + '</output></div><details class="pg-detail"><summary>计算过程</summary><p>' + e(block.interpretation) + '</p></details>' + (value.mode === 'illustrative' ? guideButton('恢复初始值', 'calculation-reset', 'data-block="' + e(id) + '" class="pg-reset"') : '') + refs + '</div>'
  }
  if (block.type === 'diagram') {
    const columns = guideList(block.columns), nodes = guideList(block.nodes), edges = guideList(block.edges), positions = new Map(), rowCount = []
    columns.forEach((column, index) => { const members = nodes.filter(node => node.column === column.id); rowCount.push(members.length); members.forEach((node, row) => positions.set(node.id, { x: 12 + index * 218, y: 40 + row * 80 })) })
    const edgePaths = edges.flatMap((edge, index) => {
      const from = positions.get(edge.from), to = positions.get(edge.to); if (!from || !to) return []
      const forward = to.x > from.x, same = to.x === from.x, x1 = from.x + (forward || same ? 170 : 0), x2 = to.x + (forward ? 0 : 170), y1 = from.y + 27, y2 = to.y + 27, bend = same ? x1 + 18 + index % 2 * 8 : (x1 + x2) / 2
      return [{ edge, x1, x2, y1, y2, bend }]
    })
    // A cubic stays inside its control-point bounds. Leave room beyond those
    // bounds for the 6-unit arrow marker at the active 2px stroke width.
    const width = Math.max(400, (columns.length - 1) * 218 + 194, ...edgePaths.map(path => Math.max(path.x1, path.x2, path.bend) + 14)), height = Math.max(146, Math.max(1, ...rowCount) * 80 + 52)
    const value = { id, title: block.title, nodes: nodes.map(node => ({ id: node.id, label: node.label, detail: node.detail })),
      edges: edges.map(edge => ({ id: edge.id, from: edge.from, to: edge.to, label: edge.label })), steps: guideList(block.steps).map(step => ({ label: step.label, explanation: step.explanation, activeNodes: guideList(step.activeNodes), activeEdges: guideList(step.activeEdges) })) }
    payload.diagrams.push(value)
    return '<div class="pg-block pg-diagram" data-diagram="' + e(id) + '" id="' + e(id) + '"><div class="pg-block-head">' + title + '<span class="pg-tag">' + guideMode(block.mode) + '</span></div><p class="pg-note">' + e(block.description) + '</p><div class="pg-toggle">' + value.steps.map((step, index) => guideButton(step.label, 'diagram-step', 'data-block="' + e(id) + '" data-index="' + index + '" aria-pressed="' + (index === 0) + '"')).join('') + '</div><div class="pg-diagram-scroll" tabindex="0" role="region" aria-label="' + e(block.title) + '：关系图"><svg viewBox="0 0 ' + width + ' ' + height + '" width="' + width + '" height="' + height + '" style="width:' + width + 'px;min-width:' + width + 'px;height:' + height + 'px" role="group" aria-label="' + e(block.title) + '"><defs><marker id="' + e(id) + '-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10Z"></path></marker></defs>' + columns.map((column, index) => {
      const x = 97 + index * 218, lines = guideLabelLines(column.label, 194, 11, 2)
      return '<text class="pg-column-label" x="' + x + '" y="' + (lines.length > 1 ? 13 : 20) + '" aria-label="' + e(column.label) + '"><title>' + e(column.label) + '</title>' + lines.map((line, row) => '<tspan x="' + x + '" dy="' + (row ? 14 : 0) + '">' + e(line) + '</tspan>').join('') + '</text>'
    }).join('') + edgePaths.map(({ edge, x1, x2, y1, y2, bend }) => {
      return '<path class="pg-edge" data-edge="' + e(id + ':' + edge.id) + '" d="M' + x1 + ',' + y1 + ' C' + bend + ',' + y1 + ' ' + bend + ',' + y2 + ' ' + x2 + ',' + y2 + '" marker-end="url(#' + e(id) + '-arrow)"><title>' + e(edge.label) + '</title></path>'
    }).join('') + nodes.map(node => {
      const p = positions.get(node.id); if (!p) return ''
      const lines = guideLabelLines(node.label)
      return '<g class="pg-node" role="button" tabindex="0" aria-label="' + e(node.label) + '" data-action="diagram-node" data-block="' + e(id) + '" data-node="' + e(node.id) + '"><title>' + e(node.label) + '</title><rect x="' + p.x + '" y="' + p.y + '" width="170" height="54" rx="8"></rect><text x="' + (p.x + 85) + '" y="' + (p.y + 31 - (lines.length - 1) * 8.5) + '">' + lines.map((line, index) => '<tspan x="' + (p.x + 85) + '" dy="' + (index ? 17 : 0) + '">' + e(line) + '</tspan>').join('') + '</text></g>'
    }).join('') + '</svg></div><p class="pg-diagram-explanation" data-diagram-explanation="' + e(id) + '" aria-live="polite">' + e(describePaperGuideDiagram(value)) + '</p>' + refs + '</div>'
  }
  return ''
}

/** Trusted renderer: model data is text/typed state only; no model HTML or JavaScript is executed. */
function createPaperGuideHtml(paper, { styles = '', behavior = '' } = {}) {
  const explanation = paper?.explanation, study = explanation?.caseStudy
  if (explanation?.version !== 4 || !study || !Array.isArray(study.steps) || study.steps.length < 2) throw new TypeError('A version 4 paper guide with a case study is required')
  const e = guideEscape, payload = { steps: study.steps.map(step => ({ label: guideText(step.label), file: guideText(step.file),
    language: ['json', 'python', 'text'].includes(step.language) ? step.language : 'text', code: guideText(step.code), explanation: guideText(step.explanation),
    annotations: guideList(step.annotations).map(annotation => ({ line: annotation.line, explanation: guideText(annotation.explanation) })) })), evidence: [], calculations: [], diagrams: [] }
  const chapters = guideList(explanation.chapters)
  const sections = chapters.map((chapter, chapterIndex) => '<section class="pg-section" id="chapter-' + e(chapter.id) + '" aria-labelledby="heading-' + e(chapter.id) + '"><h2 id="heading-' + e(chapter.id) + '"><span>' + (chapterIndex + 1) + '</span>' + e(chapter.title) + '</h2>' + (guideList(chapter.blocks).length ? chapter.blocks.map((block, blockIndex) => guideBlock(block, 'guide-' + chapterIndex + '-' + blockIndex, chapter.id, payload)).join('') : '<p class="pg-note">' + e(chapter.markdown || '当前可提取的论文文字未提供足够依据，暂不作结论。') + '</p>') + '</section>').join('')
  const first = payload.steps[0], lines = first.code.split('\n')
  const code = lines.map((line, index) => {
    const annotated = first.annotations.some(annotation => annotation.line === index + 1)
    const tag = annotated ? 'button' : 'div'
    return '<' + tag + (annotated ? ' type="button" class="pg-line pg-line-annotated" data-action="code-line" data-line="' + (index + 1) + '" aria-pressed="false"' : ' class="pg-line"') + '><span class="pg-line-no">' + (index + 1) + '</span><span class="pg-source">' + e(line || ' ') + '</span></' + tag + '>'
  }).join('')
  const trustedStyles = String(styles).replace(/<\/style/gi, '<\\/style'), trustedBehavior = String(behavior).replace(/<\/script/gi, '<\\/script')
  return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; connect-src \'none\'; img-src \'none\'; font-src \'none\'; base-uri \'none\'; form-action \'none\'"><title>' + e(explanation.title || paper.title) + '</title><style>' + trustedStyles + '</style></head><body><div class="pg-guide"><header class="pg-hero"><div class="pg-hero-inner"><span class="pg-kicker">论文图解</span><h1>' + e(explanation.title || paper.title) + '</h1><p class="pg-paper-title">' + e(paper.title) + '</p><p class="pg-tldr"><b>一句话</b>' + e(explanation.summary) + '</p><nav class="pg-nav" aria-label="讲解章节">' + chapters.map((chapter, index) => '<a href="#chapter-' + e(chapter.id) + '" data-action="nav-chapter" data-chapter="' + e(chapter.id) + '">' + (index + 1) + ' ' + e(chapter.title) + '</a>').join('') + '</nav></div></header><div class="pg-wrap"><div class="pg-grid"><aside class="pg-left" aria-label="贯穿案例"><div class="pg-codewin"><div class="pg-winbar"><i></i><i></i><i></i><span>' + e(study.title) + '</span></div><div class="pg-steps" aria-label="案例阶段">' + payload.steps.map((step, index) => guideButton((index + 1) + ' ' + step.label, 'case-stage', 'data-index="' + index + '" aria-pressed="' + (index === 0) + '"')).join('') + '</div><div class="pg-tabs" aria-label="案例文件">' + payload.steps.map((step, index) => guideButton(step.file, 'case-stage', 'data-index="' + index + '" aria-pressed="' + (index === 0) + '"')).join('') + '</div><div class="pg-code" data-case-code role="region" tabindex="0" aria-label="当前案例代码">' + code + '</div><div class="pg-expbox"><p data-case-explanation aria-live="polite">' + e(first.explanation) + '</p></div><p class="pg-code-hint">' + guideMode(study.mode) + guidePageNote(study.references) + '</p></div></aside><main class="pg-right">' + sections + '</main></div></div></div><script type="application/json" id="paper-guide-data">' + guideJson(payload) + '</script><script>const evaluatePaperCalculation=' + evaluatePaperCalculation.toString() + ';\nconst describePaperGuideDiagram=' + describePaperGuideDiagram.toString() + ';\n' + trustedBehavior + '</script></body></html>'
}


const list = value => Array.isArray(value) ? value : []
const text = value => typeof value === 'string' ? value : ''
const html = value => text(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
const finite = value => typeof value === 'number' && Number.isFinite(value)
const jsonData = value => JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, character => '\\u' + character.charCodeAt(0).toString(16).padStart(4, '0'))
const mode = value => value === 'illustrative' ? '构造示例（非论文原始样本）' : '论文实例'

function citations(references) {
  const pages = [...new Set(list(references).map(ref => ref?.page).filter(page => Number.isInteger(page) && page > 0 && page <= 150))]
  return pages.length ? '<p class="pe-references">（第 ' + pages.join('、') + ' 页）</p>' : ''
}

function inline(markdown) {
  const plain = text(markdown).replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\\([\\`*_{}\[\]()<>#!|~+.\-])/g, '$1')
  return html(plain).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}

function tableCells(line) {
  let source = line.trim()
  if (source.startsWith('|')) source = source.slice(1)
  if (source.endsWith('|') && !source.endsWith('\\|')) source = source.slice(0, -1)
  const cells = [], current = []
  let escaped = false
  for (const character of source) {
    if (character === '|' && !escaped) { cells.push(current.join('').trim()); current.length = 0 }
    else current.push(character)
    escaped = character === '\\' && !escaped
  }
  cells.push(current.join('').trim())
  return cells
}

function legacyMarkdown(markdown) {
  const lines = text(markdown).replace(/\r\n?/g, '\n').split('\n'), blocks = []
  const fence = line => /^ {0,3}(`{3,}|~{3,})([^\s]*)\s*$/.exec(line)
  const divider = line => tableCells(line).length >= 2 && tableCells(line).every(cell => /^:?-{3,}:?$/.test(cell))
  for (let index = 0; index < lines.length;) {
    const line = lines[index]
    if (!line.trim()) { index++; continue }
    const marker = fence(line)
    if (marker) {
      const code = [], language = ['json', 'python', 'text'].includes(marker[2]) ? marker[2] : 'text'
      index++
      while (index < lines.length) {
        const close = fence(lines[index])
        if (close && close[1][0] === marker[1][0] && close[1].length >= marker[1].length && !close[2]) { index++; break }
        code.push(lines[index++])
      }
      blocks.push('<pre><code class="language-' + language + '">' + html(code.join('\n')) + '</code></pre>')
      continue
    }
    const heading = /^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line)
    if (heading) {
      const level = Math.min(6, heading[1].length + 2)
      blocks.push('<h' + level + '>' + inline(heading[2]) + '</h' + level + '>'); index++; continue
    }
    if (index + 1 < lines.length && line.includes('|') && divider(lines[index + 1])) {
      const columns = tableCells(line), rows = []
      index += 2
      while (index < lines.length && lines[index].trim() && lines[index].includes('|')) rows.push(tableCells(lines[index++]))
      blocks.push('<div class="pe-table-scroll" tabindex="0"><table><thead><tr>' + columns.map(column => '<th scope="col">' + inline(column) + '</th>').join('')
        + '</tr></thead><tbody>' + rows.map(row => '<tr>' + columns.map((_, cell) => '<td>' + inline(row[cell] || '') + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>')
      continue
    }
    const bullet = /^\s*(?:[-*+] |\d+[.)] )/.exec(line)
    if (bullet) {
      const ordered = /^\s*\d/.test(line), items = []
      const pattern = ordered ? /^\s*\d+[.)]\s+(.+)$/ : /^\s*[-*+]\s+(.+)$/
      while (index < lines.length) {
        const item = pattern.exec(lines[index]); if (!item) break
        items.push('<li>' + inline(item[1]) + '</li>'); index++
      }
      blocks.push('<' + (ordered ? 'ol' : 'ul') + '>' + items.join('') + '</' + (ordered ? 'ol' : 'ul') + '>'); continue
    }
    const paragraph = [line]; index++
    while (index < lines.length && lines[index].trim() && !fence(lines[index]) && !/^ {0,3}#{1,6}\s/.test(lines[index])
      && !/^\s*(?:[-*+] |\d+[.)] )/.test(lines[index]) && !(index + 1 < lines.length && lines[index].includes('|') && divider(lines[index + 1]))) paragraph.push(lines[index++])
    blocks.push('<p>' + inline(paragraph.join('\n')).replace(/\n/g, '<br>') + '</p>')
  }
  return blocks.join('\n')
}

function stepButton(label, target, action = 'select-card') {
  return '<button type="button" data-export-action="' + action + '" data-target-id="' + target + '" aria-pressed="false">' + html(label) + '</button>'
}

function compactRelationLabel(value) {
  const characters = [...text(value).replace(/\s+/g, ' ').trim()], lines = []
  const units = character => character.codePointAt(0) <= 255 ? 1 : 2
  let position = 0
  while (position < characters.length && lines.length < 2) {
    const line = []
    let width = 0
    while (position < characters.length && width + units(characters[position]) <= 10) {
      width += units(characters[position]); line.push(characters[position++])
    }
    lines.push(line.join('').trim())
  }
  if (position < characters.length) {
    const last = [...lines[lines.length - 1]]
    while (last.reduce((sum, character) => sum + units(character), 0) > 8) last.pop()
    lines[lines.length - 1] = last.join('').trimEnd() + '…'
  }
  if (!lines.length) lines.push('关系')
  return lines.map(line => ({ text: line, width: Math.max(1, [...line].reduce((sum, character) => sum + units(character), 0) * 5) }))
}

function diagram(block, id) {
  const columns = list(block.columns), nodes = list(block.nodes), edges = list(block.edges), steps = list(block.steps)
  const positions = new Map(), rows = new Map()
  for (const node of nodes) {
    const column = Math.max(0, columns.findIndex(item => item.id === node.column)), row = rows.get(column) || 0
    rows.set(column, row + 1); positions.set(node.id, { x: 40 + column * 260, y: 76 + row * 104, column, node })
  }
  const width = Math.max(590, columns.length * 260 + 70), labels = [], occupied = new Map()
  let height = Math.max(220, 104 * Math.max(1, ...rows.values()) + 90)
  const edgeSvg = edges.map((edge, index) => {
    const from = positions.get(edge.from), to = positions.get(edge.to)
    if (!from || !to) return ''
    const forward = from.x < to.x, same = from.x === to.x
    const x1 = from.x + (forward || same ? 200 : 0), x2 = to.x + (forward ? 0 : 200)
    const y1 = from.y + 34, y2 = to.y + 34, bend = same ? x1 + 30 + (index % 3) * 12 : Math.max(36, Math.abs(x2 - x1) * .48)
    const control1 = same ? bend : x1 + (forward ? bend : -bend), control2 = same ? bend : x2 + (forward ? -bend : bend)
    const d = `M ${x1} ${y1} C ${control1} ${y1}, ${control2} ${y2}, ${x2} ${y2}`
    const gap = same || forward ? from.column : from.column - 1, labelX = 270 + gap * 260
    const pieces = compactRelationLabel(edge.label), labelWidth = Math.max(...pieces.map(piece => piece.width)) + 6, labelHeight = pieces.length * 12 + 8
    let anchorX = labelX, anchorY = (y1 + y2) / 2
    if (same) anchorX = x1 + .75 * (bend - x1)
    else {
      let low = 0, high = 1
      for (let turn = 0; turn < 32; turn++) {
        const t = (low + high) / 2, inverse = 1 - t
        const x = inverse ** 3 * x1 + 3 * inverse ** 2 * t * control1 + 3 * inverse * t ** 2 * control2 + t ** 3 * x2
        if ((x < labelX) === forward) low = t; else high = t
      }
      const t = (low + high) / 2
      anchorY = y1 + (y2 - y1) * (3 * t ** 2 - 2 * t ** 3)
    }
    const taken = occupied.get(gap) || [], preferred = Math.max(56 + labelHeight / 2, anchorY)
    let labelY
    for (let attempt = 0; attempt <= edges.length * 2; attempt++) {
      const direction = attempt % 2 ? 1 : -1
      const candidate = preferred + direction * Math.ceil(attempt / 2) * (labelHeight + 8)
      if (candidate - labelHeight / 2 < 56 || candidate + labelHeight / 2 > height - 14) continue
      if (taken.every(other => Math.abs(candidate - other.y) >= (labelHeight + other.height) / 2 + 6)) { labelY = candidate; break }
    }
    if (labelY === undefined) {
      labelY = Math.max(height - 14 + labelHeight / 2 + 8, ...taken.map(other => other.y + other.height / 2 + labelHeight / 2 + 8))
      height = labelY + labelHeight / 2 + 20
    }
    taken.push({ y: labelY, height: labelHeight }); occupied.set(gap, taken)
    const leader = Math.abs(anchorY - labelY) > 2 || Math.abs(anchorX - labelX) > 2
      ? '<path class="pe-edge-label-leader" d="M ' + anchorX + ' ' + anchorY + ' L ' + labelX + ' ' + labelY + '"></path>' : ''
    labels.push('<g class="pe-edge-label" data-edge-label-id="' + html(edge.id) + '" transform="translate(' + labelX + ' ' + labelY + ')"><title>' + html(edge.label) + '</title>'
      + '<rect class="pe-edge-label-box" x="' + (-labelWidth / 2) + '" y="' + (-labelHeight / 2) + '" width="' + labelWidth + '" height="' + labelHeight + '" rx="4"></rect><text x="0" y="' + (pieces.length > 1 ? -3 : 3) + '">'
      + pieces.map((piece, line) => '<tspan x="0" dy="' + (line ? 12 : 0) + '" textLength="' + piece.width + '" lengthAdjust="spacingAndGlyphs">' + html(piece.text) + '</tspan>').join('') + '</text></g>')
    return '<g class="pe-edge" data-edge-id="' + html(edge.id) + '"><title>' + html(edge.label) + '</title><path d="' + d
      + '" marker-end="url(#' + id + '-arrow)"></path></g>' + leader
  }).join('')
  const nodeSvg = [...positions.values()].map(({ x, y, node }) => {
    const label = [...text(node.label)], pieces = []
    for (let offset = 0; offset < Math.min(label.length, 28); offset += 14) pieces.push(label.slice(offset, offset + 14).join(''))
    if (label.length > 28) pieces[1] += '…'
    return '<g class="pe-node" role="button" tabindex="0" aria-pressed="false" aria-label="' + html(node.label) + '" data-export-action="diagram-node" data-node-id="' + html(node.id) + '">'
      + '<title>' + html(node.label) + '：' + html(node.detail) + '</title><rect class="pe-node-box" x="' + x + '" y="' + y + '" width="200" height="68" rx="10"></rect>'
      + '<text x="' + (x + 100) + '" y="' + (y + (pieces.length > 1 ? 28 : 39)) + '">' + pieces.map((piece, index) => '<tspan x="' + (x + 100) + '" dy="' + (index ? 20 : 0) + '">' + html(piece) + '</tspan>').join('') + '</text></g>'
  }).join('')
  return '<section class="pe-block pe-diagram" data-diagram id="' + id + '"><h3>' + html(block.title) + '</h3><p class="pe-mode">' + mode(block.mode) + '</p><p>' + html(block.description) + '</p>'
    + '<div class="pe-diagram-scroll" tabindex="0" role="region" aria-label="' + html(block.title) + '：关系图"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height + '" role="group" aria-label="' + html(block.title) + '">'
    + '<defs><marker id="' + id + '-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 Z"></path></marker></defs>'
    + columns.map((column, index) => '<text class="pe-column-label" x="' + (140 + index * 260) + '" y="34">' + html(column.label) + '</text>').join('') + edgeSvg + labels.join('') + nodeSvg + '</svg></div>'
    + '<div class="pe-diagram-controls" data-export-controls aria-label="关系图步骤">' + steps.map((step, index) => '<button type="button" data-export-action="diagram-step" data-step-index="' + index + '" data-active-nodes="' + html(jsonData(list(step.activeNodes))) + '" data-active-edges="' + html(jsonData(list(step.activeEdges))) + '" aria-pressed="false">' + (index + 1) + '. ' + html(step.label) + '</button>').join('') + '</div>'
    + '<ol class="pe-diagram-explanations">' + steps.map((step, index) => '<li data-diagram-explanation="' + index + '"><strong>' + html(step.label) + '</strong><p>' + html(step.explanation) + '</p></li>').join('') + '</ol>'
    + '<dl class="pe-node-details">' + nodes.map(node => '<div data-node-detail="' + html(node.id) + '"><dt>' + html(node.label) + '</dt><dd>' + html(node.detail) + '</dd></div>').join('') + '</dl>'
    + '<ul class="pe-edge-details">' + edges.map(edge => '<li>' + html(positions.get(edge.from)?.node.label || edge.from) + ' → ' + html(positions.get(edge.to)?.node.label || edge.to) + '：' + html(edge.label) + '</li>').join('') + '</ul>' + citations(block.references) + '</section>'
}

function evidence(block, id) {
  const items = new Map(list(block.items).map(item => [item.id, item])), required = list(block.required)
  const budget = Number.isInteger(block.budget) ? Math.max(1, Math.min(8, block.budget)) : 1
  let previous = []
  const states = list(block.states).map((state, index) => {
    const ids = list(state.ids), selected = ids.map(key => items.get(key)).filter(Boolean)
    const covered = new Set(selected.flatMap(item => list(item.supports)).filter(value => required.includes(value)))
    const added = index ? ids.filter(key => !previous.includes(key)) : [], removed = index ? previous.filter(key => !ids.includes(key)) : []
    previous = ids
    const slots = Array.from({ length: budget }, (_, slot) => {
      const item = selected[slot]
      return item ? '<li class="pe-evidence-slot" data-added="' + added.includes(item.id) + '"><strong>' + html(item.label) + '</strong>' + (added.includes(item.id) ? '<small>新增</small>' : '') + '<p>' + html(item.detail) + '</p><small>支持：' + list(item.supports).map(html).join('；') + '</small></li>' : '<li class="pe-evidence-slot pe-slot-empty">空位</li>'
    }).join('')
    return '<section class="pe-evidence-state" data-selectable id="' + id + '-state-' + index + '"><h4>' + stepButton(state.label, id + '-state-' + index) + '</h4>'
      + '<p>' + html(state.explanation) + '</p><p class="pe-evidence-count">已用 ' + selected.length + ' / ' + budget + ' 个位置 · 关系覆盖 <strong>' + covered.size + ' / ' + required.length + '</strong></p>'
      + '<ol class="pe-evidence-slots">' + slots + '</ol>' + (removed.length ? '<p class="pe-removed">移除：' + removed.map(key => html(items.get(key)?.label || key)).join('、') + '</p>' : '')
      + '<ul class="pe-coverage">' + required.map(relation => '<li data-covered="' + covered.has(relation) + '">' + (covered.has(relation) ? '已覆盖：' : '缺失：') + html(relation) + '</li>').join('') + '</ul></section>'
  }).join('')
  return '<section class="pe-block pe-evidence" data-export-selection id="' + id + '"><h3>' + html(block.title) + '</h3><p class="pe-mode">' + mode(block.mode) + '</p><p>问题：' + html(block.question) + '</p><p>固定段落预算：' + budget + ' 个位置</p>'
    + '<div class="pe-evidence-states" data-export-controls>' + states + '</div><details open class="pe-candidate-details"><summary>全部候选段落</summary><dl>' + [...items.values()].map(item => '<div><dt>' + html(item.label) + '</dt><dd>' + html(item.detail) + '；支持：' + list(item.supports).map(html).join('；') + '</dd></div>').join('') + '</dl></details>' + citations(block.references) + '</section>'
}

function calculationPayload(block) {
  let nodes = 0
  const expression = (node, depth = 1) => {
    if (++nodes > 64 || depth > 6 || !node || typeof node !== 'object') return null
    if (typeof node.input === 'string') return { input: node.input }
    if (finite(node.number)) return { number: node.number }
    if (['add', 'subtract', 'multiply', 'divide'].includes(node.op) && Array.isArray(node.args) && node.args.length <= 8) return { op: node.op, args: node.args.map(argument => expression(argument, depth + 1)) }
    return null
  }
  return { type: 'calculation', mode: block.mode, precision: block.precision, inputs: list(block.inputs).map(input => ({ id: text(input.id), value: input.value,
    ...Object.fromEntries(['min', 'max', 'step'].filter(key => Object.hasOwn(input, key)).map(key => [key, input[key]])) })), expression: expression(block.expression) }
}

function calculation(block, id, calculations) {
  const payload = calculationPayload(block)
  let result, valid = true
  try { result = evaluatePaperCalculation(payload) } catch { valid = false }
  if (valid) calculations.push({ id, block: payload })
  const inputs = list(block.inputs).map((input, index) => {
    const inputId = id + '-input-' + index, ranged = valid && block.mode === 'illustrative' && ['min', 'max', 'step'].every(key => finite(input[key]))
    const quotient = ranged ? (input.value - input.min) / input.step : 0
    const continuous = ranged && (!Number.isFinite(quotient) || Math.abs(quotient - Math.round(quotient)) > 1e-8 * Math.max(1, Math.abs(quotient)))
    const step = continuous ? 'any' : input.step
    return '<div class="pe-calculation-input"><label for="' + inputId + '">' + html(input.label) + '</label><output data-calc-input-value="' + html(input.id) + '" ' + (ranged ? 'for="' : 'id="') + inputId + '">' + (finite(input.value) ? String(input.value) : '—') + '</output><p>' + html(input.meaning) + '</p>'
      + (ranged ? '<input type="range" id="' + inputId + '" data-calc-input="' + html(input.id) + '" min="' + input.min + '" max="' + input.max + '" step="' + step + '" value="' + input.value + '">' : '<span class="pe-fixed-value">固定参数</span>') + '</div>'
  }).join('')
  const formatted = valid ? result.toFixed(payload.precision) : '当前参数无法计算。'
  return '<section class="pe-block pe-calculation" data-calculation id="' + id + '"><h3>' + html(block.title) + '</h3><p class="pe-mode">' + mode(block.mode) + '</p><p class="pe-formula"><code>' + html(block.formula) + '</code></p><div class="pe-calculation-inputs">' + inputs + '</div>'
    + '<p class="pe-calculation-result"><span>' + html(block.resultLabel) + '</span><output data-calculation-result aria-live="polite" data-raw-value="' + (valid ? result : '') + '">' + formatted + '</output></p><p>' + html(block.interpretation) + '</p>' + citations(block.references) + '</section>'
}

function renderBlock(block, id, calculations) {
  if (!block || typeof block !== 'object') return ''
  if (block.type === 'paragraph') return '<div class="pe-paragraph"><p>' + html(block.text) + '</p>' + citations(block.references) + '</div>'
  if (block.type === 'diagram') return diagram(block, id)
  if (block.type === 'evidence') return evidence(block, id)
  if (block.type === 'calculation') return calculation(block, id, calculations)
  const heading = '<h3>' + html(block.title) + '</h3>', refs = citations(block.references)
  if (block.type === 'terms') return '<section class="pe-block pe-terms">' + heading + '<dl>' + list(block.items).map(item => '<div><dt>' + html(item.term) + '</dt><dd><p><strong>含义：</strong>' + html(item.meaning) + '</p><p><strong>作用：</strong>' + html(item.role) + '</p><p><strong>本例：</strong>' + html(item.example) + '</p>' + (item.contrast ? '<p><strong>易混区别：</strong>' + html(item.contrast) + '</p>' : '') + '</dd></div>').join('') + '</dl>' + refs + '</section>'
  if (block.type === 'example') return '<section class="pe-block pe-example" data-export-selection>' + heading + '<p class="pe-mode">' + mode(block.mode) + '</p><ol class="pe-steps" data-export-controls>' + list(block.steps).map((step, index) => '<li data-selectable id="' + id + '-step-' + index + '"><h4>' + stepButton((index + 1) + '. ' + text(step.label), id + '-step-' + index) + '</h4><pre><code>' + html(step.code) + '</code></pre><p>' + html(step.explanation) + '</p></li>').join('') + '</ol>' + refs + '</section>'
  if (block.type === 'flow') return '<section class="pe-block pe-flow" data-export-selection>' + heading + '<ol class="pe-steps" data-export-controls>' + list(block.steps).map((step, index) => '<li data-selectable id="' + id + '-step-' + index + '"><h4>' + stepButton((index + 1) + '. ' + text(step.title), id + '-step-' + index) + '</h4><dl>' + [['输入', step.input], ['操作', step.operation], ['输出', step.output]].map(([label, value]) => '<dt>' + label + '</dt><dd>' + html(value) + '</dd>').join('') + '</dl></li>').join('') + '</ol>' + refs + '</section>'
  if (block.type === 'table') return '<section class="pe-block pe-table"><div class="pe-table-scroll" role="region" tabindex="0" aria-label="' + html(block.title) + '"><table><caption>' + html(block.title) + '</caption><thead><tr>' + list(block.columns).map(column => '<th scope="col">' + html(column) + '</th>').join('') + '</tr></thead><tbody>' + list(block.rows).map(row => '<tr>' + list(row).map(cell => '<td>' + html(cell) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>' + refs + '</section>'
  if (block.type === 'chart') {
    const data = list(block.data).filter(point => finite(point?.value)), magnitude = Math.max(1, ...data.map(point => Math.abs(point.value)))
    const minimum = Math.min(0, ...data.map(point => point.value)), maximum = Math.max(0, ...data.map(point => point.value))
    const low = minimum / magnitude, span = maximum / magnitude - low || 1, zero = -low / span * 100
    return '<figure class="pe-block pe-chart">' + '<figcaption>' + html(block.title) + '</figcaption><p>' + html(block.context) + '</p><p>' + html(block.metric) + '（' + html(block.unit) + '）· ' + (block.direction === 'lower' ? '越低越好' : '越高越好') + '</p><ol>' + data.map(point => {
      const value = point.value / magnitude, left = (Math.min(value, 0) - low) / span * 100, width = Math.abs(value) / span * 100
      return '<li><div class="pe-chart-label"><span>' + html(point.label) + '</span><strong>' + html(point.display) + '</strong></div><div class="pe-chart-track" aria-hidden="true"><span class="pe-chart-bar" data-negative="' + (point.value < 0) + '" style="left:' + left + '%;width:' + width + '%"></span><span class="pe-chart-zero" style="left:' + zero + '%"></span></div>' + citations([point.reference]) + '</li>'
    }).join('') + '</ol><div class="pe-chart-axis"><span>' + minimum + '</span><span>' + maximum + '</span></div>' + refs + '</figure>'
  }
  return '<p class="pe-note">此内容块暂不支持 HTML 展示。</p>'
}

/** Export explanation fields only; PDF pages and source quotations never enter the document or script data. */
function createPaperHtml(paper, { styles = '', behavior = '', guideStyles = '', guideBehavior = '' } = {}) {
  if (paper?.explanation?.version === 4) return createPaperGuideHtml(paper, { styles: guideStyles, behavior: guideBehavior })
  const explanation = paper?.explanation
  if (!explanation || !Array.isArray(explanation.chapters) || !explanation.chapters.length) throw new TypeError('Paper explanation is required')
  const title = text(explanation.title) || text(paper.title) || '论文讲解', calculations = []
  const chapters = explanation.chapters.map((chapter, index) => {
    const body = Array.isArray(chapter.blocks) && chapter.blocks.length ? chapter.blocks.map((block, blockIndex) => renderBlock(block, 'pe-c' + index + '-b' + blockIndex, calculations)).join('\n') : legacyMarkdown(chapter.markdown)
    return '<section class="pe-chapter" id="chapter-' + (index + 1) + '"><h2><span>' + (index + 1) + '</span>' + html(chapter.title) + '</h2>' + body + '</section>'
  }).join('\n')
  const script = ';(() => {\n"use strict";\nconst evaluatePaperCalculation = (' + evaluatePaperCalculation.toString() + ');\n' + text(behavior) + '\n})();'
  return '<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; connect-src \'none\'; base-uri \'none\'; form-action \'none\'"><title>' + html(title) + '</title><style>' + text(styles).replace(/<\/style/gi, '<\\/style') + '</style></head><body><main class="paper-export"><header class="pe-header"><p class="pe-eyebrow">论文百科 · 完整讲解</p><h1>' + html(title) + '</h1>' + (paper.fileName ? '<p class="pe-file-name">' + html(paper.fileName) + '</p>' : '') + '</header><nav class="pe-directory" aria-label="章节目录">' + explanation.chapters.map((chapter, index) => '<a href="#chapter-' + (index + 1) + '">' + (index + 1) + '. ' + html(chapter.title) + '</a>').join('') + '</nav><article>' + chapters + '</article></main><script type="application/json" id="paper-export-calculations">' + jsonData(calculations) + '</script><script>' + script.replace(/<\/script/gi, '<\\/script') + '</script></body></html>\n'
}

window.__ModuleLoader__.load({
  id: 'dsh-paper-wiki',
  factory(require) {
    const React = require('react')
    const primitives = require('@deepseek-ai/dsh-client-ui-primitives')
    const { Button, MarkdownText, Modal } = primitives
    const { createElement: h, useEffect, useId, useRef, useSyncExternalStore } = React
    const PaperContent = createPaperContentRenderer(React, primitives)
    const GenerationProgress = createPaperGenerationProgress(React, primitives)
    const panelId = 'dsh-paper-wiki'
    const uuid = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i
    const terminal = new Set(['completed', 'failed', 'cancelled'])
    const dateFormat = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' })
    const labels = { code: { copyLabel: '复制', copiedLabel: '已复制' }, footnotes: '脚注' }
    const api = (path, query = {}) => {
      const url = new URL('api/dsh-paper-wiki/' + path, document.baseURI)
      for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value)
      return url
    }
    function metadata(value) {
      if (!uuid.test(value?.id) || typeof value.fileName !== 'string' || typeof value.title !== 'string'
        || !Number.isSafeInteger(value.pageCount) || value.pageCount < 1 || !Number.isFinite(new Date(value.createdAt).getTime())) return null
      return { id: value.id, title: value.title, fileName: value.fileName, pageCount: value.pageCount,
        createdAt: value.createdAt, sha256: value.sha256, explained: value.explained === true || Boolean(value.explanation) }
    }
    function paperRecord(value) {
      const item = metadata(value)
      if (!item) return null
      const explanation = value.explanation
      if (explanation?.version === 4 && (!explanation.caseStudy || !Array.isArray(explanation.caseStudy.steps)
        || explanation.caseStudy.steps.length < 2 || explanation.caseStudy.steps.length > 6)) return null
      if (explanation && (!Array.isArray(explanation.chapters) || !explanation.chapters.length
        || explanation.chapters.some(chapter => typeof chapter.id !== 'string' || typeof chapter.title !== 'string' || typeof chapter.markdown !== 'string'
          || chapter.blocks !== undefined && (!Array.isArray(chapter.blocks) || !chapter.blocks.length || chapter.blocks.length > 10 || chapter.blocks.some(block => !block || !['paragraph', 'example', 'flow', 'table', 'chart', 'terms', 'diagram', 'evidence', 'calculation'].includes(block.type)))))) return null
      return { ...item, warnings: Array.isArray(value.warnings) ? value.warnings.filter(item => typeof item === 'string') : [], explanation }
    }
    function validJob(value) {
      return value && uuid.test(value.id) && uuid.test(value.paperId)
        && ['reading', 'writing', 'reviewing', 'saving', 'completed', 'failed', 'cancelled'].includes(value.phase)
    }
    async function readResponse(response) {
      const value = await response.json().catch(() => null)
      if (!response.ok) throw new Error(typeof value?.error === 'string' ? value.error : '操作失败，请重试。')
      return value
    }
    function createPaperStore() {
      let snapshot = { papers: [], historyStatus: 'idle', error: '', result: null,
        chapter: 0, formOpen: false, file: null, preparing: null, importing: false,
        openingId: null, deletion: null, generation: null, offline: false, generating: false }
      let disposed = false, initialized = false, openRevision = 0, listRequest, openRequest, importRequest, pollRequest, deleteRequest
      let pollTimer, pollingId, generationRequest
      let creationPaperId, cancelAfterCreateId
      const listeners = new Set()
      const controllers = new Set()
      const controller = () => { const value = new AbortController(); controllers.add(value); return value }
      const update = patch => { if (!disposed) { snapshot = { ...snapshot, ...patch }; for (const listener of listeners) listener() } }
      const merge = values => {
        const items = new Map(snapshot.papers.map(item => [item.id, item]))
        for (const item of values) if (item) items.set(item.id, item)
        return [...items.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id))
      }
      async function loadPapers() {
        listRequest?.abort()
        const request = listRequest = controller()
        update({ historyStatus: 'loading', error: '' })
        try {
          const data = await readResponse(await fetch(api('papers'), { credentials: 'same-origin', signal: request.signal }))
          if (!Array.isArray(data?.papers)) throw new Error('无法读取论文库。')
          if (!request.signal.aborted) update({ papers: data.papers.map(metadata).filter(Boolean), historyStatus: 'ready' })
        } catch { if (!request.signal.aborted) update({ historyStatus: 'error' }) }
        finally { controllers.delete(request); if (listRequest === request) listRequest = null }
      }
      async function fetchPaper(id, signal) {
        const value = paperRecord(await readResponse(await fetch(api('papers', { id }), { credentials: 'same-origin', signal })))
        if (!value || value.id !== id) throw new Error('论文记录不完整，请重新导入。')
        return value
      }
      async function openPaper(id) {
        if (disposed || snapshot.openingId === id) return
        openRequest?.abort()
        const revision = ++openRevision
        const request = openRequest = controller()
        update({ openingId: id, error: '' })
        try {
          const result = await fetchPaper(id, request.signal)
          if (!request.signal.aborted && revision === openRevision) update({ result, chapter: 0, formOpen: false })
        } catch (error) { if (!request.signal.aborted && revision === openRevision) update({ error: error.message }) }
        finally { controllers.delete(request); if (openRequest === request) { openRequest = null; update({ openingId: null }) } }
      }
      function stopPolling() {
        clearTimeout(pollTimer)
        pollRequest?.abort()
        pollingId = null
      }
      async function acceptJob(job, restore = false) {
        if (!validJob(job) || disposed) return
        update({ generation: { ...job, receivedAt: Date.now() }, offline: false, generating: false })
        if (terminal.has(job.phase)) {
          stopPolling()
          if (job.phase === 'completed') {
            const request = controller()
            try {
              const result = await fetchPaper(job.paperId, request.signal)
              if (!request.signal.aborted) update({ papers: merge([metadata(result)]),
                ...(snapshot.result?.id === result.id ? { result, chapter: 0 } : {}) })
            } catch (error) { if (!request.signal.aborted) update({ error: error.message }) }
            finally { controllers.delete(request) }
          }
          return
        }
        if (pollingId !== job.id || restore) { stopPolling(); pollingId = job.id; schedulePoll(job.id) }
        if (cancelAfterCreateId === job.paperId) {
          cancelAfterCreateId = null
          update({ preparing: null })
          await cancelGeneration()
        }
      }
      function schedulePoll(id) {
        pollTimer = setTimeout(async () => {
          if (disposed || pollingId !== id) return
          const request = pollRequest = controller()
          try {
            const data = await readResponse(await fetch(api('generation', { id }), { credentials: 'same-origin', signal: request.signal }))
            if (!request.signal.aborted && data?.job === null) {
              await acceptJob({ ...snapshot.generation, id, phase: 'failed', error: '生成任务已中断或 DSH 已重启。请点击「生成讲解」重新尝试。' })
              return
            }
            if (!validJob(data?.job)) throw new Error('无法读取生成任务。')
            if (!request.signal.aborted) await acceptJob(data.job)
          } catch (error) { if (!request.signal.aborted) update({ offline: true }) }
          finally {
            controllers.delete(request)
            if (!disposed && pollingId === id) schedulePoll(id)
          }
        }, 1500)
      }
      async function recoverGeneration(includeFinished = false) {
        const request = controller()
        try {
          const data = await readResponse(await fetch(api('generation'), { credentials: 'same-origin', signal: request.signal }))
          if (!request.signal.aborted && !generationRequest && validJob(data?.job)
            && (includeFinished || !terminal.has(data.job.phase))) await acceptJob(data.job, true)
        } catch { /* The library remains usable if no generation can be recovered. */ }
        finally { controllers.delete(request) }
      }
      async function createWiki() {
        if (disposed || snapshot.importing || snapshot.generating || !snapshot.file
          || snapshot.generation && !terminal.has(snapshot.generation.phase)) return
        const file = snapshot.file
        creationPaperId = cancelAfterCreateId = null
        const request = importRequest = controller()
        const revision = ++openRevision
        openRequest?.abort()
        update({ importing: true, formOpen: false, error: '', preparing: {
          id: 'preparing', phase: 'reading', fileName: file.name, elapsedMs: 0, receivedAt: Date.now(),
        } })
        try {
          if (file.size > 30 * 1024 * 1024 || !/\.pdf$/i.test(file.name)) throw new Error('请选择不超过 30 MB 的 PDF 文件。')
          const response = await fetch(api('papers'), { method: 'POST', credentials: 'same-origin', signal: request.signal,
            headers: { 'content-type': 'application/pdf', 'x-paper-filename': encodeURIComponent(file.name) }, body: file })
          const result = paperRecord(await readResponse(response))
          if (!result) throw new Error('导入结果不完整，请重试。')
          if (!request.signal.aborted) {
            creationPaperId = result.id
            listRequest?.abort()
            update({ papers: merge([metadata(result)]), historyStatus: 'ready', file: null,
              ...(revision === openRevision ? { result, chapter: 0, formOpen: false } : {}) })
            await generate(result.id)
          }
        } catch (error) {
          if (!request.signal.aborted) update({ error: error.message || '无法读取论文，请重试。', ...(revision === openRevision && { formOpen: true }) })
        } finally {
          controllers.delete(request)
          if (importRequest === request) {
            importRequest = null
            update({ importing: false, preparing: null, ...(request.signal.aborted && revision === openRevision && { formOpen: true }) })
          }
        }
      }
      async function generate(paperId = snapshot.result?.id) {
        if (disposed || !uuid.test(paperId) || snapshot.generating || snapshot.generation && !terminal.has(snapshot.generation.phase)) return
        if (!snapshot.importing) cancelAfterCreateId = null
        const request = generationRequest = controller()
        update({ generating: true, error: '' })
        try {
          const response = await fetch(api('generation'), { method: 'POST', credentials: 'same-origin', signal: request.signal,
            headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: paperId }) })
          const data = await response.json().catch(() => null)
          if ((response.ok || response.status === 409) && validJob(data?.job)) {
            await acceptJob(data.job, true)
            if (data.job.paperId !== paperId) update({ error: '已有论文正在生成，请稍后重试。' })
          } else throw new Error(data?.error || '无法开始讲解，请重试。')
        } catch (error) { if (!request.signal.aborted) { update({ error: error.message }); void recoverGeneration(true) } }
        finally { controllers.delete(request); if (generationRequest === request) { generationRequest = null; update({ generating: false }) } }
      }
      async function cancelGeneration() {
        if (snapshot.preparing && importRequest) {
          cancelAfterCreateId = creationPaperId
          importRequest.abort()
          return
        }
        if (!snapshot.generation || terminal.has(snapshot.generation.phase)) return
        const request = controller()
        try {
          const response = await fetch(api('generation/cancel'), { method: 'POST', credentials: 'same-origin', signal: request.signal,
            headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: snapshot.generation.id }) })
          const data = await readResponse(response)
          if (validJob(data?.job)) await acceptJob(data.job, true)
          else await recoverGeneration()
        } catch (error) { if (!request.signal.aborted) update({ error: error.message || '无法取消生成，请重试。' }) }
        finally { controllers.delete(request) }
      }
      async function deletePaper() {
        if (!snapshot.deletion || deleteRequest) return
        const item = snapshot.deletion.item
        const request = deleteRequest = controller()
        update({ deletion: { item, pending: true, error: '' } })
        try {
          const response = await fetch(api('papers/delete'), { method: 'POST', credentials: 'same-origin', signal: request.signal,
            headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: item.id }) })
          if (!response.ok) await readResponse(response)
          if (!request.signal.aborted) {
            listRequest?.abort()
            if (snapshot.openingId === item.id) { ++openRevision; openRequest?.abort() }
            update({ deletion: null, papers: snapshot.papers.filter(paper => paper.id !== item.id),
              ...(snapshot.result?.id === item.id ? { result: null } : {}),
              ...(snapshot.generation?.paperId === item.id && terminal.has(snapshot.generation.phase) ? { generation: null } : {}) })
          }
        } catch (error) { if (!request.signal.aborted) update({ deletion: { item, pending: false, error: error.message } }) }
        finally { controllers.delete(request); deleteRequest = null }
      }
      return {
        subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
        getSnapshot: () => snapshot,
        initialize() { if (!initialized && !disposed) { initialized = true; void loadPapers(); void recoverGeneration() } },
        loadPapers, openPaper, createWiki, generate, cancelGeneration, deletePaper,
        setFile(file) { update({ file: file || null, error: '' }) },
        setFormOpen(formOpen) { update({ formOpen, error: '',
          ...(formOpen && snapshot.generation && terminal.has(snapshot.generation.phase) && { generation: null }) }) },
        selectChapter(chapter) { if (snapshot.result?.explanation?.chapters[chapter]) update({ chapter }) },
        returnToLibrary() { ++openRevision; openRequest?.abort(); update({ result: null, openingId: null, formOpen: false, error: '',
          ...(snapshot.generation?.phase === 'completed' && { generation: null }) }) },
        requestDelete(item) { update({ deletion: { item, pending: false, error: '' } }) },
        cancelDelete() { if (!snapshot.deletion?.pending) update({ deletion: null }) },
        dispose() { disposed = true; stopPolling(); for (const request of controllers) request.abort(); listeners.clear() },
      }
    }
    function PaperIcon({ size = 20 }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, 'aria-hidden': true },
        h('path', { d: 'M6 3.5h8l4 4v13H6z', strokeLinejoin: 'round' }), h('path', { d: 'M14 3.5v4h4M9 11h6M9 14h6M9 17h4', strokeLinecap: 'round' }))
    }
    function Glyph({ kind }) {
      return h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, 'aria-hidden': true },
        h('path', { d: kind === 'trash' ? 'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7' : kind === 'plus' ? 'M12 5v14M5 12h14' : 'm9 5 7 7-7 7', strokeLinecap: 'round', strokeLinejoin: 'round' }))
    }
    function ImportForm({ store, state, formId }) {
      const fileInput = useRef(null), heading = useRef(null), titleId = useId()
      const busy = state.importing || state.generating || state.generation && !terminal.has(state.generation.phase)
      useEffect(() => { heading.current?.focus() }, [])
      return h('section', { id: formId, className: 'dsh-paper-wiki-form-card', 'aria-labelledby': titleId },
        h('h2', { id: titleId, ref: heading, tabIndex: -1, className: 'dsh-paper-wiki-form-title' }, '新建 Wiki'),
        h('form', { className: 'dsh-paper-wiki-form', onSubmit: event => { event.preventDefault(); void store.createWiki() } },
          h('input', { ref: fileInput, type: 'file', hidden: true, accept: '.pdf,application/pdf', 'aria-label': '论文文件',
            onChange: event => { const file = event.target.files?.[0]; if (file) store.setFile(file); event.target.value = '' } }),
          h('div', { className: 'dsh-paper-wiki-file-field' },
            h(Button, { type: 'button', variant: 'outline', disabled: busy, onClick: () => fileInput.current?.click() }, '选择论文'),
            state.file && h('span', { title: state.file.name }, state.file.name)),
          h(Button, { type: 'submit', variant: 'primary', disabled: busy || !state.file }, '生成讲解')))
    }
    function PaperLibrary({ store, state }) {
      const titleId = useId()
      return h('section', { className: 'dsh-paper-wiki-history', 'aria-labelledby': titleId },
        h('h2', { id: titleId }, '已保存论文'),
        ['idle', 'loading'].includes(state.historyStatus) && !state.papers.length && h('p', { role: 'status', className: 'dsh-paper-wiki-library-status' }, '正在读取论文…'),
        state.historyStatus === 'error' && h('div', { role: 'alert', className: 'dsh-paper-wiki-library-status' },
          h('p', null, '无法读取论文库，请重试。'),
          h(Button, { type: 'button', size: 'sm', onClick: () => void store.loadPapers() }, '重试')),
        state.historyStatus === 'ready' && !state.papers.length && h('div', { className: 'dsh-paper-wiki-library-empty' },
          h(PaperIcon, { size: 25 }), h('p', null, '还没有已保存的论文')),
        state.papers.length > 0 && h('ul', { className: 'dsh-paper-wiki-history-list' }, state.papers.map(item => h('li', { key: item.id, className: 'dsh-paper-wiki-history-row' },
          h('button', { type: 'button', className: 'dsh-paper-wiki-history-item', 'aria-busy': state.openingId === item.id || undefined,
            onClick: () => void store.openPaper(item.id) }, h('span', { className: 'dsh-paper-wiki-history-icon' }, h(PaperIcon, { size: 19 })),
            h('span', { className: 'dsh-paper-wiki-history-copy' }, h('strong', { title: item.fileName }, item.title),
              h('span', { className: 'dsh-paper-wiki-history-meta' }, h('span', null, item.pageCount + ' 页'),
                h('span', { className: item.explained ? 'dsh-paper-wiki-ready' : undefined }, item.explained ? '已讲解' : '待讲解'),
                h('time', { dateTime: item.createdAt }, dateFormat.format(new Date(item.createdAt))))),
            state.openingId === item.id ? h('span', { role: 'status' }, '正在打开…') : h(Glyph, { kind: 'chevron' })),
          h('button', { type: 'button', className: 'dsh-paper-wiki-delete', title: '删除论文', 'aria-label': '删除论文 ' + item.title,
            disabled: state.generation?.paperId === item.id && !terminal.has(state.generation.phase), onClick: () => store.requestDelete(item) }, h(Glyph, { kind: 'trash' }))))))
    }
    function sourceMarkdown(markdown, paper) {
      function citation(href) {
        try {
          const url = new URL(href.replace(/&amp;/g, '&'), document.baseURI)
          if (url.searchParams.get('id') !== paper.id) return null
          const page = url.origin === 'https://dsh-paper-wiki.invalid' && url.pathname === '/source'
            ? Number(url.searchParams.get('page')) : url.pathname.endsWith('/api/dsh-paper-wiki/pdf')
              && /^#page=\d+$/.test(url.hash) ? Number(url.hash.slice(6)) : null
          return Number.isInteger(page) && page >= 1 && page <= paper.pageCount ? '（第 ' + page + ' 页）' : null
        } catch { return null }
      }
      let fence = null
      return markdown.split('\n').map(line => {
        const marker = /^\s*(`{3,}|~{3,})/.exec(line)
        if (marker) { if (!fence) fence = marker[1]; else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null; return line }
        if (fence) return line
        return line.split(/(`+[^`]*`+)/g).map((part, index) => index % 2 ? part : part
          .replace(/!?\[[^\]\n]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (match, href) => citation(href) || match)
          .replace(/<([^<>\s]+)>/g, (match, href) => citation(href) || match)
          .replace(/https?:\/\/[^\s<>()]+|(?:\/|api\/)[^\s<>()]+/g, href => citation(href) || href)).join('')
      }).join('\n')
    }
    function downloadMarkdown(paper) {
      const explanation = paper.explanation
      if (!explanation) return
      const markdown = '# ' + explanation.title + '\n\n'
        + explanation.chapters.map(chapter => '## ' + chapter.title + '\n\n' + sourceMarkdown(chapter.markdown, paper)).join('\n\n')
      const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url; link.download = paper.fileName.replace(/\.pdf$/i, '') + '-讲解.md'; link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
    function downloadHtml(paper) {
      const html = createPaperHtml(paper, { styles: paperExportStyles, behavior: paperExportBehavior,
        guideStyles: paperGuideStyles, guideBehavior: paperGuideBehavior })
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url; link.download = paper.fileName.replace(/\.pdf$/i, '') + '-讲解.html'; link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
    function ChapterDirectory({ state, store }) {
      const selectId = useId(), chapters = state.result.explanation.chapters
      return h('nav', { 'aria-label': '讲解章节' }, h('h2', { className: 'dsh-paper-wiki-rail-label' }, '章节目录'),
        h('ul', { className: 'dsh-paper-wiki-chapter-list' }, chapters.map((chapter, index) => h('li', { key: chapter.id },
          h('button', { type: 'button', className: 'dsh-paper-wiki-chapter-button', 'aria-current': state.chapter === index ? 'page' : undefined,
            onClick: () => store.selectChapter(index) }, chapter.title)))),
        h('div', { className: 'dsh-paper-wiki-chapter-picker' }, h('label', { htmlFor: selectId }, '章节'),
          h('select', { id: selectId, value: state.chapter, onChange: event => store.selectChapter(Number(event.target.value)) },
            chapters.map((chapter, index) => h('option', { key: chapter.id, value: index }, chapter.title)))))
    }
    function PaperReader({ store, state }) {
      const paper = state.result, explanation = paper.explanation
      const chapter = explanation?.chapters[state.chapter]
      const heading = useRef(null), sections = useRef({}), previous = useRef(null)
      const continuous = explanation?.version >= 3
      const active = state.generation && !terminal.has(state.generation.phase)
      useEffect(() => {
        const changed = previous.current?.id === paper.id && previous.current.chapter !== state.chapter
        if (continuous && changed) {
          const target = sections.current?.[chapter?.id]
          target?.scrollIntoView({ block: 'start' }); target?.focus({ preventScroll: true })
        } else heading.current?.focus({ preventScroll: true })
        previous.current = { id: paper.id, chapter: state.chapter }
      }, [paper.id, state.chapter, continuous])
      if (explanation?.version === 4) return h('div', { className: 'dsh-paper-wiki-guide-reader' },
        paper.warnings.length > 0 && h('div', { className: 'dsh-paper-wiki-warning', role: 'note' }, paper.warnings.map((warning, index) => h('p', { key: index }, warning))),
        h('iframe', { key: paper.id + '-' + explanation.createdAt, className: 'dsh-paper-wiki-guide-frame',
          title: '论文互动图解', sandbox: 'allow-scripts', referrerPolicy: 'no-referrer',
          srcDoc: createPaperHtml(paper, { guideStyles: paperGuideStyles, guideBehavior: paperGuideBehavior }) }))
      return h('div', { className: 'dsh-paper-wiki-reader' },
        h('div', { className: 'dsh-paper-wiki-reader-heading' }, h('div', null, h('p', { className: 'dsh-paper-wiki-eyebrow' }, '本地论文 · ' + paper.pageCount + ' 页'),
          h('h1', { ref: heading, tabIndex: -1 }, paper.title), h('p', { className: 'dsh-paper-wiki-file-name' }, paper.fileName)),
          explanation && h('div', { className: 'dsh-paper-wiki-actions' }, h(Button, { size: 'sm', variant: 'outline', onClick: () => continuous ? downloadHtml(paper) : downloadMarkdown(paper) }, continuous ? '导出 HTML' : '导出讲解'),
            h(Button, { size: 'sm', variant: 'primary', disabled: state.importing || state.generating || active,
              onClick: () => void store.generate() }, state.generating ? '正在提交…' : '重新讲解'))),
        paper.warnings.length > 0 && h('div', { className: 'dsh-paper-wiki-warning', role: 'note' }, paper.warnings.map((warning, index) => h('p', { key: index }, warning))),
        explanation ? h('div', { className: 'dsh-paper-wiki-columns' }, h('aside', { className: 'dsh-paper-wiki-sidebar' }, h(ChapterDirectory, { state, store })),
          h('article', { className: 'dsh-paper-wiki-article', 'aria-label': '论文讲解' },
            (continuous ? explanation.chapters : [chapter]).map((item, index) => h('section', {
              key: paper.id + '-' + explanation.createdAt + '-' + item.id,
              className: 'dsh-paper-wiki-lesson-section', 'aria-labelledby': 'paper-' + paper.id + '-' + item.id,
            }, h('header', { className: 'dsh-paper-wiki-article-header' }, h('h2', {
                className: 'dsh-paper-wiki-article-title', id: 'paper-' + paper.id + '-' + item.id, tabIndex: -1,
                ref: node => { if (sections.current) sections.current[item.id] = node },
              }, item.title),
              (!continuous || index === 0) && h('div', { className: 'dsh-paper-wiki-meta' }, h('span', null, '中文讲解'),
                explanation.model && h('span', null, explanation.model), explanation.createdAt && h('time', { dateTime: explanation.createdAt }, dateFormat.format(new Date(explanation.createdAt))))),
              h('div', { className: 'dsh-paper-wiki-prose' }, item.blocks
                ? h(PaperContent, { key: paper.id + '-' + explanation.createdAt + '-' + item.id, chapter: item, labels })
                : h(MarkdownText, { text: sourceMarkdown(item.markdown, paper), omitHtml: true, labels }))))))
          : h('div', { className: 'dsh-paper-wiki-explanation-empty' },
            h(Button, { variant: 'primary', disabled: state.importing || state.generating || active, onClick: () => void store.generate() }, '生成讲解')))

    }
    function DeleteDialog({ store, deletion }) {
      return h(Modal, { open: true, title: '删除论文？', closeLabel: '关闭', onClose: store.cancelDelete,
        description: '将删除保存的 PDF、提取文本和讲解。',
        footer: h(React.Fragment, null, h(Button, { 'data-modal-autofocus': '', disabled: deletion.pending, onClick: store.cancelDelete }, '取消'),
          h(Button, { variant: 'primary', disabled: deletion.pending, className: 'dsh-paper-wiki-confirm-delete', onClick: () => void store.deletePaper() }, deletion.pending ? '正在删除…' : '删除')) },
        h('p', null, deletion.item.title), deletion.error && h('p', { role: 'alert', className: 'dsh-paper-wiki-error' }, deletion.error))
    }
    function PaperWikiPage({ store }) {
      const state = useSyncExternalStore(store.subscribe, store.getSnapshot), page = useRef(null)
      const formId = useId()
      useEffect(() => store.initialize(), [store])
      useEffect(() => { if (page.current) page.current.scrollTop = 0 }, [state.result?.id])
      useEffect(() => { if (page.current && !(state.result?.explanation?.version >= 3)) page.current.scrollTop = 0 }, [state.chapter])
      const active = state.generation && !terminal.has(state.generation.phase)
      const generation = state.preparing || state.generation
      const showProgress = generation && generation.phase !== 'completed'
        && (state.preparing || active || !state.result || generation.paperId === state.result.id)
      const progressOwnsResult = !state.result?.explanation && showProgress && (state.preparing || generation.paperId === state.result?.id)
      const title = generation && (generation.fileName || state.papers.find(paper => paper.id === generation.paperId)?.title)
      const guide = state.result?.explanation?.version === 4
      return h('section', { className: 'dsh-paper-wiki-page', 'aria-label': '论文百科', ref: page, 'data-reading': state.result ? '' : undefined, 'data-guide': guide ? '' : undefined },
        h('style', null, paperWikiStyles), state.deletion && h(DeleteDialog, { store, deletion: state.deletion }),
        h('div', { className: 'dsh-paper-wiki-shell' },
          h('header', { className: 'dsh-paper-wiki-bar' }, state.result
            ? h('nav', { className: 'dsh-paper-wiki-breadcrumb', 'aria-label': '当前位置' }, h('button', { type: 'button', onClick: store.returnToLibrary }, '论文库'),
              h(Glyph, { kind: 'chevron' }), h('span', { title: state.result.title }, state.result.title))
            : h('h1', { className: 'dsh-paper-wiki-brand' }, h('span', { className: 'dsh-paper-wiki-brand-icon' }, h(PaperIcon, { size: 20 })), '论文库'),
            guide && h('div', { className: 'dsh-paper-wiki-actions' },
              h(Button, { size: 'sm', variant: 'outline', onClick: () => downloadHtml(state.result) }, '导出 HTML'),
              h(Button, { size: 'sm', variant: 'primary', disabled: state.importing || state.generating || active,
                onClick: () => void store.generate() }, state.generating ? '正在提交…' : '重新讲解')),
            !state.result && h('div', { className: 'dsh-paper-wiki-actions' }, h(Button, { size: 'sm', variant: state.formOpen ? 'outline' : 'primary', disabled: state.importing || state.generating || active,
              icon: state.formOpen ? undefined : h(Glyph, { kind: 'plus' }), 'aria-expanded': state.formOpen,
              'aria-controls': state.formOpen ? formId : undefined,
              onClick: () => store.setFormOpen(!state.formOpen) }, state.formOpen ? '取消新建' : '新建 Wiki'))),
          h('div', { className: state.result ? 'dsh-paper-wiki-reading' : 'dsh-paper-wiki-library' },
            showProgress && h(GenerationProgress, { generation: { ...generation, title }, offline: state.offline, store }),
            state.error && h('p', { role: 'alert', className: 'dsh-paper-wiki-feedback' }, state.error),
            state.result ? !progressOwnsResult && h(PaperReader, { state, store }) : h(React.Fragment, null,
              state.formOpen && h(ImportForm, { store, state, formId }), h(PaperLibrary, { store, state })))))
    }
    return {
      name: panelId, inject: ['slots'],
      apply(ctx) {
        const store = createPaperStore()
        ctx.effect(() => () => store.dispose())
        ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: panelId, inject: () => ({ store }) }, PaperWikiPage))
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: panelId, label: '论文百科', order: 11 }, PaperIcon))
      },
    }
  },
})

})()
