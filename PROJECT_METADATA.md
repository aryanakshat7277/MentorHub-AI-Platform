# 📄 Project Implementation & Architecture Metadata Log

This file contains the complete historical record and architectural metadata of everything implemented from scratch in the **MentorHub Platform**.

---

## 🏛️ Architecture & Schema Specification

### 1. Database Schema (H2 Persistent Engine)
- **Users Table (`users`)**:
  - `id` (BIGINT, Primary Key)
  - `email` (VARCHAR, Unique)
  - `password` (VARCHAR, BCrypt Encoded)
  - `name` (VARCHAR)
  - `title` (VARCHAR)
  - `company` (VARCHAR)
  - `bio` (TEXT)
  - `avatar_url` (VARCHAR)
  - `role` (VARCHAR: `ROLE_MENTOR` / `ROLE_MENTEE`)
  - `rating` (DOUBLE)
  - `xp_points` (INT)
  - `current_streak` (INT)
  - `hours_mentored` (INT)
  - `total_sessions` (INT)

- **Goals Table (`goals`)**:
  - `id` (BIGINT, Primary Key)
  - `user_id` (BIGINT, Foreign Key -> `users.id`)
  - `title` (VARCHAR)
  - `description` (TEXT)
  - `category` (VARCHAR: `SPECIFIC`, `MEASURABLE`, `ACHIEVABLE`, `RELEVANT`, `TIME_BOUND`)
  - `status` (VARCHAR: `TO_DO`, `IN_PROGRESS`, `ACHIEVED`)
  - `progress_pct` (INT)
  - `target_date` (DATE)

- **Resources Table (`resources`)**:
  - `id` (BIGINT, Primary Key)
  - `title` (VARCHAR)
  - `description` (TEXT)
  - `type` (VARCHAR: `ARTICLE`, `VIDEO`, `COURSE`, `BOOK`)
  - `author` (VARCHAR)
  - `read_time` (VARCHAR)
  - `url` (VARCHAR)
  - `bookmarked` (BOOLEAN)

---

## 🎨 UI/UX Token System & Global Styles

### CSS Variables (`src/styles.scss`)
```scss
:root {
  --bg-primary: #040711;
  --bg-sidebar: #090E1A;
  --bg-surface: rgba(11, 18, 33, 0.92);
  --bg-surface-elevated: rgba(18, 27, 47, 0.96);
  --border-surface: 1px solid rgba(0, 240, 255, 0.35);
  --border-glow: 1px solid rgba(181, 95, 230, 0.6);

  --accent-cyan: #00F0FF;
  --accent-purple: #D8B4FE;
  --accent-emerald: #34D399;
  --accent-amber: #FBBF24;

  --text-main: #FFFFFF;
  --text-primary: #FFFFFF;
  --text-sub: #F1F5F9;
  --text-muted: #CBD5E1;

  --font-heading: 'Times New Roman', Times, serif;
  --font-body: 'Times New Roman', Times, serif;
}
```

---

## 🛠️ Key Bugfixes & Technical Improvements Summary

1. **BCrypt Self-Healing Seeder**:
   - Resolved database authentication discrepancies by implementing an automatic password validation & re-hashing mechanism inside `AuthController.java`.

2. **System File Picker Avatar Upload**:
   - Configured Angular's file input `#profileFileInput` to allow users to pick any picture file from their computer system and immediately apply it as their cybernetic avatar.

3. **Roadmap Tree Z-Index & Alignment**:
   - Prevented vertical connecting lines from cutting across node badge numbers by enforcing solid background fills (`#0B1221`) and higher stacking orders (`z-index: 3`).

4. **Resource Hub Class Hierarchy**:
   - Replaced unstyled browser defaults with a 2/3-column responsive grid (`.resources-grid`), filter pills (`.filter-pill`), search box capsule (`.search-box`), and color-coded type badges (`.type-badge`).

5. **HTML5 Canvas PDF Certificate Renderer**:
   - Built a dynamic canvas renderer in `CertificatesComponent` with custom gold border geometry, official signature lines, stamp seal graphics, and PDF export functionality.
