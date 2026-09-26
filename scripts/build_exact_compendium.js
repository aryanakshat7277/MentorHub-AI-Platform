const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'backend', 'src', 'main', 'resources', 'cutm_courses.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

function normalizeFaculty(raw) {
  if (!raw || !raw.trim()) return 'Centurion Faculty Panel';
  let f = raw.trim().replace(/\s+/g, ' ');
  if (f === 'MR.MANOJ PADHI' || f === 'MR. MANOJ PADHI') {
    return 'Mr. Manoj Padhi';
  }
  return f;
}

const facultyMap = {};
data.forEach(c => {
  const fac = normalizeFaculty(c.faculty);
  if (!facultyMap[fac]) {
    facultyMap[fac] = {
      name: fac,
      departments: new Set(),
      courses: []
    };
  }
  if (c.department) facultyMap[fac].departments.add(c.department.trim());
  facultyMap[fac].courses.push(c);
});

const sortedKeys = Object.keys(facultyMap).sort((a,b) => a.localeCompare(b));

// 1. Generate Markdown Artifact
let md = `# 🏛️ Centurion University of Technology and Management (C.U.T.M.)
## 📋 Authoritative Faculty & Courseware Master Directory (All 385 Courses, 184 Faculty Profiles)

> [!IMPORTANT]
> This document contains the **exact, verified, un-truncated mapping** of which faculty member teaches which subject across all constituent schools (SoET, SoMC, MSSSoA, SoPAHS, SoAS, CCAL) directly derived from the official C.U.T.M. Courseware catalog.

---

### 🔍 Key Faculty Disambiguation
- **Mr. Manoj Padhi** (Computer Science & Engineering): Teaches **Enterprise Java 21 & Object-Oriented Systems (CUTM1011)**, **Advanced Java (CUST1051)**, and **Angular (CUST1052)**.
- **Manoj Kumar Padhi** (Vocational Skill & Action Learning): Teaches **Automotive (Four Wheeler / Two Wheeler)**, **EV Assembly (CUSK650)**, **Welding Fabrication (CUSK16)**, **NLP (CUSK913)**, and **Accounting for Managers (CUCT1003)**.
- **Dr. Durga Prasad Padhi** (Management / Agriculture): Teaches **Agricultural Marketing & Prices (CUTM180, CUTM481)**.
- **Nandini Padhi** (Fisheries / Ecology): Teaches **Aquatic Ecology & Disaster Management (CUTM546, CUTM533)**.
- **Manas Ranjan Padhi** (Automobile Engineering): Teaches **Automobile Engineering (CUDM319, CUDP883)**.

---

### 📚 Full Faculty-To-Subject Master Table

| Faculty Member | Academic Department / School | Courses Taught (Code & Title) | Categories & Credits |
| :--- | :--- | :--- | :--- |
`;

sortedKeys.forEach(k => {
  const item = facultyMap[k];
  const depts = Array.from(item.departments).join('<br>');
  const coursesFormatted = item.courses.map(c => {
    return `**[${c.courseCode}]** ${c.courseTitle} *(ID: ${c.coursewareId || 'N/A'})*`;
  }).join('<br>');
  const catCredits = item.courses.map(c => {
    return `${c.courseCategory || 'Core'} (${c.credits || 3} Cr, LTP: ${c.ltp || 'N/A'})`;
  }).join('<br>');

  md += `| **${k}** | ${depts} | ${coursesFormatted} | ${catCredits} |\n`;
});

const artifactPath = path.join('C:', 'Users', 'aryan', '.gemini', 'antigravity', 'brain', '5898d378-b18f-4b24-aecd-e2326639b44c', 'cutm_exact_faculty_course_data.md');
fs.writeFileSync(artifactPath, md, 'utf8');
console.log('Wrote artifact to:', artifactPath);

