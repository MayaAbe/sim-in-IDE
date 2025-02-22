# server/app.py
from flask import Flask, request, jsonify, send_from_directory
import os
import io
import contextlib

app = Flask(__name__, static_folder='../client', static_url_path='')

# ばね‐マス‐ダンパシミュレーションの関数をインポート
from simulation.spring_mass_damper import simulate

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/run_simulation', methods=['POST'])
def run_simulation():
    # エディタから送信されたPythonコードを受け取る
    user_code = request.form.get('code', '')

    # 実行環境にsimulate関数を渡す
    local_env = {"simulate": simulate}

    # 標準出力をキャプチャ
    output = io.StringIO()
    with contextlib.redirect_stdout(output):
        try:
            exec(user_code, {}, local_env)
        except Exception as e:
            return jsonify({"error": str(e)})

    # ユーザコードはシミュレーション結果を変数 result に格納する想定
    if "result" in local_env:
        result = local_env["result"]
        return jsonify({"result": result, "output": output.getvalue()})
    else:
        return jsonify({"error": "シミュレーション結果が見つかりません。result変数に結果を代入してください。"})

if __name__ == '__main__':
    app.run(debug=True)
