"""Moves the demo's as-of date from 31 May 2026 to 31 Oct 2026.

Months shift +5, quarters +2 and halves +1 so every relative ordering
(past, due, overdue) is preserved. Applied identically to page source and
the identity-mapped en.ts locale so tt() keys keep matching."""
import calendar
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent / 'src'
MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
FULL = [calendar.month_name[i] for i in range(1, 13)]
SHIFT = 5
MON = '|'.join(MONTHS)
FULL_RE = '|'.join(FULL)


def add_months(year: int, month: int, n: int = SHIFT) -> tuple[int, int]:
    total = year * 12 + (month - 1) + n
    return total // 12, total % 12 + 1


def iso_date(m: re.Match) -> str:
    y, mo = add_months(int(m['y']), int(m['m']))
    d = min(int(m['d']), calendar.monthrange(y, mo)[1])
    # Month-end dates stay month-end (31 May -> 31 Oct, 30 Apr -> 30 Sep).
    if int(m['d']) == calendar.monthrange(int(m['y']), int(m['m']))[1]:
        d = calendar.monthrange(y, mo)[1]
    return f'{y:04d}-{mo:02d}-{d:02d}'


def iso_month(m: re.Match) -> str:
    y, mo = add_months(int(m['y']), int(m['m']))
    return f'{y:04d}-{mo:02d}'


def name_year(m: re.Match) -> str:
    word = m['mon']
    full = word in FULL
    idx = (FULL if full else MONTHS).index(word) + 1
    y, mo = add_months(int(m['y']), idx)
    return f"{(FULL if full else MONTHS)[mo - 1]}{m['sep']}{y}"


def name_short_year(m: re.Match) -> str:
    y, mo = add_months(2000 + int(m['y']), MONTHS.index(m['mon']) + 1)
    return f"{MONTHS[mo - 1]} {y % 100:02d}{m['tail']}"


def day_name(m: re.Match) -> str:
    _, mo = add_months(2026, MONTHS.index(m['mon']) + 1)
    return f"{m['d']} {MONTHS[mo - 1]}"


def label(m: re.Match) -> str:
    return f"{m['k']}: {m['q']}{MONTHS[(MONTHS.index(m['mon']) + SHIFT) % 12]}{m['q']}"


def month_list(m: re.Match) -> str:
    return re.sub(r"'(" + MON + r")'", lambda x: f"'{MONTHS[(MONTHS.index(x[1]) + SHIFT) % 12]}'", m[0])


def quarter(m: re.Match) -> str:
    q = int(m['q']) - 1 + 2
    yy = int(m['y']) + q // 4
    q = q % 4 + 1
    year = f'{yy:04d}' if len(m['y']) == 4 else f'{yy % 100:02d}'
    return f"Q{q}{m['sep']}{year}"


def quarter_iso(m: re.Match) -> str:
    q = int(m['q']) - 1 + 2
    return f"{int(m['y']) + q // 4}-Q{q % 4 + 1}"


def half(m: re.Match) -> str:
    h = int(m['h']) - 1 + 1
    yy = int(m['y']) + h // 2
    year = f'{yy:04d}' if len(m['y']) == 4 else f'{yy % 100:02d}'
    return f"H{h % 2 + 1}{m['sep']}{year}"


RULES = [
    (re.compile(r'(?P<y>20[2-3]\d)-(?P<m>[01]\d)-(?P<d>[0-3]\d)'), iso_date),
    (re.compile(r'(?P<y>20[2-3]\d)-Q(?P<q>[1-4])'), quarter_iso),
    (re.compile(r"(?<![\d-])(?P<y>20[2-3]\d)-(?P<m>0[1-9]|1[0-2])(?![\d-])"), iso_month),
    (re.compile(r'\b(?P<mon>' + FULL_RE + '|' + MON + r')(?P<sep>[ -])(?P<y>20[2-3]\d)\b'), name_year),
    (re.compile(r"\b(?P<mon>" + MON + r") (?P<y>2[5-9]|3[0-5])(?P<tail>['`·])"), name_short_year),
    (re.compile(r'\b(?P<d>[1-3]?\d) (?P<mon>' + MON + r')\b(?= 20[2-3]\d| ·|\)|\b)'), None),  # handled by name_year when year present
    (re.compile(r"\b(?P<k>m|mo|month|mon|period|label|x)\s*:\s*(?P<q>['\"])(?P<mon>" + MON + r")(?P=q)"), label),
    (re.compile(r"\[\s*'(?:" + MON + r")'(?:\s*,\s*'(?:" + MON + r")'){2,}\s*\]"), month_list),
    (re.compile(r"\bQ(?P<q>[1-4])(?P<sep>[ -]'?|')(?P<y>20[2-3]\d|2[5-9]|3[0-5])\b"), quarter),
    (re.compile(r"\bH(?P<h>[12])(?P<sep>[ -]'?|')(?P<y>20[2-3]\d|2[5-9]|3[0-5])\b"), half),
]


def shift(text: str) -> str:
    for pattern, fn in RULES:
        if fn is not None:
            text = pattern.sub(fn, text)
    return text.replace('31 May 2026', '31 Oct 2026')


def main() -> None:
    for path in ROOT.rglob('*.ts*'):
        original = path.read_text()
        updated = shift(original)
        if updated != original:
            path.write_text(updated)
            print(path.relative_to(ROOT))


if __name__ == '__main__':
    main()
