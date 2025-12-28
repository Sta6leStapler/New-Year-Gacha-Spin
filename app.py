import os
import random
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/spin', methods=['POST'])
def spin():
    """
    クライアントから送られたアイテムリストとモード設定に基づいて抽選を行うAPI
    """
    data = request.json
    items = data.get('items', [])
    # クライアント側でURLパラメータなどから判定した「秘密モードフラグ」を受け取る
    is_secret_mode = data.get('is_secret', False)

    if not items:
        return jsonify({'error': 'No items provided'}), 400

    # 抽選に使用する重みリストを作成
    weights = []
    for item in items:
        if is_secret_mode:
            # 秘密モードの場合、裏の設定値(real_weight)を使用
            # 設定がない場合はデフォルトで1(またはvisual_weight)を使うなどの安全策
            weight = float(item.get('real_weight', 1))
        else:
            # 通常モードの場合、見た目の設定値(visual_weight)を使用
            weight = float(item.get('visual_weight', 1))
        weights.append(weight)

    # 重みに基づいて抽選 (結果はリストのインデックス)
    # weightsの合計が0の場合はランダムにするなどの回避策
    total_weight = sum(weights)
    if total_weight <= 0:
        winner_index = random.randint(0, len(items) - 1)
    else:
        # random.choices はリストを返すが、1つだけ選ぶので [0] を取得
        winner_item = random.choices(items, weights=weights, k=1)[0]
        # 選ばれたアイテムが元のリストの何番目かを特定する（インデックスを返す）
        winner_index = items.index(winner_item)

    return jsonify({
        'winner_index': winner_index,
        'is_secret_mode': is_secret_mode
    })

if __name__ == '__main__':
    # ローカル開発用
    app.run(debug=True, port=5000)