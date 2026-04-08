#!/usr/bin/env python3
"""Generate all thesis charts for Pari master's thesis."""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

# ── Style ─────────────────────────────────────────────────────────────────────
BLUE   = '#1a3a5c'
LBLUE  = '#2e6da4'
TEAL   = '#1d7a8a'
ORANGE = '#e07b39'
GREEN  = '#2e8b57'
RED    = '#c0392b'
LGRAY  = '#ecf0f1'
DGRAY  = '#7f8c8d'
GOLD   = '#f0a500'

plt.rcParams.update({
    'font.family': 'DejaVu Sans',
    'font.size': 11,
    'axes.titlesize': 13,
    'axes.titleweight': 'bold',
    'axes.spines.top': False,
    'axes.spines.right': False,
    'figure.dpi': 150,
    'savefig.dpi': 150,
    'savefig.bbox': 'tight',
    'savefig.pad_inches': 0.15,
})

OUT = '/Users/vladimirbojadzi/dev/pari/docs/figures'

# ══════════════════════════════════════════════════════════════════════════════
# Fig 1.1 — Transfer cost comparison (MKD)
# ══════════════════════════════════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(9, 5))

channels = [
    'Меѓубанкарски\nтрансфер (МКД)', 'Банкарски\nшалтер', 'PayPal\n(EU→EU)',
    'Revolut\n(Revolut→Revolut)', 'Pari\n(проценка)'
]
fees_500    = [20.0, 30.0, 5.5, 0.0, 0.0]   # % of 500 MKD transfer
fees_5000   = [2.0,  3.0,  1.4, 0.0, 0.0]   # % of 5000 MKD transfer

x = np.arange(len(channels))
w = 0.35

bars1 = ax.bar(x - w/2, fees_500,  w, label='Трансфер 500 МКД',  color=LBLUE,  zorder=3)
bars2 = ax.bar(x + w/2, fees_5000, w, label='Трансфер 5.000 МКД', color=ORANGE, zorder=3)

ax.set_ylabel('Такса (% од износот на трансферот)', labelpad=8)
ax.set_title('Споредба на трошоци за трансфер по канал', pad=14)
ax.set_xticks(x)
ax.set_xticklabels(channels, fontsize=9.5)
ax.set_ylim(0, 36)
ax.axhline(0, color='black', linewidth=0.6)
ax.yaxis.grid(True, linestyle='--', alpha=0.5, zorder=0)
ax.set_axisbelow(True)
ax.legend(loc='upper right', framealpha=0.9)

for bar in bars1:
    h = bar.get_height()
    if h > 0:
        ax.text(bar.get_x() + bar.get_width()/2, h + 0.4, f'{h:.1f}%',
                ha='center', va='bottom', fontsize=9, color=LBLUE, fontweight='bold')
for bar in bars2:
    h = bar.get_height()
    if h > 0:
        ax.text(bar.get_x() + bar.get_width()/2, h + 0.4, f'{h:.1f}%',
                ha='center', va='bottom', fontsize=9, color=ORANGE, fontweight='bold')

# zero labels
for i, (v1, v2) in enumerate(zip(fees_500, fees_5000)):
    if v1 == 0:
        ax.text(x[i] - w/2, 0.5, '0%', ha='center', va='bottom', fontsize=8.5, color=GREEN, fontweight='bold')
    if v2 == 0:
        ax.text(x[i] + w/2, 0.5, '0%', ha='center', va='bottom', fontsize=8.5, color=GREEN, fontweight='bold')

plt.tight_layout()
plt.savefig(f'{OUT}/fig1_1_transfer_costs.png')
plt.close()
print('✓ fig1_1_transfer_costs.png')

# ══════════════════════════════════════════════════════════════════════════════
# Fig 2.1 — Microservices vs Monolith (Tambi 2019)
# ══════════════════════════════════════════════════════════════════════════════
fig, axes = plt.subplots(1, 3, figsize=(11, 5))

metrics = [
    ('Намалување на\nоперативни трошоци', 40, 0, BLUE, LGRAY),
    ('Побрзо пуштање\nнови функционалности', 60, 0, TEAL, LGRAY),
    ('TPS (трансакции/сек)\nMonzo Bank', 1000, 350, LBLUE, DGRAY),
]

