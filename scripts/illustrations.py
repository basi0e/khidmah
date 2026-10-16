# Khidmah illustration set. Each scene is SVG inner markup for viewBox "0 0 240 160".
INK="#1b2430"; PALM="#0e6b57"; DEEP="#0a4f41"; SUN="#f2b33d"; MIST="#e3eee8"; LINE="#d8e0db"
PALE="#cfe5dc"; SUNPALE="#fbe7b5"; W="#ffffff"
S=f'stroke="{INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"'

def blob(): return f'<circle cx="120" cy="80" r="64" fill="{MIST}"/><ellipse cx="120" cy="142" rx="86" ry="7" fill="{LINE}"/>'
def spark(x,y,c,s=1): return f'<path transform="translate({x} {y}) scale({s})" d="M0 -9 L2.5 -2.5 L9 0 L2.5 2.5 L0 9 L-2.5 2.5 L-9 0 L-2.5 -2.5Z" fill="{c}"/>'
def drop(x,y,c=PALM,s=1): return f'<path transform="translate({x} {y}) scale({s})" d="M0 -8 C4 -2 6 1 6 4 a6 6 0 0 1 -12 0 C-6 1 -4 -2 0 -8Z" fill="{c}"/>'
def wrench(x,y,rot,c=SUN,s=1): return (f'<g transform="translate({x} {y}) rotate({rot}) scale({s})">'
  f'<rect x="-4" y="-2" width="8" height="40" rx="4" fill="{c}" {S}/>'
  f'<path d="M-11 -14 a12 12 0 1 0 22 0 l-5 4 h-12 z" fill="{c}" {S}/></g>')

SCENES = {}

SCENES["ac"] = blob() + (
  f'<rect x="44" y="36" width="152" height="52" rx="12" fill="{W}" {S}/>'
  f'<path d="M58 54 h46" stroke="{LINE}" stroke-width="4" stroke-linecap="round"/>'
  f'<circle cx="178" cy="52" r="4.5" fill="{SUN}"/>'
  f'<rect x="58" y="72" width="124" height="8" rx="4" fill="{PALM}"/>'
  + ''.join(f'<path d="M{x} 98 q9 7 0 14 q-9 7 0 14" fill="none" stroke="{PALM}" stroke-width="3.5" stroke-linecap="round"/>' for x in (86,120,154))
  + f'<g transform="translate(204 114)" stroke="{PALM}" stroke-width="2.5" stroke-linecap="round"><path d="M0 -10 V10 M-9 -5 L9 5 M-9 5 L9 -5"/></g>'
  + spark(34,112,SUN,0.8))

SCENES["plumbing"] = blob() + (
  f'<rect x="54" y="98" width="132" height="40" rx="4" fill="{W}" {S}/>'
  f'<path d="M120 98 v40" {S}/><circle cx="110" cy="118" r="3" fill="{INK}"/><circle cx="130" cy="118" r="3" fill="{INK}"/>'
  f'<rect x="38" y="86" width="164" height="13" rx="5" fill="{INK}"/>'
  f'<path d="M116 86 v-30 q0 -10 10 -10 h16 q10 0 10 10 v6" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>'
  f'<path d="M116 86 v-30 q0 -10 10 -10 h16 q10 0 10 10 v6" fill="none" stroke="{LINE}" stroke-width="2.5" stroke-linecap="round"/>'
  f'<rect x="104" y="58" width="24" height="8" rx="4" fill="{SUN}" {S}/>'
  + drop(152,74,PALM,0.9) + drop(144,84,PALM,0.6)
  + wrench(196,64,35,SUN,0.9) + spark(60,52,SUN,0.8))

