// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps, and the renderer paints what is there. The game moves between six screens:
// title, play, paused, level-done, win and caught.
//
// ?shot=cover|patrol|alert|exit|caught stages that scene instead of running the loop,
// paints it twice and sets window.__shotReady for a screenshot.
import { STEP } from './config.js';
import { LEVELS, createWorld } from './world.js';
import { EVENT_ALARM, EVENT_CAUGHT, EVENT_LOST, updateGuards } from './guards.js';
import { EVENT_EXIT, EVENT_PICKUP, updatePlayer } from './player.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import {
  createRenderer,
  SCREEN_CAUGHT,
  SCREEN_LEVEL_DONE,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  SCREEN_WIN,
} from './render.js';
import { isMuted, playCaught, playClick, playPickup, playStep, playWin, startAlarm, stopAlarm, toggleMute, unlockAudio } from './audio.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);

function announce(message) {
  status.textContent = message;
}

function runShot(name) {
  const scene = stageShot(name);
  let painted = 0;
  function paint() {
    renderer.draw(scene.world, scene.screen, scene.time, false);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput();
  let world = createWorld(0);
  let screen = SCREEN_TITLE;
  let totalTime = 0;
  let accumulator = 0;
  let last = performance.now();
  let lastStepSound = 0;

  function startRun() {
    world = createWorld(0);
    totalTime = 0;
    screen = SCREEN_PLAY;
    stopAlarm();
    announce('Bermain. Ambil 3 relik, lalu ke exit tanpa ketahuan.');
  }

  function nextLevel() {
    if (world.levelIndex + 1 >= LEVELS.length) {
      screen = SCREEN_WIN;
      playWin();
      announce('Menang. Semua relik aman.');
      return;
    }
    totalTime += world.timeSeconds;
    world = createWorld(world.levelIndex + 1);
    screen = SCREEN_PLAY;
    stopAlarm();
    announce(`${world.level.name}. Ambil 3 relik.`);
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const nowMuted = toggleMute();
      announce(nowMuted ? 'Suara mati.' : 'Suara hidup.');
    }
    if (actions & ACTION_RESTART && (screen === SCREEN_PLAY || screen === SCREEN_CAUGHT)) {
      startRun();
      return;
    }
    if (actions & ACTION_CONFIRM) {
      unlockAudio();
      if (screen === SCREEN_TITLE) {
        playClick();
        startRun();
      } else if (screen === SCREEN_LEVEL_DONE) {
        playClick();
        nextLevel();
      } else if (screen === SCREEN_WIN || screen === SCREEN_CAUGHT) {
        playClick();
        startRun();
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Lanjut.');
      }
    } else if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        stopAlarm();
        announce('Jeda.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Lanjut.');
      }
    }
  }

  function step() {
    if (screen !== SCREEN_PLAY) return;
    const direction = input.direction();
    const running = input.running();
    const playerEvents = updatePlayer(world, direction, running, STEP);
    if (playerEvents & EVENT_PICKUP) {
      playPickup();
      announce(`Relik diambil. Sisa ${world.relics.filter((r) => !r.taken).length}.`);
    }
    if (playerEvents & EVENT_EXIT) {
      stopAlarm();
      if (world.levelIndex + 1 >= LEVELS.length) {
        totalTime += world.timeSeconds;
        screen = SCREEN_WIN;
        playWin();
        announce('Menang. Semua relik aman.');
      } else {
        screen = SCREEN_LEVEL_DONE;
        playWin();
        announce(`Lantai ${world.levelIndex + 1} bersih.`);
      }
      return;
    }
    const guardEvents = updateGuards(world, STEP, running);
    if (guardEvents & EVENT_ALARM) {
      startAlarm();
      announce('Alarm! Penjaga mengejarmu — hilang dari pandangannya!');
    }
    if (guardEvents & EVENT_LOST) {
      announce('Penjaga kehilangan jejakmu.');
    }
    if (guardEvents & EVENT_CAUGHT) {
      world.caught = true;
      screen = SCREEN_CAUGHT;
      stopAlarm();
      playCaught();
      announce('Ketahuan! Penjaga menangkapmu.');
      return;
    }
    if (world.player.moving && world.player.stepTimer <= 0.001) {
      // The step timer resets inside updatePlayer; play the sound on its beat.
      if (world.timeSeconds - lastStepSound > 0.2) {
        lastStepSound = world.timeSeconds;
        playStep(running);
      }
    }
    world.timeSeconds += STEP;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world, screen, now / 1000, isMuted(), { totalTime: totalTime + world.timeSeconds });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      stopAlarm();
      announce('Jeda.');
    }
  });

  announce('Arsip Tengah Malam. Tekan Spasi atau Enter untuk mulai.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
