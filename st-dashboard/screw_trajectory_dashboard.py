"""
screw_trajectory_dashboard.py

Same screw-trajectory optimization model as screw_trajectory_planner.py,
but rendered as a single combined "dashboard" figure:

    +---------------------+---------------------------+
    |  INPUTS panel       |                           |
    +---------------------+   3D geometry view         |
    |  OUTPUTS panel      |   (physis, hemisphere,     |
    +---------------------+    screw, key points)      |
    |  Thread purchase vs. beta_S curve, with the       |
    |  chosen inputs and the resulting optimum labeled  |
    +----------------------------------------------------+

This is a geometric/engineering planning and teaching aid only.
It is NOT a substitute for clinical judgment, intraoperative
fluoroscopy, or validated surgical planning software.
"""

import numpy as np
from scipy.optimize import minimize_scalar
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from mpl_toolkits.mplot3d.art3d import Poly3DCollection


# ======================================================================
# Core geometry
# ======================================================================
def thread_length_inside(betaS_deg, alphaS_deg, N_normal, C, P0, R, L, Lth):
    dir_vec = np.array([np.tan(np.radians(alphaS_deg)),
                         np.tan(np.radians(betaS_deg)),
                         1.0])
    uS = dir_vec / np.linalg.norm(dir_vec)

    denom = np.dot(uS, N_normal)
    s_physis = np.inf if abs(denom) < 1e-9 else np.dot(C - P0, N_normal) / denom

    diff = P0 - C
    b = np.dot(uS, diff)
    c = np.dot(diff, diff) - R ** 2
    disc = b ** 2 - c
    if disc < 0:
        return 0.0, s_physis, -np.inf, False

    sqrt_disc = np.sqrt(disc)
    s_sphere = max(-b - sqrt_disc, -b + sqrt_disc)

    thread_start, thread_end = L - Lth, L
    zone_start, zone_end = max(0.0, s_physis), s_sphere
    ov_start, ov_end = max(thread_start, zone_start), min(thread_end, zone_end)

    L_inside = max(0.0, ov_end - ov_start)
    penetration = L > s_sphere
    return L_inside, s_physis, s_sphere, penetration


