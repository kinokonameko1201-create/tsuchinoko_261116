import 'package:flutter/material.dart';

import 'theme.dart';

void main() => runApp(const TsuchinokoApp());

class TsuchinokoApp extends StatelessWidget {
  const TsuchinokoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'tsuchinoko',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      home: const SetupCheckPage(),
    );
  }
}

/// 環境確認用の画面。Figma の画面を実装したら置き換える。
class SetupCheckPage extends StatefulWidget {
  const SetupCheckPage({super.key});

  @override
  State<SetupCheckPage> createState() => _SetupCheckPageState();
}

class _SetupCheckPageState extends State<SetupCheckPage> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('tsuchinoko')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('セットアップ完了', style: t.textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text('Material 3 / Noto Sans JP が適用されています。',
              style: t.textTheme.bodyMedium),
          const SizedBox(height: 24),
          Wrap(spacing: 8, runSpacing: 8, children: [
            FilledButton(onPressed: () {}, child: const Text('収穫を記録')),
            OutlinedButton(onPressed: () {}, child: const Text('カレンダー')),
            const Chip(label: Text('収穫適期')),
          ]),
          const SizedBox(height: 24),
          Card(
            child: ListTile(
              leading: const Icon(Icons.grass),
              title: const Text('畝 4'),
              subtitle: const Text('あと 3 日で収穫適期'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {},
            ),
          ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.map_outlined), label: 'マップ'),
          NavigationDestination(icon: Icon(Icons.calendar_month_outlined), label: 'カレンダー'),
          NavigationDestination(icon: Icon(Icons.settings_outlined), label: '設定'),
        ],
      ),
    );
  }
}
