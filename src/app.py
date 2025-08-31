
import streamlit as st
import pandas as pd
from datetime import datetime, timedelta
from uc3_intent import intent_from_text, dispatch_intent, SelectionState, set_primary, set_secondary, clear_selection, get_selection

st.set_page_config(page_title="UC3 Test Harness", layout="wide")

# --- Mock data (Orders) ---
if "orders" not in st.session_state:
    st.session_state.orders = pd.DataFrame([
        {"id": "14", "label": "Order 14", "start": datetime.now().date(), "due": (datetime.now()+timedelta(days=2)).date()},
        {"id": "22", "label": "Order 22", "start": (datetime.now()+timedelta(days=1)).date(), "due": (datetime.now()+timedelta(days=5)).date()},
        {"id": "35", "label": "Order 35", "start": (datetime.now()+timedelta(days=2)).date(), "due": (datetime.now()+timedelta(days=6)).date()},
    ])

orders = st.session_state.orders

# --- Selection tray ---
sel: SelectionState = get_selection()

st.sidebar.header("Selection Tray")
if sel.primary:
    st.sidebar.success(f"Primary: order #{sel.primary['id']}")
if sel.secondary:
    st.sidebar.info(f"Secondary: order #{sel.secondary['id']}")
col_clear, = st.sidebar.columns(1)
if st.sidebar.button("Clear Selection"):
    clear_selection()
    st.rerun()

# --- Mock "Chart": table with select buttons ---
st.title("FLowKa UC3 — Selection + Voice Deixis (Streamlit Harness)")

st.caption("Click 'Select' to set **Primary**, Shift+Select (or 'Select Secondary') for **Secondary**. Then try commands like 'delay this by 2 days' or 'swap orders'.")

for _, row in orders.iterrows():
    c1, c2, c3, c4, c5 = st.columns([2,2,2,2,2])
    c1.write(f"#{row.id} — {row.label}")
    c2.write(f"Start: {row.start}")
    c3.write(f"Due: {row.due}")
    if c4.button("Select Primary", key=f"p_{row.id}"):
        set_primary({"kind":"order","id":str(row.id),"label":row.label})
        st.rerun()
    if c5.button("Select Secondary", key=f"s_{row.id}"):
        set_secondary({"kind":"order","id":str(row.id),"label":row.label})
        st.rerun()

st.divider()

# --- Command / Voice input ---
st.subheader("Command / Voice Transcript")
text = st.text_input("Say/type a command", placeholder="e.g., delay this by 2 days | swap orders | move this to next monday")

col_a, col_b = st.columns([1,4])
if col_a.button("Run"):
    if text.strip():
        intent = intent_from_text(text, source="speech")
        msg = dispatch_intent(intent, st.session_state)
        st.success(msg)
    else:
        st.warning("Type something like 'delay this by 2 days'.")

# --- Show current data ---
st.subheader("Orders")
st.dataframe(orders, hide_index=True)