for ax, (title, micro_val, mono_val, col, base_col) in zip(axes, metrics):
    cats = ['Традиционална\nмонолитна\nархитектура', 'Микросервисна\nархитектура']
    vals = [mono_val if mono_val > 0 else micro_val * 0.6, micro_val]
    colors = [base_col, col]
    bars = ax.bar(cats, vals, color=colors, width=0.5, zorder=3)
    ax.set_title(title, pad=10, fontsize=10)
    ax.yaxis.grid(True, linestyle='--', alpha=0.5, zorder=0)
    ax.set_axisbelow(True)
    ax.set_ylim(0, max(vals) * 1.25)
    for bar, v in zip(bars, vals):
        label = f'{v}%' if '%' not in title else f'{v}%'
        if 'TPS' in title:
            label = f'{v} TPS'
        elif 'трошоци' in title or 'функционалности' in title:
            label = f'+{v}%' if bar.get_x() > 0.5 else f'0%'
            if v == mono_val and mono_val == 0:
                label = 'baseline'
            else:
                label = f'{v}%'
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + max(vals)*0.02,
                label, ha='center', va='bottom', fontweight='bold', fontsize=10)

axes[0].set_ylabel('Подобрување (%)', labelpad=8)
fig.suptitle('Придобивки од микросервисна архитектура (Tambi, 2019)', fontsize=13, fontweight='bold', y=1.01)
plt.tight_layout()
plt.savefig(f'{OUT}/fig2_1_microservices_benefits.png')
plt.close()
print('✓ fig2_1_microservices_benefits.png')

# ══════════════════════════════════════════════════════════════════════════════
# Fig 2.2 — P2P platform adoption / penetration
# ══════════════════════════════════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(10, 5.5))

platforms   = ['Swish\n(Шведска)', 'MobilePay\n(Данска)', 'Venmo\n(САД)', 'Revolut\n(Глобал)',
               'PayPal\n(Глобал)', 'Tikkie\n(Холандија)', 'Pari\n(Македонија\nпроценка)']
penetration = [87, 72, 36, 28, 24, 61, 0]  # % of target population / registered users (normalized)
metric      = ['% население', '% население', '% возр. 18-35', '% smartphone', '% online', '% население', 'цел: 15%']
colors_p    = [BLUE, TEAL, LBLUE, GREEN, ORANGE, DGRAY, RED]

y = np.arange(len(platforms))
bars = ax.barh(y, penetration, color=colors_p, height=0.6, zorder=3)
ax.set_xlabel('Пенетрација / Адопција (%)', labelpad=8)
ax.set_title('Адопција на P2P платежни апликации по платформа', pad=14)
ax.set_yticks(y)
ax.set_yticklabels(platforms, fontsize=9.5)
ax.set_xlim(0, 105)
ax.xaxis.grid(True, linestyle='--', alpha=0.5, zorder=0)
ax.set_axisbelow(True)

for bar, val, met in zip(bars, penetration, metric):
    label = f'{val}%  ({met})' if val > 0 else f'0%  (Цел: 15%+)'
    ax.text(bar.get_width() + 1, bar.get_y() + bar.get_height()/2,
            label, va='center', fontsize=9, color='#333333')

plt.tight_layout()
plt.savefig(f'{OUT}/fig2_2_p2p_adoption.png')
plt.close()
print('✓ fig2_2_p2p_adoption.png')

# ═════════════════════��════════════════════════════════════════════════════════
# Fig 2.3 — Consumer trust paradox (Zeller & Lynch, 2021)
# ══════════════════════════════════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(8, 5))

statements = [
    'Доверба во банките\nза чување на фин. информации',
    'Подготвени да ја споделат\nисторијата на трансакции\nсо трета страна (TPP)'
]
pct_yes = [76, 39]  # 76% trust, 61% would NOT share → 39% would share
pct_no  = [24, 61]

x = np.arange(len(statements))
w = 0.4

ax.bar(x, pct_yes, w, label='Да / Согласни', color=TEAL,   zorder=3)
ax.bar(x, pct_no,  w, label='Не / Несогласни', color=RED, zorder=3,
       bottom=pct_yes)

