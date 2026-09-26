const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'backend', 'src', 'main', 'resources', 'cutm_courses.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

console.log('Total raw courses:', data.length);

// Normalize faculty names
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
console.log('Consolidated unique faculties:', sortedKeys.length);

// Print specific faculties to check
['Mr. Manoj Padhi', 'MANOJ KUMAR PADHI', 'Dr. Sujata Chakravarty', 'Sangram Routray', 'Dr. Pramod Kumar Patjoshi'].forEach(k => {
  if (facultyMap[k]) {
    console.log(`\n=== ${k} (${Array.from(facultyMap[k].departments).join(' | ')}) ===`);
    facultyMap[k].courses.forEach(c => {
      console.log(`   - [${c.courseCode}] ${c.courseTitle} (${c.courseCategory}, Credits: ${c.credits}, LTP: ${c.ltp}, ID: ${c.coursewareId})`);
    });
  }
});
