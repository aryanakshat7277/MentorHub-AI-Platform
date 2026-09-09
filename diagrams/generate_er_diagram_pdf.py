import os
from reportlab.pdfgen import canvas
from reportlab.lib import colors
import shutil

page_w = 1496.69
page_h = 841.89

def build_er_diagram(target_path):
    c = canvas.Canvas(target_path, pagesize=(page_w, page_h))
    
    # -------------------------------------------------------------
    # BACKGROUND & LUXURY BORDERS
    # -------------------------------------------------------------
    c.setFillColor(colors.HexColor("#FAF4EE"))
    c.rect(0, 0, page_w, page_h, fill=1, stroke=0)
    
    # Outer luxury double border
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
    c.drawCentredString(52, page_h - 59, "E")
    
    c.setFillColor(colors.HexColor("#150E0B"))
    c.setFont("Helvetica-Bold", 18)
    c.drawString(88, page_h - 45, "MENTORHUB AI PLATFORM \u2014 DATABASE (ER) DIAGRAM")
    c.setFillColor(colors.HexColor("#555555"))
    c.setFont("Helvetica-Oblique", 10.5)
    c.drawString(88, page_h - 60, "App Database Tables \u2022 Stored Information, Fields & Table Connections")
    
    # Status Pill
    c.setFillColor(colors.HexColor("#117A65"))
    c.roundRect(page_w - 210, page_h - 65, 170, 24, 5, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 9.0)
    c.drawCentredString(page_w - 125, page_h - 53, "EASY & SIMPLE TERMS")
    
    # -------------------------------------------------------------
    # SYSTEM BOUNDARY (DATABASE CONTAINER)
    # -------------------------------------------------------------
    sys_x = 35
    sys_y = 52
    sys_w = page_w - 70
    sys_h = page_h - 146
    
    c.setFillColor(colors.HexColor("#FAF4EE"))
    c.setStrokeColor(colors.HexColor("#1A5276"))
    c.setLineWidth(1.8)
    c.roundRect(sys_x, sys_y, sys_w, sys_h, 10, fill=1, stroke=1)
    
    # Boundary Title Tag
    c.setFillColor(colors.HexColor("#1A5276"))
    c.roundRect(sys_x + 16, sys_y + sys_h - 26, 320, 22, 5, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(sys_x + 26, sys_y + sys_h - 20, "DATABASE TABLES : MENTORHUB DATA")

    # -------------------------------------------------------------
    # RELATION LABELS COLLECTOR (Rendered on top layer)
    # -------------------------------------------------------------
    pending_labels = []

    def draw_entity_table(c, x, y, w, h, table_name, display_title, header_color, columns):
        """
        Draws a systematic relational table box with clean, friendly subtitles.
        """
        c.saveState()
        
        # 3D Shadow
        c.setFillColor(colors.HexColor("#2C1D16"))
        c.roundRect(x - w/2 + 4, y - h/2 - 4, w, h, 6, fill=1, stroke=0)
        
        # Table Container
        c.setFillColor(colors.HexColor("#FFFFFF"))
        c.setStrokeColor(header_color)
        c.setLineWidth(1.8)
        c.roundRect(x - w/2, y - h/2, w, h, 6, fill=1, stroke=1)
        
        # Header Banner
        c.setFillColor(header_color)
        c.path = c.beginPath()
        c.path.roundRect(x - w/2, y + h/2 - 28, w, 28, 6)
        c.drawPath(c.path, fill=1, stroke=0)
        
        # Header Text
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 10.5)
        c.drawCentredString(x, y + h/2 - 13, table_name.upper())
        c.setFont("Helvetica-Oblique", 7.8)
        c.drawCentredString(x, y + h/2 - 23, display_title)
        
        # Columns List
        cur_y = y + h/2 - 44
        row_height = 15.5
        
        for idx, col in enumerate(columns):
            k_type, col_name, d_type = col
            
            # Alternating row backgrounds
            if idx % 2 == 1:
                c.setFillColor(colors.HexColor("#F9F8F6"))
                c.rect(x - w/2 + 1, cur_y - 3, w - 2, row_height, fill=1, stroke=0)
            
            # Key Pills
            if k_type == 'PK':
                c.setFillColor(colors.HexColor("#C0392B"))
                c.roundRect(x - w/2 + 6, cur_y - 2, 22, 11, 2, fill=1, stroke=0)
                c.setFillColor(colors.white)
                c.setFont("Helvetica-Bold", 6.8)
                c.drawCentredString(x - w/2 + 17, cur_y + 1, "PK")
            elif k_type == 'FK':
                c.setFillColor(colors.HexColor("#2980B9"))
                c.roundRect(x - w/2 + 6, cur_y - 2, 22, 11, 2, fill=1, stroke=0)
                c.setFillColor(colors.white)
                c.setFont("Helvetica-Bold", 6.8)
                c.drawCentredString(x - w/2 + 17, cur_y + 1, "FK")
            elif k_type == 'UQ':
                c.setFillColor(colors.HexColor("#D35400"))
                c.roundRect(x - w/2 + 6, cur_y - 2, 22, 11, 2, fill=1, stroke=0)
                c.setFillColor(colors.white)
                c.setFont("Helvetica-Bold", 6.8)
                c.drawCentredString(x - w/2 + 17, cur_y + 1, "UQ")
            
            # Column Name
            c.setFillColor(colors.HexColor("#150E0B"))
            c.setFont("Helvetica-Bold", 8.2)
            c.drawString(x - w/2 + 32, cur_y, col_name)
            
            # Data Type
            c.setFillColor(colors.HexColor("#777777"))
            c.setFont("Helvetica", 7.5)
            c.drawRightString(x + w/2 - 8, cur_y, d_type)
            
            cur_y -= row_height
            
        c.restoreState()

    def draw_orthogonal_relation(c, x1, y1, x2, y2, label_txt, color, card1="1", card2="N", route_axis="horizontal"):
        """
        Draws clean orthogonal connecting lines between tables with simple cardinality notation.
        """
        c.saveState()
        c.setStrokeColor(color)
        c.setLineWidth(1.6)
        
        if route_axis == "horizontal":
            mid_x = (x1 + x2) / 2
            c.line(x1, y1, mid_x, y1)
            c.line(mid_x, y1, mid_x, y2)
            c.line(mid_x, y2, x2, y2)
            label_x, label_y = mid_x, (y1 + y2) / 2
        else:
            mid_y = (y1 + y2) / 2
            c.line(x1, y1, x1, mid_y)
            c.line(x1, mid_y, x2, mid_y)
            c.line(x2, mid_y, x2, y2)
            label_x, label_y = (x1 + x2) / 2, mid_y
            
        # Register label to be drawn on top layer
        if label_txt:
            pending_labels.append((label_x, label_y, label_txt, color))
            
        # Cardinality Badges
        c.setFillColor(colors.HexColor("#2C1D16"))
        c.setFont("Helvetica-Bold", 8.5)
        c.drawCentredString(x1 + (12 if x2 > x1 else -12), y1 + (10 if y2 > y1 else -10), card1)
        c.drawCentredString(x2 + (-12 if x2 > x1 else 12), y2 + (10 if y2 > y1 else -10), card2)
        
        c.restoreState()

    # -------------------------------------------------------------
    # TABLE DEFINITIONS & COLUMNS (Simple & Standard Names)
    # -------------------------------------------------------------
    
    # 1. USERS TABLE
    users_cols = [
        ('PK', 'id', 'BIGINT'),
        ('UQ', 'email', 'VARCHAR(255)'),
        ('', 'name', 'VARCHAR(255)'),
        ('', 'password', 'VARCHAR(255)'),
        ('', 'role', 'VARCHAR(50)'),
        ('', 'title', 'VARCHAR(255)'),
        ('', 'company', 'VARCHAR(255)'),
        ('', 'bio', 'VARCHAR(1000)'),
        ('', 'skills', 'VARCHAR(1000)'),
        ('', 'avatar_url', 'TEXT'),
        ('', 'xp_points', 'INT'),
        ('', 'current_streak', 'INT'),
        ('', 'rating', 'DOUBLE'),
        ('', 'hours_mentored', 'INT'),
        ('', 'total_sessions', 'INT'),
        ('', 'badges_count', 'INT')
    ]
    
    # 2. MENTORING SESSIONS TABLE
    sessions_cols = [
        ('PK', 'id', 'BIGINT'),
        ('FK', 'mentor_id', 'BIGINT'),
        ('', 'mentor_name', 'VARCHAR(255)'),
        ('FK', 'mentee_id', 'BIGINT'),
        ('', 'mentee_name', 'VARCHAR(255)'),
        ('', 'topic', 'VARCHAR(255)'),
        ('', 'scheduled_at', 'TIMESTAMP'),
        ('', 'duration_minutes', 'INT'),
        ('', 'status', 'VARCHAR(50)'),
        ('', 'meeting_link', 'VARCHAR(255)'),
        ('', 'notes', 'VARCHAR(2000)')
    ]
    
    # 3. WORKSPACE SESSIONS TABLE
    workspace_cols = [
        ('PK', 'id', 'BIGINT'),
        ('FK', 'session_id', 'BIGINT'),
        ('', 'shared_code', 'TEXT'),
        ('', 'shared_notes', 'VARCHAR(5000)'),
        ('', 'active_language', 'VARCHAR(50)'),
        ('', 'updated_at', 'TIMESTAMP')
    ]
    
    # 4. GOALS TABLE
    goals_cols = [
        ('PK', 'id', 'BIGINT'),
        ('FK', 'user_id', 'BIGINT'),
        ('', 'title', 'VARCHAR(255)'),
        ('', 'description', 'VARCHAR(1000)'),
        ('', 'category', 'VARCHAR(10)'),
        ('', 'category_name', 'VARCHAR(50)'),
        ('', 'status', 'VARCHAR(50)'),
        ('', 'progress_percentage', 'INT'),
        ('', 'target_date', 'VARCHAR(50)')
    ]
    
    # 5. RESOURCES TABLE
    resources_cols = [
        ('PK', 'id', 'BIGINT'),
        ('', 'title', 'VARCHAR(255)'),
        ('', 'type', 'VARCHAR(50)'),
        ('', 'category', 'VARCHAR(100)'),
        ('', 'url', 'VARCHAR(500)'),
        ('', 'description', 'VARCHAR(2000)'),
        ('', 'author', 'VARCHAR(255)'),
        ('', 'read_time', 'VARCHAR(50)'),
        ('', 'bookmarked', 'BOOLEAN'),
        ('', 'file_name', 'VARCHAR(255)'),
        ('', 'file_type', 'VARCHAR(50)'),
        ('', 'file_data', 'TEXT'),
        ('', 'is_user_uploaded', 'BOOLEAN')
    ]
    
    # 6. BADGES TABLE
    badges_cols = [
        ('PK', 'id', 'BIGINT'),
        ('', 'name', 'VARCHAR(255)'),
        ('', 'description', 'VARCHAR(1000)'),
        ('', 'category', 'VARCHAR(100)'),
        ('', 'icon_url', 'VARCHAR(500)'),
        ('', 'xp_value', 'INT')
    ]
    
    # 7. USER BADGES TABLE
    user_badges_cols = [
        ('PK', 'id', 'BIGINT'),
        ('FK', 'user_id', 'BIGINT'),
        ('FK', 'badge_id', 'BIGINT'),
        ('', 'earned_at', 'TIMESTAMP')
    ]
    
    # 8. CERTIFICATES TABLE
    certificates_cols = [
        ('PK', 'id', 'BIGINT'),
        ('UQ', 'certificate_number', 'VARCHAR(255)'),
        ('', 'student_name', 'VARCHAR(255)'),
        ('', 'course_name', 'VARCHAR(255)'),
        ('', 'mentor_name', 'VARCHAR(255)'),
        ('', 'completion_date', 'VARCHAR(50)'),
        ('', 'verification_url', 'VARCHAR(500)'),
        ('', 'qr_code_data', 'VARCHAR(2000)'),
        ('', 'status', 'VARCHAR(50)')
    ]

    # -------------------------------------------------------------
    # GEOMETRY & COORDINATES (Friendly Table Subtitles)
    # -------------------------------------------------------------
    t_users = (490, 480, 240, 285, "users", "User Accounts & Profiles", colors.HexColor("#C0392B"), users_cols)
    t_sessions = (880, 595, 235, 205, "mentoring_sessions", "Booked Mentoring Sessions", colors.HexColor("#D35400"), sessions_cols)
    t_workspace = (1240, 595, 220, 130, "workspace_sessions", "Meeting Notes & Shared Code", colors.HexColor("#117A65"), workspace_cols)
    t_goals = (880, 305, 235, 175, "goals", "Learning Goals & Tasks", colors.HexColor("#8E44AD"), goals_cols)
    t_certificates = (1240, 305, 220, 175, "certificates", "Completed Certificates", colors.HexColor("#27AE60"), certificates_cols)
    t_resources = (165, 565, 225, 235, "resources", "Study Articles & Videos", colors.HexColor("#F39C12"), resources_cols)
    t_badges = (165, 235, 215, 130, "badges", "Badges & Rewards List", colors.HexColor("#E67E22"), badges_cols)
    t_user_badges = (490, 195, 210, 100, "user_badges", "Badges Earned by Users", colors.HexColor("#2980B9"), user_badges_cols)

    # -------------------------------------------------------------
    # 1. DRAW RELATIONSHIP LINES (Simple & Clear Labels)
    # -------------------------------------------------------------
    
    # users (1) ──< (N) mentoring_sessions (mentor_id)
    draw_orthogonal_relation(c, 
                             t_users[0] + t_users[2]/2, t_users[1] + 60, 
                             t_sessions[0] - t_sessions[2]/2, t_sessions[1] + 30, 
                             "Mentor Account", colors.HexColor("#D35400"), "1", "N", "horizontal")
                             
    # users (1) ──< (N) mentoring_sessions (mentee_id)
    draw_orthogonal_relation(c, 
                             t_users[0] + t_users[2]/2, t_users[1] + 20, 
                             t_sessions[0] - t_sessions[2]/2, t_sessions[1] - 10, 
                             "Student Account", colors.HexColor("#D35400"), "1", "N", "horizontal")

    # mentoring_sessions (1) ─── (1) workspace_sessions (session_id)
    draw_orthogonal_relation(c, 
                             t_sessions[0] + t_sessions[2]/2, t_sessions[1], 
                             t_workspace[0] - t_workspace[2]/2, t_workspace[1], 
                             "Meeting Details", colors.HexColor("#117A65"), "1", "1", "horizontal")

    # users (1) ──< (N) goals (user_id)
    draw_orthogonal_relation(c, 
                             t_users[0] + t_users[2]/2, t_users[1] - 80, 
                             t_goals[0] - t_goals[2]/2, t_goals[1], 
                             "User Goals", colors.HexColor("#8E44AD"), "1", "N", "horizontal")

    # users (1) ──< (N) user_badges (user_id)
    draw_orthogonal_relation(c, 
                             t_users[0], t_users[1] - t_users[3]/2, 
                             t_user_badges[0], t_user_badges[1] + t_user_badges[3]/2, 
                             "User Account", colors.HexColor("#2980B9"), "1", "N", "vertical")

    # badges (1) ──< (N) user_badges (badge_id)
    draw_orthogonal_relation(c, 
                             t_badges[0] + t_badges[2]/2, t_badges[1], 
                             t_user_badges[0] - t_user_badges[2]/2, t_user_badges[1], 
                             "Badge Details", colors.HexColor("#E67E22"), "1", "N", "horizontal")

    # goals (N) ─── (1) certificates
    draw_orthogonal_relation(c, 
                             t_goals[0] + t_goals[2]/2, t_goals[1], 
                             t_certificates[0] - t_certificates[2]/2, t_certificates[1], 
                             "Issued for Goals", colors.HexColor("#27AE60"), "N", "1", "horizontal")

    # resources (N) ─── (1) users
    draw_orthogonal_relation(c, 
                             t_resources[0] + t_resources[2]/2, t_resources[1], 
                             t_users[0] - t_users[2]/2, t_users[1] + 40, 
                             "Saved by User", colors.HexColor("#F39C12"), "N", "1", "horizontal")

    # -------------------------------------------------------------
    # 2. DRAW ENTITY TABLES
    # -------------------------------------------------------------
    all_tables = [t_users, t_sessions, t_workspace, t_goals, t_certificates, t_resources, t_badges, t_user_badges]
    for tbl in all_tables:
        draw_entity_table(c, *tbl)

    # -------------------------------------------------------------
    # 3. DRAW RELATIONSHIP LABELS ON TOP (Never clipped)
    # -------------------------------------------------------------
    c.saveState()
    for lx, ly, ltxt, lcolor in pending_labels:
        lbl_w = len(ltxt) * 6.5 + 16
        c.setFillColor(colors.HexColor("#FFFFFF"))
        c.setStrokeColor(lcolor)
        c.setLineWidth(1.2)
        c.roundRect(lx - lbl_w/2, ly - 7, lbl_w, 15, 3, fill=1, stroke=1)
        c.setFillColor(lcolor)
        c.setFont("Helvetica-Bold", 7.8)
        c.drawCentredString(lx, ly - 3.0, ltxt)
    c.restoreState()

    # -------------------------------------------------------------
    # 4. FOOTER LEGEND / METADATA (Simple terms)
    # -------------------------------------------------------------
    c.saveState()
    leg_x = sys_x + 20
    leg_y = sys_y + 12
    c.setFillColor(colors.HexColor("#2C1D16"))
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(leg_x, leg_y, "LEGEND :")
    
    # PK Badge
    c.setFillColor(colors.HexColor("#C0392B"))
    c.roundRect(leg_x + 80, leg_y - 2, 22, 11, 2, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 6.8)
    c.drawCentredString(leg_x + 91, leg_y + 1, "PK")
    c.setFillColor(colors.HexColor("#555555"))
    c.setFont("Helvetica", 8.0)
    c.drawString(leg_x + 108, leg_y, "Primary Key (Unique ID)")
    
    # FK Badge
    c.setFillColor(colors.HexColor("#2980B9"))
    c.roundRect(leg_x + 235, leg_y - 2, 22, 11, 2, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 6.8)
    c.drawCentredString(leg_x + 246, leg_y + 1, "FK")
    c.setFillColor(colors.HexColor("#555555"))
    c.setFont("Helvetica", 8.0)
    c.drawString(leg_x + 263, leg_y, "Foreign Key (Link to Other Table)")
    
    # UQ Badge
    c.setFillColor(colors.HexColor("#D35400"))
    c.roundRect(leg_x + 430, leg_y - 2, 22, 11, 2, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 6.8)
    c.drawCentredString(leg_x + 441, leg_y + 1, "UQ")
    c.setFillColor(colors.HexColor("#555555"))
    c.setFont("Helvetica", 8.0)
    c.drawString(leg_x + 458, leg_y, "Unique Value (No Duplicates)")
    
    # Cardinality
    c.setStrokeColor(colors.HexColor("#150E0B"))
    c.setLineWidth(1.4)
    c.line(leg_x + 615, leg_y + 3, leg_x + 645, leg_y + 3)
    c.setFillColor(colors.HexColor("#555555"))
    c.drawString(leg_x + 652, leg_y, "1 -----< N   One-to-Many (One user has many items)")
    
    c.restoreState()

    c.save()

if __name__ == "__main__":
    out_local = "MentorHub_ER_Diagram.pdf"
    out_d = r"D:\MentorHub_ER_Diagram.pdf"
    build_er_diagram(out_local)
    try:
        shutil.copyfile(out_local, out_d)
    except Exception as e:
        print(f"Copy error: {e}")
    print("ER Diagram with simplified terms generated successfully.")