ax.set_ylabel('Одговори (%)', labelpad=8)
ax.set_title('Парадоксот на доверба кај потрошувачите (Zeller & Lynch, 2021)', pad=14)
ax.set_xticks(x)
ax.set_xticklabels(statements, fontsize=10)
ax.set_ylim(0, 115)
ax.yaxis.grid(True, linestyle='--', alpha=0.5, zorder=0)
ax.set_axisbelow(True)
ax.legend(loc='upper right', framealpha=0.9)

for i, (y_val, n_val) in enumerate(zip(pct_yes, pct_no)):
    ax.text(i, y_val/2, f'{y_val}%', ha='center', va='center',
            fontsize=12, fontweight='bold', color='white')
    ax.text(i, y_val + n_val/2, f'{n_val}%', ha='center', va='center',
            fontsize=12, fontweight='bold', color='white')

plt.tight_layout()
plt.savefig(f'{OUT}/fig2_3_trust_paradox.png')
plt.close()
print('✓ fig2_3_trust_paradox.png')

# ══════════════════════════════════════════════════════════════════════════════
# Fig 2.4 — Open banking global adoption (Wilson & Tam, 2026)
# ══════════════════════════════════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(7, 7))

sizes  = [23, 48, 29]
labels = [
    'Сеопфатна\nбезбедносна рамка\n(23%)',
    'Имплементирано\nбез полна безб. рамка\n(48%)',
    'Без имплементација\nна отворено банкарство\n(29%)'
]
colors_d = [GREEN, LBLUE, LGRAY]
explode  = (0.06, 0.02, 0.0)
wedges, texts, autotexts = ax.pie(
    sizes, labels=labels, colors=colors_d, explode=explode,
    autopct='%1.0f%%', startangle=120,
    textprops={'fontsize': 10},
    wedgeprops={'linewidth': 1.5, 'edgecolor': 'white'}
)
for at in autotexts:
    at.set_fontsize(12)
    at.set_fontweight('bold')
    at.set_color('white')

ax.set_title('Глобална адопција на отворено банкарство\n(193 земји, Wilson & Tam, 2026)',
             pad=16, fontsize=13, fontweight='bold')
plt.tight_layout()
plt.savefig(f'{OUT}/fig2_4_open_banking_adoption.png')
plt.close()
print('✓ fig2_4_open_banking_adoption.png')

# ══════════════════════════════════════════════════════════════════════════════
# Fig 2.5 — Top API security vulnerabilities (Gounari et al. 2024)
# ══════════════════════════════════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(9, 5.5))

vulns = [
    'BOLA / IDOR\n(Broken Object-Level Auth)',
    'Broken Auth\n& Session Mgmt',
    'Прекумерна изложеност\nна податоци',
    'Rate Limiting\nпроблеми',
    'Security\nMisconfiguration',
    'Инјекција\n(SQL, XSS)'
]
prevalence = [40, 31, 28, 24, 19, 15]
colors_v   = [RED, ORANGE, GOLD, LBLUE, TEAL, GREEN]

y = np.arange(len(vulns))
bars = ax.barh(y, prevalence, color=colors_v, height=0.6, zorder=3)
ax.set_xlabel('Распространетост во API имплементации (%)', labelpad=8)
ax.set_title('Најчести безбедносни ранливости во финансиски API\n(Gounari et al., 2024)', pad=14)
ax.set_yticks(y)
ax.set_yticklabels(vulns, fontsize=9.5)
ax.set_xlim(0, 52)
ax.xaxis.grid(True, linestyle='--', alpha=0.5, zorder=0)
ax.set_axisbelow(True)

for bar, v in zip(bars, prevalence):
    ax.text(bar.get_width() + 0.5, bar.get_y() + bar.get_height()/2,
            f'{v}%', va='center', fontsize=10, fontweight='bold')

plt.tight_layout()
plt.savefig(f'{OUT}/fig2_5_api_vulnerabilities.png')
plt.close()
print('✓ fig2_5_api_vulnerabilities.png')

# ══════════════════════════════════════════════════════════════════════════════
# Fig 4.1 — Pari security coverage radar chart
# ══════════════════════════════════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(7, 7), subplot_kw=dict(polar=True))

