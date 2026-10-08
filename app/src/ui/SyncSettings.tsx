import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { useApp } from '../state/AppStateContext';
import { ORG_FILE } from '../state/sync';
import { Button, s as shared, Toggle } from './components';
import { copy } from './copy';
import { colors, fonts, space, themed } from './theme';

const c = copy.sync;

/** Sync between this device and others through a WebDAV folder. The .org mirror is its own switch (OrgSettings). */
export function SyncSettings() {
  const { sync } = useApp();
  const { config, status } = sync;
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!config) return;
    setUrl(config.url);
    setUser(config.user);
    setPassword(config.password);
  }, [config]);

  const on = !!config?.enabled;
  const save = () => { void sync.save({ enabled: true, url: url.trim(), user: user.trim(), password, org: config?.org ?? false }); setOpen(false); };
  const when = status.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : undefined;

  return (
    <View style={st.section}>
      <Text style={shared.label}>{c.title}</Text>
      <Text style={shared.faint}>{on ? (status.syncing ? c.syncing : status.error ?? (when ? c.syncedAt(when) : c.waiting)) : c.off}</Text>

      {open ? (
        <View style={st.section}>
          <TextInput value={url} onChangeText={setUrl} placeholder={c.urlPlaceholder} placeholderTextColor={colors.faint}
            autoCapitalize="none" autoCorrect={false} keyboardType="url" style={st.input} accessibilityLabel={c.url} />
          <TextInput value={user} onChangeText={setUser} placeholder={c.user} placeholderTextColor={colors.faint}
            autoCapitalize="none" autoCorrect={false} style={st.input} accessibilityLabel={c.user} />
          <TextInput value={password} onChangeText={setPassword} placeholder={c.password} placeholderTextColor={colors.faint}
            secureTextEntry autoCapitalize="none" autoCorrect={false} style={st.input} accessibilityLabel={c.password} />
          <Text style={shared.faint}>{c.note}</Text>
          <View style={shared.row}>
            <Button kind="primary" label={c.save} onPress={save} />
            <Button label={copy.cancel} onPress={() => setOpen(false)} />
          </View>
        </View>
      ) : (
        <View style={shared.row}>
          {on ? <Button kind="primary" label={c.now} onPress={sync.syncNow} /> : null}
          <Button label={on ? c.edit : c.setUp} onPress={() => setOpen(true)} />
          {on && config ? <Button label={c.stop} onPress={() => { void sync.save({ ...config, enabled: false }); }} /> : null}
        </View>
      )}
    </View>
  );
}

/** Off unless asked for. Needs sync, since the file lives in the same folder. */
export function OrgSettings() {
  const { sync } = useApp();
  const { config } = sync;
  const on = !!config?.enabled && config.org;
  const o = copy.settings;
  return (
    <View style={st.section}>
      <Text style={shared.label}>{o.org}</Text>
      <Toggle
        label={o.orgSetting(ORG_FILE)}
        value={on}
        disabled={!config?.enabled}
        onChange={(org) => { if (config) void sync.save({ ...config, org }); }}
      />
      <Text style={shared.faint}>{config?.enabled ? o.orgNote : o.orgNeedsSync}</Text>
    </View>
  );
}

const st = themed(() => ({
  section: { gap: space.md },
  input: {
    color: colors.ink, fontFamily: fonts.sans, fontSize: 16, backgroundColor: colors.surface,
    borderRadius: 10, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, paddingVertical: 11,
  },
}));
