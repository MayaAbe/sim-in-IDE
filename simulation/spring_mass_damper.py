# simulation/spring_mass_damper.py
def simulate(mass=1.0, damping=0.2, stiffness=10.0, x0=1.0, v0=0.0, t_end=10.0, dt=0.01):
    """
    ばね‐マス‐ダンパ系のシミュレーションをEuler法で実行します。
    戻り値は時刻と変位のリストを含む辞書です。
    """
    times = []
    positions = []

    t = 0.0
    x = x0
    v = v0

    while t <= t_end:
        times.append(t)
        positions.append(x)

        # 加速度の計算： a = -(damping/mass)*v - (stiffness/mass)*x
        a = -(damping/mass)*v - (stiffness/mass)*x

        # Euler法による数値積分
        v = v + a * dt
        x = x + v * dt

        t += dt

    return {"time": times, "position": positions}
