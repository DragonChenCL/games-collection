// Saves the player list in the container Storage (client 9.46+), following the mini-tool docs:
// an unknown version, a missing SDK or a failed call never falls back to browser storage.
export const KEY = 'gold-rooftop';
const STORAGE_MIN_CLIENT_VERSION = 9460;

function readBuildVersion(launchOptions) {
  const env = launchOptions && launchOptions.miniToolEnv;
  const value = env && env.buildVersion;
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (!/^[1-9]\d{6,}$/.test(String(value))) return null;
  const version = Number(value);
  return Number.isSafeInteger(version) ? version : null;
}

// Client version such as 9462 for 9.46.2, or null when it cannot be determined.
export async function clientVersion(xhs) {
  let build = readBuildVersion(xhs && xhs.launchOptions);
  const miniTool = xhs && xhs.miniTool;
  if (build === null && miniTool && typeof miniTool.getLaunchOptions === 'function') {
    try { build = readBuildVersion(await miniTool.getLaunchOptions()); } catch (e) { build = null; }
  }
  return build === null ? null : Math.floor(build / 1000);
}

// reason: '' when usable, 'unknown' (version or SDK missing) or 'old' (client below 9.46).
export async function openStore(xhs) {
  const version = await clientVersion(xhs);
  const miniTool = xhs && xhs.miniTool;
  const has = name => !!miniTool && typeof miniTool[name] === 'function';
  const reason = version === null || !has('getStorage') || !has('setStorage') ? 'unknown'
    : version < STORAGE_MIN_CLIENT_VERSION ? 'old' : '';

  // { state: 'ok', data } | { state: 'empty' } | { state: 'failed' }
  async function read() {
    if (reason) return { state: 'failed' };
    try {
      const { data } = await miniTool.getStorage({ key: KEY });
      if (data === null || data === undefined || data === '') return { state: 'empty' };
      return { state: 'ok', data: JSON.parse(data) };
    } catch (e) {
      // A failed read is only "nothing saved yet" when the container confirms the key is absent.
      try {
        if (has('getStorageInfo')) {
          const { keys } = await miniTool.getStorageInfo();
          if (Array.isArray(keys) && !keys.includes(KEY)) return { state: 'empty' };
        }
      } catch (e2) { /* stays failed */ }
      return { state: 'failed' };
    }
  }

  async function write(value) {
    if (reason) return false;
    try {
      const result = await miniTool.setStorage({ key: KEY, data: JSON.stringify(value) });
      return !!result && result.errMsg === 'setStorage:ok';
    } catch (e) { return false; }
  }

  return { reason, read, write, version };
}
