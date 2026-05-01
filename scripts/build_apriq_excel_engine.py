import json
import os
import sys

# Local vendored deps path (keeps this repo self-contained in locked environments).
PYDEPS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "_pydeps"))
if PYDEPS_DIR not in sys.path:
    sys.path.insert(0, PYDEPS_DIR)

import xlsxwriter  # type: ignore


REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def _make_fmt(workbook, *, bg=None, num_format=None, bold=False, border=1):
    d = {"border": border}
    if bg:
        d["bg_color"] = bg
    if num_format:
        d["num_format"] = num_format
    if bold:
        d["bold"] = True
    return workbook.add_format(d)


def _fmt_money(ws, workbook):
    return workbook.add_format({"num_format": '#,##0'})


def _fmt_rate(ws, workbook):
    return workbook.add_format({"num_format": '#,##0'})


def _fmt_pct(ws, workbook):
    return workbook.add_format({"num_format": "0.00%"})


def _fmt_pct_points(ws, workbook):
    # percent points stored like 7.00 meaning 7%
    return workbook.add_format({"num_format": "0.00"})


def _fmt_text(ws, workbook):
    return workbook.add_format({"text_wrap": True})


def _fmt_header(ws, workbook):
    return workbook.add_format(
        {"bold": True, "bg_color": "#F2F2F2", "border": 1, "align": "left"}
    )


def build_workbook(out_path: str):
    # Import the source of truth constants from the engine (same values as app).
    # Note: this script is intentionally “dumb”: it mirrors the published constants and formulas,
    # not a re-interpretation.
    import sys

    sys.path.insert(0, os.path.join(REPO_ROOT, "src"))
    # engine is a plain JS module; we cannot import it into python directly.
    # Therefore we embed assumptions by reading a generated JSON from node (see below).
    raise RuntimeError("Use build() entrypoint, not build_workbook() directly.")


NODE_EXTRACT_SCRIPT = r"""
import fs from 'node:fs';
import path from 'node:path';
import { BUILDING_RATES, QUALITY, SITE_ACCESS, PROJECT_TYPE, RENOVATION_COMPLEXITY, COMPLEXITY, LAND_PROCUREMENT, LAND_SLOPE, BREAKDOWN_ELEMENTS } from '../src/engine/rates.js';
import { calculate } from '../src/engine/calculator.js';

// Keep in sync with src/engine/calculator.js (hidden weights are not exported)
const ELEMENT_WEIGHTS = [0.55, 0.90, 1.25, 1.05, 1.30, 0.95, 1.45, 1.35, 0.70, 1.40, 0.80];

const out = {
  BUILDING_RATES,
  QUALITY,
  SITE_ACCESS,
  PROJECT_TYPE,
  RENOVATION_COMPLEXITY,
  COMPLEXITY,
  LAND_PROCUREMENT,
  LAND_SLOPE,
  BREAKDOWN_ELEMENTS,
  ELEMENT_WEIGHTS,
  // Expose a reference calculator for validation runs
  __calculate: (inputs) => calculate(inputs),
};

// serialize without function
const outJson = { ...out };
delete outJson.__calculate;

fs.writeFileSync(path.join(process.cwd(), 'apriq-engine-constants.json'), JSON.stringify(outJson, null, 2));
"""


def _write_node_extract_tmp(tmp_path: str):
    with open(tmp_path, "w", encoding="utf-8") as f:
        f.write(NODE_EXTRACT_SCRIPT)


def _load_constants(constants_path: str):
    with open(constants_path, "r", encoding="utf-8") as f:
        return json.load(f)


def _flatten_rates(building_rates: dict):
    rows = []
    for cat_key, cat in building_rates.items():
        for subtype_key, sub in cat["subtypes"].items():
            rows.append(
                {
                    "category": cat_key,
                    "subtype": subtype_key,
                    "rate": float(sub["rate"]),
                }
            )
    return rows


