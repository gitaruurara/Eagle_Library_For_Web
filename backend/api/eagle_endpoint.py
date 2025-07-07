"""
Eagle Web InterfaceのバックエンドAPIエンドポイントを定義するモジュール。
FastAPIアプリケーションのルーティング、CORS設定、Eagleライブラリとの連携を処理します。
"""
#-- coding: utf-8 -*-
import json
import urllib.parse
from pathlib import Path
from io import BytesIO

import requests
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse

from util.eagle_library import my_eagle, eagle_library_dict
from util.fast_app import app
from util.settings import ALLOW_ORIGINS, API_BASE_URL

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,  # settings.pyから読み込み
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/library_list")
async def get_library_list():
    """
    利用可能なEagleライブラリのリストを取得するエンドポイント。
    `backend/settings.json` で指定されたパス以下を検索し、`.library` 拡張子を持つフォルダを検出します。

    Returns:
        dict: ライブラリ名（フォルダ名から`.library`を除去したもの）と、その絶対パスの辞書。
    """
    return eagle_library_dict

@app.get("/library/get/{library_name}")
async def get_library_path(library_name: str):
    """
    指定されたライブラリ名に基づいてライブラリのパスを取得するエンドポイント。

    Args:
        library_name (str): 取得するライブラリの名前。

    Returns:
        dict: ライブラリのパスを含む辞書。

    Raises:
        HTTPException: ライブラリが見つからない場合は404エラーを返します。
    """
    if library_name in eagle_library_dict:
        return {"path": eagle_library_dict[library_name]}
    else:
        raise HTTPException(status_code=404, detail="Library not found")

@app.get("/library/switch/{library_name}")
async def switch_library(library_name: str):
    """
    指定されたライブラリ名に基づいてEagleのライブラリを切り替えるエンドポイント。

    Args:
        library_name (str): 切り替えるライブラリの名前。

    Returns:
        dict: 切り替え成功メッセージを含む辞書。

    Raises:
        HTTPException: ライブラリが見つからない、またはパスが存在しない場合は404エラーを返します。
    """
    if library_name in eagle_library_dict:
        path = Path(eagle_library_dict[library_name])
        if path.exists():
            my_eagle.switch_library(path.as_posix())
            return {"message": f"Switched to library: {library_name}"}
        else:
            raise HTTPException(status_code=404, detail="Library path does not exist")
    else:
        raise HTTPException(status_code=404, detail="Library not found")

@app.get("/library/current")
async def get_current_library():
    """
    現在Eagleでアクティブになっているライブラリ名を取得するエンドポイント。

    Returns:
        str: 現在のライブラリ名。

    Raises:
        HTTPException: ライブラリ情報が見つからない場合は404エラーを返します。
    """
    library_info = my_eagle.get_library_info().get("library").get("name")
    if library_info:
        return library_info
    else:
        raise HTTPException(status_code=404, detail="Library information not found")

def get_original_image_path(image_id: str) -> tuple[Path, dict]:
    """
    オリジナル画像のパスとメタデータを取得する関数。

    Args:
        image_id (str): 画像のID。

    Returns:
        tuple[Path, dict]: オリジナル画像のパスと画像メタデータのタプル。

    Raises:
        HTTPException: 画像が見つからない場合は404エラーを返します。
    """
    thumbnail_path = urllib.parse.unquote(my_eagle.get_thumbnail_path(image_id))
    image_data = my_eagle.get_item_info(image_id)
    ext = image_data.get("ext")
    name = image_data.get("name")
    filename = f"{name}.{ext}"
    image_dir = Path(thumbnail_path).parent
    image_path = image_dir / filename

    if not image_path.exists():
        # オリジナル画像が見つからない場合はサムネイルパスを返す
        return Path(thumbnail_path), image_data

    return image_path, image_data

@app.get("/library/image/{image_id}")
async def get_image(image_id: str):
    """
    指定された画像IDに基づいて画像ファイルを取得するエンドポイント。
    画像サイズが300KBを超える場合はストリーミングで、それ以下の場合は直接ファイルを返します。

    Args:
        image_id (str): 取得する画像のID。

    Returns:
        FileResponseまたはStreamingResponse: 画像ファイルと関連するメタデータを返します。
    """
    image_path, image_data = get_original_image_path(image_id)
    ext = image_path.suffix.lstrip(".").lower()
    
    # ファイルが存在しない場合は404エラー
    if not image_path.exists():
        raise HTTPException(status_code=404, detail=f"Image file not found for ID: {image_id}")

    headers = {"Cache-Control": "public, max-age=31536000", "Image-Data": json.dumps(image_data)}

    if image_path.stat().st_size > 300 * 1024:
        # 300KBを超える場合はストリーミングで返す
        with image_path.open("rb") as f:
            file_data = BytesIO(f.read())
            return StreamingResponse(file_data, media_type=f"image/{ext}", headers=headers)
    else:
        # 300KB以下の場合はオリジナル画像を返す
        return FileResponse(image_path, media_type=f"image/{ext}", headers=headers)

@app.get("/library/image_list")
async def get_image_list(limit: int = 100, offset: int = 0, folderId: str = None):
    """
    現在のライブラリ内の画像リストとサムネイルURLを取得するエンドポイント。
    Eagle APIから画像情報を取得し、サムネイルURLを付加して返します。

    Args:
        limit (int, optional): 取得する画像の最大数。デフォルトは100。
        offset (int, optional): 取得開始位置のオフセット。デフォルトは0。
        folderId (str, optional): フィルタリングするフォルダのID。指定しない場合は全ての画像。

    Returns:
        list: 画像情報（IDとサムネイルURL）のリスト。

    Raises:
        HTTPException: Eagle APIからの画像リスト取得に失敗した場合にエラーを返します。
    """
    url = f'http://localhost:41595/api/item/list?limit={limit}'
    if folderId:
        url += f'&folders={folderId}'

    resp = requests.get(url)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail="Failed to fetch image list from Eagle API")

    data = resp.json().get("data", [])
    if offset:
        data = data[offset:]

    image_list_with_thumbnails = [
        {
            "id": item["id"],
            "thumbnailUrl": f"{API_BASE_URL}/library/image/{item['id']}"
        }
        for item in data
    ]

    return image_list_with_thumbnails

@app.get("/folder/list")
async def get_folder_list():
    """
    現在のEagleライブラリのフォルダリストを取得するエンドポイント。
    Eagle APIからフォルダ情報を取得して返します。

    Returns:
        list: フォルダ情報のリスト。

    Raises:
        HTTPException: Eagle APIからのフォルダリスト取得に失敗した場合にエラーを返します。
    """
    resp = requests.get('http://localhost:41595/api/folder/list')
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail="Failed to fetch folder list from Eagle API")
    return resp.json().get("data", [])

@app.get("/api/item/info/{image_id}")
async def get_item_info_by_id(image_id: str):
    """
    指定されたIDを持つ画像のメタデータ（情報）をJSON形式で取得するエンドポイント。
    Eagle APIから直接画像情報を取得します。

    Args:
        image_id (str): 情報を取得したい画像のID。

    Returns:
        dict: Eagleから取得した画像のメタデータ。

    Raises:
        HTTPException: 画像が見つからない場合、またはEagle APIからの取得に失敗した場合にエラーを返します。
    """
    try:
        image_data = my_eagle.get_item_info(image_id)
        if not image_data:
            raise HTTPException(status_code=404, detail=f"Image with ID '{image_id}' not found.")
        return image_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while fetching item info: {str(e)}")