import os
from reportlab.pdfgen import canvas
from reportlab.lib import colors

page_w = 1496.69
page_h = 841.89

def build_systematic_dfd(p):
    c = canvas.Canvas(p, pagesize=(page_w, page_h))
    
    # -------------------------------------------------------------
    # BACKGROUND & BORDERS
    # -------------------------------------------------------------
    c.setFillColor(colors.HexColor("#FAF4EE"))
    c.rect(0, 0, page_w, page_h, fill=1, stroke=0)
    
    c.setStrokeColor(colors.HexColor("#D4AF37"))
    c.setLineWidth(2.5)
    c.rect(15, 15, page_w - 30, page_h - 30)
    c.setStrokeColor(colors.HexColor("#1A5276"))
    c.setLineWidth(0.8)
    c.rect(20, 20, page_w - 40, page_h - 40)
    
    # Header
    c.setFillColor(colors.HexColor("#D4AF37"))
    c.circle(50, page_h - 50, 18, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#150E0B"))
    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(50, page_h - 57, "M")
    
    c.setFont("Helvetica-Bold", 18)
    c.drawString(85, page_h - 45, "MENTORHUB AI PLATFORM \u2014 SYSTEM DATA FLOW DIAGRAM (DFD LEVEL 1)")
    c.setFillColor(colors.HexColor("#555555"))
    c.setFont("Helvetica-Oblique", 11)
    c.drawString(85, page_h - 60, "Structured 4-Column Architecture \u2022 H2 Persistent Database Spine \u2022 Angular Standalone UI")
    
    c.setFillColor(colors.HexColor("#A04000"))
    c.roundRect(page_w - 180, page_h - 65, 140, 22, 4, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawCentredString(page_w - 110, page_h - 54, "ACTUAL SYSTEM SCOPE")
    
    # -------------------------------------------------------------
    # GRID GEOMETRY (4 Columns instead of 5, evenly spaced)
    # -------------------------------------------------------------
    sys_x = 260
    sys_y = 60
    sys_w = 970
    sys_h = page_h - 160
    
    c.setFillColor(colors.HexColor("#FAF4EE"))
    c.setStrokeColor(colors.HexColor("#D4AF37"))
    c.setLineWidth(1.5)
    c.roundRect(sys_x, sys_y, sys_w, sys_h, 8, fill=1, stroke=1)
    
    c.setFillColor(colors.HexColor("#2C1D16"))
    c.roundRect(sys_x + 14, sys_y + sys_h - 25, 290, 20, 4, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(sys_x + 22, sys_y + sys_h - 19, "SYSTEM BOUNDARY : MENTORHUB ENGINE")

    # Column Centers
    col1_x = 130  # External Entities (Mentee/Mentor)
    col2_x = 420  # Input Processes
    col3_x = 748  # Data Stores (H2 DB)
    col4_x = 1076 # Output Processes
    
    # 4 Rows for core features
    row1_y = page_h - 220
    row2_y = page_h - 370
    row3_y = page_h - 520
    row4_y = page_h - 670

    # -------------------------------------------------------------
    # HELPERS
    # -------------------------------------------------------------
    def draw_entity(c, x, y, w, h, title, subtitle, color):
        c.setFillColor(colors.HexColor("#2C1D16"))
        c.roundRect(x - w/2 + 4, y - h/2 - 4, w, h, 6, fill=1, stroke=0)
        c.setFillColor(colors.HexColor("#FAF4EE"))
        c.setStrokeColor(color)
        c.setLineWidth(2.5)
        c.roundRect(x - w/2, y - h/2, w, h, 6, fill=1, stroke=1)
        c.setFillColor(color)
        c.setFont("Helvetica-Bold", 11.5)
        c.drawCentredString(x, y + 6, title)
        c.setFillColor(colors.HexColor("#C0392B"))
        c.setFont("Helvetica-Oblique", 8.5)
        c.drawCentredString(x, y - 8, subtitle)

    def draw_process(c, x, y, w, h, title, subtitle_lines, color):
        c.setFillColor(colors.HexColor("#2C1D16"))
        c.roundRect(x - w/2 + 4, y - h/2 - 4, w, h, 8, fill=1, stroke=0)
        c.setFillColor(colors.HexColor("#FAF4EE"))
        c.setStrokeColor(color)
        c.setLineWidth(2.5)
        c.roundRect(x - w/2, y - h/2, w, h, 8, fill=1, stroke=1)
        c.setFillColor(color)
        c.path = c.beginPath()
        c.path.roundRect(x - w/2, y + h/2 - 20, w, 20, 8)
        c.drawPath(c.path, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 9.5)
        c.drawCentredString(x, y + h/2 - 14, title)
        c.setFillColor(colors.HexColor("#555555"))
        c.setFont("Helvetica-Oblique", 8.5)
        y_offset = -2
        for line in subtitle_lines:
            c.drawCentredString(x, y + y_offset, line)
            y_offset -= 12

    def draw_data_store(c, x, y, w, h, ds_id, title, color):
        c.setFillColor(colors.HexColor("#2C1D16"))
        c.roundRect(x - w/2 + 4, y - h/2 - 4, w, h, 6, fill=1, stroke=0)
        c.setFillColor(colors.HexColor("#FAF4EE"))
        c.setStrokeColor(color)
        c.setLineWidth(2.5)
        c.roundRect(x - w/2, y - h/2, w, h, 6, fill=1, stroke=1)
        c.setFillColor(color)
        c.path = c.beginPath()
        c.path.moveTo(x - w/2, y - h/2 + 6)
        c.path.lineTo(x - w/2, y + h/2 - 6)
        c.path.arcTo(x - w/2, y + h/2 - 12, x - w/2 + 12, y + h/2, 180, -90)
        c.path.lineTo(x - w/2 + 30, y + h/2)
        c.path.lineTo(x - w/2 + 30, y - h/2)
        c.path.lineTo(x - w/2 + 6, y - h/2)
        c.path.arcTo(x - w/2, y - h/2, x - w/2 + 12, y - h/2 + 12, 270, -90)
        c.drawPath(c.path, fill=1, stroke=0)
        c.line(x - w/2 + 30, y - h/2, x - w/2 + 30, y + h/2)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 11.5)
        c.drawCentredString(x - w/2 + 15, y - 4, ds_id)
        c.setFillColor(colors.HexColor("#150E0B"))
        c.setFont("Helvetica-Bold", 11.0)
        c.drawCentredString(x + 10, y - 4, title)

    def draw_flow_arrow(c, x1, y1, x2, y2, label_txt, color, label_offset_x=0):
        c.saveState()
        c.setStrokeColor(color)
        c.setLineWidth(2.2)
        
        mid_x = (x1 + x2) / 2 + label_offset_x
        mid_y = (y1 + y2) / 2
        
        c.line(x1, y1, mid_x, y1)
        c.line(mid_x, y1, mid_x, y2)
        c.line(mid_x, y2, x2, y2)
        
        import math
        angle = math.pi if x1 > x2 else 0
        arrow_len = 9.0
        ax1 = x2 - arrow_len * math.cos(angle - math.pi / 6)
        ay1 = y2 - arrow_len * math.sin(angle - math.pi / 6)
        ax2 = x2 - arrow_len * math.cos(angle + math.pi / 6)
        ay2 = y2 - arrow_len * math.sin(angle + math.pi / 6)
        c.line(x2, y2, ax1, ay1)
        c.line(x2, y2, ax2, ay2)
        
        c.setFillColor(colors.HexColor("#FAF4EE"))
        c.setStrokeColor(color)
        c.setLineWidth(1.5)
        c.setFont("Helvetica-Bold", 9.5)
        lbl_w = len(label_txt) * 7.8 + 18
        c.roundRect(mid_x - lbl_w/2, mid_y - 8, lbl_w, 16, 4, fill=1, stroke=1)
        c.setFillColor(colors.HexColor("#150E0B"))
        c.drawCentredString(mid_x, mid_y - 3, label_txt)
        
        c.restoreState()

    # -------------------------------------------------------------
    # DEFINITIONS
    # -------------------------------------------------------------
    COLOR_MENTEE = colors.HexColor("#C0392B")
    COLOR_MENTOR = colors.HexColor("#D35400")
    COLOR_API = colors.HexColor("#2980B9")
    COLOR_DB = colors.HexColor("#C0392B")
    
    # Entities
    ent_mentee = (col1_x, row1_y, 130, 52, "Student / Mentee", "Frontend Client", COLOR_MENTEE)
    ent_mentor = (col1_x, row3_y, 130, 52, "Expert Mentor", "Frontend Client", COLOR_MENTOR)
    
    # Input Processes (Col 2)
    proc_p1 = (col2_x, row1_y, 170, 52, "P1.0: AUTH & PROFILE", ["System Avatar Upload", "BCrypt Authentication"], COLOR_API)
    proc_p2 = (col2_x, row2_y, 170, 52, "P2.0: GOAL TRACKER", ["SMART Goals Kanban", "3D Letter Cards"], colors.HexColor("#D35400"))
    proc_p3 = (col2_x, row3_y, 170, 52, "P3.0: RESOURCE HUB", ["Filter Pills & Search", "Bookmarking"], colors.HexColor("#F39C12"))
    proc_p4 = (col2_x, row4_y, 170, 52, "P4.0: AI CHATBOT", ["Floating Sparkle UI", "Prompt Drawer"], colors.HexColor("#8E44AD"))
    
    # Data Stores (Col 3) - H2 Database Tables
    ds_d1 = (col3_x, row1_y, 180, 40, "D1", "users Table (H2)", COLOR_DB)
    ds_d2 = (col3_x, row2_y, 180, 40, "D2", "goals Table (H2)", COLOR_DB)
    ds_d3 = (col3_x, row3_y, 180, 40, "D3", "resources Table (H2)", COLOR_DB)
    
    # Output Processes (Col 4)
    proc_p5 = (col4_x, row1_y, 170, 52, "P5.0: ANALYTICS", ["Velocity Sparklines", "Radial Ring Gauges"], colors.HexColor("#117A65"))
    proc_p6 = (col4_x, row2_y, 170, 52, "P6.0: LEARNING PATH", ["Active Curricula", "Non-Overlapping Tree"], colors.HexColor("#16A085"))
    proc_p7 = (col4_x, row3_y, 170, 52, "P7.0: CERTIFICATES", ["HTML5 Canvas PDF", "Seal & Signature"], colors.HexColor("#27AE60"))

    # -------------------------------------------------------------
    # DRAW FLOWS
    # -------------------------------------------------------------
    # Flow Mentee -> P1.0
    draw_flow_arrow(c, ent_mentee[0] + 65, row1_y, proc_p1[0] - 85, row1_y, "Login / JWT Token", COLOR_MENTEE)
    # Flow P1.0 -> D1
    draw_flow_arrow(c, proc_p1[0] + 85, row1_y, ds_d1[0] - 90, row1_y, "Sync User Profile", COLOR_API)
    
    # Flow Mentee -> P2.0
    draw_flow_arrow(c, ent_mentee[0] + 65, row2_y, proc_p2[0] - 85, row2_y, "Add / Edit Goals", COLOR_MENTEE)
    # Flow P2.0 -> D2
    draw_flow_arrow(c, proc_p2[0] + 85, row2_y, ds_d2[0] - 90, row2_y, "Save Target Status", colors.HexColor("#D35400"))
    
    # Flow Mentor -> P3.0
    draw_flow_arrow(c, ent_mentor[0] + 65, row3_y, proc_p3[0] - 85, row3_y, "Add Resources", COLOR_MENTOR)
    # Flow P3.0 -> D3
    draw_flow_arrow(c, proc_p3[0] + 85, row3_y, ds_d3[0] - 90, row3_y, "Store Content URL", colors.HexColor("#F39C12"))

    # Flow Mentee -> P4.0
    draw_flow_arrow(c, ent_mentee[0] + 65, row4_y, proc_p4[0] - 85, row4_y, "Send Prompt", COLOR_MENTEE)

    # Cross connections!
    # D1 -> P5.0 Analytics
    draw_flow_arrow(c, ds_d1[0] + 90, row1_y, proc_p5[0] - 85, row1_y, "XP & Streaks", colors.HexColor("#117A65"))
    
    # D2 -> P6.0 Learning Path
    draw_flow_arrow(c, ds_d2[0] + 90, row2_y, proc_p6[0] - 85, row2_y, "Curricula Progress", colors.HexColor("#16A085"))
    
    # D1 -> P7.0 Certificates
    draw_flow_arrow(c, ds_d1[0] + 90, row3_y, proc_p7[0] - 85, row3_y, "Verify User XP", colors.HexColor("#27AE60"))

    # Mentee <- Analytics (Feedback loop)
    c.saveState()
    c.setStrokeColor(colors.HexColor("#117A65"))
    c.setLineWidth(2.2)
    bx1, by1 = proc_p5[0], row1_y + 26
    bx2, by2 = ent_mentee[0], row1_y + 26
    c.line(bx1, by1, bx1, by1 + 40)
    c.line(bx1, by1 + 40, bx2, by1 + 40)
    
    import math
    angle = -math.pi/2
    arrow_len = 9.0
    c.line(bx2, by1 + 40, bx2, by2)
    ax1 = bx2 - arrow_len * math.cos(angle - math.pi / 6)
    ay1 = by2 - arrow_len * math.sin(angle - math.pi / 6)
    ax2 = bx2 - arrow_len * math.cos(angle + math.pi / 6)
    ay2 = by2 - arrow_len * math.sin(angle + math.pi / 6)
    c.line(bx2, by2, ax1, ay1)
    c.line(bx2, by2, ax2, ay2)
    
    lbl = "View Dashboard Metrics"
    lbl_w = len(lbl) * 7.8 + 18
    mid_xx = (bx1 + bx2) / 2
    mid_yy = by1 + 40
    c.setFillColor(colors.HexColor("#FAF4EE"))
    c.setLineWidth(1.5)
    c.roundRect(mid_xx - lbl_w/2, mid_yy - 8, lbl_w, 16, 4, fill=1, stroke=1)
    c.setFillColor(colors.HexColor("#150E0B"))
    c.setFont("Helvetica-Bold", 9.5)
    c.drawCentredString(mid_xx, mid_yy - 3, lbl)
    c.restoreState()
    
    # Custom Route: Mentor -> P2.0 (Assign Goals)
    c.saveState()
    c.setStrokeColor(COLOR_MENTOR)
    c.setLineWidth(2.2)
    cx1, cy1 = ent_mentor[0] + 50, row3_y - 26
    cx2, cy2 = proc_p2[0] - 50, row2_y + 26
    c.line(cx1, cy1, cx1, cy1 - 20)
    c.line(cx1, cy1 - 20, 230, cy1 - 20)
    c.line(230, cy1 - 20, 230, cy2 + 20)
    c.line(230, cy2 + 20, cx2, cy2 + 20)
    c.line(cx2, cy2 + 20, cx2, cy2)
    
    angle = -math.pi/2
    ax1 = cx2 - arrow_len * math.cos(angle - math.pi / 6)
    ay1 = cy2 - arrow_len * math.sin(angle - math.pi / 6)
    ax2 = cx2 - arrow_len * math.cos(angle + math.pi / 6)
    ay2 = cy2 - arrow_len * math.sin(angle + math.pi / 6)
    c.line(cx2, cy2, ax1, ay1)
    c.line(cx2, cy2, ax2, ay2)
    
    lbl = "Assign Mentor Goals"
    lbl_w = len(lbl) * 7.8 + 18
    c.setFillColor(colors.HexColor("#FAF4EE"))
    c.setLineWidth(1.5)
    c.roundRect(230 - lbl_w/2, ((cy1-20) + (cy2+20))/2 - 8, lbl_w, 16, 4, fill=1, stroke=1)
    c.setFillColor(colors.HexColor("#150E0B"))
    c.setFont("Helvetica-Bold", 9.5)
    c.drawCentredString(230, ((cy1-20) + (cy2+20))/2 - 3, lbl)
    c.restoreState()
    
    # Custom Route: P7.0 Certificates -> Mentee
    c.saveState()
    c.setStrokeColor(colors.HexColor("#27AE60"))
    c.setLineWidth(2.2)
    dx1, dy1 = proc_p7[0], row3_y - 26
    dx2, dy2 = ent_mentee[0], row1_y - 26
    
    c.line(dx1, dy1, dx1, row4_y - 40)
    c.line(dx1, row4_y - 40, dx2, row4_y - 40)
    c.line(dx2, row4_y - 40, dx2, dy2)
    
    angle = math.pi/2
    ax1 = dx2 - arrow_len * math.cos(angle - math.pi / 6)
    ay1 = dy2 - arrow_len * math.sin(angle - math.pi / 6)
    ax2 = dx2 - arrow_len * math.cos(angle + math.pi / 6)
    ay2 = dy2 - arrow_len * math.sin(angle + math.pi / 6)
    c.line(dx2, dy2, ax1, ay1)
    c.line(dx2, dy2, ax2, ay2)
    
    lbl = "Download HTML5 Canvas PDF"
    lbl_w = len(lbl) * 7.8 + 18
    mid_xx = (dx1 + dx2) / 2
    mid_yy = row4_y - 40
    c.setFillColor(colors.HexColor("#FAF4EE"))
    c.setLineWidth(1.5)
    c.roundRect(mid_xx - lbl_w/2, mid_yy - 8, lbl_w, 16, 4, fill=1, stroke=1)
    c.setFillColor(colors.HexColor("#150E0B"))
    c.setFont("Helvetica-Bold", 9.5)
    c.drawCentredString(mid_xx, mid_yy - 3, lbl)
    c.restoreState()


    # -------------------------------------------------------------
    # DRAW BOXES LAST
    # -------------------------------------------------------------
    
    # Draw Entities
    draw_entity(c, *ent_mentee)
    draw_entity(c, *ent_mentor)
    
    # Draw Input Processes
    draw_process(c, *proc_p1)
    draw_process(c, *proc_p2)
    draw_process(c, *proc_p3)
    draw_process(c, *proc_p4)
    
    # Draw Data Stores
    draw_data_store(c, *ds_d1)
    draw_data_store(c, *ds_d2)
    draw_data_store(c, *ds_d3)
    
    # Draw Output Processes
    draw_process(c, *proc_p5)
    draw_process(c, *proc_p6)
    draw_process(c, *proc_p7)

    c.save()

if __name__ == "__main__":
    build_systematic_dfd("MentorHub_Data_Flow_Diagram.pdf")
