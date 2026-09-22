import { test } from 'node:test';
import assert from 'node:assert/strict';
import { directDownloadUrl, DriveMediaHost } from '../src/adapters/mediaHost.js';

test('directDownloadUrl monta o link de download direto do Drive', () => {
  assert.equal(
    directDownloadUrl('ABC123'),
    'https://drive.google.com/uc?export=download&id=ABC123',
  );
});

test('DriveMediaHost torna público e devolve a URL', async () => {
  const calls = [];
  const fakeDrive = {
    async makePublic(id) {
      calls.push(id);
      return id;
    },
  };
  const host = new DriveMediaHost(fakeDrive);
  const url = await host.publicUrl('FILE9');
  assert.deepEqual(calls, ['FILE9']); // tornou público exatamente esse arquivo
  assert.equal(url, 'https://drive.google.com/uc?export=download&id=FILE9');
});
