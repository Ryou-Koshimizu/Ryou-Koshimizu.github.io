# LUMEN 公開前チェックリスト（2026-06-10 診断時点）

公開（ドメイン取得・サーバーアップ）前に、上から順に必ず潰すこと。
🔴 = 公開ブロッカー（これを残したまま公開しない） / 🟡 = 公開直後までに対応

---

## 🔴 1. 実績数値・お客様の声・事例の事実確認【最重要・法令】

サイト全体に以下の「実績」が記載されている：

- 支援実績 **120件以上**（index/aboutほか、**titleタグにも記載**）
- 平均問い合わせ増加 **3.2倍** / 継続率 **96%** / 最短納品 **14日**
- お客様の声（A.K.様・T.N.様・M.S.様、★5）
- cases.html の Before/After 事例6件（整骨院 +6倍 など）
- cases.html のJSON-LDには「**LUMENが支援した実際の改善事例**」と機械可読で宣言済み

**これらが事実でない（または証憑を出せない）場合、公開すると景品表示法の優良誤認・
2023年10月施行のステマ規制（虚偽レビュー）に抵触するリスクがある。**
構造化データに虚偽を載せるとGoogleペナルティ・AIへの誤情報学習の原因にもなる。

対応（どちらか）:
- [ ] 全数値・事例・声が事実であることを確認し、根拠資料を残す
- [ ] 事実でないものは削除し、「創業の経緯・代表の経歴・制作ポリシー・モニター価格・
      返金/品質保証」など実績ゼロでも成立する信頼要素に差し替える
      （差し替え作業はClaude Codeに依頼すればすぐできる）

## 🔴 2. 問い合わせフォームの送信先設定

旧実装は**送信せずに「送信完了」を表示するダミー**だった（問い合わせ全損）。
現在は `js/script.js` の `setupForm()` 内 `FORM_ENDPOINT` にURLを入れると実送信される。
未設定の間は「準備中」の正直な案内が出る（偽の完了表示はしない）。

- [ ] フォームサービスを契約し、URLを `FORM_ENDPOINT` に設定する
  - Formspree（無料50件/月）: https://formspree.io → `https://formspree.io/f/xxxxxxxx`
  - SSGform（国産・無料）: https://ssgform.com
- [ ] テスト送信して自分のメールに届くことを確認
- [ ] スパム対策のhoneypot（`_gotcha`）は実装済み。Formspree側でもreCAPTCHA設定推奨

## 🔴 3. ドメイン確定後の一括置換（153箇所）

`https://YOUR-DOMAIN.com` が **17ファイル・153箇所**（canonical / OGP / JSON-LD /
robots.txt / sitemap.xml）に入っている。ドメイン取得後、フォルダ直下で：

```bash
# 例: 実ドメインが https://lumen-web.jp の場合
grep -rl 'YOUR-DOMAIN.com' --include='*.html' --include='*.xml' --include='*.txt' . \
  | xargs sed -i '' 's|YOUR-DOMAIN\.com|lumen-web.jp|g'
```

- [ ] 置換後に `grep -r "YOUR-DOMAIN" .` が0件であること

## 🔴 4. ※プレースホルダの実値入力（NAP統一）

残っている主な ※ 箇所：

| 項目 | ファイル |
|---|---|
| 代表者氏名（4箇所） | about.html（本文+Organization schema）/ law.html |
| 住所（都道府県・市区町村・番地） | index.html schema / about.html / law.html |
| 電話番号（3箇所） | index.html schema / about.html / law.html |
| メールアドレス（4箇所） | about.html / law.html / privacy.html |
| sameAs：GBP/Instagram/X のURL（7ファイル） | index/about/faq/contact/flow/cases ほか |
| 代表者プロフィール・経歴 | about.html PROFILE セクション |

- [ ] **NAP（屋号・住所・電話）の表記を全ページ・全媒体で1字も違わず統一**する
      （表記ゆれはMEO・エンティティ認識を直接弱める）
- [ ] sameAsはアカウントが実在するものだけ残し、無いものは配列から削除
      （ダミーURLを残すとschema検証エラー）

## 🟡 5. OGP画像・favicon

- [x] `ogp.png`（1200×630）を生成済み。全ページの `og:image` は
      `https://YOUR-DOMAIN.com/ogp.png` を参照（手順3の置換で有効になる）
- [ ] 気に入らなければ差し替え（サイズは1200×630を維持）
- [ ] favicon が無い。正方形ロゴ（512×512推奨）を用意して全ページ `<head>` に
      `<link rel="icon" href="favicon.png">` を追加（Claude Codeに依頼可）

## 🟡 6. Googleビジネスプロフィール（MEO の土台）

- [ ] 開業届・所在地確定後、GBPを作成（カテゴリ:「ウェブサイト制作会社」主、
      「マーケティングコンサルタント」副など）
- [ ] NAP をサイトと完全一致させる
- [ ] 取得したGBPのURLを全ページの `sameAs` に追加
- [ ] 営業時間・サービス・写真・説明文（エンティティ定義文と同じ言い回し）を登録

## 🟡 7. 公開直後にやること

- [ ] Google Search Console 登録 → `sitemap.xml` 送信
- [ ] GA4 設定（FAQで「GA4対応」を謳っているので自社サイトにも入れる）
- [ ] Bing Webmaster Tools 登録（ChatGPT検索はBingインデックスを参照）
- [ ] `https://ドメイン/robots.txt` が見えること・AIボット許可が生きていることを確認
- [ ] リッチリザルトテスト: https://search.google.com/test/rich-results で
      index/faq/pricing を検証（※入りschemaのエラーが消えていること）
- [ ] 表示速度: PageSpeed Insights でモバイル計測（WebGL/GSAPが重い場合は
      index のローディング演出の短縮を検討）

## 🟡 8. 公開2〜4週間後の計測ループ（AI引用チェック）

以下のクエリを ChatGPT(検索ON)・Perplexity・Google(AI Overviews) で実際に叩き、
自社が出るか・誰が引用されているかを記録する：

1. 「ホームページ制作 初期費用0円 月額制 おすすめ」
2. 「HP制作 サブスク 所有権譲渡」
3. 「LP制作 月額 29800円」
4. 「AI検索対策（AEO/GEO）を頼める制作会社」
5. 「飲食店 ホームページ 食べログ依存 やめたい」
6. 「整骨院 ホームページ集客 Googleマップ」
7. 「LUMEN Webサイト制作」（指名検索）
8. 「中小企業 ホームページ制作 保守込み 月額」

→ 出なかったクエリに対応するページ（hp/lp/pricing/restaurant/seikotsuin）の
   FAQ・本文を強化して再計測（LUMEN Analyticsで構造スコアの推移も記録）。

## メモ

- `img/hero.webp`（184KB）はどのページからも参照されていない未使用ファイル。
  使う予定がなければ削除してよい（転送量削減）。
- restaurant.html / seikotsuin.html をナビ・フッターに追加済み（孤立ページ解消）。
- FAQのアコーディオンはJS開閉だが、回答テキストはHTMLに常時存在するため
  AIクローラは読める（問題なし）。
