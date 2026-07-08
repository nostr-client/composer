# composer

`<nostr-composer>` — write and publish a nostr text note (kind 1).
**No build step.** One file: [`composer.js`](composer.js).

Part of [nostr-client](https://github.com/nostr-client) — a modular, composable
nostr client where each repo does one thing.

**Live demo:** https://nostr-client.github.io/composer/

## Use

```html
<script type="module" src="https://nostr-client.github.io/login/login.js"></script>
<script type="module" src="https://nostr-client.github.io/composer/composer.js"></script>

<nostr-login></nostr-login>
<nostr-composer placeholder="What's happening?"></nostr-composer>
```

- signer: `window.nostrSigner` / `nostr:login` events (or set the `.signer` property)
- relays: shared `defaultPool()` (or `relays="wss://a,wss://b"`, or set `.pool`)
- publish shows per-relay acknowledgements
- fires `nostr:published` with `{ event, results }` — both bubbling from the
  element and on `window`, so e.g. a feed can prepend your new note instantly

## License

AGPL-3.0-or-later
