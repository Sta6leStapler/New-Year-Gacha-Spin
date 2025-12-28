# 🎍 New Year Gacha Spin (お年玉ルーレット)

お正月のお年玉の金額をランダムに決定する、Webブラウザ用ルーレットアプリです。
スマホやPCからアクセスし、その場ですぐに盛り上がれるように設計されています。

[こちらから](https://new-year-gacha-spin.vercel.app/)

## ✨ 特徴

* **完全レスポンシブ対応:** PC、タブレット、スマホ（縦・横）どの画面でも崩れずに表示されます。
* **カスタマイズ可能:** 項目名、色、当選確率（見た目上の幅）を自由に設定可能。
* **裏モード（Secret Mode）搭載:**
    * 「見た目の幅」と「実際の当選確率」を別々に設定できる機能を搭載。
    * URLに特定のパラメータをつけることで、管理者だけが裏確率を設定可能になります。
* **演出:** 回転時のドラムロール音、当選時のファンファーレ、減速アニメーションでワクワク感を演出。
* **分割配置機能:** 1つの項目をルーレット上に複数箇所に分散させ、見た目を華やかにできます。
* **設定の保存:** ブラウザのローカルストレージに設定を保存するため、リロードしても設定が消えません。
* **インストール不要:** ブラウザさえあれば動作します。

## 🛠️ 技術スタック

* **Backend:** Python 3.12 (Flask)
* **Frontend:** HTML5, CSS3, JavaScript (Vanilla JS, Canvas API)
* **Deployment:** Vercel (Serverless Function)

## 🚀 使い方

### 1. 通常モード（子供・親戚用）
URLにアクセスするだけで遊べます。
画面下の「⚙️ 管理者設定を開く」から、項目の追加・削除・色の変更が可能です。

### 2. 設定方法
画面最下部の設定パネルを開いて編集します。

* **名前:** 項目名（金額など）。
* **見た目:** ルーレット上での扇形の広さ。
* **分割:** その項目をルーレット上で何箇所に分散させるか（例: `3`にすると3つに分かれて配置されます）。
* **メッセージ:** 当選時に表示されるお祝いメッセージ（例: 「おめでとう！」「神引き！！」）。

### 3. 裏モード（管理者用）
URLの末尾に `/?mode=secret` を付けてアクセスします。

* 例: `https://your-app-url.vercel.app/?mode=secret`
* 設定パネルに**「裏確率」**という赤背景の列が出現します。
* ここで設定した数値が**実際の抽選確率**として使用されます（見た目の幅は無視されます）。

## 💻 ローカルでの実行方法

開発やカスタマイズを行う場合の手順です。

1.  **リポジトリをクローン**
    ```bash
    git clone [input URL]
    cd new-year-gacha
    ```

2.  **仮想環境の作成と有効化**
    ```bash
    # Windows
    python -m venv venv
    .\venv\Scripts\Activate

    # Mac/Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **依存ライブラリのインストール**
    ```bash
    pip install -r requirements.txt
    ```

4.  **アプリの起動**
    ```bash
    python app.py
    ```

5.  **ブラウザでアクセス**
    `http://127.0.0.1:5000` または `http://[PCのIPアドレス]:5000`

## ☁️ デプロイ (Vercel)

このプロジェクトは `vercel.json` を含んでいるため、Vercelにインポートするだけで動作します。

1.  GitHubにコードをプッシュ。
2.  Vercelのダッシュボードで "Add New Project" > "Import Git Repository"。
3.  設定変更なしで "Deploy" をクリックするだけで完了です。

## 📂 ディレクトリ構成

```text
.
├── app.py              # Flaskバックエンド
├── requirements.txt    # 依存ライブラリ
├── vercel.json         # Vercel設定ファイル
├── static/
│   ├── css/
│   │   └── style.css   # スタイルシート
│   ├── js/
│   │   └── script.js   # ルーレット描画・ロジック
│   └── sounds/         # 音声ファイル (drum.mp3, fanfare.mp3)
└── templates/
    └── index.html      # メインHTML
```

## ⚠️ 注意事項
iOS（iPhone）では、マナーモードがオンになっているとブラウザの音が鳴らない場合があります。使用時はマナーモードを解除してください。

設定はブラウザごとに保存されます。本番で使用する端末（スマホやタブレット）で事前に設定を行ってください。

## License
This project is licensed under the MIT License.

## Credits
Font: Yusei Magic

Sound Effects: 効果音ラボ