SCENES["electrical"] = blob() + (
  f'<path d="M84 22 h72" {S}/><path d="M120 22 v22" {S}/>'
  f'<path d="M94 70 l10 -26 h32 l10 26 z" fill="{SUN}" {S}/>'
  f'<circle cx="120" cy="78" r="8" fill="{W}" {S}/>'
  + ''.join(f'<path d="{d}" stroke="{SUN}" stroke-width="3" stroke-linecap="round"/>' for d in ("M120 94 v8","M100 88 l-6 6","M140 88 l6 6"))
  + f'<rect x="150" y="96" width="44" height="44" rx="9" fill="{W}" {S}/>'
  f'<circle cx="165" cy="118" r="3.5" fill="{INK}"/><circle cx="179" cy="118" r="3.5" fill="{INK}"/>'
  f'<path d="M72 96 l-16 24 h14 l-6 22 l22 -30 h-14 l8 -16 z" fill="{PALM}" {S}/>')

SCENES["cleaning"] = blob() + (
  f'<path d="M66 70 q30 -36 60 0" fill="none" {S}/>'
  f'<circle cx="80" cy="74" r="9" fill="{W}" {S}/><circle cx="97" cy="68" r="11" fill="{W}" {S}/><circle cx="113" cy="74" r="8" fill="{W}" {S}/>'
  f'<path d="M64 84 h64 l-7 52 h-50 z" fill="{PALM}" {S}/>'
  f'<rect x="60" y="78" width="72" height="10" rx="4" fill="{DEEP}" {S}/>'
  f'<rect x="150" y="82" width="36" height="56" rx="9" fill="{SUN}" {S}/>'
  f'<rect x="160" y="68" width="16" height="14" fill="{W}" {S}/>'
  f'<path d="M150 58 h30 v10 h-30 z" fill="{INK}" {S}/><path d="M150 66 l-8 10" {S}/>'
  f'<rect x="158" y="98" width="20" height="16" rx="3" fill="{W}"/>'
  + ''.join(f'<circle cx="{x}" cy="{y}" r="2.2" fill="{PALM}"/>' for x,y in ((136,56),(130,62),(138,66),(128,50)))
  + spark(46,52,SUN) + spark(206,58,PALM,0.8))

SCENES["painting"] = blob() + (
  f'<rect x="40" y="30" width="118" height="108" rx="4" fill="{W}"/>'
  f'<rect x="40" y="30" width="56" height="108" rx="4" fill="{PALE}"/>'
  f'<rect x="40" y="30" width="118" height="108" rx="4" fill="none" {S}/>'
  f'<path d="M96 30 v108" stroke="{PALM}" stroke-width="2" stroke-dasharray="4 5"/>'
  f'<rect x="86" y="46" width="50" height="20" rx="10" fill="{SUN}" {S}/>'
  f'<path d="M136 56 h14 v34 h-16 v24" fill="none" stroke="{INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>'
  f'<rect x="128" y="112" width="12" height="26" rx="5" fill="{INK}"/>'
  f'<path d="M166 134 l12 -18 h34 l-8 18 z" fill="{PALM}" {S}/>'
  f'<path d="M176 120 h28" stroke="{PALE}" stroke-width="3" stroke-linecap="round"/>'
  + spark(196,50,SUN,0.9))

SCENES["carpentry"] = blob() + (
  f'<rect x="46" y="38" width="92" height="98" rx="6" fill="{SUNPALE}" {S}/>'
  f'<path d="M46 86 h92" {S}/>'
  f'<rect x="56" y="48" width="72" height="30" rx="3" fill="{W}" {S}/>'
  f'<circle cx="92" cy="104" r="4" fill="{INK}"/>'
  f'<path d="M138 42 l30 -6 v96 l-30 4 z" fill="{W}" {S}/>'
  f'<circle cx="160" cy="86" r="3.5" fill="{INK}"/>'
  f'<path d="M180 138 L208 104" stroke="{DEEP}" stroke-width="8" stroke-linecap="round"/>'
  f'<path d="M196 88 l22 18 l-7 8 l-22 -18 z" fill="{INK}"/>'
  + spark(34,60,SUN,0.8))

