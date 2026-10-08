/**
 * Long-press the app icon on Android → "Quick add". A static app shortcut that
 * opens becomewhoyouare://add, which Expo Router maps to the quick-add sheet.
 * Native config, so it shows up in development and release builds, not Expo Go.
 */
const fs = require('fs');
const path = require('path');
const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('expo/config-plugins');

const shortcutsXml = (pkg, scheme) => `<?xml version="1.0" encoding="utf-8"?>
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">
  <shortcut
    android:shortcutId="quick_add"
    android:enabled="true"
    android:icon="@mipmap/ic_launcher"
    android:shortcutShortLabel="@string/quick_add_short"
    android:shortcutLongLabel="@string/quick_add_long">
    <intent
      android:action="android.intent.action.VIEW"
      android:targetPackage="${pkg}"
      android:targetClass="${pkg}.MainActivity"
      android:data="${scheme}://add" />
  </shortcut>
</shortcuts>
`;

function upsertString(xml, name, value) {
  const line = `  <string name="${name}">${value}</string>`;
  const re = new RegExp(`\\s*<string name="${name}">[^<]*</string>`);
  return re.test(xml) ? xml.replace(re, `\n${line}`) : xml.replace('</resources>', `${line}\n</resources>`);
}

module.exports = function withQuickAddShortcut(config) {
  const pkg = config.android?.package;
  const scheme = Array.isArray(config.scheme) ? config.scheme[0] : config.scheme;
  if (!pkg || !scheme) throw new Error('withQuickAddShortcut needs android.package and scheme in app.json');

  config = withDangerousMod(config, ['android', async (cfg) => {
    const res = path.join(cfg.modRequest.platformProjectRoot, 'app/src/main/res');
    fs.mkdirSync(path.join(res, 'xml'), { recursive: true });
    fs.writeFileSync(path.join(res, 'xml/shortcuts.xml'), shortcutsXml(pkg, scheme));
    const stringsPath = path.join(res, 'values/strings.xml');
    let strings = fs.existsSync(stringsPath) ? fs.readFileSync(stringsPath, 'utf8') : '<resources>\n</resources>\n';
    strings = upsertString(strings, 'quick_add_short', 'Quick add');
    strings = upsertString(strings, 'quick_add_long', 'Quick add a task');
    fs.writeFileSync(stringsPath, strings);
    return cfg;
  }]);

  return withAndroidManifest(config, (cfg) => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(cfg.modResults);
    activity['meta-data'] = (activity['meta-data'] ?? []).filter((m) => m.$['android:name'] !== 'android.app.shortcuts');
    activity['meta-data'].push({ $: { 'android:name': 'android.app.shortcuts', 'android:resource': '@xml/shortcuts' } });
    return cfg;
  });
};
