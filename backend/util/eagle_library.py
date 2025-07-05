"""
Eagleライブラリの操作と検出に関する機能を提供するモジュール。
設定ファイルから検索パスを読み込み、指定されたパス以下のEagleライブラリを動的に検出します。
"""
#-- coding: utf-8 -*-
from eaglewrapper import Eagle
import glob
import os
from .settings import EAGLE_LIBRARY_SEARCH_PATH

my_eagle = Eagle()

def find_eagle_libraries(search_path):
    """
    指定されたパス以下にあるEagleライブラリ（.libraryフォルダ）を再帰的に検索します。
    """
    pattern = os.path.join(search_path, '**', '*.library')
    library_paths = glob.glob(pattern, recursive=True)
    
    libraries = {}
    for path in library_paths:
        if os.path.isdir(path):
            library_name = os.path.basename(path).replace(".library", "")
            if not library_name or library_name.startswith('.'):
                continue
            libraries[library_name] = path
            
    return libraries

# settings.pyから検索パスを読み込み、ライブラリの辞書を作成
eagle_library_dict = find_eagle_libraries(EAGLE_LIBRARY_SEARCH_PATH)
