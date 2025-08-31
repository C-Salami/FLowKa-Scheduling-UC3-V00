
import re
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

# --- Selection state kept in a module-level var for simplicity ---
class SelectionState(dict):
    pass

_selection_state = SelectionState()

def get_selection() -> SelectionState:
    return _selection_state

def clear_selection():
    _selection_state.clear()

def set_primary(item: Dict[str, Any]):
    # drop if equal to secondary
    sec = _selection_state.get("secondary")
    if sec and sec["id"] == item["id"] and sec["kind"] == item["kind"]:
        _selection_state["secondary"] = None
    _selection_state["primary"] = item
    _selection_state["lastClicked"] = item

def set_secondary(item: Dict[str, Any]):
    pri = _selection_state.get("primary")
    if not pri or (pri["id"] == item["id"] and pri["kind"] == item["kind"]):
        return
    _selection_state["secondary"] = item
    _selection_state["lastClicked"] = item

# --- Normalizer (very small) ---
WORD2NUM = {
    "zero":0, "one":1, "two":2, "too":2, "to":2, "three":3, "four":4, "for":4, "five":5,
    "six":6, "seven":7, "eight":8, "ate":8, "nine":9, "ten":10
}

def normalize_numbers(s: str) -> str:
    def repl(m):
        w = m.group(0).lower()
        return str(WORD2NUM.get(w, w))
    s = re.sub(r"\b(zero|one|two|too|to|three|four|for|five|six|seven|eight|ate|nine|ten)\b", repl, s, flags=re.I)
    s = re.sub(r"\b(next|coming)\s+mon(day)?\b", "next monday", s, flags=re.I)
    return s

# --- Intent parsing ---
def parse_explicit_id(t: str):
    m = re.search(r"\b(order|operation|op|id)\s*#?\s*(\d+)\b", t, flags=re.I)
    if not m: return None
    kind = "operation" if m.group(1).lower().startswith("op") or m.group(1).lower()=="operation" else "order"
    return {"kind": kind, "id": m.group(2)}

def resolve_deixis(t: str):
    s = get_selection()
    mentions_order = re.search(r"\border(s)?\b", t)
    mentions_operation = re.search(r"\b(operation|op)\b", t)
    kind_hint = "order" if mentions_order else ("operation" if mentions_operation else None)

    says_this = re.search(r"\b(this|that|selected|current)\b", t)
    says_these = re.search(r"\b(these|both)\b", t)

    primary = s.get("primary") or s.get("lastClicked")
    secondary = s.get("secondary")

    def kmatch(x):
        if not x: return None
        if kind_hint and x["kind"] != kind_hint: return None
        return x

    if says_these or re.search(r"\bswap\b", t):
        if kmatch(primary) and kmatch(secondary):
            return {"pair":[primary, secondary], "kindHint":kind_hint}
        return {"pair":None, "kindHint":kind_hint}

    if says_this or not re.search(r"\b(order|operation|op|id)\b", t):
        if kmatch(primary): return {"single": primary, "kindHint":kind_hint}

    return {"kindHint":kind_hint}

def parse_delay_by(t: str):
    m1 = re.search(r"\bby\s*(\d+)\s*(day|days|hour|hours)\b", t, flags=re.I)
    m2 = re.search(r"\b(\d+)\s*(day|days|hour|hours)\b", t, flags=re.I)
    m = m1 or m2
    if m:
        n = int(m.group(1))
        return {"hours": n} if "hour" in m.group(2).lower() else {"days": n}
    m3 = re.search(r"\b(next monday|next tuesday|next wednesday|next thursday|next friday|next saturday|next sunday)\b", t, flags=re.I)
    if m3:
        return {"dateISO": f"REL:{m3.group(1).lower()}"}
    return None

def parse_move_to(t: str):
    m = re.search(r"\b(to|move to|schedule for)\s+(next monday|next tuesday|tomorrow|on \d{4}-\d{2}-\d{2})\b", t, flags=re.I)
    if not m: return None
    return {"dateISO": f"REL:{m.group(2).lower()}"}