SCENES["appliance"] = blob() + (
  f'<rect x="74" y="28" width="92" height="112" rx="12" fill="{W}" {S}/>'
  f'<path d="M74 52 h92" {S}/>'
  f'<circle cx="148" cy="40" r="6" fill="{SUN}" {S}/>'
  f'<circle cx="90" cy="40" r="3" fill="{PALM}"/><circle cx="102" cy="40" r="3" fill="{LINE}"/>'
  f'<circle cx="120" cy="96" r="31" fill="{LINE}" {S}/>'
  f'<circle cx="120" cy="96" r="21" fill="{PALE}" {S}/>'
  f'<path d="M101 100 q9.5 -7 19 0 q9.5 7 19 0" fill="none" stroke="{PALM}" stroke-width="3" stroke-linecap="round"/>'
  + wrench(196,92,25,SUN,0.85) + spark(46,60,SUN,0.8))

SCENES["pest"] = blob() + (
  f'<path d="M132 28 l42 14 v34 q0 36 -42 52 q-42 -16 -42 -52 v-34 z" fill="{PALM}" {S}/>'
  f'<path d="M114 80 l12 12 l24 -26" fill="none" stroke="{W}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
  f'<g transform="translate(56 110)">'
  f'<path d="M-14 -8 l-8 -4 M-14 2 h-9 M-14 12 l-8 4 M14 -8 l8 -4 M14 2 h9 M14 12 l8 4 M-4 -18 l-5 -7 M4 -18 l5 -7" stroke="{INK}" stroke-width="2.5" stroke-linecap="round"/>'
  f'<ellipse cx="0" cy="2" rx="13" ry="17" fill="{INK}"/><circle cx="0" cy="-15" r="6" fill="{INK}"/></g>'
  f'<circle cx="56" cy="108" r="27" fill="none" stroke="{SUN}" stroke-width="5"/>'
  f'<path d="M37 89 L75 127" stroke="{SUN}" stroke-width="5" stroke-linecap="round"/>')

SCENES["moving"] = blob() + (
  f'<rect x="34" y="92" width="50" height="46" fill="{SUNPALE}" {S}/><path d="M59 92 v14" stroke="{SUN}" stroke-width="5"/>'
  f'<rect x="42" y="58" width="38" height="34" fill="{SUNPALE}" {S}/><path d="M61 58 v10" stroke="{SUN}" stroke-width="5"/>'
  f'<rect x="100" y="64" width="74" height="58" rx="4" fill="{PALM}" {S}/>'
  f'<path d="M174 80 h22 l16 18 v24 h-38 z" fill="{W}" {S}/>'
  f'<path d="M180 86 h14 l9 11 h-23 z" fill="{PALE}"/>'
  f'<path d="M112 80 h50" stroke="{PALE}" stroke-width="3" stroke-linecap="round"/>'
  f'<circle cx="126" cy="126" r="11" fill="{INK}"/><circle cx="126" cy="126" r="4" fill="{W}"/>'
  f'<circle cx="192" cy="126" r="11" fill="{INK}"/><circle cx="192" cy="126" r="4" fill="{W}"/>')

SCENES["rooms"] = blob() + (
  f'<path d="M150 46 l22 -16 l22 16 v48 h-44 z" fill="{PALE}" {S}/>'
  f'<path d="M172 46 v48 M150 70 h44" stroke="{INK}" stroke-width="2.5"/>'
  f'<rect x="38" y="76" width="14" height="62" rx="3" fill="{DEEP}" {S}/>'
  f'<rect x="50" y="98" width="100" height="24" rx="7" fill="{W}" {S}/>'
  f'<rect x="84" y="98" width="66" height="24" rx="7" fill="{SUN}" {S}/>'
  f'<rect x="56" y="88" width="26" height="13" rx="6" fill="{W}" {S}/>'
  f'<path d="M58 122 v14 M144 122 v14" {S}/>'
  f'<path d="M190 138 v-26" {S}/><path d="M182 112 h16 l-3 -12 h-10 z" fill="{SUN}" {S}/>')

