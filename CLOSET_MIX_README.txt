CLOSET MIX 服だけ合成＋既存15ポーズの繰り返し試着

1. CLOSET_MIX_outfit_pose_index.html を GitHub の index.html に上書きします。
2. 通常のAI試着は既存の本番Workerを使用し、変更しません。
3. ポーズを変える新機能を動かすには、実験用の Cloudflare Worker closet-mix-tryon-v19 に CLOSET_MIX_pose_experiment_worker.js を貼り付けて Deploy してください。※ 本番 closet-mix-tryon には絶対に貼らないでください。
4. 実験用Workerの Settings -> Bindings に Workers AI の binding名 AI が必要です。
5. コーデで服2点（上着とパンツ）を選択 → ①服だけ組み合わせる → ポーズ選択 → 着せる / 次のポーズで着せる。
6. 元写真の背景は除去しません。これは画像の上下配置機能であり、服の輪郭切り抜きではありません。
7. AI試着は生成結果が不安定になる可能性があります。半ズボン・袖なしを完全に防ぐ保証はありません。
8. CLOSET_MIX_before_outfit_pose.html は変更前のバックアップです。
