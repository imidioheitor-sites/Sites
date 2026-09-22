import { test } from 'node:test';
import assert from 'node:assert/strict';
import { srtTime, assTime, segmentsToSrt, wordsToAss } from '../src/render/captions.js';
import { buildFfmpegArgs } from '../src/adapters/render.js';

test('srtTime formata HH:MM:SS,mmm', () => {
  assert.equal(srtTime(1.234), '00:00:01,234');
  assert.equal(srtTime(3661.5), '01:01:01,500');
  assert.equal(srtTime(0), '00:00:00,000');
});

test('assTime formata H:MM:SS.cc', () => {
  assert.equal(assTime(1.23), '0:00:01.23');
  assert.equal(assTime(65), '0:01:05.00');
});

test('segmentsToSrt numera e monta os blocos', () => {
  const srt = segmentsToSrt([
    { start: 0, end: 1.5, text: 'oi' },
    { start: 1.5, end: 3, text: 'tudo bem' },
  ]);
  assert.match(srt, /^1\n00:00:00,000 --> 00:00:01,500\noi/);
  assert.match(srt, /2\n00:00:01,500 --> 00:00:03,000\ntudo bem/);
});

test('wordsToAss gera um Dialogue por palavra, em maiúsculas', () => {
  const ass = wordsToAss([
    { word: 'bom', start: 0, end: 0.5 },
    { word: 'dia', start: 0.5, end: 1 },
  ]);
  const dialogues = ass.split('\n').filter((l) => l.startsWith('Dialogue:'));
  assert.equal(dialogues.length, 2);
  assert.match(ass, /BOM/);
  assert.match(ass, /PlayResX: 1080/);
});

test('buildFfmpegArgs escala/corta para 9:16 e concatena N clipes', () => {
  const args = buildFfmpegArgs({ videos: ['a.mov', 'b.mov'], out: 'o.mp4' });
  const fc = args[args.indexOf('-filter_complex') + 1];
  assert.match(fc, /scale=1080:1920/);
  assert.match(fc, /crop=1080:1920/);
  assert.match(fc, /concat=n=2:v=1:a=1/);
  assert.ok(args.includes('o.mp4'));
});

test('buildFfmpegArgs adiciona legendas e mix de trilha quando informados', () => {
  const args = buildFfmpegArgs({
    videos: ['a.mov'],
    out: 'o.mp4',
    subtitlePath: '/tmp/l.ass',
    musicPath: 'm.mp3',
  });
  const fc = args[args.indexOf('-filter_complex') + 1];
  assert.match(fc, /ass=/);
  assert.match(fc, /amix=inputs=2/);
  assert.ok(args.includes('-stream_loop'));
  // mapeia o vídeo legendado e o áudio mixado
  assert.ok(args.includes('[cvs]'));
  assert.ok(args.includes('[aout]'));
});

test('buildFfmpegArgs exige ao menos um clipe', () => {
  assert.throws(() => buildFfmpegArgs({ videos: [], out: 'o.mp4' }), /nenhum clipe/i);
});