def intent_from_text(raw: str, source: str = "text"):
    t = normalize_numbers(raw).lower()
    is_delay = re.search(r"\b(delay|postpone|push)\b", t)
    is_swap = re.search(r"\b(swap|switch)\b", t)
    is_move = re.search(r"\b(move|reschedule|schedule)\b", t)

    explicit = parse_explicit_id(t)
    deictic = resolve_deixis(t)

    if is_swap:
        return {
            "kind": "SWAP",
            "source": source,
            "raw": raw,
            "a": explicit or (deictic.get("pair")[0] if deictic.get("pair") else None),
            "b": (deictic.get("pair")[1] if deictic.get("pair") else None),
        }
    if is_delay:
        by = parse_delay_by(t)
        return {
            "kind": "DELAY",
            "source": source,
            "raw": raw,
            "target": explicit or (deictic.get("single") or {}),
            "by": by
        }
    if is_move:
        to = parse_move_to(t)
        return {
            "kind": "MOVE",
            "source": source,
            "raw": raw,
            "target": explicit or (deictic.get("single") or {}),
            "to": to
        }
    return {"kind":"UNKNOWN","source":source,"raw":raw}

# --- Mock APIs that mutate Streamlit session state ---
def _resolve_rel_date(token: str) -> datetime:
    token = token.lower()
    now = datetime.now()
    if token == "tomorrow":
        return now + timedelta(days=1)
    weekdays = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]
    if token.startswith("next "):
        wd = token.split(" ",1)[1]
        if wd in weekdays:
            delta = (weekdays.index(wd) - now.weekday() + 7) % 7
            delta = delta if delta != 0 else 7
            return now + timedelta(days=delta)
    # fallback: today
    return now

def api_delay(kind: str, id_: str, payload, state):
    df = state.orders
    idx = df.index[df["id"]==id_]
    if len(idx)==0: return f"{kind} #{id_} not found"
    i = idx[0]
    if payload.get("days"):
        df.at[i, "due"] = df.at[i, "due"] + timedelta(days=int(payload["days"]))
    elif payload.get("hours"):
        # coarse: shift due by hours/24
        df.at[i, "due"] = df.at[i, "due"] + timedelta(hours=int(payload["hours"]))
    elif payload.get("dateISO","").startswith("REL:"):
        # interpret as move to date (coarse)
        token = payload["dateISO"][4:]
        target = _resolve_rel_date(token)
        df.at[i, "due"] = target.date()
    return f"Delayed {kind} #{id_}."

def api_swap(kind: str, a: str, b: str, state):
    df = state.orders
    idx_a = df.index[df["id"]==a]
    idx_b = df.index[df["id"]==b]
    if len(idx_a)==0 or len(idx_b)==0: return "One of the items not found"
    i, j = idx_a[0], idx_b[0]
    df.iloc[[i,j]] = df.iloc[[j,i]].values
    return f"Swapped {kind} #{a} with #{b}."

def api_move(kind: str, id_: str, payload, state):
    df = state.orders
    idx = df.index[df["id"]==id_]
    if len(idx)==0: return f"{kind} #{id_} not found"
    i = idx[0]
    if payload.get("dateISO","").startswith("REL:"):
        target = _resolve_rel_date(payload["dateISO"][4:])
        df.at[i, "start"] = target.date()
        df.at[i, "due"] = (target + timedelta(days=2)).date()
    return f"Moved {kind} #{id_}."

def dispatch_intent(intent, state):
    kind = intent.get("kind")
    if kind == "DELAY":
        target = intent.get("target", {})
        id_ = target.get("id") or (_selection_state.get("primary") or {}).get("id")
        k = target.get("kind") or (_selection_state.get("primary") or {}).get("kind")
        if not id_ or not k: return "Select an item (or say 'delay this by 2 days')."
        by = intent.get("by")
        if not by: return "Specify duration, e.g., 'by 2 days'."
        return api_delay(k, id_, by, state)
    if kind == "SWAP":
        a = (intent.get("a") or _selection_state.get("primary") or {}).get("id")
        b = (intent.get("b") or _selection_state.get("secondary") or {}).get("id")
        k = (intent.get("a") or _selection_state.get("primary") or {}).get("kind") or "order"
        if not a or not b: return "Pick two items to swap (Select Primary + Select Secondary)."
        return api_swap(k, a, b, state)
    if kind == "MOVE":
        target = intent.get("target", {})
        id_ = target.get("id") or (_selection_state.get("primary") or {}).get("id")
        k = target.get("kind") or (_selection_state.get("primary") or {}).get("kind")
        to = intent.get("to")
        if not id_ or not k: return "Select an item (or say 'move this to next Monday')."
        if not to: return "Give a date, e.g., 'to next Monday'."
        return api_move(k, id_, to, state)
    return "Sorry, I didn't catch that. Try 'delay this by 2 days' or 'swap orders'."