def build(out_xlsx_path: str):
    # 1) Extract engine constants via node (ensures 1:1 values with app)
    tmp_js = os.path.join(REPO_ROOT, "scripts", "_extract_engine_constants.mjs")
    constants_json = os.path.join(REPO_ROOT, "apriq-engine-constants.json")

    _write_node_extract_tmp(tmp_js)
    os.system(f'node "{tmp_js}"')
    if not os.path.exists(constants_json):
        raise RuntimeError("Failed to generate apriq-engine-constants.json via node.")

    c = _load_constants(constants_json)

    # 2) Build workbook
    wb = xlsxwriter.Workbook(out_xlsx_path)

    ws_readme = wb.add_worksheet("README")
    ws_inputs = wb.add_worksheet("INPUTS")
    ws_assumptions = wb.add_worksheet("ASSUMPTIONS")
    ws_calcs = wb.add_worksheet("CALCULATIONS")
    ws_breakdown = wb.add_worksheet("BREAKDOWN")
    ws_summary = wb.add_worksheet("SUMMARY")
    ws_checks = wb.add_worksheet("CHECKS")
    ws_report = wb.add_worksheet("REPORT")

    fmt_header = _fmt_header(None, wb)
    fmt_text = _fmt_text(None, wb)
    fmt_money = _fmt_money(None, wb)
    fmt_rate = _fmt_rate(None, wb)
    fmt_pct = _fmt_pct(None, wb)
    fmt_pct_points = _fmt_pct_points(None, wb)

    # Colour coding
    # - Inputs = blue
    # - Calculations = grey
    # - Outputs = green
    BLUE = "#D9E8FF"
    GREY = "#EFEFEF"
    GREEN = "#DFF2DF"
    fmt_in_text = _make_fmt(wb, bg=BLUE)
    fmt_in_num = _make_fmt(wb, bg=BLUE, num_format="#,##0")
    fmt_in_rate = _make_fmt(wb, bg=BLUE, num_format="#,##0")
    fmt_in_pct = _make_fmt(wb, bg=BLUE, num_format="0.00%")
    fmt_in_pp = _make_fmt(wb, bg=BLUE, num_format="0.00")

    fmt_calc_text = _make_fmt(wb, bg=GREY)
    fmt_calc_money = _make_fmt(wb, bg=GREY, num_format="#,##0")
    fmt_calc_rate = _make_fmt(wb, bg=GREY, num_format="#,##0")
    fmt_calc_pct = _make_fmt(wb, bg=GREY, num_format="0.00%")

    fmt_out_money = _make_fmt(wb, bg=GREEN, num_format="#,##0", bold=True)
    fmt_out_rate = _make_fmt(wb, bg=GREEN, num_format="#,##0", bold=True)
    fmt_out_text = _make_fmt(wb, bg=GREEN, bold=True)

    # Presentation formats
    fmt_title = wb.add_format({"bold": True, "font_size": 16})
    fmt_section = wb.add_format({"bold": True, "font_size": 12, "bg_color": "#111111", "font_color": "#FFFFFF"})
    fmt_label = wb.add_format({"bold": True})
    fmt_note = wb.add_format({"font_color": "#666666"})

    # ---------------- README ----------------
    ws_readme.set_column(0, 0, 20)
    ws_readme.set_column(1, 1, 90)
    ws_readme.write(0, 0, "Workbook", fmt_header)
    ws_readme.write(0, 1, "AprIQ Calculation Engine (1:1 mirror)", fmt_text)
    ws_readme.write(2, 0, "Source of truth", fmt_header)
    ws_readme.write(2, 1, "src/engine/calculator.js (calculate) + src/engine/rates.js", fmt_text)
    ws_readme.write(4, 0, "Sheets", fmt_header)
    ws_readme.write(4, 1, "INPUTS, ASSUMPTIONS, CALCULATIONS, BREAKDOWN, SUMMARY, CHECKS, REPORT", fmt_text)
    ws_readme.write(6, 0, "Notes", fmt_header)
    ws_readme.write(
        6,
        1,
        "This workbook preserves: blended multiplier stack, renovation split logic, sequential financial additions, land slope uplift + development allowance, and weighted elemental Rand distribution using hidden element weights. "
        "Escalation depends on run date/time in JS; this workbook exposes the same escalation math but exact matching requires controlling the reference 'now'.",
        fmt_text,
    )

    # ---------------- ASSUMPTIONS ----------------
    row = 0
    ws_assumptions.freeze_panes(1, 0)
    ws_assumptions.set_column(0, 0, 26)
    ws_assumptions.set_column(1, 4, 24)

    # Multipliers tables
    def write_multiplier_table(title, mapping, start_row):
        ws_assumptions.write(start_row, 0, title, fmt_header)
        ws_assumptions.write(start_row + 1, 0, "Key", fmt_header)
        ws_assumptions.write(start_row + 1, 1, "Label", fmt_header)
        ws_assumptions.write(start_row + 1, 2, "Multiplier", fmt_header)
        r = start_row + 2
        for k, v in mapping.items():
            ws_assumptions.write(r, 0, k)
            ws_assumptions.write(r, 1, v.get("label", k))
            ws_assumptions.write_number(r, 2, float(v.get("multiplier", 1.0)))
            r += 1
        return r + 1

    row = write_multiplier_table("QUALITY", c["QUALITY"], row)
    row = write_multiplier_table("COMPLEXITY", c["COMPLEXITY"], row)
    row = write_multiplier_table("SITE_ACCESS", c["SITE_ACCESS"], row)
    row = write_multiplier_table("PROJECT_TYPE", c["PROJECT_TYPE"], row)
    row = write_multiplier_table("RENOVATION_COMPLEXITY", c["RENOVATION_COMPLEXITY"], row)
    row = write_multiplier_table("LAND_SLOPE", c["LAND_SLOPE"], row)

    # Land procurement
    ws_assumptions.write(row, 0, "LAND_PROCUREMENT", fmt_header)
    ws_assumptions.write(row + 1, 0, "Type", fmt_header)
    ws_assumptions.write(row + 1, 1, "Label", fmt_header)
    ws_assumptions.write(row + 1, 2, "RatePerM2", fmt_header)
    ws_assumptions.write(row + 1, 3, "DevelopmentMultiplier", fmt_header)
    r = row + 2
    for k, v in c["LAND_PROCUREMENT"].items():
        ws_assumptions.write(r, 0, k)
        ws_assumptions.write(r, 1, v.get("label", k))
        ws_assumptions.write_number(r, 2, float(v.get("ratePerM2", 0.0)), fmt_rate)
        ws_assumptions.write_number(r, 3, float(v.get("developmentMultiplier", 0.0)), fmt_pct)
        r += 1
    row = r + 2

    # Breakdown elements + hidden weights
    ws_assumptions.write(row, 0, "BREAKDOWN_ELEMENTS + HIDDEN_WEIGHTS", fmt_header)
    ws_assumptions.write(row + 1, 0, "Index", fmt_header)
    ws_assumptions.write(row + 1, 1, "Key", fmt_header)
    ws_assumptions.write(row + 1, 2, "Label", fmt_header)
    ws_assumptions.write(row + 1, 3, "DefaultPct", fmt_header)
    ws_assumptions.write(row + 1, 4, "HiddenWeight", fmt_header)
    for i, el in enumerate(c["BREAKDOWN_ELEMENTS"]):
        ws_assumptions.write_number(row + 2 + i, 0, i + 1)
        ws_assumptions.write(row + 2 + i, 1, el["key"])
        ws_assumptions.write(row + 2 + i, 2, el["label"])
        ws_assumptions.write_number(row + 2 + i, 3, float(el["pct"]), fmt_pct)
        ws_assumptions.write_number(row + 2 + i, 4, float(c["ELEMENT_WEIGHTS"][i]))

    # Base rates table (flattened)
    rates = _flatten_rates(c["BUILDING_RATES"])
    base_rate_start = row + 2 + len(c["BREAKDOWN_ELEMENTS"]) + 3
    ws_assumptions.write(base_rate_start, 0, "BASE_RATES (ZAR/m²)", fmt_header)
    ws_assumptions.write(base_rate_start + 1, 0, "Category", fmt_header)
    ws_assumptions.write(base_rate_start + 1, 1, "Subtype", fmt_header)
    ws_assumptions.write(base_rate_start + 1, 2, "Rate", fmt_header)
    ws_assumptions.write(base_rate_start + 1, 3, "Key", fmt_header)
    for i, rr in enumerate(rates):
        ws_assumptions.write(base_rate_start + 2 + i, 0, rr["category"])
        ws_assumptions.write(base_rate_start + 2 + i, 1, rr["subtype"])
        ws_assumptions.write_number(base_rate_start + 2 + i, 2, rr["rate"], fmt_rate)
        ws_assumptions.write_formula(
            base_rate_start + 2 + i,
            3,
            f"={xlsxwriter.utility.xl_rowcol_to_cell(base_rate_start + 2 + i, 0)}&\"|\"&{xlsxwriter.utility.xl_rowcol_to_cell(base_rate_start + 2 + i, 1)}",
        )

    # Named ranges for key tables
    wb.define_name(
        "BaseRates_Category",
        f"=ASSUMPTIONS!$A${base_rate_start+3}:$A${base_rate_start+2+len(rates)}",
    )
    wb.define_name(
        "BaseRates_Subtype",
        f"=ASSUMPTIONS!$B${base_rate_start+3}:$B${base_rate_start+2+len(rates)}",
    )
    wb.define_name(
        "BaseRates_Rate",
        f"=ASSUMPTIONS!$C${base_rate_start+3}:$C${base_rate_start+2+len(rates)}",
    )
    wb.define_name(
        "BaseRates_Key",
        f"=ASSUMPTIONS!$D${base_rate_start+3}:$D${base_rate_start+2+len(rates)}",
    )

    # Selector lists (for dropdowns)
    selector_start = base_rate_start + 2 + len(rates) + 3
    ws_assumptions.write(selector_start, 0, "SELECTOR LISTS (for INPUTS dropdowns)", fmt_header)
    ws_assumptions.write(selector_start + 1, 0, "Categories", fmt_header)
    ws_assumptions.write(selector_start + 1, 1, "All subtypes (fallback)", fmt_header)
    categories = sorted(list(c["BUILDING_RATES"].keys()))
    all_subtypes = []
    for cat_key, cat in c["BUILDING_RATES"].items():
        all_subtypes.extend(list(cat["subtypes"].keys()))
    all_subtypes = sorted(set(all_subtypes))
    max_len = max(len(categories), len(all_subtypes))
    for i in range(max_len):
        if i < len(categories):
            ws_assumptions.write(selector_start + 2 + i, 0, categories[i])
        if i < len(all_subtypes):
            ws_assumptions.write(selector_start + 2 + i, 1, all_subtypes[i])
    wb.define_name(
        "CategoryList",
        f"=ASSUMPTIONS!$A${selector_start+3}:$A${selector_start+2+len(categories)}",
    )
    wb.define_name(
        "SubtypeList",
        f"=ASSUMPTIONS!$B${selector_start+3}:$B${selector_start+2+len(all_subtypes)}",
    )

    # Dependent dropdowns (Category -> Subtype list)
    # We generate:
    # - a map table: category -> named-range-name
    # - a named range per category containing its subtypes
    def _sanitize_name(s: str) -> str:
        out = []
        for ch in s:
            if ch.isalnum():
                out.append(ch)
            else:
                out.append("_")
        nm = "".join(out)
        if not nm or (not nm[0].isalpha() and nm[0] != "_"):
            nm = "_" + nm
        return nm

    dep_start = selector_start + 2 + max_len + 3
    ws_assumptions.write(dep_start, 0, "DEPENDENT SUBTYPE DROPDOWNS", fmt_header)
    ws_assumptions.write(dep_start + 1, 0, "Category", fmt_header)
    ws_assumptions.write(dep_start + 1, 1, "SubtypeRangeName", fmt_header)

    # Write per-category subtype columns starting from column D (index 3)
    subtype_col0 = 3
    for i, cat_key in enumerate(categories):
        range_name = f"Subtypes_{_sanitize_name(cat_key)}"
        ws_assumptions.write(dep_start + 2 + i, 0, cat_key)
        ws_assumptions.write(dep_start + 2 + i, 1, range_name)

        # Column for this category's subtypes
        col = subtype_col0 + i
        ws_assumptions.write(dep_start + 1, col, cat_key, fmt_header)
        subtypes = sorted(list(c["BUILDING_RATES"][cat_key]["subtypes"].keys()))
        for r_i, st in enumerate(subtypes):
            ws_assumptions.write(dep_start + 2 + r_i, col, st)

        # Define named range for subtypes (no blanks)
        first = xlsxwriter.utility.xl_rowcol_to_cell(dep_start + 2, col, row_abs=True, col_abs=True)
        last = xlsxwriter.utility.xl_rowcol_to_cell(dep_start + 2 + len(subtypes) - 1, col, row_abs=True, col_abs=True)
        wb.define_name(range_name, f"=ASSUMPTIONS!{first}:{last}")

    # Define mapping named ranges
    wb.define_name(
        "CategoryMap_Category",
        f"=ASSUMPTIONS!$A${dep_start+3}:$A${dep_start+2+len(categories)}",
    )
    wb.define_name(
        "CategoryMap_RangeName",
        f"=ASSUMPTIONS!$B${dep_start+3}:$B${dep_start+2+len(categories)}",
    )

    # ---------------- INPUTS ----------------
    ws_inputs.set_column(0, 0, 30)
    ws_inputs.set_column(1, 1, 26)
    ws_inputs.set_column(2, 2, 60)
    ws_inputs.freeze_panes(1, 0)

    ws_inputs.write(0, 0, "Input", fmt_header)
    ws_inputs.write(0, 1, "Value (blue = user editable)", fmt_header)
    ws_inputs.write(0, 2, "Notes / trace", fmt_header)

    ws_inputs.write(1, 0, "PROJECT SETUP", fmt_section)
    ws_inputs.merge_range(1, 0, 1, 2, "PROJECT SETUP", fmt_section)

    inputs = [
        ("use1Category", "Residential", "src/engine/calculator.js inputs"),
        ("use1Subtype", "Single Dwelling", "src/engine/calculator.js inputs"),
        ("use1Allocation", 1.0, "Fraction; allocations must sum to 1"),
        ("use2Category", "", ""),
        ("use2Subtype", "", ""),
        ("use2Allocation", 0.0, ""),
        ("use3Category", "", ""),
        ("use3Subtype", "", ""),
        ("use3Allocation", 0.0, ""),
        ("rate1Adjustment", 0.0, "Percent points; rate1 = raw*(1+adj/100)"),
        ("rate2Adjustment", 0.0, ""),
        ("rate3Adjustment", 0.0, ""),
        ("floorArea", 1000.0, "m²"),
        ("projectTypeKey", "New", "PROJECT_TYPE lookup"),
        ("renovationArea", 0.0, "Only used when projectTypeKey=Renovation"),
        ("renovationComplexityKey", "Low", "RENOVATION_COMPLEXITY lookup"),
        ("qualityKey", "Medium", "QUALITY lookup"),
        ("complexityKey", "Low Complexity", "COMPLEXITY lookup"),
        ("siteAccessKey", "Urban Setting", "SITE_ACCESS lookup"),
        ("contingencyPct", 0.10, "Fraction"),
        ("profitPct", 0.10, "Fraction"),
        ("preliminariesPct", 0.05, "Fraction"),
        ("feesPct", 0.12, "Fraction"),
        ("vatPct", 0.15, "Fraction"),
        ("landProcurementType", "N/A", "LAND_PROCUREMENT lookup"),
        ("landArea", 0.0, "m²"),
        ("landSlopeKey", "Flat Land (0-5%)", "LAND_SLOPE lookup"),
        ("customLandRatePerM2", 0.0, "Only for Manual Input land"),
        ("manualLandDevelopmentPct", 0.0, "Only for Manual Input land; fraction"),
        ("useCustomSplit", False, "If TRUE, customElementPcts are used"),
        ("includeEscalation", False, "If TRUE and estimatedStartDate present, escalation applies"),
        ("escalationRate", 7.0, "Percent points per annum"),
        ("estimatedStartDate", "", "Date string (yyyy-mm-dd)"),
    ]

    input_row = 2
    for name, val, note in inputs:
        ws_inputs.write(input_row, 0, name)
        if isinstance(val, bool):
            ws_inputs.write_boolean(input_row, 1, val, fmt_in_text)
        elif isinstance(val, (int, float)):
            # format by field semantics
            if name.endswith("Pct") and name not in ("escalationRate",):
                ws_inputs.write_number(input_row, 1, float(val), fmt_in_pct)
            elif name.endswith("Adjustment") or name == "escalationRate":
                ws_inputs.write_number(input_row, 1, float(val), fmt_in_pp)
            elif "RatePerM2" in name:
                ws_inputs.write_number(input_row, 1, float(val), fmt_in_rate)
            else:
                ws_inputs.write_number(input_row, 1, float(val), fmt_in_num)
        else:
            ws_inputs.write(input_row, 1, val, fmt_in_text)
        ws_inputs.write(input_row, 2, note, fmt_text)
        input_row += 1

    # Dropdowns / data validation (presentation + reduces input errors)
    def _dv_list(row_idx, name_range):
        ws_inputs.data_validation(row_idx, 1, row_idx, 1, {"validate": "list", "source": name_range})

    # Categories/subtypes (not dependent-filtered; still 1:1 with app because engine uses exact text keys)
    _dv_list(2, "=CategoryList")  # use1Category
    ws_inputs.data_validation(
        3, 1, 3, 1,
        {"validate": "list", "source": '=INDIRECT(XLOOKUP(use1Category,CategoryMap_Category,CategoryMap_RangeName))'}
    )
    _dv_list(5, "=CategoryList")  # use2Category
    ws_inputs.data_validation(
        6, 1, 6, 1,
        {"validate": "list", "source": '=INDIRECT(XLOOKUP(use2Category,CategoryMap_Category,CategoryMap_RangeName))'}
    )
    _dv_list(8, "=CategoryList")  # use3Category
    ws_inputs.data_validation(
        9, 1, 9, 1,
        {"validate": "list", "source": '=INDIRECT(XLOOKUP(use3Category,CategoryMap_Category,CategoryMap_RangeName))'}
    )

    # Selector keys from helper named ranges (created on CALCULATIONS sheet)
    _dv_list(14, "=ProjectTypeKeys")
    _dv_list(16, "=RenovKeys")
    _dv_list(17, "=QualityKeys")
    _dv_list(18, "=ComplexityKeys")
    _dv_list(19, "=SiteKeys")
    _dv_list(25, "=LandTypeKeys")
    _dv_list(27, "=SlopeKeys")

    # Boolean flags
    ws_inputs.data_validation(30, 1, 30, 1, {"validate": "list", "source": ["TRUE", "FALSE"]})
    ws_inputs.data_validation(31, 1, 31, 1, {"validate": "list", "source": ["TRUE", "FALSE"]})

    # Custom element pcts (11)
    ws_inputs.write(input_row + 1, 0, "ELEMENT SPLIT (optional)", fmt_section)
    ws_inputs.merge_range(input_row + 1, 0, input_row + 1, 2, "ELEMENT SPLIT (optional)", fmt_section)
    ws_inputs.write(input_row + 2, 0, "Index", fmt_header)
    ws_inputs.write(input_row + 2, 1, "Pct", fmt_header)
    ws_inputs.write(input_row + 2, 2, "Only used when useCustomSplit=TRUE", fmt_header)
    for i, el in enumerate(c["BREAKDOWN_ELEMENTS"]):
        ws_inputs.write_number(input_row + 3 + i, 0, i + 1)
        ws_inputs.write_number(input_row + 3 + i, 1, float(el["pct"]), fmt_in_pct)
        ws_inputs.write(input_row + 3 + i, 2, el["label"], fmt_note)

    # Named input cells
    def name_input(input_name: str):
        for r in range(1, input_row):
            if ws_inputs.table[r][0] if False else True:
                pass

    # We can't introspect worksheet state from xlsxwriter, so define named ranges by coordinates.
    # Maintain the same order as `inputs` list above.
    def cell(row0, col0):
        # row0/col0 are 0-based; xlsx uses A1
        return xlsxwriter.utility.xl_rowcol_to_cell(row0, col0, row_abs=True, col_abs=True)

    for idx, (nm, _, _) in enumerate(inputs):
        r = 1 + idx
        wb.define_name(nm, f"=INPUTS!{cell(r,1)}")

    # Custom element pct range (11x1)
    custom_start = input_row + 3
    wb.define_name(
        "CustomElementPcts",
        f"=INPUTS!{cell(custom_start,1)}:{cell(custom_start+10,1)}",
    )

    # ---------------- CALCULATIONS ----------------
    ws_calcs.set_column(0, 0, 34)
    ws_calcs.set_column(1, 1, 30)
    ws_calcs.set_column(2, 2, 60)
    ws_calcs.freeze_panes(1, 0)

    ws_calcs.write(0, 0, "Item", fmt_header)
    ws_calcs.write(0, 1, "Value", fmt_header)
    ws_calcs.write(0, 2, "Trace (file → expression)", fmt_header)

    r = 1
    def w(name, formula, trace, num_format=None, *, define=True):
        nonlocal r
        ws_calcs.write(r, 0, name)
        if isinstance(formula, (int, float)):
            ws_calcs.write_number(r, 1, float(formula), num_format)
        else:
            ws_calcs.write_formula(r, 1, formula, num_format)
        ws_calcs.write(r, 2, trace, fmt_text)
        if define:
            # Prefix to avoid collisions with INPUT named ranges.
            wb.define_name(f"calc_{name}", f"=CALCULATIONS!{cell(r,1)}")
        r += 1

    # Rate lookups: use XLOOKUP on Category+Subtype (concatenated).
    w(
        "rate1Raw",
        '=IFERROR(XLOOKUP(use1Category&"|"&use1Subtype, BaseRates_Key, BaseRates_Rate), 0)',
        "rates.js getRate(category, subtype)",
        fmt_calc_rate,
    )
    w(
        "rate2Raw",
        '=IFERROR(XLOOKUP(use2Category&"|"&use2Subtype, BaseRates_Key, BaseRates_Rate), 0)',
        "rates.js getRate(category, subtype)",
        fmt_calc_rate,
    )
    w(
        "rate3Raw",
        '=IFERROR(XLOOKUP(use3Category&"|"&use3Subtype, BaseRates_Key, BaseRates_Rate), 0)',
        "rates.js getRate(category, subtype)",
        fmt_calc_rate,
    )
    w("rate1", "=calc_rate1Raw*(1+rate1Adjustment/100)", "calculator.js L30", fmt_calc_rate)
    w("rate2", "=calc_rate2Raw*(1+rate2Adjustment/100)", "calculator.js L31", fmt_calc_rate)
    w("rate3", "=calc_rate3Raw*(1+rate3Adjustment/100)", "calculator.js L32", fmt_calc_rate)
    w(
        "weightedBaseRate",
        "=calc_rate1*use1Allocation + calc_rate2*use2Allocation + calc_rate3*use3Allocation",
        "calculator.js L34",
        fmt_calc_rate,
    )
    w(
        "allocationTotal",
        "=use1Allocation+use2Allocation+use3Allocation",
        "calculator.js L36",
        None,
    )
    w(
        "allocationCheck",
        '=IF(ABS(allocationTotal-1)<0.0001,"OK","ERROR")',
        "calculator.js L37",
        None,
    )

    # Multiplier lookups
    # We use XLOOKUP across each multiplier table block. For simplicity in Excel, we repeat blocks with ranges:
    # Define named ranges for each multiplier table at fixed coordinates by searching is hard; instead we embed XLOOKUP with table areas
    # using dynamic ranges via ASSUMPTIONS columns A:C and matching the title row is cumbersome.
    # So we provide direct lookups using FILTER on Key column in each section is also cumbersome.
    # Instead, we write helper lookup tables on CALCULATIONS from JSON in fixed area.

    # Helper tables (Key → Multiplier) for all multipliers (small).
    helper_start = r + 2
    ws_calcs.write(helper_start, 0, "Lookup helpers (Key → Multiplier)", fmt_header)
    ws_calcs.write(helper_start + 1, 0, "QUALITY key", fmt_header)
    ws_calcs.write(helper_start + 1, 1, "Multiplier", fmt_header)
    for i, (k, v) in enumerate(c["QUALITY"].items()):
        ws_calcs.write(helper_start + 2 + i, 0, k)
        ws_calcs.write_number(helper_start + 2 + i, 1, float(v.get("multiplier", 1.0)))
    q_range_keys = f"=CALCULATIONS!{cell(helper_start+2,0)}:{cell(helper_start+2+len(c['QUALITY'])-1,0)}"
    q_range_vals = f"=CALCULATIONS!{cell(helper_start+2,1)}:{cell(helper_start+2+len(c['QUALITY'])-1,1)}"
    wb.define_name("QualityKeys", q_range_keys)
    wb.define_name("QualityMults", q_range_vals)

    offset = helper_start + 2 + len(c["QUALITY"]) + 2
    ws_calcs.write(offset, 0, "COMPLEXITY key", fmt_header)
    ws_calcs.write(offset, 1, "Multiplier", fmt_header)
    for i, (k, v) in enumerate(c["COMPLEXITY"].items()):
        ws_calcs.write(offset + 1 + i, 0, k)
        ws_calcs.write_number(offset + 1 + i, 1, float(v.get("multiplier", 1.0)))
    wb.define_name(
        "ComplexityKeys",
        f"=CALCULATIONS!{cell(offset+1,0)}:{cell(offset+len(c['COMPLEXITY']),0)}",
    )
    wb.define_name(
        "ComplexityMults",
        f"=CALCULATIONS!{cell(offset+1,1)}:{cell(offset+len(c['COMPLEXITY']),1)}",
    )

    offset2 = offset + 1 + len(c["COMPLEXITY"]) + 2
    ws_calcs.write(offset2, 0, "SITE_ACCESS key", fmt_header)
    ws_calcs.write(offset2, 1, "Multiplier", fmt_header)
    for i, (k, v) in enumerate(c["SITE_ACCESS"].items()):
        ws_calcs.write(offset2 + 1 + i, 0, k)
        ws_calcs.write_number(offset2 + 1 + i, 1, float(v.get("multiplier", 1.0)))
    wb.define_name(
        "SiteKeys",
        f"=CALCULATIONS!{cell(offset2+1,0)}:{cell(offset2+len(c['SITE_ACCESS']),0)}",
    )
    wb.define_name(
        "SiteMults",
        f"=CALCULATIONS!{cell(offset2+1,1)}:{cell(offset2+len(c['SITE_ACCESS']),1)}",
    )

    offset3 = offset2 + 1 + len(c["SITE_ACCESS"]) + 2
    ws_calcs.write(offset3, 0, "PROJECT_TYPE key", fmt_header)
    ws_calcs.write(offset3, 1, "Multiplier", fmt_header)
    for i, (k, v) in enumerate(c["PROJECT_TYPE"].items()):
        ws_calcs.write(offset3 + 1 + i, 0, k)
        ws_calcs.write_number(offset3 + 1 + i, 1, float(v.get("multiplier", 1.0)))
    wb.define_name(
        "ProjectTypeKeys",
        f"=CALCULATIONS!{cell(offset3+1,0)}:{cell(offset3+len(c['PROJECT_TYPE']),0)}",
    )
    wb.define_name(
        "ProjectTypeMults",
        f"=CALCULATIONS!{cell(offset3+1,1)}:{cell(offset3+len(c['PROJECT_TYPE']),1)}",
    )

    offset4 = offset3 + 1 + len(c["PROJECT_TYPE"]) + 2
    ws_calcs.write(offset4, 0, "RENOVATION_COMPLEXITY key", fmt_header)
    ws_calcs.write(offset4, 1, "Multiplier", fmt_header)
    for i, (k, v) in enumerate(c["RENOVATION_COMPLEXITY"].items()):
        ws_calcs.write(offset4 + 1 + i, 0, k)
        ws_calcs.write_number(offset4 + 1 + i, 1, float(v.get("multiplier", 1.0)))
    wb.define_name(
        "RenovKeys",
        f"=CALCULATIONS!{cell(offset4+1,0)}:{cell(offset4+len(c['RENOVATION_COMPLEXITY']),0)}",
    )
    wb.define_name(
        "RenovMults",
        f"=CALCULATIONS!{cell(offset4+1,1)}:{cell(offset4+len(c['RENOVATION_COMPLEXITY']),1)}",
    )

    # Land slope lookup
    offset5 = offset4 + 1 + len(c["RENOVATION_COMPLEXITY"]) + 2
    ws_calcs.write(offset5, 0, "LAND_SLOPE key", fmt_header)
    ws_calcs.write(offset5, 1, "Multiplier", fmt_header)
    for i, (k, v) in enumerate(c["LAND_SLOPE"].items()):
        ws_calcs.write(offset5 + 1 + i, 0, k)
        ws_calcs.write_number(offset5 + 1 + i, 1, float(v.get("multiplier", 1.0)))
    wb.define_name(
        "SlopeKeys",
        f"=CALCULATIONS!{cell(offset5+1,0)}:{cell(offset5+len(c['LAND_SLOPE']),0)}",
    )
    wb.define_name(
        "SlopeMults",
        f"=CALCULATIONS!{cell(offset5+1,1)}:{cell(offset5+len(c['LAND_SLOPE']),1)}",
    )

    # Land procurement lookup (type -> ratePerM2, devMult)
    offset6 = offset5 + 1 + len(c["LAND_SLOPE"]) + 2
    ws_calcs.write(offset6, 0, "LAND_PROCUREMENT type", fmt_header)
    ws_calcs.write(offset6, 1, "RatePerM2", fmt_header)
    ws_calcs.write(offset6, 2, "DevMultiplier", fmt_header)
    for i, (k, v) in enumerate(c["LAND_PROCUREMENT"].items()):
        ws_calcs.write(offset6 + 1 + i, 0, k)
        ws_calcs.write_number(offset6 + 1 + i, 1, float(v.get("ratePerM2", 0.0)))
        ws_calcs.write_number(offset6 + 1 + i, 2, float(v.get("developmentMultiplier", 0.0)))
    wb.define_name(
        "LandTypeKeys",
        f"=CALCULATIONS!{cell(offset6+1,0)}:{cell(offset6+len(c['LAND_PROCUREMENT']),0)}",
    )
    wb.define_name(
        "LandTypeRate",
        f"=CALCULATIONS!{cell(offset6+1,1)}:{cell(offset6+len(c['LAND_PROCUREMENT']),1)}",
    )
    wb.define_name(
        "LandTypeDev",
        f"=CALCULATIONS!{cell(offset6+1,2)}:{cell(offset6+len(c['LAND_PROCUREMENT']),2)}",
    )

    # Continue main calc items after helpers, but keep references stable by naming them
    # We place the remaining formulas at fixed rows (above helper_start) already written.

    # Define named ranges for already written calc outputs by their row numbers.
    # Rows written so far: 1.. (r-1). We'll define names for the ones we need later by using their label row.
    # For simplicity, we also define formulas again in SUMMARY/BREAKDOWN using the named items we created in this sheet.

    # Append remaining core formulas now (after allocationCheck)
    # Multiplier lookups
    w("qualityMultiplier", '=IFERROR(XLOOKUP(qualityKey,QualityKeys,QualityMults),1)', "calculator.js L39", fmt_calc_text)
    w("complexityMultiplier", '=IFERROR(XLOOKUP(complexityKey,ComplexityKeys,ComplexityMults),1)', "calculator.js L43", fmt_calc_text)
    w("siteMultiplier", '=IFERROR(XLOOKUP(siteAccessKey,SiteKeys,SiteMults),1)', "calculator.js L40", fmt_calc_text)
    w("projectTypeMultiplier", '=IFERROR(XLOOKUP(projectTypeKey,ProjectTypeKeys,ProjectTypeMults),1)', "calculator.js L41", fmt_calc_text)
    w("renovationMultiplier", '=IFERROR(XLOOKUP(renovationComplexityKey,RenovKeys,RenovMults),1)', "calculator.js L42", fmt_calc_text)
    w(
        "blendedMultiplier",
        "=1 + (calc_qualityMultiplier-1)*1.00 + (calc_complexityMultiplier-1)*0.75 + (calc_siteMultiplier-1)*0.50",
        "calculator.js L49-L52",
        fmt_calc_text,
    )
    w("totalAdjustedBaseRate", "=calc_weightedBaseRate*calc_blendedMultiplier", "calculator.js L53", fmt_calc_rate)

    # Areas split
    w("newArea", '=IF(projectTypeKey="Renovation", MAX(0,floorArea-renovationArea), floorArea)', "calculator.js L64-L71", fmt_calc_text)
    w("renovArea", '=IF(projectTypeKey="Renovation", MIN(renovationArea,floorArea), 0)', "calculator.js L64-L72", fmt_calc_text)

    w(
        "baseConstructionCostNew",
        '=IF(projectTypeKey="Renovation", calc_totalAdjustedBaseRate*calc_newArea, calc_totalAdjustedBaseRate*calc_projectTypeMultiplier*floorArea)',
        "calculator.js L64-L73",
        fmt_calc_money,
    )
    w(
        "baseConstructionCostRenovation",
        '=IF(projectTypeKey="Renovation", calc_totalAdjustedBaseRate*calc_renovationMultiplier*calc_renovArea, 0)',
        "calculator.js L68-L73",
        fmt_calc_money,
    )
    w("constructionCost", "=calc_baseConstructionCostNew+calc_baseConstructionCostRenovation", "calculator.js L88", fmt_calc_money)

    # Land
    w("isManualLand", '=IF(landProcurementType="Manual Input", TRUE, FALSE)', "calculator.js L75", fmt_calc_text)
    w(
        "landProcurementRatePerM2",
        '=IF(isManualLand, customLandRatePerM2, IFERROR(XLOOKUP(landProcurementType,LandTypeKeys,LandTypeRate),0))',
        "calculator.js L79-L82",
        fmt_calc_rate,
    )
    w(
        "landDevelopmentMultiplier",
        '=IF(isManualLand, manualLandDevelopmentPct, IFERROR(XLOOKUP(landProcurementType,LandTypeKeys,LandTypeDev),0))',
        "calculator.js L83-L85",
        fmt_calc_pct,
    )
    w(
        "earthworksMultiplier",
        '=IFERROR(XLOOKUP(landSlopeKey,SlopeKeys,SlopeMults),1)',
        "calculator.js L86",
        fmt_calc_text,
    )
    w("landProcurementCostBase", "=calc_landProcurementRatePerM2*landArea", "calculator.js L92", fmt_calc_money)
    w("earthworksCost", "=calc_landProcurementCostBase*(calc_earthworksMultiplier-1)", "calculator.js L93", fmt_calc_money)
    w("landProcurementCost", "=calc_landProcurementCostBase*calc_earthworksMultiplier", "calculator.js L94", fmt_calc_money)
    w("landDevelopmentCost", "=calc_landProcurementCost*calc_landDevelopmentMultiplier", "calculator.js L97", fmt_calc_money)
    w("totalLandCost", "=calc_landProcurementCost+calc_landDevelopmentCost", "calculator.js L108", fmt_calc_money)

    # Financial additions (construction only)
    w("contingencyAmount", "=calc_constructionCost*contingencyPct", "calculator.js L100", fmt_calc_money)
    w("contractorProfit", "=(calc_constructionCost+calc_contingencyAmount)*profitPct", "calculator.js L101", fmt_calc_money)
    w("preliminaries", "=(calc_constructionCost+calc_contingencyAmount+calc_contractorProfit)*preliminariesPct", "calculator.js L102", fmt_calc_money)
    w(
        "subtotalBeforeFees",
        "=calc_constructionCost+calc_contingencyAmount+calc_contractorProfit+calc_preliminaries",
        "calculator.js L103",
        fmt_calc_money,
    )
    w("professionalFees", "=calc_subtotalBeforeFees*feesPct", "calculator.js L104", fmt_calc_money)
    w("subtotalExVAT", "=calc_subtotalBeforeFees+calc_professionalFees", "calculator.js L105", fmt_calc_money)
    w("vatAmount", "=calc_subtotalExVAT*vatPct", "calculator.js L106", fmt_calc_money)
    w(
        "totalFinancialAdditions",
        "=calc_contingencyAmount+calc_contractorProfit+calc_preliminaries+calc_professionalFees+calc_vatAmount",
        "calculator.js L107",
        fmt_calc_money,
    )
    w(
        "totalProjectCost",
        "=calc_constructionCost+calc_totalFinancialAdditions+calc_totalLandCost",
        "calculator.js L109",
        fmt_calc_money,
    )

    # Escalation: model yearsToStart as an input-friendly parameter.
    # Exact match to JS requires same 'now' and 30.44 days/month; here we provide the same math if user enters a StartDate and a NowDate.
    w("nowDate", "=TODAY()", "Excel TODAY() used; JS uses new Date()", fmt_calc_text)
    w("startDate", '=IF(estimatedStartDate="", "", DATEVALUE(estimatedStartDate))', "Inputs.estimatedStartDate", fmt_calc_text)
    w(
        "monthsToStart",
        '=IF(AND(includeEscalation, startDate<>""), MAX(0, (startDate-nowDate)/30.44), 0)',
        "calculator.js L137 (30.44 days/month)",
        fmt_calc_text,
    )
    w("yearsToStart", "=calc_monthsToStart/12", "calculator.js L138", fmt_calc_text)
    w(
        "escalatedTotal",
        '=IF(AND(includeEscalation, calc_yearsToStart>=1), calc_totalProjectCost*POWER(1+escalationRate/100, calc_yearsToStart), calc_totalProjectCost)',
        "calculator.js L146 (continuous exponent)",
        fmt_calc_money,
    )

    # ---------------- BREAKDOWN ----------------
    ws_breakdown.set_column(0, 0, 4)
    ws_breakdown.set_column(1, 1, 28)
    ws_breakdown.set_column(2, 2, 18)
    ws_breakdown.set_column(3, 3, 18)
    ws_breakdown.set_column(4, 4, 18)
    ws_breakdown.set_column(5, 5, 18)
    ws_breakdown.freeze_panes(1, 0)

    ws_breakdown.write(0, 0, "Idx", fmt_header)
    ws_breakdown.write(0, 1, "Element", fmt_header)
    ws_breakdown.write(0, 2, "DefaultPct", fmt_header)
    ws_breakdown.write(0, 3, "EffectivePct", fmt_header)
    ws_breakdown.write(0, 4, "HiddenWeight", fmt_header)
    ws_breakdown.write(0, 5, "Amount", fmt_header)

    # Put effective pct = IF(useCustomSplit, CustomElementPcts[i], DefaultPct)
    # WeightedShare_i = EffectivePct*HiddenWeight
    # Amount_i = (WeightedShare_i/SUM(weightedShares))*constructionCost
    for i, el in enumerate(c["BREAKDOWN_ELEMENTS"]):
        ws_breakdown.write_number(1 + i, 0, i + 1)
        ws_breakdown.write(1 + i, 1, el["label"])
        ws_breakdown.write_number(1 + i, 2, float(el["pct"]), fmt_calc_pct)
        ws_breakdown.write_formula(
            1 + i,
            3,
            f'=IF(useCustomSplit, INDEX(CustomElementPcts,{i+1}), {xlsxwriter.utility.xl_rowcol_to_cell(1+i,2)})',
            fmt_calc_pct,
        )
        ws_breakdown.write_number(1 + i, 4, float(c["ELEMENT_WEIGHTS"][i]))

    # Helper column weighted share in hidden area
    ws_breakdown.write(0, 6, "WeightedShare", fmt_header)
    for i in range(11):
        ws_breakdown.write_formula(1 + i, 6, f"={xlsxwriter.utility.xl_rowcol_to_cell(1+i,3)}*{xlsxwriter.utility.xl_rowcol_to_cell(1+i,4)}")
    ws_breakdown.write(0, 7, "TotalWeightedShare", fmt_header)
    ws_breakdown.write_formula(1, 7, "=SUM($G$2:$G$12)")
    ws_breakdown.write(0, 8, "ConstructionCost", fmt_header)
    ws_breakdown.write_formula(1, 8, "=calc_constructionCost")

    for i in range(11):
        ws_breakdown.write_formula(
            1 + i,
            5,
            f'=IF($H$2>0, ({xlsxwriter.utility.xl_rowcol_to_cell(1+i,6)}/$H$2)*$I$2, 0)',
            fmt_money,
        )

    ws_breakdown.set_column(6, 8, 0.1)  # hide helper cols visually

    # ---------------- SUMMARY ----------------
    ws_summary.set_column(0, 0, 40)
    ws_summary.set_column(1, 1, 24)
    ws_summary.set_column(2, 2, 60)
    ws_summary.write(0, 0, "Metric", fmt_header)
    ws_summary.write(0, 1, "Value", fmt_header)
    ws_summary.write(0, 2, "Trace", fmt_header)

    srow = 1
    def s(metric, formula, trace, fmt=None):
        nonlocal srow
        ws_summary.write(srow, 0, metric)
        ws_summary.write_formula(srow, 1, formula, fmt)
        ws_summary.write(srow, 2, trace, fmt_text)
        srow += 1

    s("Applied rate (totalAdjustedBaseRate)", "=calc_totalAdjustedBaseRate", "calculator.js totalAdjustedBaseRate", fmt_out_rate)
    s("Base construction cost (new)", "=calc_baseConstructionCostNew", "calculator.js baseConstructionCostNew", fmt_out_money)
    s("Base construction cost (renovation)", "=calc_baseConstructionCostRenovation", "calculator.js baseConstructionCostRenovation", fmt_out_money)
    s("Construction cost", "=calc_constructionCost", "calculator.js constructionCost", fmt_out_money)
    s("Total financial additions", "=calc_totalFinancialAdditions", "calculator.js totalFinancialAdditions", fmt_out_money)
    s("Total land cost", "=calc_totalLandCost", "calculator.js totalLandCost", fmt_out_money)
    s("Total project cost", "=calc_totalProjectCost", "calculator.js totalProjectCost", fmt_out_money)
    s("Escalated total (if enabled)", "=calc_escalatedTotal", "calculator.js escalatedTotal", fmt_out_money)

    # ---------------- CHECKS ----------------
    ws_checks.set_column(0, 0, 40)
    ws_checks.set_column(1, 1, 24)
    ws_checks.set_column(2, 2, 70)
    ws_checks.write(0, 0, "Check", fmt_header)
    ws_checks.write(0, 1, "Result", fmt_header)
    ws_checks.write(0, 2, "Meaning", fmt_header)

    ws_checks.write(1, 0, "Allocation totals to 1.0000")
    ws_checks.write_formula(1, 1, "=allocationCheck")
    ws_checks.write(1, 2, "Must be OK (abs(total-1)<0.0001). See calculator.js allocationCheck.", fmt_text)

    ws_checks.write(2, 0, "Custom element pcts total")
    ws_checks.write_formula(2, 1, "=SUM(CustomElementPcts)")
    ws_checks.write(2, 2, "Only relevant if useCustomSplit=TRUE; should be ~1.00.", fmt_text)

    ws_checks.write(3, 0, "Breakdown amounts sum to construction cost")
    ws_checks.write_formula(3, 1, "=SUM(BREAKDOWN!$F$2:$F$12)-calc_constructionCost", fmt_money)
    ws_checks.write(3, 2, "Should be 0 (within rounding). Breakdown is weighted by hidden weights.", fmt_text)

    # ---------------- REPORT (printable, app-like outputs) ----------------
    ws_report.set_column(0, 0, 36)
    ws_report.set_column(1, 1, 22)
    ws_report.set_column(2, 2, 22)
    ws_report.set_column(3, 3, 22)
    ws_report.set_margins(0.4, 0.4, 0.5, 0.5)
    ws_report.set_landscape()
    ws_report.fit_to_pages(1, 1)
    ws_report.print_area(0, 0, 60, 3)

    ws_report.write(0, 0, "AprIQ Estimate Report", fmt_title)
    ws_report.write(2, 0, "Key outputs", fmt_header)
    ws_report.write(3, 0, "Applied rate (ZAR/m²)", fmt_header)
    ws_report.write_formula(3, 1, "=calc_totalAdjustedBaseRate", fmt_out_rate)
    ws_report.write(4, 0, "Construction cost", fmt_header)
    ws_report.write_formula(4, 1, "=calc_constructionCost", fmt_out_money)
    ws_report.write(5, 0, "Total financial additions", fmt_header)
    ws_report.write_formula(5, 1, "=calc_totalFinancialAdditions", fmt_out_money)
    ws_report.write(6, 0, "Total land cost", fmt_header)
    ws_report.write_formula(6, 1, "=calc_totalLandCost", fmt_out_money)
    ws_report.write(7, 0, "Total project cost", fmt_header)
    ws_report.write_formula(7, 1, "=calc_totalProjectCost", fmt_out_money)
    ws_report.write(8, 0, "Escalated total (if enabled)", fmt_header)
    ws_report.write_formula(8, 1, "=calc_escalatedTotal", fmt_out_money)

    ws_report.write(10, 0, "Elemental breakdown (weighted)", fmt_header)
    ws_report.write(11, 0, "Element", fmt_header)
    ws_report.write(11, 1, "Amount", fmt_header)
    for i in range(11):
        ws_report.write_formula(12 + i, 0, f"=BREAKDOWN!{xlsxwriter.utility.xl_rowcol_to_cell(1+i,1)}")
        ws_report.write_formula(12 + i, 1, f"=BREAKDOWN!{xlsxwriter.utility.xl_rowcol_to_cell(1+i,5)}", fmt_money)

    # Final polish
    ws_assumptions.autofilter(0, 0, 0, 0)
    ws_inputs.autofilter(0, 0, 0, 2)
    ws_calcs.autofilter(0, 0, 0, 2)
    ws_breakdown.autofilter(0, 0, 0, 5)
    ws_summary.autofilter(0, 0, 0, 2)
    ws_checks.autofilter(0, 0, 0, 2)
    ws_report.autofilter(11, 0, 11, 1)

    wb.close()

    # Cleanup temp extract file; keep constants json for audit.
    try:
        os.remove(tmp_js)
    except OSError:
        pass


if __name__ == "__main__":
    out = os.path.join(REPO_ROOT, "AprIQ-Calculation-Engine.xlsx")
    build(out)
    print(f"Wrote {out}")