# Spot illustrations for "How it works" and the providers section
SCENES["step-request"] = blob() + (
  f'<rect x="84" y="18" width="72" height="124" rx="14" fill="{W}" {S}/>'
  f'<path d="M108 28 h24" stroke="{LINE}" stroke-width="4" stroke-linecap="round"/>'
  f'<rect x="94" y="42" width="52" height="30" rx="6" fill="{PALE}"/>'
  f'<path d="M100 52 h26 M100 62 h38" stroke="{PALM}" stroke-width="3" stroke-linecap="round"/>'
  f'<path d="M96 84 h48 M96 94 h34" stroke="{LINE}" stroke-width="4" stroke-linecap="round"/>'
  f'<rect x="96" y="112" width="48" height="16" rx="8" fill="{INK}"/>'
  + spark(176,50,SUN) + spark(60,96,PALM,0.8))

SCENES["step-pro"] = blob() + (
  f'<path d="M78 142 q0 -48 42 -48 q42 0 42 48 z" fill="{PALM}" {S}/>'
  f'<path d="M108 96 l12 14 l12 -14" fill="none" stroke="{W}" stroke-width="3" stroke-linejoin="round"/>'
  f'<circle cx="140" cy="122" r="7" fill="{SUN}" {S}/>'
  f'<circle cx="120" cy="66" r="22" fill="{SUNPALE}" {S}/>'
  f'<path d="M97 60 q2 -26 23 -26 q21 0 23 26 z" fill="{DEEP}" {S}/><path d="M92 60 h38" {S}/>'
  f'<rect x="168" y="112" width="44" height="28" rx="4" fill="{SUN}" {S}/><path d="M180 112 v-8 h20 v8" fill="none" {S}/>'
  + spark(56,54,SUN,0.9))

SCENES["step-bill"] = blob() + (
  f'<path d="M78 22 h80 v112 l-10 -7 l-10 7 l-10 -7 l-10 7 l-10 -7 l-10 7 l-10 -7 l-10 7 z" fill="{W}" {S}/>'
  f'<path d="M92 44 h40 M92 60 h52 M92 76 h30" stroke="{LINE}" stroke-width="4" stroke-linecap="round"/>'
  f'<path d="M92 100 h52" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>'
  f'<circle cx="166" cy="104" r="22" fill="{PALM}" {S}/>'
  f'<path d="M156 104 l7 7 l14 -15" fill="none" stroke="{W}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
  + spark(60,46,SUN,0.9))

def ts():
    import json
    body = ",\n".join(f'  {json.dumps(k)}: {json.dumps(v)}' for k,v in SCENES.items())
    return ("// Original Khidmah illustrations (viewBox 0 0 240 160). Generated; edit the scenes, not the markup by hand.\n"
            "export const SCENES: Record<string, string> = {\n" + body + ",\n};\n")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "ts":
        print(ts(), end="")
    else:
        import cairosvg
        keys=list(SCENES); cols=4; w,h=240,160; pad=16
        rows=(len(keys)+cols-1)//cols
        parts=[]
        for i,k in enumerate(keys):
            x=(i%cols)*(w+pad); y=(i//cols)*(h+pad+18)
            parts.append(f'<g transform="translate({x} {y})"><rect width="{w}" height="{h}" fill="#fff" stroke="#ccc"/>{SCENES[k]}<text x="4" y="{h+14}" font-size="12" font-family="sans-serif">{k}</text></g>')
        W2=cols*(w+pad); H2=rows*(h+pad+18)
        svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{W2}" height="{H2}" viewBox="0 0 {W2} {H2}"><rect width="100%" height="100%" fill="#f6f6f6"/>{"".join(parts)}</svg>'
        cairosvg.svg2png(bytestring=svg.encode(), write_to="sheet.png", output_width=W2*1.5)
        print("ok", len(keys))
