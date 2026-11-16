import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Material 3 テーマ。
/// Figma のカラー変数・テキストスタイルを取り込んだら、ここを更新する。
class AppTheme {
  /// 既存プロトタイプの --primary (#4D6B30) をシード色に使用
  static const seed = Color(0xFF4D6B30);

  static ThemeData light() => _build(Brightness.light);
  static ThemeData dark() => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final scheme = ColorScheme.fromSeed(seedColor: seed, brightness: brightness);
    final base = ThemeData(useMaterial3: true, colorScheme: scheme);
    return base.copyWith(
      textTheme: GoogleFonts.notoSansJpTextTheme(base.textTheme),
    );
  }
}