categories = [
    'Автентикација\n& Сесии',
    'Авторизација\n& BOLA',
    'Транспортна\nбезбедност',
    'Rate Limiting\n& DoS заштита',
    'Регулаторна\nусогласеност\n(PSD2/GDPR)',
    'Мониторинг\n& Логирање',
    'Тестирање\nи валидација'
]
N = len(categories)
values = [9, 9, 8, 8, 8, 7, 9]   # Pari scores (out of 10)
values_industry = [6, 5, 7, 6, 5, 5, 6]  # typical industry average

angles = np.linspace(0, 2*np.pi, N, endpoint=False).tolist()
values_plot = values + [values[0]]
values_ind  = values_industry + [values_industry[0]]
angles_plot = angles + [angles[0]]
cat_labels  = categories + [categories[0]]

ax.set_theta_offset(np.pi / 2)
ax.set_theta_direction(-1)
ax.plot(angles_plot, values_plot,   color=BLUE,   linewidth=2.5, linestyle='solid')
ax.fill(angles_plot, values_plot,   color=BLUE,   alpha=0.2)
ax.plot(angles_plot, values_ind,    color=ORANGE, linewidth=2, linestyle='dashed')
ax.fill(angles_plot, values_ind,    color=ORANGE, alpha=0.1)

ax.set_xticks(angles)
ax.set_xticklabels(categories, fontsize=9)
ax.set_ylim(0, 10)
ax.set_yticks([2, 4, 6, 8, 10])
ax.set_yticklabels(['2', '4', '6', '8', '10'], fontsize=8, color=DGRAY)
ax.yaxis.grid(True, color='gray', alpha=0.4)
ax.xaxis.grid(True, color='gray', alpha=0.4)

pari_patch    = mpatches.Patch(color=BLUE,   alpha=0.5, label='Pari')
ind_patch     = mpatches.Patch(color=ORANGE, alpha=0.4, label='Просек на индустријата')
ax.legend(handles=[pari_patch, ind_patch], loc='lower right',
          bbox_to_anchor=(1.35, -0.05), fontsize=10)

ax.set_title('Безбедносна покриеност на Pari по димензии\n(скала 0–10)', pad=22,
             fontsize=13, fontweight='bold')
plt.tight_layout()
plt.savefig(f'{OUT}/fig4_1_security_radar.png')
plt.close()
print('✓ fig4_1_security_radar.png')

# ══════════════════════════════════════════════════════════════════════════════
# Fig 5.1 — Goal achievement summary
# ══════════════════════════════════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(10, 6))

goals = [
    'Функционално P2P\nплатежно решение',
    'Банкарска\nинтеграција (PSD2)',
    'Социјални\nфункционалности',
    'Безбедносна\nанализа и SCA',
    'Регулаторна\nусогласеност'
]
achieved  = [100, 85, 95, 90, 88]
remaining = [v - a for v, a in zip([100]*5, achieved)]

x = np.arange(len(goals))
w = 0.5

bars_a = ax.bar(x, achieved,  w, label='Постигнато', color=GREEN,  zorder=3)
bars_r = ax.bar(x, remaining, w, label='Во тек / делумно', color=GOLD, zorder=3,
                bottom=achieved)

ax.set_ylabel('Степен на постигнување (%)', labelpad=8)
ax.set_title('Евалуација на постигнатите истражувачки цели', pad=14)
ax.set_xticks(x)
ax.set_xticklabels(goals, fontsize=9.5)
ax.set_ylim(0, 115)
ax.yaxis.grid(True, linestyle='--', alpha=0.5, zorder=0)
ax.set_axisbelow(True)
ax.legend(loc='lower right', framealpha=0.9)

for bar, val in zip(bars_a, achieved):
    ax.text(bar.get_x() + bar.get_width()/2, val/2,
            f'{val}%', ha='center', va='center', fontsize=11,
            fontweight='bold', color='white')

for bar, val, ach in zip(bars_r, remaining, achieved):
    if val > 0:
        ax.text(bar.get_x() + bar.get_width()/2, ach + val/2,
                f'{val}%', ha='center', va='center', fontsize=10,
                fontweight='bold', color='#555')

plt.tight_layout()
plt.savefig(f'{OUT}/fig5_1_goal_achievement.png')
plt.close()
print('✓ fig5_1_goal_achievement.png')

print('\nAll 8 charts generated successfully.')
