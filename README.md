# Eagle Web Interface

このプロジェクトは、[Eagle](https://eagle.cool/) ソフトウェアで管理されているライブラリをWebブラウザから管理・閲覧するためのインターフェースを提供します。Eagleは、画像、ビデオ、オーディオ、ドキュメントなど、あらゆる種類のデジタルアセットを収集、整理、参照するための強力なツールです。このWebインターフェースは、Eagleアプリケーションがインストールされている環境で、そのライブラリにWebブラウザ経由でアクセスすることを可能にします。

## セットアップ

### 前提条件

*   Python 3.8以上
*   Node.js (LTS推奨)
*   npm または Yarn

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-username/eagle_web.git
cd eagle_web
```

### 2. バックエンドのセットアップ

Pythonの依存関係をインストールします。

```bash
pip install -r requirements.txt
```

### 3. フロントエンドのセットアップ

Node.jsの依存関係をインストールします。

```bash
npm install
# または yarn install
```

## 設定

バックエンドの設定は `backend/settings.json` ファイルで行います。このファイルはGit管理から除外されているため、`backend/settings.json.example` をコピーして作成してください。

```bash
cp backend/settings.json.example backend/settings.json
```

`backend/settings.json` をテキストエディタで開き、以下の項目を設定します。

*   `EAGLE_LIBRARY_SEARCH_PATH`: Eagleライブラリ（`.library` フォルダ）を検索するルートパスを指定します。例: `"set/your/path/to/library"`
*   `ALLOW_ORIGINS`: CORS (Cross-Origin Resource Sharing) の許可オリジンを指定します。開発中は `["*"]` で全てを許可できますが、本番環境では具体的なオリジンを指定することを推奨します。例: `["http://localhost:3000", "https://your-domain.com"]`

```json
{
  "EAGLE_LIBRARY_SEARCH_PATH": "set/your/path/to/library",
  "ALLOW_ORIGINS": ["*"]
}
```

## アプリケーションの実行

### 1. バックエンドの起動

プロジェクトのルートディレクトリから以下のコマンドを実行します。

```bash
uvicorn eagle_endpoint:app --reload --host 0.0.0.0 --port 8000
```

または、`start_uvicorn.command` スクリプトを使用することもできます。

### 2. フロントエンドの起動

新しいターミナルを開き、プロジェクトのルートディレクトリから以下のコマンドを実行します。

```bash
npm run dev
# または yarn dev
```

通常、ブラウザで `http://localhost:5173` (Viteのデフォルトポート) が開かれ、アプリケーションにアクセスできます。

## 開発

### コードの変更

*   バックエンド: `backend/` ディレクトリ内のPythonファイルを編集します。`uvicorn` の `--reload` オプションにより、変更が自動的に反映されます。
*   フロントエンド: `src/` ディレクトリ内のReact/TypeScriptファイルを編集します。`npm run dev` により、変更が自動的にリロードされます。

### 依存関係の追加

*   Python: `pip install <package-name>` でインストール後、`pip freeze > requirements.txt` で `requirements.txt` を更新します。
*   Node.js: `npm install <package-name>` または `yarn add <package-name>` でインストール後、`package.json` と `package-lock.json` (または `yarn.lock`) が更新されます。
