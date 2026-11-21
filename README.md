# Arsip Tengah Malam — Stealth Game

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/zenganteng0987/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/zenganteng0987/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

Masuk arsip tengah malam, ambil 3 relik di setiap lantai, dan keluar lewat pintu EXIT tanpa ketahuan penjaga. Game stealth top-down original untuk kompetisi [best-stealth-game-20261121-1759](https://make.fun/bounty/best-stealth-game-20261121-1759) di make.fun.

## Cara main

- **WASD / panah** — bergerak
- **Shift** — lari (lebih cepat, tapi berisik: penjaga di dekatmu akan datang memeriksa)
- **Spasi / Enter** — mulai, lanjut ke lantai berikutnya
- **P** — jeda, **R** — mulai ulang, **M** — suara mati/hidup

Rak kayu menahan pandangan penjaga — sembunyi di baliknya saat kerucut kuning menyapu ke arahmu. Meter **Terlihat** di atas terisi saat kamu masuk kerucut pandang penjaga; kalau penuh, alarm bunyi dan penjaga mengejarmu. Hilang dari pandangannya cukup lama dan dia akan mencari sebentar, lalu kembali ke rute patrolinya. Kumpulkan semua relik untuk membuka pintu EXIT, lalu keluar sebelum ketahuan. Ada 3 lantai, makin ke atas makin banyak penjaga dan makin rapat patrolinya.

## Yang ada di dalam game

- 3 lantai dengan layout, rak, dan rute patroli yang berbeda
- Penjaga dengan vision cone, rute patroli waypoint, dan 4 state: patroli, kejar, cari, kembali
- Detection meter, alarm, dan kesempatan pulih (recovery)
- Suara lari yang terdengar penjaga (lingkaran noise terlihat saat berlari)
- Semua suara dibuat sintetis dengan WebAudio — tanpa file audio eksternal
- Layar mulai, jeda, lantai selesai, menang, dan ketahuan
- Tanpa build step, tanpa request network: semua file ada di bawah `game/`

## Menjalankan

```sh
node serve.ts
```

Lalu buka http://localhost:8080 di desktop Chrome.

## Struktur kode

- `game/index.html` — canvas 1280x720, memuat `./src/main.js`
- `game/src/config.js` — semua angka yang bisa di-tune (kecepatan, jarak pandang, warna)
- `game/src/input.js` — keyboard
- `game/src/world.js` — data 3 lantai, line-of-sight, state dunia
- `game/src/guards.js` — patroli, vision cone, deteksi, kejar/cari/kembali
- `game/src/player.js` — gerak pencuri, ambil relik, keluar lewat exit
- `game/src/audio.js` — suara sintetis WebAudio (langkah, alarm, pickup)
- `game/src/render.js` — semua gambar di canvas, HUD, dan semua layar
- `game/src/shots.js` — adegan untuk screenshot (`?shot=cover|patrol|alert|exit`)
- `game/src/main.js` — loop utama dan pergantian layar
- `main.ts` — menyalin `game/` dan `screenshots/` ke `/output` dan menulis `dossier.json`
