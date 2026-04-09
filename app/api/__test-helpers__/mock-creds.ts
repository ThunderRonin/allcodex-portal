export function mockEtapiCreds() {
  return { url: 'http://localhost:8080', token: 'test-etapi-token' };
}

export function mockAkCreds() {
  return { url: 'http://localhost:3001', token: 'test-ak-token' };
}

export function mockNoCreds() {
  return { url: '', token: '' };
}