# ======================================================================
# Dashboard figure
# ======================================================================
def build_dashboard():
    # ---------------- USER-DEFINED INPUTS ----------------------------
    L, Lth, pitch = 50.0, 20.0, 1.5           # screw length, thread length, pitch (mm)
    alphaS_deg = 10.0                          # fixed AP screw angle (deg)
    alphaN_deg, betaN_deg = 13.0, 15.0         # physis obliquity (deg)
    R = 22.0                                   # femoral head radius (mm)
    P0 = np.array([0.0, 0.0, 0.0])             # screw entry point
    d_axis = 35.0                              # entry-to-physis distance (mm)
    C = np.array([0.0, 0.0, d_axis])
    beta_range = (-60.0, 60.0)

    # ---------------- OPTIMIZATION ------------------------------------
    N_normal = np.array([np.tan(np.radians(alphaN_deg)),
                          np.tan(np.radians(betaN_deg)), 1.0])
    N_normal /= np.linalg.norm(N_normal)

    def neg_L_inside(betaS):
        return -thread_length_inside(betaS, alphaS_deg, N_normal, C, P0, R, L, Lth)[0]

    res = minimize_scalar(neg_L_inside, bounds=beta_range, method='bounded',
                           options={'xatol': 1e-4})
    betaS_opt = res.x
    L_max = -res.fun
    L_inside, s_physis, s_sphere, penetration = thread_length_inside(
        betaS_opt, alphaS_deg, N_normal, C, P0, R, L, Lth)
    N_threads = L_inside / pitch

    beta_vec = np.linspace(*beta_range, 400)
    L_vec = np.array([thread_length_inside(b, alphaS_deg, N_normal, C, P0, R, L, Lth)[0]
                       for b in beta_vec])

    # ---------------- FIGURE / GRID LAYOUT ----------------------------
    fig = plt.figure(figsize=(15, 11))
    fig.patch.set_facecolor('white')
    gs = gridspec.GridSpec(3, 2, height_ratios=[1.1, 1.1, 1.4], width_ratios=[1, 1.3],
                            hspace=0.45, wspace=0.28)

    ax_in = fig.add_subplot(gs[0, 0])
    ax_out = fig.add_subplot(gs[1, 0])
    ax_3d = fig.add_subplot(gs[0:2, 1], projection='3d')
    ax_curve = fig.add_subplot(gs[2, :])

    fig.suptitle('Screw Trajectory Planning — Inputs, Optimization, and Result',
                  fontsize=17, fontweight='bold', y=0.97)

    # ---- INPUTS PANEL ----
    ax_in.axis('off')
    ax_in.set_title('INPUTS', fontsize=13, fontweight='bold', loc='left', color='#0C447C')
    input_rows = [
        ('Screw total length  L', f'{L:.1f} mm'),
        ('Threaded tip length  L_th', f'{Lth:.1f} mm'),
        ('Thread pitch', f'{pitch:.2f} mm'),
        ('Fixed AP angle  \u03b1_S', f'{alphaS_deg:.1f}\u00b0'),
        ('Physis AP obliquity  \u03b1_N', f'{alphaN_deg:.1f}\u00b0'),
        ('Physis lateral obliquity  \u03b2_N', f'{betaN_deg:.1f}\u00b0'),
        ('Femoral head radius  R', f'{R:.1f} mm'),
        ('Entry-to-physis distance', f'{d_axis:.1f} mm'),
        ('Lateral angle search range', f'{beta_range[0]:.0f}\u00b0 to {beta_range[1]:.0f}\u00b0'),
    ]
    y0 = 0.92
    for label, val in input_rows:
        ax_in.text(0.02, y0, label, fontsize=10.5, color='#333333', transform=ax_in.transAxes)
        ax_in.text(0.98, y0, val, fontsize=10.5, fontweight='bold', color='#0C447C',
                   ha='right', transform=ax_in.transAxes)
        y0 -= 0.105
    for spine in ['top', 'right', 'left', 'bottom']:
        pass
    ax_in.add_patch(plt.Rectangle((0, 0), 1, 1, transform=ax_in.transAxes, fill=False,
                                   edgecolor='#B5D4F4', linewidth=1.2))

    # ---- OUTPUTS PANEL ----
    ax_out.axis('off')
    ax_out.set_title('OUTPUTS', fontsize=13, fontweight='bold', loc='left', color='#712B13')
    pen_txt = 'YES \u2013 tip breaches joint surface' if penetration else 'No'
    output_rows = [
        ('Optimal lateral angle  \u03b2_S', f'{betaS_opt:.2f}\u00b0'),
        ('Distance to physis crossing  s_physis', f'{s_physis:.2f} mm'),
        ('Distance to joint surface  s_sphere', f'{s_sphere:.2f} mm'),
        ('Threaded length inside epiphysis  L_inside', f'{L_inside:.2f} mm'),
        ('Approx. threads engaged', f'{N_threads:.1f}'),
        ('Articular penetration risk', pen_txt),
    ]
    y0 = 0.88
    for label, val in output_rows:
        ax_out.text(0.02, y0, label, fontsize=10.5, color='#333333', transform=ax_out.transAxes)
        ax_out.text(0.98, y0, val, fontsize=11, fontweight='bold', color='#712B13',
                   ha='right', transform=ax_out.transAxes)
        y0 -= 0.145
    ax_out.add_patch(plt.Rectangle((0, 0), 1, 1, transform=ax_out.transAxes, fill=False,
                                    edgecolor='#F0997B', linewidth=1.2))

    # ---- 3D GEOMETRY PANEL ----
    dir_vec = np.array([np.tan(np.radians(alphaS_deg)), np.tan(np.radians(betaS_opt)), 1.0])
    uS = dir_vec / np.linalg.norm(dir_vec)
    pt_entry = P0
    pt_physis = P0 + s_physis * uS
    pt_sphere_hit = P0 + s_sphere * uS
    pt_tip = P0 + L * uS
    pt_thread_start = P0 + max(L - Lth, 0.0) * uS

    axis_len = max(L, C[2] + R) * 1.2
    ax_3d.plot([0, 0], [0, 0], [0, axis_len], 'k--', linewidth=1.2, label='Neck axis')

    arbitrary = np.array([1.0, 0.0, 0.0])
    if abs(np.dot(arbitrary, N_normal)) > 0.9:
        arbitrary = np.array([0.0, 1.0, 0.0])
    e1 = np.cross(N_normal, arbitrary); e1 /= np.linalg.norm(e1)
    e2 = np.cross(N_normal, e1);        e2 /= np.linalg.norm(e2)
    theta = np.linspace(0, 2 * np.pi, 60)
    disk_r = R * 1.15
    disk_pts = C[:, None] + disk_r * (np.outer(e1, np.cos(theta)) + np.outer(e2, np.sin(theta)))
    ax_3d.add_collection3d(Poly3DCollection([list(zip(disk_pts[0], disk_pts[1], disk_pts[2]))],
                                             facecolor=(0.85, 0.85, 1.0, 0.35),
                                             edgecolor=(0.3, 0.3, 0.7)))

    u = np.linspace(0, 2 * np.pi, 50)
    v = np.linspace(0, np.pi, 50)
    Xs = R * np.outer(np.cos(u), np.sin(v)) + C[0]
    Ys = R * np.outer(np.sin(u), np.sin(v)) + C[1]
    Zs = R * np.outer(np.ones_like(u), np.cos(v)) + C[2]
    mask = (Xs - C[0]) * N_normal[0] + (Ys - C[1]) * N_normal[1] + (Zs - C[2]) * N_normal[2] < 0
    Xs, Ys, Zs = (np.where(mask, np.nan, arr) for arr in (Xs, Ys, Zs))
    ax_3d.plot_surface(Xs, Ys, Zs, color=(1.0, 0.8, 0.6), alpha=0.45, linewidth=0, shade=True)

    ax_3d.plot(*zip(pt_entry, pt_thread_start), color=(0.3, 0.3, 0.3), linewidth=4, label='Shank')
    ax_3d.plot(*zip(pt_thread_start, pt_tip), color=(0.85, 0.1, 0.1), linewidth=4, label='Threads')
    ax_3d.scatter(*pt_entry, color='k', s=55, label='Entry (P0)')
    ax_3d.scatter(*pt_physis, color='g', marker='^', s=65, label='Physis crossing')
    ax_3d.scatter(*pt_sphere_hit, color='m', marker='D', s=65, label='Joint surface exit')
    ax_3d.scatter(*pt_tip, color='r', marker='*', s=130, label='Tip')

    ax_3d.set_xlabel('X (AP), mm', fontsize=9)
    ax_3d.set_ylabel('Y (lateral), mm', fontsize=9)
    ax_3d.set_zlabel('Z (neck axis), mm', fontsize=9)
    ax_3d.set_title(f'Optimized 3D trajectory  (\u03b1_S={alphaS_deg:.1f}\u00b0, \u03b2_S={betaS_opt:.2f}\u00b0)',
                     fontsize=11)
    ax_3d.legend(loc='upper left', fontsize=8, bbox_to_anchor=(-0.15, 1.0))
    ax_3d.view_init(elev=18, azim=32)
    ax_3d.set_box_aspect([1, 1, 1])
    ax_3d.set_xlim(-axis_len / 2, axis_len / 2)
    ax_3d.set_ylim(-axis_len / 2, axis_len / 2)
    ax_3d.set_zlim(0, axis_len)

    # ---- OPTIMIZATION CURVE PANEL ----
    ax_curve.plot(beta_vec, L_vec, color='#185FA5', linewidth=2.2, label='L_inside(\u03b2_S)')
    ax_curve.axvline(betaS_opt, color='#993C1D', linestyle=':', linewidth=1.3)
    ax_curve.plot(betaS_opt, L_max, 'o', color='#D85A30', markersize=10, zorder=5)
    ax_curve.annotate(
        f'Optimum\n\u03b2_S = {betaS_opt:.2f}\u00b0\nL_inside = {L_max:.2f} mm',
        xy=(betaS_opt, L_max), xytext=(betaS_opt + 8, L_max * 0.6),
        fontsize=10, fontweight='bold', color='#712B13',
        arrowprops=dict(arrowstyle='->', color='#712B13', linewidth=1.3))
    ax_curve.set_xlabel('Lateral view angle \u03b2_S (deg)', fontsize=11)
    ax_curve.set_ylabel('Threaded length inside epiphysis, L_inside (mm)', fontsize=11)
    ax_curve.set_title(f'Thread purchase vs. lateral angle  (\u03b1_S fixed at {alphaS_deg:.1f}\u00b0)',
                        fontsize=12)
    ax_curve.grid(True, alpha=0.3)
    ax_curve.legend(loc='upper right', fontsize=9)

    fig.savefig('screw_trajectory_dashboard.png', dpi=160, bbox_inches='tight')
    return fig, dict(alpha_S=alphaS_deg, beta_S=betaS_opt, L_inside=L_inside,
                      N_threads=N_threads, s_physis=s_physis, s_sphere=s_sphere,
                      penetration=penetration)


if __name__ == '__main__':
    fig, results = build_dashboard()
    print(results)
    plt.show()
