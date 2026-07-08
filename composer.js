/**
 * composer.js — <nostr-composer>, publish a text note (kind 1).
 * No build step. Composes with any pool + any NIP-07-shaped signer.
 *
 * Part of https://github.com/nostr-client — one repo, one thing.
 * License: AGPL-3.0-or-later
 *
 * Usage:
 *   <script type="module" src="https://nostr-client.github.io/composer/composer.js"></script>
 *   <nostr-composer placeholder="What's happening?"></nostr-composer>
 *
 * Signer: window.nostrSigner / 'nostr:login' events (or set .signer).
 * Relays: shared defaultPool() (or relays="…" attribute, or set .pool).
 * Fires 'nostr:published' (bubbling + on window) with { event, results }.
 */

import { Pool, defaultPool } from 'https://nostr-client.github.io/pool/pool.js'

const TEMPLATE = /* html */ `
<style>
  :host { display: block;
    font-family: var(--nc-font, ui-sans-serif, system-ui, sans-serif);
    font-size: .95rem; color: var(--nc-ink, #201d26); }
  form { display: grid; gap: .6rem; padding: .9rem 1rem;
    background: var(--nc-surface, #fff);
    border: 1px solid var(--nc-line, #e9e6e0);
    border-radius: var(--nc-radius, 14px);
    box-shadow: var(--nc-shadow, 0 1px 2px rgb(32 27 51 / 4%), 0 6px 24px -10px rgb(32 27 51 / 10%)); }
  textarea { font: inherit; padding: .6em .7em; border-radius: var(--nc-radius-sm, 9px);
    min-height: 4.2em; border: 1px solid var(--nc-line, #e9e6e0);
    background: var(--nc-inset, #f4f2ee); color: inherit;
    resize: vertical; width: 100%; box-sizing: border-box; line-height: 1.5; }
  textarea:focus { outline: 2px solid var(--nc-accent-soft, #f2ecfd);
    border-color: var(--nc-accent, #7c3aed); }
  .row { display: flex; justify-content: space-between; align-items: center; gap: .6rem; }
  .count { font-size: .75rem; color: var(--nc-faint, #a8a4b0); }
  button { font: inherit; cursor: pointer; border: none; border-radius: 999px;
    padding: .5em 1.4em; font-weight: 600;
    background: var(--nc-accent, #7c3aed); color: var(--nc-accent-ink, #fff);
    transition: filter .15s ease, transform .15s ease; }
  button:hover { filter: brightness(1.08); }
  button:active { transform: translateY(1px); }
  button:disabled { opacity: .45; cursor: default; filter: none; }
  .status { font-size: .8rem; white-space: pre-wrap; color: var(--nc-soft, #6d6a76); }
</style>
<form>
  <textarea id="text"></textarea>
  <div class="row">
    <span class="count" id="count"></span>
    <button id="send" type="submit">Publish</button>
  </div>
  <div class="status" id="status"></div>
</form>
`

class NostrComposer extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' }).innerHTML = TEMPLATE
    this.pool = null
    this.signer = null
    this.text = this.shadowRoot.getElementById('text')
    this.send = this.shadowRoot.getElementById('send')
    this.status = this.shadowRoot.getElementById('status')
    this.countEl = this.shadowRoot.getElementById('count')
    this._onLogin = () => this._refresh()
    this._onLogout = () => this._refresh()
  }

  connectedCallback() {
    this.text.placeholder = this.getAttribute('placeholder') || "What's happening?"
    this.send.textContent = this.getAttribute('button-label') || 'Publish'
    window.addEventListener('nostr:login', this._onLogin)
    window.addEventListener('nostr:logout', this._onLogout)
    this.text.addEventListener('input', () => {
      this.countEl.textContent = this.text.value.length ? this.text.value.length + ' chars' : ''
    })
    this.shadowRoot.querySelector('form').onsubmit = (e) => { e.preventDefault(); this._publish() }
    this._refresh()
  }

  disconnectedCallback() {
    window.removeEventListener('nostr:login', this._onLogin)
    window.removeEventListener('nostr:logout', this._onLogout)
  }

  get _signer() { return this.signer || window.nostrSigner }

  get _pool() {
    if (!this.pool) {
      const relays = this.getAttribute('relays')
      this.pool = relays ? new Pool(relays.split(',').map((s) => s.trim())) : defaultPool()
    }
    return this.pool
  }

  _refresh() {
    const ok = !!this._signer
    this.send.disabled = !ok
    this.status.textContent = ok ? '' : 'log in to publish'
  }

  async _publish() {
    const content = this.text.value.trim()
    if (!content) return
    if (!this._signer) { this.status.textContent = '✗ no signer — log in first'; return }
    this.send.disabled = true
    this.status.textContent = 'signing…'
    try {
      const event = await this._signer.signEvent({
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content,
      })
      this.status.textContent = 'publishing…'
      const results = await this._pool.publish(event)
      const okCount = results.filter((r) => r.ok).length
      this.status.textContent = okCount
        ? `✓ published to ${okCount}/${results.length} relays`
        : results.map((r) => '✗ ' + r.relay + ' — ' + r.message).join('\n')
      if (okCount) this.text.value = ''
      this.countEl.textContent = ''
      const detail = { event, results }
      this.dispatchEvent(new CustomEvent('nostr:published', { detail, bubbles: true, composed: true }))
      window.dispatchEvent(new CustomEvent('nostr:published', { detail }))
    } catch (err) {
      this.status.textContent = '✗ ' + (err.message || err)
    } finally {
      this.send.disabled = false
    }
  }
}

if (!customElements.get('nostr-composer')) customElements.define('nostr-composer', NostrComposer)
