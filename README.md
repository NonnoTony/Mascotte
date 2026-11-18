# Mascotte 🟠

Clawd (in pixel art) — o in alternativa Pallino — è una piccola mascotte animata che vive nella tua chat. Non ha dipendenze: è un solo file JavaScript.

**Cosa fa da solo:** entra camminando, sbircia dal basso, balla, saluta, salta, fa piroette, si stiracchia, si addormenta (Zzz), dice frasi e ogni tanto se ne va. Con gli occhi segue il puntatore.

**Come reagisce:**
- **Tocco:** ride, salta, arrossisce o fa una piroetta
- **4 tocchi di fila:** gli gira la testa 😵‍💫
- **7 tocchi di fila:** si arrabbia e scappa via (per un po' non torna)
- **Pressione lunga:** coccole e cuoricini 🥰
- **Trascinamento:** lo sollevi, scalcia, e quando lo lasci cade (se cade da troppo in alto si stordisce)
- **Tocco mentre dorme o sbircia:** si sveglia di colpo / "Mi hai trovato!"
- **Messaggi della chat:** risponde a parole come *balla, ciao, salta, gira, dormi, ti voglio bene, vieni, vai via*

## Demo

Apri `index.html` nel browser.

## Come aggiungerla alla tua chat

```html
<script src="mascotte.js"></script>
<script>
  const mascotte = new Mascotte({ container: '#chat' }); // l'area dei messaggi
  // quando l'utente invia un messaggio:
  mascotte.onMessage(testo);
</script>
```

Opzioni: `character` (`"pixel"` = Clawd, default, oppure `"pallino"`), `name`, `size` (px, default 96), `minDelay` / `maxDelay` (ms tra un'azione e l'altra), `speed`, `colors` (`main`, `light`, `dark`, `accent`), `phrases` (per cambiare le frasi).

Metodi: `dance()`, `wave()`, `jump()`, `spin()`, `sleep()`, `love()`, `come()`, `leave()`, `say(testo)`, `setFace(umore)`, `start()`, `stop()`, `destroy()`.
