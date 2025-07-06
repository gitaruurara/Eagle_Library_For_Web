"""
アプリケーションの設定を管理するモジュール。
Eagleライブラリの検索パスやCORSの許可オリジンなどの設定を定義します。
設定は `settings.json` から読み込まれます。
"""
#-- coding: utf-8 -*-
import json
import os
import pathlib

SETTINGS_FILE = pathlib.Path(__file__).parent.parent.parent / "setting" /"settings.json"
print(SETTINGS_FILE)
def load_settings():
    print(os.path.exists(SETTINGS_FILE))
    if os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

settings = load_settings()
print(settings.keys())

EAGLE_LIBRARY_SEARCH_PATH = settings["EAGLE_LIBRARY_SEARCH_PATH"]
ALLOW_ORIGINS = settings["ALLOW_ORIGINS"]