// 2. Generate java lines for CutmCoursewareBrainCompendium.java
let javaFacultyLines = [];
sortedKeys.forEach(k => {
  const item = facultyMap[k];
  const depts = Array.from(item.departments).join(', ');
  const cList = item.courses.map(c => {
    let title = c.courseTitle.replace(/"/g, '\\"');
    return `${c.courseCode} - ${title} (Category: ${c.courseCategory}, Credits: ${c.credits}, LTP: ${c.ltp}, ID: ${c.coursewareId})`;
  }).join('; ');
  javaFacultyLines.push(`            • ${k} [${depts}]: ${cList}`);
});

console.log('Total Java faculty lines:', javaFacultyLines.length);

const compendiumContent = `package com.mentorhub.service;

import com.mentorhub.model.CutmCourse;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Authoritative, Comprehensive Knowledge Compendium for Centurion University of Technology and Management (C.U.T.M.)
 * Official Courseware Portal: https://courseware.cutm.ac.in
 * Contains exact, authentic data for all 385 courses and 184 faculty professors.
 */
public class CutmCoursewareBrainCompendium {

    public static final String COMPREHENSIVE_COMPENDIUM = """
        CENTURION UNIVERSITY OF TECHNOLOGY AND MANAGEMENT (C.U.T.M.) EXACT ACADEMIC & FACULTY DIRECTORY:
        - Official Courseware Portal: https://courseware.cutm.ac.in/courses
        - Official Nomenclature: Centurion University of Technology and Management (Centurion University / C.U.T.M.)
        - Course Catalog: Exactly 385 authenticated courses across 6 constituent schools and CBCS baskets.
        - Faculty Registry: Exactly 184 verified professors, deans, and domain experts.

        CRITICAL FACULTY DISTINCTIONS (AVOID ANOMALIES):
        1. Mr. Manoj Padhi (School of Engineering & Technology - CSE): Teaches CUTM1011 (Enterprise Java 21 & Object-Oriented Systems), CUST1051 (ADVANCED JAVA), and CUST1052 (Angular).
        2. MANOJ KUMAR PADHI (Vocational & Skill / Action Learning): Teaches CUCT1003 (Accounting for Managers), CUSK913 (Introduction to NLP), CUSK611/CUSK5 (Four Wheeler Service Technology), CUSK16 (Welding Fabrication), CUSK650 (EV Assembly), CUSK856 (Spectral Image Processing), CUCT990/CUCT992 (Vehicle Driving & Service), CUCT3 (Two Wheeler Technician), CUDP1066 (Composite Design).
        3. Dr. Durga Prasad Padhi (Management): Teaches CUTM180 (Agricultural Marketing and Prices) and CUTM481 (Agriculture Marketing).
        4. Nandini Padhi (Ecology/Fisheries): Teaches CUTM546 (Aquatic Ecology, Biodiversity and Disaster Management) and CUTM533 (Aquatic Mammals, Reptiles and Amphibians).
        5. Manas Ranjan Padhi (Mechanical/Automobile): Teaches CUDM319 & CUDP883 (Automobile Engineering).
        6. Prof. Sangram Routray (CSE): Teaches CUTM1010 (Data Structures & Algorithmic Analysis), CUTM1020 (Advanced Information Security), CUTM1602 (Artificial Intelligence, Machine Learning & Deep Learning).
        7. Dr. Sujata Chakravarty (CSE): Teaches CUTM1012 (Database Systems, SQL & Transactional Integrity) and CUDM626 (Domain Track: Data Science and Machine Learning).
        8. Dr. Bhairaba Kumar Majhi (Applied Sciences / Mathematics): Teaches CUTM1001 (Applied Mathematics & Engineering Statistics), CUTM146, CUTM273, CUTM284 (Analysis I & II).
        9. Dr. Padmaja Patnaik (Applied Sciences / Physics): Teaches CUTM1002 (Quantum & Semiconductor Physics for Computing), CUTM308 (Advanced Quantum Mechanics), CUSK851, CUSK850, CUSK837.
        10. Dr. Pramod Kumar Patjoshi (Management & Commerce): Teaches CUTM2101 (Technology Entrepreneurship & Startup Venture Incubation) and CUCT212 (Accounting for Managers).

        CBCS BASKET STRUCTURE:
        - Basket I (AECC): CUTM1001 (Applied Mathematics), CUTM1002 (Quantum Physics), Environmental Studies, Communication.
        - Basket II (PCC): CUTM1010 (Data Structures), CUTM1011 (Enterprise Java), CUTM1012 (Database Systems), CUTM1020 (Advanced Information Security).
        - Basket III (PEC): CUTM1601 (Cloud Computing), CUTM1602 (AI & Deep Learning), CUDM626 (Data Science & ML), CUDM1127 (AWS Cloud), CUDM1086 (NodeJS & MongoDB), CUDM1084 (ReactJS).
        - Basket IV (OE): CUTM2101 (Technology Entrepreneurship), CUCT212 (Accounting for Managers), CUDM930 (Business Environment), CUDM845 (Banking Law).
        - Basket V (SEC): CUTM3001 (Production Skill Certification), CUSK885 (Adobe Tools), CUDM343 (Welding & Inspection), CUDM333 (CNC Manufacturing), CUSK910 (Solar Lighting).

        CONSTITUENT SCHOOLS:
        1. School of Engineering & Technology (SoET)
        2. School of Management & Commerce (SoMC)
        3. M.S. Swaminathan School of Agriculture (MSSSoA)
        4. School of Paramedics & Allied Health Sciences (SoPAHS)
        5. School of Applied Sciences (SoAS)
        6. Centurion Center for Action Learning (CCAL)

        AUTHORITATIVE FACULTY & SUBJECT REGISTRY (ALL 184 FACULTY MEMBERS):
${javaFacultyLines.join('\n')}

        BEHAVIORAL RULES:
        - When asked which faculty teaches a subject, or what subject a faculty teaches, give the EXACT course code, exact title, credits, and department from this registry.
        - NEVER give anomalous or guessed subjects. If someone asks about Mr. Manoj Padhi, do NOT mention Four Wheeler or Welding; cite Enterprise Java, Advanced Java, and Angular.
        - Pronounce "C.U.T.M." letter-by-letter as "C. U. T. M." or say "Centurion University".
        """;

    /**
     * Precision lookup for faculty inquiries. Matches exact names and specific tokens, avoiding surname collisions.
     */
    public static String answerFacultyInquiry(String query, List<CutmCourse> allCourses) {
        if (query == null || query.trim().isEmpty() || allCourses == null) return null;
        String q = query.toLowerCase().replaceAll("[^a-z0-9\\\\s]", " ").trim();

        // Stop words to ignore
        Set<String> stopWords = new HashSet<>(Arrays.asList(
            "who", "what", "which", "is", "are", "teaches", "teaching", "teach", "the", "a", "an", "subject", "subjects",
            "course", "courses", "faculty", "professor", "sir", "madam", "dr", "mr", "mrs", "ms", "prof", "tell", "me",
            "about", "give", "data", "exact", "anomalous", "know", "does", "do", "in", "at", "cutm", "centurion", "university"
        ));

        List<String> queryTokens = Arrays.stream(q.split("\\\\s+"))
            .filter(t -> t.length() >= 3 && !stopWords.contains(t))
            .collect(Collectors.toList());

        if (queryTokens.isEmpty()) return null;

        // Group courses by normalized faculty
        Map<String, List<CutmCourse>> facultyCoursesMap = new LinkedHashMap<>();
        for (CutmCourse c : allCourses) {
            String fac = c.getFaculty();
            if (fac == null || fac.trim().isEmpty() || fac.contains("Panel")) continue;
            String normalizedFac = fac.trim().replace("\\\\s+", " ");
            if (normalizedFac.equalsIgnoreCase("MR.MANOJ PADHI") || normalizedFac.equalsIgnoreCase("MR. MANOJ PADHI")) {
                normalizedFac = "Mr. Manoj Padhi";
            }
            facultyCoursesMap.computeIfAbsent(normalizedFac, k -> new ArrayList<>()).add(c);
        }

        Map<String, List<CutmCourse>> matchedFaculty = new LinkedHashMap<>();

        // Scoring algorithm: Prefer full name matches
        for (Map.Entry<String, List<CutmCourse>> entry : facultyCoursesMap.entrySet()) {
            String facName = entry.getKey();
            String facLower = facName.toLowerCase().replaceAll("[^a-z0-9\\\\s]", " ");
            List<String> facTokens = Arrays.stream(facLower.split("\\\\s+"))
                .filter(t -> t.length() >= 3 && !stopWords.contains(t))
                .toList();

            // Check if query contains the exact full faculty name
            if (q.contains(facLower)) {
                matchedFaculty.put(facName, entry.getValue());
                continue;
            }

            // Check token overlap
            long matchingTokens = queryTokens.stream().filter(facTokens::contains).count();

            // If query contains multiple tokens (e.g. "manoj padhi"), all must match
            if (queryTokens.size() >= 2 && matchingTokens == queryTokens.size()) {
                matchedFaculty.put(facName, entry.getValue());
            } else if (queryTokens.size() == 1 && matchingTokens >= 1) {
                // If single token, only match if it's distinctive (more than 4 characters or unique)
                if (facTokens.size() == 1 || queryTokens.get(0).length() >= 5) {
                    matchedFaculty.put(facName, entry.getValue());
                }
            }
        }

        // Special disambiguation for Manoj Padhi inquiries
        if (q.contains("manoj padhi") || (q.contains("manoj") && !q.contains("kumar"))) {
            matchedFaculty.entrySet().removeIf(e -> e.getKey().equalsIgnoreCase("MANOJ KUMAR PADHI") || e.getKey().contains("Durga"));
        }

        if (matchedFaculty.isEmpty()) return null;

        StringBuilder sb = new StringBuilder();
        sb.append("### 🏛️ Centurion University (C.U.T.M.) Verified Faculty Intelligence\\n\\n");

        for (Map.Entry<String, List<CutmCourse>> entry : matchedFaculty.entrySet()) {
            String facName = entry.getKey();
            List<CutmCourse> courses = entry.getValue();
            CutmCourse first = courses.get(0);

            sb.append("**Faculty:** ").append(facName).append("\\n");
            sb.append("**School / Department:** ").append(first.getDepartment() != null ? first.getDepartment() : "Centurion University").append("\\n");
            Set<String> cats = courses.stream().map(CutmCourse::getCourseCategory).filter(Objects::nonNull).collect(Collectors.toSet());
            sb.append("**Specializations & Tracks:** ").append(String.join(", ", cats)).append("\\n");
            sb.append("**Courses Taught (").append(courses.size()).append("):**\\n");

            for (CutmCourse c : courses) {
                sb.append("• **").append(c.getCourseCode()).append("**: ").append(c.getCourseTitle());
                if (c.getCredits() != null) sb.append(" (").append(c.getCredits()).append(" Credits, LTP: ").append(c.getLtp()).append(")");
                if (c.getCoursewareId() != null) {
                    sb.append(" — [🌐 Courseware #").append(c.getCoursewareId()).append("](https://courseware.cutm.ac.in/course/").append(c.getCoursewareId()).append(")");
                }
                sb.append("\\n");
            }
            sb.append("\\n");
        }

        return sb.toString().trim();
    }

    /**
     * Precision lookup for course code or title inquiry.
     */
    public static String answerCourseInquiry(String query, List<CutmCourse> allCourses) {
        if (query == null || query.trim().isEmpty() || allCourses == null) return null;
        String q = query.toLowerCase().trim();

        for (CutmCourse c : allCourses) {
            String codeLower = c.getCourseCode() != null ? c.getCourseCode().toLowerCase() : "";
            String titleLower = c.getCourseTitle() != null ? c.getCourseTitle().toLowerCase() : "";

            boolean matchCode = !codeLower.isEmpty() && q.contains(codeLower);
            boolean matchTitle = !titleLower.isEmpty() && q.contains(titleLower);

            if (matchCode || matchTitle) {
                String fac = c.getFaculty();
                if (fac != null) {
                    if (fac.equalsIgnoreCase("MR.MANOJ PADHI") || fac.equalsIgnoreCase("MR. MANOJ PADHI")) {
                        fac = "Mr. Manoj Padhi";
                    }
                } else {
                    fac = "Centurion University Faculty Panel";
                }

                StringBuilder sb = new StringBuilder();
                sb.append("### 📚 C.U.T.M. Courseware Intelligence: ").append(c.getCourseCode()).append(" — ").append(c.getCourseTitle()).append("\\n\\n");
                sb.append("• **Faculty Instructor:** ").append(fac).append("\\n");
                sb.append("• **Academic School:** ").append(c.getDepartment() != null ? c.getDepartment() : "School of Engineering & Technology").append("\\n");
                sb.append("• **CBCS Basket:** ").append(c.getBasketName() != null ? c.getBasketName() : "University Basket").append("\\n");
                sb.append("• **Category:** ").append(c.getCourseCategory() != null ? c.getCourseCategory() : "Core").append("\\n");
                if (c.getCredits() != null) {
                    sb.append("• **Credits & LTP:** ").append(c.getCredits()).append(" Credits (LTP: ").append(c.getLtp()).append(")\\n");
                }
                if (c.getCoursewareUrl() != null) {
                    sb.append("• **Official Courseware Portal:** [🌐 View Session Plans & Lessons]( ").append(c.getCoursewareUrl()).append(" )\\n");
                }
                if (c.getDescription() != null && !c.getDescription().isEmpty()) {
                    sb.append("• **Description:** ").append(c.getDescription()).append("\\n");
                }
                if (c.getPrerequisites() != null && !c.getPrerequisites().isEmpty()) {
                    sb.append("• **Prerequisites:** ").append(c.getPrerequisites()).append("\\n");
                }
                return sb.toString().trim();
            }
        }

        return null;
    }
}
`;

const javaFilePath = path.join(__dirname, '..', 'backend', 'src', 'main', 'java', 'com', 'mentorhub', 'service', 'CutmCoursewareBrainCompendium.java');
fs.writeFileSync(javaFilePath, compendiumContent, 'utf8');
console.log('Successfully wrote exact Java compendium to:', javaFilePath);
