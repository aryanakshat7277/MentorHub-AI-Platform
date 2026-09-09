import os
from reportlab.pdfgen import canvas
from reportlab.lib import colors
import math
import shutil

page_w = 1496.69
page_h = 841.89

def build_organized_use_case(target_path):
    c = canvas.Canvas(target_path, pagesize=(page_w, page_h))
    
    # -------------------------------------------------------------
    # BACKGROUND & LUXURY BORDERS
    # -------------------------------------------------------------
    c.setFillColor(colors.HexColor("#FAF4EE"))
    c.rect(0, 0, page_w, page_h, fill=1, stroke=0)
    
    # Outer decorative luxury borders
    c.setStrokeColor(colors.HexColor("#1A5276"))
    c.setLineWidth(2.5)
    c.rect(15, 15, page_w - 30, page_h - 30)
    c.setStrokeColor(colors.HexColor("#D4AF37"))
    c.setLineWidth(0.8)
    c.rect(20, 20, page_w - 40, page_h - 40)
    
    # Header Icon & Title Banner
    c.setFillColor(colors.HexColor("#1A5276"))
    c.circle(52, page_h - 52, 19, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(52, page_h - 59, "U")
    
    c.setFillColor(colors.HexColor("#150E0B"))
    c.setFont("Helvetica-Bold", 18)
    c.drawString(88, page_h - 45, "MENTORHUB AI PLATFORM \u2014 UML USE CASE DIAGRAM")
    c.setFillColor(colors.HexColor("#555555"))
    c.setFont("Helvetica-Oblique", 10.5)
    c.drawString(88, page_h - 60, "User Roles \u2022 Core Application Features \u2022 System Interactions & Workflows")
    
    # Status Pill
    c.setFillColor(colors.HexColor("#117A65"))
    c.roundRect(page_w - 210, page_h - 65, 170, 24, 5, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 9.0)
    c.drawCentredString(page_w - 125, page_h - 53, "CLEAR & SIMPLE TERMS")
    
    # -------------------------------------------------------------
    # SYSTEM BOUNDARY
    # -------------------------------------------------------------
    sys_x = 240
    sys_y = 52
    sys_w = 1016
    sys_h = page_h - 146
    
    c.setFillColor(colors.HexColor("#FAF4EE"))
    c.setStrokeColor(colors.HexColor("#1A5276"))
    c.setLineWidth(1.8)
    c.roundRect(sys_x, sys_y, sys_w, sys_h, 10, fill=1, stroke=1)
    
    # Boundary Title Tag
    c.setFillColor(colors.HexColor("#1A5276"))
    c.roundRect(sys_x + 16, sys_y + sys_h - 26, 360, 22, 5, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(sys_x + 26, sys_y + sys_h - 20, "SYSTEM BOUNDARY : MENTORHUB APPLICATION")

    # -------------------------------------------------------------
    # 4 FUNCTIONAL SUBSYSTEM CARDS (BACKGROUND SHADING)
    # -------------------------------------------------------------
    col_w = 230
    col_gap = 18
    start_x = sys_x + 20
    
    col1_left = start_x
    col2_left = start_x + (col_w + col_gap)
    col3_left = start_x + (col_w + col_gap) * 2
    col4_left = start_x + (col_w + col_gap) * 3
    
    # Give space at bottom for the legend
    col_h = sys_h - 76
    col_y = sys_y + 36
    
    subsystems = [
        (col1_left, col_y, col_w, col_h, "1. ACCOUNTS & MATCHING", colors.HexColor("#2980B9"), colors.HexColor("#EBF5FB")),
        (col2_left, col_y, col_w, col_h, "2. SESSIONS & MEETINGS", colors.HexColor("#117A65"), colors.HexColor("#E8F8F5")),
        (col3_left, col_y, col_w, col_h, "3. GOALS & AI ASSISTANT", colors.HexColor("#8E44AD"), colors.HexColor("#F4ECF7")),
        (col4_left, col_y, col_w, col_h, "4. CERTIFICATES & REPORTS", colors.HexColor("#34495E"), colors.HexColor("#EAECEE"))
    ]
    
    for sx, sy, sw, sh, header, hdr_color, bg_color in subsystems:
        # Card Background
        c.setFillColor(bg_color)
        c.setStrokeColor(hdr_color)
        c.setLineWidth(1.0)
        c.roundRect(sx, sy, sw, sh, 8, fill=1, stroke=1)
        
        # Subsystem Header Tab
        c.setFillColor(hdr_color)
        c.path = c.beginPath()
        c.path.roundRect(sx, sy + sh - 22, sw, 22, 8)
        c.drawPath(c.path, fill=1, stroke=0)
        
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 8.8)
        c.drawCentredString(sx + sw/2, sy + sh - 15, header)

    # -------------------------------------------------------------
    # HELPER FUNCTIONS
    # -------------------------------------------------------------
    def get_ellipse_point(cx, cy, w, h, target_x, target_y):
        angle = math.atan2(target_y - cy, target_x - cx)
        rx = w / 2.0
        ry = h / 2.0
        px = cx + rx * math.cos(angle)
        py = cy + ry * math.sin(angle)
        return px, py

    def draw_actor(c, x, y, title, role_subtitle, color, badge_color):
        c.saveState()
        # Card container
        c.setFillColor(colors.HexColor("#EDE5DA"))
        c.roundRect(x - 68, y - 76, 136, 152, 8, fill=1, stroke=0)
        c.setFillColor(colors.HexColor("#FAF4EE"))
        c.setStrokeColor(badge_color)
        c.setLineWidth(1.6)
        c.roundRect(x - 70, y - 74, 140, 150, 8, fill=1, stroke=1)
        
        # Stick figure
        c.setStrokeColor(color)
        c.setLineWidth(2.4)
        c.setFillColor(colors.HexColor("#FAF4EE"))
        # Head
        c.circle(x, y + 42, 13, fill=1, stroke=1)
        # Face detail
        c.setFillColor(color)
        c.circle(x - 4, y + 43, 2, fill=1, stroke=0)
        c.circle(x + 4, y + 43, 2, fill=1, stroke=0)
        # Body
        c.line(x, y + 29, x, y + 2)
        # Arms
        c.line(x - 18, y + 20, x + 18, y + 20)
        c.line(x - 18, y + 20, x - 24, y + 10)
        c.line(x + 18, y + 20, x + 24, y + 10)
        # Legs
        c.line(x, y + 2, x - 14, y - 22)
        c.line(x, y + 2, x + 14, y - 22)
        
        # Actor Title Pill
        c.setFillColor(badge_color)
        c.roundRect(x - 62, y - 48, 124, 18, 4, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 9.5)
        c.drawCentredString(x, y - 44, title)
        
        # Role subtitle
        c.setFillColor(colors.HexColor("#333333"))
        c.setFont("Helvetica-Bold", 8.2)
        c.drawCentredString(x, y - 62, role_subtitle)
        c.restoreState()

    def draw_use_case(c, x, y, w, h, title, subtitle, color):
        c.saveState()
        # 3D Shadow
        c.setFillColor(colors.HexColor("#2C1D16"))
        c.ellipse(x - w/2 + 3, y - h/2 - 3, x + w/2 + 3, y + h/2 - 3, fill=1, stroke=0)
        
        # Main Ellipse Background
        c.setFillColor(colors.HexColor("#FFFFFF"))
        c.setStrokeColor(color)
        c.setLineWidth(2.0)
        c.ellipse(x - w/2, y - h/2, x + w/2, y + h/2, fill=1, stroke=1)
        
        # Inner Header Banner
        c.setFillColor(color)
        c.path = c.beginPath()
        c.path.moveTo(x - w/2 + 22, y + 5)
        c.path.lineTo(x + w/2 - 22, y + 5)
        c.path.arcTo(x + w/2 - 32, y + 5, x + w/2 - 12, y + 24, 0, 90)
        c.path.lineTo(x - w/2 + 32, y + 24)
        c.path.arcTo(x - w/2 + 12, y + 5, x - w/2 + 32, y + 24, 90, 90)
        c.drawPath(c.path, fill=1, stroke=0)
        
        # Title text
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 9.0)
        c.drawCentredString(x, y + 11, title)
        
        # Subtitle detail text
        c.setFillColor(colors.HexColor("#222222"))
        c.setFont("Helvetica-Bold", 8.0)
        c.drawCentredString(x, y - 9, subtitle)
        c.restoreState()

    def draw_assoc(c, x1, y1, uc, color):
        c.saveState()
        cx, cy, w, h = uc[0], uc[1], uc[2], uc[3]
        ex, ey = get_ellipse_point(cx, cy, w, h, x1, y1)
        c.setStrokeColor(color)
        c.setLineWidth(1.6)
        c.line(x1, y1, ex, ey)
        c.restoreState()

    def draw_uml_relation(c, uc_src, uc_dst, stereotype="<<include>>", color=colors.HexColor("#8E44AD")):
        c.saveState()
        sx, sy, sw, sh = uc_src[0], uc_src[1], uc_src[2], uc_src[3]
        dx, dy, dw, dh = uc_dst[0], uc_dst[1], uc_dst[2], uc_dst[3]
        
        x1, y1 = get_ellipse_point(sx, sy, sw, sh, dx, dy)
        x2, y2 = get_ellipse_point(dx, dy, dw, dh, sx, sy)
        
        c.setStrokeColor(color)
        c.setLineWidth(1.4)
        c.setDash(4, 3)
        c.line(x1, y1, x2, y2)
        
        # Relationship Pill
        mid_x = (x1 + x2) / 2
        mid_y = (y1 + y2) / 2
        raw_angle = math.atan2(y2 - y1, x2 - x1)
        deg = math.degrees(raw_angle)
        
        text_deg = deg
        if text_deg > 90:
            text_deg -= 180
        elif text_deg < -90:
            text_deg += 180
            
        c.translate(mid_x, mid_y)
        c.rotate(text_deg)
        
        c.setFillColor(colors.HexColor("#FFFFFF"))
        c.setStrokeColor(color)
        c.setLineWidth(1.0)
        c.roundRect(-26, -7, 52, 14, 3, fill=1, stroke=1)
        
        c.setFillColor(color)
        c.setFont("Helvetica-Bold", 7.8)
        c.drawCentredString(0, -3, stereotype)
        c.restoreState()
        
        # Arrowhead pointing to target (x2, y2)
        c.saveState()
        arrow_len = 8.5
        ax1 = x2 - arrow_len * math.cos(raw_angle - math.pi / 6)
        ay1 = y2 - arrow_len * math.sin(raw_angle - math.pi / 6)
        ax2 = x2 - arrow_len * math.cos(raw_angle + math.pi / 6)
        ay2 = y2 - arrow_len * math.sin(raw_angle + math.pi / 6)
        c.setStrokeColor(color)
        c.setLineWidth(1.4)
        c.line(x2, y2, ax1, ay1)
        c.line(x2, y2, ax2, ay2)
        c.restoreState()

    # -------------------------------------------------------------
    # GEOMETRY & POSITIONS
    # -------------------------------------------------------------
    # Left Actors
    act_mentee_x = 115
    act_mentee_y = 540
    
    act_mentor_x = 115
    act_mentor_y = 240
    
    # Right Actors
    act_verifier_x = 1380
    act_verifier_y = 540
    
    act_admin_x = 1380
    act_admin_y = 240

    # 4 Column Centers
    c1_x = col1_left + col_w / 2
    c2_x = col2_left + col_w / 2
    c3_x = col3_left + col_w / 2
    c4_x = col4_left + col_w / 2
    
    # 3 Systematic Rows
    r1_y = 555
    r2_y = 390
    r3_y = 225

    uc_w = 196
    uc_h = 66

    # 12 Systematic Use Cases (Clean & Natural Terminology)
    # Subsystem 1: Accounts & Matching
    uc1 = (c1_x, r1_y, uc_w, uc_h, "1. Register & Login", "Secure Auth \u2022 Edit Profile & Bio", colors.HexColor("#2980B9"))
    uc2 = (c1_x, r2_y, uc_w, uc_h, "2. Find & Match Mentors", "Filter Skills \u2022 Match Score", colors.HexColor("#8E44AD"))
    uc3 = (c1_x, r3_y, uc_w, uc_h, "3. View Learning Path", "Step-by-Step Roadmap Tree", colors.HexColor("#16A085"))

    # Subsystem 2: Sessions & Meetings
    uc4 = (c2_x, r1_y, uc_w, uc_h, "4. Book Mentoring Session", "Select Date & Time \u2022 Confirm", colors.HexColor("#D35400"))
    uc5 = (c2_x, r2_y, uc_w, uc_h, "5. Live Video & Code Session", "Video Call \u2022 Code & Whiteboard", colors.HexColor("#117A65"))
    uc6 = (c2_x, r3_y, uc_w, uc_h, "6. Browse Study Resources", "Articles & Videos \u2022 Bookmarks", colors.HexColor("#F39C12"))

    # Subsystem 3: Goals & AI Assistant
    uc7 = (c3_x, r1_y, uc_w, uc_h, "7. Manage Goals & Tasks", "To-Do & Progress \u2022 Mentor Sign-off", colors.HexColor("#C0392B"))
    uc8 = (c3_x, r2_y, uc_w, uc_h, "8. Chat with AI Assistant", "Instant Q&A \u2022 Career & Study Help", colors.HexColor("#6C3483"))
    uc9 = (c3_x, r3_y, uc_w, uc_h, "9. Earn Points & Badges", "Daily Streaks \u2022 XP Points & Levels", colors.HexColor("#E67E22"))

    # Subsystem 4: Certificates & Reports
    uc11 = (c4_x, r1_y, uc_w, uc_h, "11. Download Certificate", "Export PDF \u2022 Verify with QR Code", colors.HexColor("#27AE60"))
    uc10 = (c4_x, r2_y, uc_w, uc_h, "10. View Performance Charts", "Weekly Progress \u2022 Session Stats", colors.HexColor("#2E86C1"))
    uc12 = (c4_x, r3_y, uc_w, uc_h, "12. Manage Users & Platform", "Account Moderation \u2022 System Health", colors.HexColor("#34495E"))

    # -------------------------------------------------------------
    # DRAW ASSOCIATIONS (Cleanly connected, zero crossings)
    # -------------------------------------------------------------
    COLOR_MENTEE = colors.HexColor("#C0392B")
    COLOR_MENTOR = colors.HexColor("#D35400")
    COLOR_ADMIN = colors.HexColor("#1A5276")
    COLOR_VERIFIER = colors.HexColor("#27AE60")

    # Mentee Associations (Origin: act_mentee_x + 70, act_mentee_y)
    m_ox, m_oy = act_mentee_x + 70, act_mentee_y
    draw_assoc(c, m_ox, m_oy + 20, uc1, COLOR_MENTEE)
    draw_assoc(c, m_ox, m_oy, uc2, COLOR_MENTEE)
    draw_assoc(c, m_ox, m_oy - 20, uc3, COLOR_MENTEE)

    # Mentor Associations (Origin: act_mentor_x + 70, act_mentor_y)
    men_ox, men_oy = act_mentor_x + 70, act_mentor_y
    # Left-rail connection to UC1
    c.saveState()
    c.setStrokeColor(COLOR_MENTOR)
    c.setLineWidth(1.6)
    c.line(men_ox, men_oy + 40, men_ox + 35, men_oy + 40)
    c.line(men_ox + 35, men_oy + 40, men_ox + 35, uc1[1] - 25)
    ex, ey = get_ellipse_point(uc1[0], uc1[1], uc_w, uc_h, men_ox + 35, uc1[1] - 25)
    c.line(men_ox + 35, uc1[1] - 25, ex, ey)
    c.restoreState()
    
    draw_assoc(c, men_ox, men_oy + 15, uc5, COLOR_MENTOR)
    draw_assoc(c, men_ox, men_oy - 15, uc6, COLOR_MENTOR)

    # Verifier Associations (Origin: act_verifier_x - 70, act_verifier_y)
    v_ox, v_oy = act_verifier_x - 70, act_verifier_y
    draw_assoc(c, v_ox, v_oy, uc11, COLOR_VERIFIER)

    # Admin Associations (Origin: act_admin_x - 70, act_admin_y)
    adm_ox, adm_oy = act_admin_x - 70, act_admin_y
    draw_assoc(c, adm_ox, adm_oy + 25, uc10, COLOR_ADMIN)
    draw_assoc(c, adm_ox, adm_oy - 20, uc12, COLOR_ADMIN)

    # -------------------------------------------------------------
    # DRAW UML RELATIONSHIPS (Strictly clean orthogonal / horizontal)
    # -------------------------------------------------------------
    # Row 1 Horizontal: UC4 (Booking) <<include>> UC1 (Auth)
    draw_uml_relation(c, uc4, uc1, "<<include>>", colors.HexColor("#2980B9"))
    
    # Row 1 Horizontal: UC11 (Certificate) <<include>> UC7 (Goals)
    draw_uml_relation(c, uc11, uc7, "<<include>>", colors.HexColor("#27AE60"))
    
    # Row 2 Horizontal: UC8 (AI Chatbot) <<extend>> UC5 (Live Studio)
    draw_uml_relation(c, uc8, uc5, "<<extend>>", colors.HexColor("#6C3483"))
    
    # Row 2 Horizontal: UC10 (Analytics) <<include>> UC8 (AI Chatbot)
    draw_uml_relation(c, uc10, uc8, "<<include>>", colors.HexColor("#2E86C1"))
    
    # Row 3 Horizontal: UC6 (Resource Hub) <<include>> UC3 (Learning Path)
    draw_uml_relation(c, uc6, uc3, "<<include>>", colors.HexColor("#16A085"))
    
    # Row 3 Horizontal: UC9 (Gamification) <<extend>> UC6 (Resource Hub)
    draw_uml_relation(c, uc9, uc6, "<<extend>>", colors.HexColor("#E67E22"))

    # Vertical Column 1: UC2 (Matchmaker) <<include>> UC1 (Register & Login)
    draw_uml_relation(c, uc2, uc1, "<<include>>", colors.HexColor("#2980B9"))
    
    # Vertical Column 2: UC5 (Live Session) <<include>> UC4 (Booking)
    draw_uml_relation(c, uc5, uc4, "<<include>>", colors.HexColor("#D35400"))
    
    # Vertical Column 3: UC7 (Goals) <<extend>> UC8 (AI Chatbot)
    draw_uml_relation(c, uc7, uc8, "<<extend>>", colors.HexColor("#6C3483"))
    
    # Vertical Column 3: UC8 (AI Chatbot) <<extend>> UC9 (Gamification)
    draw_uml_relation(c, uc8, uc9, "<<extend>>", colors.HexColor("#8E44AD"))

    # -------------------------------------------------------------
    # DRAW USE CASES
    # -------------------------------------------------------------
    all_ucs = [uc1, uc2, uc3, uc4, uc5, uc6, uc7, uc8, uc9, uc10, uc11, uc12]
    for uc in all_ucs:
        draw_use_case(c, *uc)

    # -------------------------------------------------------------
    # DRAW ACTORS
    # -------------------------------------------------------------
    draw_actor(c, act_mentee_x, act_mentee_y, "Student / Mentee", "Learner Account", COLOR_MENTEE, colors.HexColor("#C0392B"))
    draw_actor(c, act_mentor_x, act_mentor_y, "Expert Mentor", "Teacher & Guide", COLOR_MENTOR, colors.HexColor("#D35400"))
    draw_actor(c, act_verifier_x, act_verifier_y, "Public Verifier", "Scans Certificate QR", COLOR_VERIFIER, colors.HexColor("#27AE60"))
    draw_actor(c, act_admin_x, act_admin_y, "System Admin", "Platform Manager", COLOR_ADMIN, colors.HexColor("#1A5276"))

    # -------------------------------------------------------------
    # LEGEND / FOOTER METADATA
    # -------------------------------------------------------------
    c.saveState()
    leg_x = sys_x + 20
    leg_y = sys_y + 12
    c.setFillColor(colors.HexColor("#2C1D16"))
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(leg_x, leg_y, "UML CONVENTIONS :")
    
    # Solid Line
    c.setStrokeColor(colors.HexColor("#150E0B"))
    c.setLineWidth(1.4)
    c.line(leg_x + 110, leg_y + 3, leg_x + 140, leg_y + 3)
    c.setFillColor(colors.HexColor("#555555"))
    c.setFont("Helvetica", 8.0)
    c.drawString(leg_x + 146, leg_y, "User Action (Direct Interaction)")
    
    # Dashed Line Include
    c.setStrokeColor(colors.HexColor("#2980B9"))
    c.setLineWidth(1.2)
    c.setDash(3, 2)
    c.line(leg_x + 285, leg_y + 3, leg_x + 315, leg_y + 3)
    c.setFillColor(colors.HexColor("#555555"))
    c.drawString(leg_x + 321, leg_y, "<<include>> Mandatory Step")
    
    # Dashed Line Extend
    c.setStrokeColor(colors.HexColor("#6C3483"))
    c.line(leg_x + 475, leg_y + 3, leg_x + 505, leg_y + 3)
    c.drawString(leg_x + 511, leg_y, "<<extend>> Optional Enhancement")
    c.restoreState()

    c.save()

if __name__ == "__main__":
    out_local = "MentorHub_Use_Case_Diagram.pdf"
    out_d = r"D:\MentorHub_Use_Case_Diagram.pdf"
    build_organized_use_case(out_local)
    try:
        shutil.copyfile(out_local, out_d)
    except Exception as e:
        print(f"Copy error: {e}")
    print("Use Case Diagram with simplified terms generated successfully.")
