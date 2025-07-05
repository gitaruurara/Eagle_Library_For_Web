# Backend Documentation

このディレクトリには、Eagle Web Interfaceのバックエンドサービスを構成するPythonコードが含まれています。FastAPIフレームワークを使用して構築されており、Eagleアプリケーションとの連携、ライブラリの管理、画像データの提供などを行います。

## アーキテクチャ

バックエンドは以下の主要なコンポーネントで構成されています。

*   **`main.py`**: Uvicornサーバーを起動するためのエントリポイント。
*   **`fast_app.py`**: FastAPIアプリケーションインスタンスを初期化し、基本的なミドルウェア（CORSなど）を設定します。
*   **`eagle_endpoint.py`**: すべてのAPIエンドポイントを定義し、クライアントからのリクエストを処理します。`eagle_library.py` と連携してEagleの機能を提供します。
*   **`eagle_library.py`**: Eagleアプリケーションのライブラリ検出と操作（ライブラリの切り替え、アイテム情報の取得など）を担当します。設定ファイルから検索パスを読み込みます。
*   **`settings.py`**: アプリケーションの設定（Eagleライブラリの検索パス、CORSオリジンなど）を管理します。これらの設定は `settings.json` ファイルから動的に読み込まれます。
*   **`get_ip.py`**: サーバーのローカルIPアドレスを取得するためのユーティリティスクリプト。

## モジュール概要

### `main.py`

Uvicornサーバーを起動し、`eagle_endpoint.py` で定義されたFastAPIアプリケーションを実行します。開発時には `--reload` オプションを付けて実行することで、コードの変更が自動的に反映されます。

### `fast_app.py`

FastAPIの `app` インスタンスを作成し、CORS (Cross-Origin Resource Sharing) ミドルウェアを設定します。これにより、異なるオリジンからのフロントエンドリクエストを許可します。

### `eagle_endpoint.py`

このアプリケーションの主要なAPIエンドポイントが定義されています。以下のような機能を提供します。

*   `/library_list`: 利用可能なEagleライブラリのリストを返します。
*   `/library/get/{library_name}`: 指定されたライブラリ名のパスを返します。
*   `/library/switch/{library_name}`: Eagleアプリケーションのアクティブなライブラリを切り替えます。
*   `/library/current`: 現在アクティブなEagleライブラリの名前を返します。
*   `/library/image/{image_id}`: 指定されたIDの画像ファイル（オリジナルまたはサムネイル）を返します。
*   `/library/image_list`: 現在のライブラリ内の画像リストとサムネイルURLを返します。
*   `/folder/list`: 現在のライブラリ内のフォルダリストを返します。
*   `/api/item/info/{image_id}`: 指定されたIDの画像のメタデータ（情報）を返します。

### `eagle_library.py`

`settings.py` で指定されたパス以下を再帰的に検索し、`.library` 拡張子を持つEagleライブラリフォルダを検出します。また、`eaglewrapper` ライブラリを使用してEagleアプリケーションと直接通信し、ライブラリの切り替えやアイテム情報の取得などを行います。

### `settings.py`

アプリケーションの起動時に `settings.json` ファイルから設定を読み込みます。これにより、環境固有の設定をコードベースから分離し、Gitリポジトリにコミットされないようにします。

### `get_ip.py`

現在のマシンのローカルIPアドレスを取得するためのシンプルなユーティリティスクリプトです。

## 設定 (`settings.json`)

バックエンドの設定は `backend/settings.json` ファイルで行います。このファイルはGit管理から除外されており、`backend/settings.json.example` をテンプレートとして使用します。

```json
{
  "EAGLE_LIBRARY_SEARCH_PATH": "/Volumes/ARU",
  "ALLOW_ORIGINS": ["*"]
}
```

*   `EAGLE_LIBRARY_SEARCH_PATH`: Eagleライブラリ（`.library` フォルダ）を検索するルートパスを指定します。例: `"/Volumes/ARU"`
*   `ALLOW_ORIGINS`: CORS (Cross-Origin Resource Sharing) の許可オリジンを指定します。開発中は `["*"]` で全てを許可できますが、本番環境では具体的なオリジンを指定することを推奨します。

## 開発

バックエンドのコードを変更した場合、`main.py` を `--reload` オプション付きで実行していれば、変更は自動的に反映されます。

新しいPythonパッケージを追加した場合は、`requirements.txt` を更新してください。

```bash
pip install <package-name>
pip freeze > requirements.txt
```