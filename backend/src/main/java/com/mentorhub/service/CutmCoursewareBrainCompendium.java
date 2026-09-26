package com.mentorhub.service;

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
            • Abhi Mitra [School of Engineering & Technology]: CUDM584 - Domain : Gaming and Immersive Learning (AR-VR) (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 584); CUSK833 - Course Name : 3D Game Art (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 833)
            • Ajay Mishra [School of Engineering & Technology]: CUSK664 - SKILL - Design Supervisor Wooden &amp; Modular Furniture (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 664); CUSK800 - SKILL - Fabrication (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 800)
            • Ajitav Acharya [School of Engineering & Technology, School of Management & Commerce]: CUDM930 - BUSINESS ENVIRONMENT (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 930); CUDM954 - E-Commerce (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 954); CUDM936 - Financial Market Operation (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 936)
            • Ambika Sankar Mishra [School of Engineering & Technology]: CUSK645 - Thesis (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 645)
            • Amit Kumar [School of Engineering & Technology]: YEAR2021 - Domain Track Title :Business Analytics (Year 2021) (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 1033); CUDM1034 - Domain Track Title :Data Analytics (Year 2021) (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 1034); CUDM362 - Domain Track: Business Analytics (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 362)
            • Amiya Singh [School of Engineering & Technology]: CUSK657 - SKILL - Editing (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 657); CUSK838 - SKILL- Innovation and Entrepreneurship (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 838); CUSK655 - SKILL-Camera Operation (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 655)
            • Anita Patra [School of Engineering & Technology]: CUDM297 - Domain Track : Data Analytics - Visualisation (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 297)
            • Ansuman Nanda [School of Engineering & Technology]: CUDM495 - Job Role - Industrial Maintenance (Mechatronics-Inchage) (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 495); CUDM266 - Job Role - Multi Skill Technician (Manufacturing) (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 266); CUDM834 - Job Role - Shop floor Enginner (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 834); CUDM755 - Job Role – Machine tool Operator (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 755); CUSK458 - SKILL - Mechatronics System Design (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 458)
            • Binayak Sahoo [School of Engineering & Technology]: CUDM689 - Job Role - CNC Operator &amp; Programmer (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 689); CUDM829 - Job Role-AUTOMOTIVE SREVICE TECHNICIAN-2 (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 829)
            • Boina Anil Kumar [School of Applied Sciences]: CUTM8 - Applied Mathematics-1 (Category: Core, Credits: 4, LTP: 3-0-2, ID: 8)
            • Chandrasekhar Sahu [School of Engineering & Technology]: CUCT886 - Certificate Course on Dairy Farming (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 886)
            • Chinmaya Chidananda Behera [School of Engineering & Technology]: CUSK570 - SKILL-Drug Research using Biovia (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 570); CUCT852 - Drug Design Using Biovia (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 852)
            • Chiranjeeb Prasad Mohanty [School of Engineering & Technology]: CUDM471 - Job Role; Draughtsman (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 471); CUDM727 - JOBROLE: Supervisor(Construction) (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 727)
            • Chittaranjan Routray [School of Engineering & Technology]: CUTM239 - Analytical Techniques (Category: Core, Credits: 4, LTP: 3-0-2, ID: 239); CUDM1027 - Introduction to composites manufacturing (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 1027)
            • D Rahul Rao [School of Engineering & Technology]: CUSK506 - SKILL - Drone Piloting (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 506)
            • Debabrata Biswal [School of Engineering & Technology]: CUSK738 - SKILL - Basket Ball, Paid Course (Fees- 500) (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 738); CUSK756 - SKILL - Gym Instructor, Paid Course (Fees- 1000) (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 756)
            • Debashish Tripathy [M.S. Swaminathan School of Agriculture, School of Engineering & Technology]: CUTM722 - Advanced Aquaculture (Category: Core, Credits: 4, LTP: 3-0-2, ID: 722); CUTM624 - Animal breeding (Category: Core, Credits: 4, LTP: 3-0-2, ID: 624)
            • Debashree debadatta Behera [School of Engineering & Technology]: CUSK496 - SKILL: Solar Thermal Engineer-Industrial Process Heat (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 496); CUCT862 - Certificate course : Solar Thermal Engineering (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 862)
            • Debasis Sahu [School of Engineering & Technology]: CUCT982 - Transformer Manufacturing, Repairing and Maintenance (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 982)
            • Debendra Maharana [School of Engineering & Technology]: CUTM364 - Advanced Web Programming (Category: Core, Credits: 4, LTP: 3-0-2, ID: 364)
            • Debi Prasad Satapathy [School of Management & Commerce]: CUDM262 - Financial Institutions, Markets and Services (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 262)
            • Deepak Kandher [School of Engineering & Technology]: CUCT887 - Certificate Course on Mushroom Farming (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 887)
            • Dillip Mohanta [School of Engineering & Technology]: CUDM333 - Domain Track: Manufacturing (Conventional, CNC and Additive) (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 333); CUCT984 - Design Supervising of Wooden and Modular Furniture (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 984); CUCT985 - Fabrication (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 985); CUDP1007 - Diploma in Manufacturing (Conventional, CNC, and Additive) (Category: Diploma, Credits: 3, LTP: 2-1-0, ID: 1007)
            • Dr Chaitanya [School of Paramedics & Allied Health Sciences, School of Engineering & Technology]: CUTM805 - Applied Anatomy and Physiology Related to Anesthesia Technology (Category: Core, Credits: 4, LTP: 3-0-2, ID: 805); CUTM802 - BASIC &amp; OCULAR PHARMACOLOGY (Category: Core, Credits: 4, LTP: 3-0-2, ID: 802)
            • Dr Chandan Das [School of Engineering & Technology]: CUCT1067 - Pharmacy Technician (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 1067)
            • Dr Dojalisa Sahu [School of Engineering & Technology]: CUTM457 - Applied Engineering Materials (Category: Core, Credits: 4, LTP: 3-0-2, ID: 457)
            • Dr G V Ramana [School of Engineering & Technology]: CUTM635 - Advanced Extraction Technologies (Category: Core, Credits: 4, LTP: 3-0-2, ID: 635); CUTM1004 - Advanced Separation Technologies and Downstream Processing (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1004); CUTM444 - Ayurveda and Fermentation Technology (Category: Core, Credits: 4, LTP: 3-0-2, ID: 444)
            • Dr P Anthony Sunny Dayal [School of Engineering & Technology]: CUCT867 - E-Vehicle Assembly and Service Technology (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 867)
            • Dr Rukmini Mishra [School of Engineering & Technology]: CUDM104 - Domain Track: Genetic Engineering and Genomics (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 104); CUDP1062 - Genetic Engineering and Genomics (Category: Diploma, Credits: 3, LTP: 2-1-0, ID: 1062)
            • Dr Sabyasachi Dey [School of Management & Commerce]: CUDM382 - Marketing Domain: Retail and E-Tail Management (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 382); CUDM918 - Marketing Domain: Rural Marketing (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 918); CUDM893 - Marketing Domain: Sales and Distribution Management (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 893); CUDM237 - Marketing Domain: Services and Financial Services Marketing (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 237)
            • Dr Siba Prasad Parida [School of Paramedics & Allied Health Sciences]: CUTM331 - Anatomy and Biology of Fish and Shellfish (Category: Core, Credits: 4, LTP: 3-0-2, ID: 331)
            • Dr Sitaram Swain [School of Engineering & Technology]: CUTM303 - Bioanalytical Techniques (Category: Core, Credits: 4, LTP: 3-0-2, ID: 303); CUTM586 - Biochemical Techniques (Category: Core, Credits: 4, LTP: 3-0-2, ID: 586)
            • Dr. A.M Mohanty [School of Engineering & Technology]: CUTM20 - Advanced Metrology (Category: Core, Credits: 4, LTP: 3-0-2, ID: 20)
            • Dr. Amit Kumar Sahoo [School of Engineering & Technology]: CUDM313 - Domain Track: Industrial Automation (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 313); CUSK516 - SKILL - Electrical Installation (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 516)
            • Dr. Amrutha Gopan [School of Paramedics & Allied Health Sciences]: CUTM23 - Anatomy and Biology of Finfish (Category: Core, Credits: 4, LTP: 3-0-2, ID: 23); CUTM527 - Anatomy and Biology of Shellfish (Category: Core, Credits: 4, LTP: 3-0-2, ID: 527)
            • Dr. Arun Kumar Pradhan [School of Engineering & Technology]: CUTM196 - Applications of composites (Category: Core, Credits: 4, LTP: 3-0-2, ID: 196)
            • Dr. Bhairaba Kumar Majhi [School of Engineering & Technology - Applied Sciences, School of Engineering & Technology]: CUTM1001 - Applied Mathematics & Engineering Statistics (Category: Core, Credits: 4, LTP: 3-1-0, ID: 789); CUTM146 - Advanced Analysis (Category: Core, Credits: 4, LTP: 3-0-2, ID: 146); CUTM273 - Analysis-I (Category: Core, Credits: 4, LTP: 3-0-2, ID: 273); CUTM284 - Analysis-II (Category: Core, Credits: 4, LTP: 3-0-2, ID: 284)
            • Dr. Chandra Sekhar Dash [School of Engineering & Technology]: CUDM285 - Domain Track: Chip Design and Fabrication using VLSI (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 285); CUDP1063 - Diploma: Chip Design and Fabrication Using VLSI (Category: Diploma, Credits: 3, LTP: 2-1-0, ID: 1063)
            • Dr. Chinu Bohidar [School of Engineering & Technology]: CUTM729 - Advertising and Public Relations (Category: Core, Credits: 4, LTP: 3-0-2, ID: 729); CUCT73 - Certificate in Camera Operator (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 73); CUCT864 - Certificate in Video Editing (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 864)
            • Dr. Dinkar J. Gaikwad [School of Engineering & Technology]: CUSK702 - Hydroponics Technician (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 702); CUCT870 - Hydroponics Technology (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 870)
            • Dr. G. Arun Manohar [School of Engineering & Technology]: CUTM130 - Applied Ergonomics (Category: Core, Credits: 4, LTP: 3-0-2, ID: 130); CUSK630 - SKILL - Computer Aided Drafting (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 630)
            • Dr. Gagan Kumar Panigrahi [School of Engineering & Technology]: CUCT857 - Introduction to Computational Biology (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 857)
            • Dr. Gitanjali Behera [M.S. Swaminathan School of Agriculture]: CUTM183 - Agricultural Structures And Environment Control (Category: Core, Credits: 4, LTP: 3-0-2, ID: 183)
            • Dr. Goutam Kumar Mahato [School of Engineering & Technology]: CUTM836 - Advanced Complex Analysis (Category: Core, Credits: 4, LTP: 3-0-2, ID: 836)
            • Dr. HARA GOURI MISHRA [School of Applied Sciences]: CUTM537 - BIOCHEMISTRY AND CLINICAL PATHOLOGY (Theory and Practical) (Category: Core, Credits: 4, LTP: 3-0-2, ID: 537)
            • Dr. Harish Chandra Mohanta [School of Engineering & Technology]: CUTM74 - Analog Communication Systems (Category: Core, Credits: 4, LTP: 3-0-2, ID: 74); CUDM350 - Domain Track: Communication Systems (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 350)
            • Dr. K. Anil Kumar [School of Engineering & Technology]: CUDM498 - Domain Track; Commodity and Food Storage (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 498)
            • Dr. Kakani Grihalakshmi [School of Engineering & Technology]: CUDM337 - Domain Track: Food Processing (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 337); CUDP1064 - Diploma: Food Processing (Category: Diploma, Credits: 3, LTP: 2-1-0, ID: 1064)
            • Dr. M.L.N Acharyulu [School of Engineering & Technology]: CUTM1081 - Applied Analytical Chemitry (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1081)
            • Dr. M.L.N. Acharyulu/Dr. Narayan Gouda [School of Applied Sciences]: CUTM714 - Applied Analytical Chemistry (Category: Core, Credits: 4, LTP: 3-0-2, ID: 714)
            • Dr. Mohammad Aamir Pasha [School of Engineering & Technology]: CUSK612 - Photography (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 612)
            • Dr. Monali Priyadarsini Mishra [School of Engineering & Technology]: CUTM561 - Applied Microbiology (Category: Core, Credits: 4, LTP: 3-0-2, ID: 561); CUSK922 - SKILL-FIRST AID SERVICE (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 922)
            • Dr. Naga Jogayya K [School of Paramedics & Allied Health Sciences]: CUTM517 - Basics of Forensic Science (Theory) (Category: Core, Credits: 4, LTP: 3-0-2, ID: 517)
            • Dr. Nilanjana Datta [School of Engineering & Technology]: CUDM329 - Domain Track; Protected Horticulture (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 329)
            • Dr. Padmaja Patnaik [School of Engineering & Technology - Applied Sciences, School of Engineering & Technology]: CUTM1002 - Quantum & Semiconductor Physics for Computing (Category: Core, Credits: 4, LTP: 3-0-2, ID: 308); CUTM308 - Advanced Quantum Mechanics (Category: Core, Credits: 4, LTP: 3-0-2, ID: 308); CUSK851 - Gamified DIY kits using Lasers (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 851); CUSK850 - Laser modelling using principles of Design Thinking (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 850); CUSK837 - New Material Development with Biovia (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 837); CUCT891 - diploma course (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 891)
            • Dr. Polaki Suman [M.S. Swaminathan School of Agriculture, School of Engineering & Technology]: CUTM1126 - Agricultural Informatics and Artificial Intelligence (AI) (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1126); CUBI2550 - Biochemical Engineering - CUBI 2550 (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1131); CUBS2542 - Bioinformatics (CUBS 2542) (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 1083)
            • Dr. Prabhat Kumar Singh [School of Engineering & Technology]: CUDM234 - Seed Production Using Manual and Molecular Methods (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 234); CUSK719 - Skill Course: Seed Production (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 719)
            • Dr. Pramod Kumar Patjoshi [School of Management & Commerce]: CUTM2101 - Technology Entrepreneurship & Startup Venture Incubation (Category: Certificate, Credits: 3, LTP: 3-0-0, ID: 212); CUCT212 - Accounting for Managers (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 212)
            • Dr. Praveen Boddana [School of Engineering & Technology]: CUSK717 - Skill Course : Bio-Fertilizer Preparation (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 717); CUCT873 - Certificate Course : Bio fertilizer Preparation (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 873)
            • Dr. Pushpalatha Ganesh [School of Engineering & Technology]: CUSK688 - Skill Course - Introduction to Computational Biology (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 688)
            • Dr. Rajashree Jena [School of Engineering & Technology]: CUDM340 - Domain Track: Dairy Processing and Development (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 340)
            • Dr. Rajendra Kumar Khadanga [School of Engineering & Technology]: CUDM314 - Domain Track: Renewable Energy Applications (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 314); CUDP1065 - Diploma Course: Renewable Energy Technology and Applications (Category: Diploma, Credits: 3, LTP: 2-1-0, ID: 1065)
            • Dr. Ria Mukhopadhyay [School of Engineering & Technology]: CUCT879 - POULTRY FARMING (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 879)
            • Dr. Rosy Mallik [School of Engineering & Technology]: CUSK1035 - Spectroscopy for Analysis of Natural and Synthetic Compounds (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 1035)
            • Dr. Sagarika Parida [School of Paramedics & Allied Health Sciences]: CUTM661 - Anatomy of Angiosperm (Category: Core, Credits: 4, LTP: 3-0-2, ID: 661)
            • Dr. Sandeep Rout [M.S. Swaminathan School of Agriculture]: CUTM169 - Agricultural Heritage (Category: Core, Credits: 4, LTP: 3-0-2, ID: 169)
            • Dr. Sangram Samal [School of Engineering & Technology - Cloud Track, School of Engineering & Technology]: CUTM1601 - Cloud Computing & Microservices Architecture (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 606); CUTM606 - Advanced Propulsion (Category: Core, Credits: 4, LTP: 3-0-2, ID: 606); CUTM389 - Aerodynamic (Category: Core, Credits: 4, LTP: 3-0-2, ID: 389); CUTM523 - Aerospace structural Analysis (Category: Core, Credits: 4, LTP: 3-0-2, ID: 523)
            • Dr. Satyanarayan Dhal [School of Engineering & Technology]: CUSK1079 - Artificial Intelligence in Material Science (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 1079)
            • Dr. Saurav Barman [School of Engineering & Technology]: CUDM505 - Domain Track: Organic Farming (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 505); CUSK663 - Skill course: Organic Grower (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 663); CUCT889 - Vermicomposting farming (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 889)
            • Dr. Shantanu Bhattacharyya [School of Engineering & Technology, School of Applied Sciences]: CUTM576 - Archegoniate (Category: Core, Credits: 4, LTP: 3-0-2, ID: 576); CUTM287 - Biochemistry and Enzyme Technology (Category: Core, Credits: 4, LTP: 3-0-2, ID: 287)
            • Dr. Shraban Kumar Sahoo [School of Engineering & Technology]: CUTM229 - Atomic Structure and Chemical Bonding (Category: Core, Credits: 4, LTP: 3-0-2, ID: 229); CUSK1025 - Working with graphene and carbon fibre (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 1025)
            • Dr. Sisir Ranjan Dash [School of Management & Commerce]: CUDM235 - Marketing Domain : Brand Management &amp; Consumer Behaviour (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 235); CUDM627 - Marketing Domain : Digital Marketing &amp; Marketing Communications (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 627)
            • Dr. Soma Maji [School of Engineering & Technology]: CUDP861 - Diploma Track: Dairy Processing and Development (Category: Diploma, Credits: 3, LTP: 2-1-0, ID: 861)
            • Dr. Soumya Jal [School of Engineering & Technology, School of Applied Sciences, School of Paramedics & Allied Health Sciences]: CUTM601 - Analytical Techniques (Category: Core, Credits: 4, LTP: 3-0-2, ID: 601); CUTM793 - Biochemistry (Category: Core, Credits: 4, LTP: 3-0-2, ID: 793); CUDM1021 - Health Care Assistancy (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 1021); CUSK940 - Skill- General Duty Assistance Service (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 940)
            • Dr. Sudhansu Kumar Samal [School of Engineering & Technology]: CUSK1016 - E-Vehicle Assembly and Service Technology (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 1016)
            • Dr. Sujata Chakravarty [School of Engineering & Technology - CSE, School of Engineering & Technology]: CUTM1012 - Database Systems, SQL & Transactional Integrity (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1004); CUDM626 - Domain Track: Data Science and Machine Learning (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 626)
            • Dr. Sujit Kumar Mishra [School of Engineering & Technology]: CUTM192 - Animal Biotechnology (Category: Core, Credits: 4, LTP: 3-0-2, ID: 192)
            • Dr. Tapan Dash [School of Engineering & Technology]: CUTM436 - Advanced Characterization Techniques (Category: Core, Credits: 4, LTP: 3-0-2, ID: 436)
            • Dr.Ashok Misra [School of Engineering & Technology]: CUTM342 - Applications of CFD using Computational Tool-Simulia (Category: Core, Credits: 4, LTP: 3-0-2, ID: 342); CUDM438 - Domain Track: Computational Fluid Dynamics (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 438); CUSK835 - Introduction to Quantum Computing (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 835)
            • Dr.Banitamani Mallik [School of Engineering & Technology]: CUTM437 - Advanced Statistical Methods (Category: Core, Credits: 4, LTP: 3-0-2, ID: 437); CUCT872 - Introduction to High Performance Computing (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 872)
            • Dr.David Blessing Rani J [School of Applied Sciences]: CUTM963 - BIOCHEMISTRY - Practical (Category: Core, Credits: 4, LTP: 3-0-2, ID: 963); CUTM961 - BIOCHEMISTRY - THEORY (Category: Core, Credits: 4, LTP: 3-0-2, ID: 961)
            • Dr.Durga Prasad Padhi [School of Management & Commerce]: CUTM180 - Agricultural Marketing and Prices (Category: Core, Credits: 4, LTP: 3-0-2, ID: 180); CUTM481 - Agriculture Marketing (Category: Core, Credits: 4, LTP: 3-0-2, ID: 481)
            • Dr.M.vinod kumar [School of Engineering & Technology]: CUTM822 - Anesthesia for Patients with Medical disorders (Category: Core, Credits: 4, LTP: 3-0-2, ID: 822); CUTM4366 - BASICS OF ANESTHESIA AND OT TECHNOLOGY CUTM 4366 (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1110)
            • Dr.Prajna Pani [School of Engineering & Technology]: CUDM801 - Job Readiness (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 801)
            • Dr.Susanta Kumar Mishra [School of Management & Commerce, School of Engineering & Technology]: CUDM242 - Current Asset Management (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 242); CUSK642 - SKILL-Business Plan Preparation (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 642); CUCT874 - Certificate Course in Business Plan (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 874)
            • Er Smruti Ranjan Nayak [School of Engineering & Technology]: CUSK910 - Skill Course-Solar Lighting Technology (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 910); CUCT859 - Certificatation Course: Solar Lighting Technology (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 859); CUCT1060 - Certification Course Solar PV Driven Equipments O/M &amp; Assembly. (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 1060)
            • Gautam Modak [School of Engineering & Technology]: CUSK608 - SFS - INTRODUCTION TO ROBOTICS (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 608)
            • Gulshan Kumar [M.S. Swaminathan School of Agriculture]: CUTM593 - Aquaculture Engineering (Category: Core, Credits: 4, LTP: 3-0-2, ID: 593)
            • Jamaluddin Khan [School of Engineering & Technology]: CUDM583 - Job Role - Domestic Electrician (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 583); CUDM485 - Job Role - HMI- SCADA Technician (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 485); CUDM616 - Job Role - Industrial Electrician (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 616); CUDM466 - Job Role - PLC Technician (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 466); CUDM699 - Job Role : Supervisor -Industrial Automation (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 699); CUDM763 - JOBROLE - Supervisor Electrical Works (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 763); CUSK515 - SKILL - CCTV Technician (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 515); CUSK494 - SKILL - Repair and Maintenance of Home Appliances (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 494)
            • Jasmine Parida [School of Engineering & Technology]: CUSK684 - SKILL - Swimming, Paid Course (Fees- 1000) (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 684)
            • Jaya Krishna Krishna Behera [School of Management & Commerce]: CUSK749 - Disaster Management (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 749)
            • Jitendra Pramanik [School of Engineering & Technology]: CUDM753 - JOB ROLE: Installation Technician –Computing and Peripherals (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 753); CUSK799 - SKILL- Computer Installation &amp; Maintenance (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 799); CUSK13 - SKILL- SBC Based System Design &amp; IoT (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 13)
            • K V Kalyan Chakravarthy [School of Engineering & Technology]: CUDM386 - Domain Track; Cloud Technologies (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 386)
            • Kajal Samantara [School of Engineering & Technology]: CUDP912 - Seed Production Using Manual and Molecular Methods (Category: Diploma, Credits: 3, LTP: 2-1-0, ID: 912)
            • Kalee Prasanna Pattanayak [M.S. Swaminathan School of Agriculture, School of Engineering & Technology]: CUTM41 - Agricultural Economics and Trade (Category: Core, Credits: 4, LTP: 3-0-2, ID: 41); CUSK997 - Skill Course in Light Motor Vehicle Driving (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 997)
            • KALIPRASAD RATH [School of Engineering & Technology]: CUTM232 - Applied Number Theory (Category: Core, Credits: 4, LTP: 3-0-2, ID: 232)
            • Kalpita Bhatta [School of Engineering & Technology]: CUTM292 - Advances in Plant Ecology (Category: Core, Credits: 4, LTP: 3-0-2, ID: 292)
            • Kamal Kumar Barik [School of Engineering & Technology]: CUSK649 - Advanced Geographic Information System (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 649); CUSK519 - Hi-Tech Surveying (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 519); CUSK648 - Satellite Data Processing (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 648)
            • Kula Bhusan Pradhan [School of Engineering & Technology]: CUDM690 - JOB ROLE : Welding Supervisor (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 690); CUDM673 - JOB ROLE : Welding Technician I (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 673); CUDM686 - JOB ROLE : Welding Technician II (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 686)
            • Laluprasad Parida [School of Engineering & Technology]: CUSK501 - SKILL - Retail Sales Associate (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 501)
            • Laxmi priya Panda [School of Engineering & Technology]: CUSK504 - SKILL-Beauty and Wellness (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 504)
            • M. Aswini Kumar [School of Engineering & Technology]: CUDM1127 - Cloud Practitioner (AWS) (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 1127); CUDM1086 - REST API Server using NodeJS and MongoDB (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 1086); CUDM1084 - Web Client UI: ReactJS (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 1084)
            • Madhusmita Maharana [School of Engineering & Technology]: CUSK499 - SKILL - Line stitching supervisor (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 499)
            • Madhusmita Moharana [School of Engineering & Technology]: CUCT695 - Certificate Course in Apparel Production (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 695)
            • Manas Ranjan Padhi [School of Engineering & Technology]: CUDM319 - Domain Track: Automobile Engineering (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 319); CUDP883 - Diploma in Automobile Engineering (Category: Diploma, Credits: 3, LTP: 2-1-0, ID: 883)
            • MANOJ KUMAR PADHI [School of Management & Commerce, School of Engineering & Technology]: CUCT1003 - ACCOUNTING FOR MANAGERS (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 1003); CUSK913 - Introduction to NLP (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 913); CUSK611 - SKILL - Four Wheeler Service Technology (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 611); CUSK5 - Skill Course in Four Wheeler Service Technology (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 5); CUSK16 - Skill Course in Welding Fabrication (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 16); CUSK650 - SKILL- EV Assembly (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 650); CUSK856 - SPECTRAL IMAGE PROCESSING USING PYTHON (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 856); CUCT990 - Certificate Course in Four Wheeler Service Technology (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 990); CUCT992 - Certificate Course in Light Motor Vehicle Driving (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 992); CUCT3 - Certificate Course in Two Wheeler Technician (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 3); CUDP1066 - Diploma in Composite design and Manufacturing (6-12-6) (Category: Diploma, Credits: 3, LTP: 2-1-0, ID: 1066)
            • Mihir Ray [School of Engineering & Technology]: CUSK1045 - Skill - Brew Master (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 1045)
            • Miss Diptimayee Jena [School of Management & Commerce]: CUDP1100 - Community Pharmacy &amp; Management (Theory) (Category: Diploma, Credits: 3, LTP: 2-1-0, ID: 1100)
            • Miss. Priyanka Priyadarshini Swain [School of Engineering & Technology]: CUSK687 - SKILL - General Duty Assistance (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 687)
            • Monalisha Pani [School of Engineering & Technology]: CUDM464 - JOBROLE-Assistant Surveyor (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 464); CUCT863 - HI-TECH SURVEYING (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 863)
            • Mr Himansu Bhusan Samal [School of Engineering & Technology, School of Management & Commerce]: CUDM741 - Business Analytics (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 741); CUDM824 - Pharmaceutical Advertising and Service Management (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 824)
            • Mr. Aasif Lone [School of Engineering & Technology]: CUSK925 - SKILL: Radiology Technology (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 925)
            • Mr. Abhilash Behera [School of Management & Commerce]: CUCT892 - Certificate Course : Paddy Processing and Marketing (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 892)
            • Mr. Chandan Haldar [M.S. Swaminathan School of Agriculture, School of Engineering & Technology]: CUTM411 - Aquaculture in Reservoirs (Category: Core, Credits: 4, LTP: 3-0-2, ID: 411); CUTM409 - Aquatic Pollution (Category: Core, Credits: 4, LTP: 3-0-2, ID: 409)
            • Mr. Gyana Ranjana Panigrahi [School of Paramedics & Allied Health Sciences]: CUDM1014 - Domain Track : Cybersecurity &amp; Digital Forensic (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 1014)
            • Mr. Manoj Padhi [School of Engineering & Technology - CSE, School of Engineering & Technology]: CUTM1011 - Enterprise Java 21 & Object-Oriented Systems (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1114); CUST1051 - ADVANCED JAVA (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1114); CUST1052 - Angular (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 1103)
            • Mr. Pradeep Kumar Mahapatra [M.S. Swaminathan School of Agriculture]: CUTM602 - AGRICULTURAL INFORMATICS (Category: Core, Credits: 4, LTP: 3-0-2, ID: 602)
            • Mr. Srimay Pradhan [School of Engineering & Technology]: CUTM157 - Basics of Genetics (Category: Core, Credits: 4, LTP: 3-0-2, ID: 157)
            • Mr. Subhankar Debnath [School of Engineering & Technology]: CUDM348 - Domain Track: Soil and Water Conservation through Watershed (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 348)
            • Mr.Nagula Dinesh Kumar [School of Engineering & Technology]: CUTM564 - Binocular Vision -I (Category: Core, Credits: 4, LTP: 3-0-2, ID: 564)
            • Mrs. S. Alana Teja [School of Management & Commerce]: CUTM619 - Basic Principles of Hospital Management (Category: Core, Credits: 4, LTP: 3-0-2, ID: 619)
            • Mrs. Saubhagyalaxmi Singh [School of Engineering & Technology]: CUTM175 - Advanced Differential Equations (Category: Core, Credits: 4, LTP: 3-0-2, ID: 175)
            • Ms. Sudeepta Pattanayak [M.S. Swaminathan School of Agriculture, School of Engineering & Technology]: CUTM298 - Agricultural Microbiology (Category: Core, Credits: 4, LTP: 3-0-2, ID: 298); CUSK691 - Skill- Mushroom Grower (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 691)
            • Ms.K.S.R.G. Sowgandhika [School of Paramedics & Allied Health Sciences, School of Engineering & Technology]: CUTM2603 - GENERAL ANATOMY CUTM 2603 (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1115); CUTM1122 - Anaesthesia for specialty surgeries for ventilated patients 2 (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1122); CUTM1120 - Anaesthesia Techniques Including Complications (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1120)
            • N Durga Prasad [M.S. Swaminathan School of Agriculture]: CUTM413 - Agricultural Finance and Cooperatives (Category: Core, Credits: 4, LTP: 3-0-2, ID: 413)
            • N Jeevaratnam [School of Engineering & Technology]: CUCT866 - Certification Course : Internet of Things (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 866)
            • N. V. S. Shankar [School of Engineering & Technology]: CUDM2518 - App Development Using Flutter (CUDM2518)Course Credits: 0-4-2 (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1135)
            • Nandini Padhi [School of Management & Commerce, School of Engineering & Technology]: CUTM546 - AQUATIC ECOLOGY, BIODIVERSITY AND DISASTER MANAGEMENT (Category: Core, Credits: 4, LTP: 3-0-2, ID: 546); CUTM533 - AQUATIC MAMMALS, REPTILES AND AMPHIBIANS (Category: Core, Credits: 4, LTP: 3-0-2, ID: 533)
            • Nihar Ranjan Kar [School of Engineering & Technology]: CUTM589 - BINOCULAR VISION &amp; SQUINT (Category: Core, Credits: 4, LTP: 3-0-2, ID: 589)
            • Nimay Chandra Giri [M.S. Swaminathan School of Agriculture, School of Engineering & Technology]: CUSK1071 - SKILL: Agrivoltaic Technology (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 1071); CUSK500 - SKILL: Solar PV Installation (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 500); CUCT858 - Certificate Course: Solar PV Installer (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 858)
            • Nirmalendu Kar - RAC [School of Engineering & Technology]: CUSK617 - SKILL - RAC Technician (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 617)
            • Parle Kalyan Chakravarthy [School of Engineering & Technology]: CUSK878 - Retail Sales (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 878)
            • Prabhat K. Patnaik [School of Engineering & Technology]: CUTM98 - Antennas Analysis &amp; Design (Category: Core, Credits: 4, LTP: 3-0-2, ID: 98)
            • Prabodh Kumar Nanda [School of Engineering & Technology]: CUDM845 - BANKING LAW AND PRACTICE (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 845); CUDM840 - ENTREPRENUERSHIP DEVELOPMENT (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 840); CUDM846 - Introduction To Banking (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 846); CUDM847 - PROFICIENCY IN ENGLISH (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 847); CUDM937 - READING TO WRITING (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 937)
            • Pradeep Kumar Sahoo [School of Engineering & Technology]: CUSK1068 - Yoga and Meditation (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 1068)
            • Pradipta Banerjee, Ph.D. [School of Engineering & Technology]: CUSK917 - Skill Course - Supercritical Carbon Dioxide Plant Operation (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 917); CUCT869 - Certificate in Supercritical Carbon Dioxide Plant Operation (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 869)
            • Prafulla Kumar Panda [School of Engineering & Technology]: ASCU2020 - Domain Track: Aerial Surveying and Remote Sensing Applications (CODE: ASCU2020) (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 326)
            • Preetha Bhadra [School of Engineering & Technology]: CUDM480 - Domain Track: Nutraceuticals (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 480); CUSK916 - Skill Course - Introduction to Nutraceuticals (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 916); CUDP914 - Diploma Track Title : Nutraceuticals (Category: Diploma, Credits: 3, LTP: 2-1-0, ID: 914)
            • Prof. Centurion Faculty Panel [School of Paramedics & Allied Health Sciences, School of Engineering & Technology, School of Management & Commerce, School of Applied Sciences]: CUFS1092 - Advance Forensic Toxicology (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1225); CUCT1007 - Advanced Electrocardiography (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1230); CUFM2350 - Advanced Managerial Accounting (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 1160); ASEC3103 - Agricultural Marketing and Trade (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1173); CUTM1825 - Anaesthesia for patients with Medical Disorders CUTM 1825 (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1109); CUBS2546 - Anatomy and Medical Physiology CUBS2546 (3+1+0 ) (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1089); CUCS1013 - Android Development with Kotlin (CUCS1013) (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1134); CUTM821 - Anesthesia for Specialty Surgeries (Category: Core, Credits: 4, LTP: 3-0-2, ID: 821); CUAI1002 - Applied Probability and Statistics for AIML (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1140); CUTM718 - Applied Radiation Physics and Radiation Protection (Category: Core, Credits: 4, LTP: 3-0-2, ID: 718); BP102 - B.Pharmacy (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1239); CUTM832 - Basic Equipment in Radiotherapy (Category: Core, Credits: 4, LTP: 3-0-2, ID: 832); CUCT1001 - Basics of Cardiac Care Technology (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1156); CUFS1007 - Basics of Forensic Psychology (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1204); CUTM1798 - Basics of ocular pharmacology (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1187); CUTM3124 - BENIFICIAL INSECT FARMING (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 1207); CUTM1796 - Binocular Vision I (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1139); CUBM2553 - BIOMEDICAL EQUIPMENT-1 (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 1154); CUBM2556 - BIOMEDICALEQUIPMENT-2 (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 1155); CUDM2508 - Computer Networks (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 1208); CUDM2501 - Deep Learning for Image Analytics (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 1202); CUBB3006 - Digital Finance (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 1179); CUTM1226 - Financial Institutions, Markets &amp; Services (MBA) (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 1180); CUDM2502 - GenAI and Prompt Engineering (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 1203); CUML1021 - Machine Learning for Predictive Analytics (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 1201); CUDM478 - Marketing Domain : B2B Marketing (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 478); CUBB3009 - Retail &amp; E-Tail Management (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 1219); CUSK1228 - Fundamentals of Civil Defense &amp; Emergency Management (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 1228); CUTM3082 - Mushroom Production Technology (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 1213); CUSK610 - SKILL - Two Wheeler Service Technology (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 610); CUSK697 - SKILL -Light Motor Vehicle Driving (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 697)
            • Prof. Dr. Jharna Majumdar [School of Engineering & Technology]: SSING222 - Domain Track : Advance Video Processing, Computer Vision and Machine Learning (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 1024)
            • Prof. Niranjan Barik [School of Engineering & Technology]: CUSK715 - DAIRY FARMING (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 715); CUSK716 - POULTRY FARMING (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 716)
            • Prof. Sangram Routray [School of Engineering & Technology - AI Track]: CUTM1602 - Artificial Intelligence, Machine Learning & Deep Learning (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 1020)
            • Prof. Sunil Kumar Jha [School of Engineering & Technology]: CUSK696 - Skill- Emergency Medical Technician (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 696); CUSK920 - SKILL: Medical Laboratory Technology (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 920); CUSK923 - SKILL: Operation Theatre Technology (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 923)
            • Radha Gobinda Pradhan [School of Engineering & Technology, School of Management & Commerce]: CUDM679 - JOB ROLE- AUTOMOTIVE SERVICE SUPERVISOR (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 679); CUDM797 - JOB ROLE- AUTOMOTIVE SERVICE TECHNICIAN (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 797); CUDM772 - JOB ROLE-Power System Technician (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 772); CUDM694 - JOB ROLE-Transformer Manufacturing (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 694); CUSK647 - SKILL- Apparel Production &amp; Marketing /IE (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 647); CUSK643 - SKILL-Transformer Manufacturing, Repairing and Maintenance (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 643)
            • Raj Kumar Mohanta [School of Engineering & Technology]: CUDP1006 - Diploma:Cloud Technology (Category: Diploma, Credits: 3, LTP: 2-1-0, ID: 1006)
            • Rajesh Sukkala [School of Engineering & Technology]: CUTM700 - Applied Equipment of Radio Diagnosis (Category: Core, Credits: 4, LTP: 3-0-2, ID: 700); CUTM213 - Basic MRI (Category: Core, Credits: 4, LTP: 3-0-2, ID: 213); CUSK924 - SKILL: X-RAY Technician (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 924); CUCT881 - Certificate in Radiology Technology (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 881); CUCT880 - Certificate in X-Ray Technology (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 880)
            • Rakesh Kumar Ray [School of Engineering & Technology]: CUDM315 - Domain Track : Software Technology (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 315)
            • Rama Prasanna Dalai [School of Engineering & Technology]: CUSK678 - SKILL: Solar PV Microgrid System (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 678); CUCT860 - Microgrid Design and Implementation (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 860)
            • RAMMOHAN PERUMALLA [School of Engineering & Technology]: CUDM632 - JOBROLE - HEMM Mechanic (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 632)
            • Rashmi Ranjan [School of Engineering & Technology]: CUTM385 - Android App Development (Category: Core, Credits: 4, LTP: 3-0-2, ID: 385)
            • Roja Mandapati [School of Engineering & Technology]: CUDP895 - Diploma-Organic Farming (Category: Diploma, Credits: 3, LTP: 2-1-0, ID: 895)
            • Saban Kumar Maharana [Centurion Center for Action Learning (CCAL), School of Engineering & Technology]: CUTM3001 - Centurion Action Learning & Production Skill Certification (Category: Skill, Credits: 4, LTP: 0-0-8, ID: 885); CUSK885 - Adobe Tools and Illustrations (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 885); CUTM539 - Animation (Category: Core, Credits: 4, LTP: 3-0-2, ID: 539); CUSK882 - Digital Painting (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 882); CUSK884 - Digital Publishing (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 884); CUCT449 - Certificate in Adobe Tools and Illustrations (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 449); CUCT744 - Certificate in Digital Painting (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 744); CUCT745 - Certificate in Digital Publishing (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 745)
            • Sagar Maitra [M.S. Swaminathan School of Agriculture]: CUDM272 - Domain Track; Smart Agriculture (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 272); CUDP875 - Diploma- Smart Agriculture (Category: Diploma, Credits: 3, LTP: 2-1-0, ID: 875)
            • Sagarika Panda [School of Engineering & Technology]: CUDM555 - Domain Track: Architectural and Structural Design (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 555)
            • Samapika Dalai [School of Engineering & Technology]: CUSK975 - Floriculturist (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 975); CUCT876 - FLORICULTURIST (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 876)
            • Sambid Swain [M.S. Swaminathan School of Agriculture]: CUDM323 - Domain Track: Intensive Aquaculture (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 323)
            • Sangram Routray [School of Engineering & Technology - CSE, School of Engineering & Technology]: CUTM1010 - Data Structures & Algorithmic Analysis (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1010); CUTM1020 - Advanced Information Security (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1020)
            • Sanjukta Mohanty [School of Engineering & Technology]: CUDM931 - Business Economics (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 931); CUDM933 - BUSINESS STATISTICS (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 933); CUDM935 - On Job Internship-I (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 935); CUDM941 - ON JOB INTERNSHIP-II (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 941)
            • Sarat Kumar Jena [School of Engineering & Technology]: CUSK816 - Web Content Development (MAMC) (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 816)
            • Satish Mondal [School of Engineering & Technology]: CUSK646 - SKILL- Pottery (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 646)
            • Satyabrata Sadangi [School of Applied Sciences]: CUTM789 - Advanced Algebra (Category: Core, Credits: 4, LTP: 3-0-2, ID: 789)
            • Shekhar Kumar Sahu [School of Engineering & Technology]: CUDM400 - Domain Track: Smart Farm Machinery (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 400)
            • Siddharth Kumar [School of Engineering & Technology]: CUSK794 - SKILL - Introduction to Block Chain Technology (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 794)
            • Sipalin Nayak [School of Engineering & Technology, School of Management & Commerce]: CUDM302 - Domain Track; Composite Design and Manufacturing (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 302); CUDM544 - Domain Track:Go To Market-Product Development (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 544); CUSK928 - Composite fabrication practice (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 928); CUCT865 - Certification Course on 3D Modeling (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 865); CUCT868 - Certification course on Product life cycle management Through Gate Process ENOVIA (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 868)
            • Smaranika Mohanta [School of Engineering & Technology]: CUDP900 - Diploma-Protected Horticulture (Category: Diploma, Credits: 3, LTP: 2-1-0, ID: 900)
            • Subhasisha Praharaj [School of Engineering & Technology]: CUCT871 - Organic farming (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 871)
            • Subhendu K. Mishra. Ph.D [School of Engineering & Technology, School of Management & Commerce]: CUTM484 - Basics of Design Thinking (Category: Core, Credits: 4, LTP: 3-0-2, ID: 484); CUDM345 - Domain Track; Agri Business Management (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 345)
            • Subhraraj Panda [School of Engineering & Technology]: CUTM153 - Bio and Biomimetic Nanomaterials (Category: Core, Credits: 4, LTP: 3-0-2, ID: 153)
            • Subrat Swain [School of Engineering & Technology]: CUSK682 - SKILL - CNC Operator (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 682); CUSK614 - SKILL - CNC Programmer (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 614)
            • SUDEEP KUMAR SINGH [School of Engineering & Technology]: CUDM343 - Domain Track: Welding and Inspection (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 343); CUCT980 - Certificate Course in CNC Programming (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 980); CUCT988 - Certificate Course in Forklift Technician (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 988); CUCT989 - Certificate Course in Heavy Vehicle Service Technology (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 989); CUCT981 - CNC Machinist (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 981); CUCT991 - LIGHT MOTOR VEHICLE DRIVER (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 991); CUDP1009 - Diploma in Welding and Inspection (Category: Diploma, Credits: 3, LTP: 2-1-0, ID: 1009)
            • Sunita Satapathy [School of Applied Sciences]: CUTM406 - Animal Physiology and Biochemistry (Category: Core, Credits: 4, LTP: 3-0-2, ID: 406); CUTM164 - Biochemistry and Metabolic Processes (Category: Core, Credits: 4, LTP: 3-0-2, ID: 164)
            • Surya Narayan Sahu [School of Engineering & Technology]: CUTM103 - Basic Electrical Engineering (Category: Core, Credits: 4, LTP: 3-0-2, ID: 103)
            • Susmita Chakrabarty [School of Paramedics & Allied Health Sciences, School of Applied Sciences, School of Engineering & Technology]: CUTM312 - Advanced Hematology (Category: Core, Credits: 4, LTP: 3-0-2, ID: 312); CUTM399 - Analytical Biochemistry (Category: Core, Credits: 4, LTP: 3-0-2, ID: 399); CUTM311 - Applied Hematology (Category: Core, Credits: 4, LTP: 3-0-2, ID: 311); CUSK1037 - SKILL: Medical Diagnostic Techniques (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 1037); CUSK911 - Skill: Phlebotomy Technology (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 911); CUCT854 - Certificate: Medical Laboratory Technician (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 854)
            • Suvendra Baliyarsingh [School of Engineering & Technology, School of Management & Commerce]: CUDM668 - Job Role:Store Keeper (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 668); CUSK674 - SKILL: Precast Concrete Manufacturing (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 674); CUSK692 - SKILL: Sewerage Treatment Plant Operation (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 692); CUSK701 - SKILL: Solid Waste Management (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 701)
            • Suvendu Kumar Nayak [School of Engineering & Technology]: CUDM542 - Domain Track : Cyber Security (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 542)
            • Swakantik Mishra [School of Engineering & Technology]: CUDM316 - Domain Track: Operation and Maintenance of Electrical Grid System &amp; Transformers (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 316); CUSK921 - Skill Course: Manufacturing and Repair of Electrical Transformer (Category: Skill, Credits: 3, LTP: 0-0-6, ID: 921); CUDP1008 - Diploma in Operation and Maintenance of Electrical Grid System &amp; Transformers (Category: Diploma, Credits: 3, LTP: 2-1-0, ID: 1008)
            • Swarna Prabha Jena [School of Engineering & Technology]: CUDM225 - Domain Track : Embedded System Design (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 225)
            • Tikina Mishra [School of Engineering & Technology]: CUTM142 - Basics Of Hydrocarbons (Category: Core, Credits: 4, LTP: 3-0-2, ID: 142)
            • Truptimayee Behera [School of Engineering & Technology]: CUTM1036 - Analog Systems and Applications (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1036)
            • U.L.Devakumar. [School of Engineering & Technology]: CUCT888 - Certificate Course on Dairy Plant Operation (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 888)
            • V.Khageswar [School of Engineering & Technology]: CUCT983 - Advanced certification for welding certification (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 983)
            • Vignesh M [School of Management & Commerce]: CUDM455 - Domain Track; CONSTRUCTION PLANNING, MONITORING AND PROJECT MANAGEMENT (Category: Domain, Credits: 4, LTP: 3-0-2, ID: 455)
            • Vishal Kumar Singh [School of Engineering & Technology]: CUCT877 - Spectral Image Processing Using Python (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 877)
            • VIVEK BARIK [School of Engineering & Technology]: CUTM1005 - Basic Epidemiology (Category: Core, Credits: 4, LTP: 3-0-2, ID: 1005); CUCT894 - Certificate in Pharmacophores (Category: Certificate, Credits: 3, LTP: 2-0-2, ID: 894)

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
        String q = query.toLowerCase().replaceAll("[^a-z0-9\\s]", " ").trim();

        // Stop words to ignore
        Set<String> stopWords = new HashSet<>(Arrays.asList(
            "who", "what", "which", "is", "are", "teaches", "teaching", "teach", "the", "a", "an", "subject", "subjects",
            "course", "courses", "faculty", "professor", "sir", "madam", "dr", "mr", "mrs", "ms", "prof", "tell", "me",
            "about", "give", "data", "exact", "anomalous", "know", "does", "do", "in", "at", "cutm", "centurion", "university"
        ));

        List<String> queryTokens = Arrays.stream(q.split("\\s+"))
            .filter(t -> t.length() >= 3 && !stopWords.contains(t))
            .collect(Collectors.toList());

        if (queryTokens.isEmpty()) return null;

        // Group courses by normalized faculty
        Map<String, List<CutmCourse>> facultyCoursesMap = new LinkedHashMap<>();
        for (CutmCourse c : allCourses) {
            String fac = c.getFaculty();
            if (fac == null || fac.trim().isEmpty() || fac.contains("Panel")) continue;
            String normalizedFac = fac.trim().replace("\\s+", " ");
            if (normalizedFac.equalsIgnoreCase("MR.MANOJ PADHI") || normalizedFac.equalsIgnoreCase("MR. MANOJ PADHI")) {
                normalizedFac = "Mr. Manoj Padhi";
            }
            facultyCoursesMap.computeIfAbsent(normalizedFac, k -> new ArrayList<>()).add(c);
        }

        Map<String, List<CutmCourse>> matchedFaculty = new LinkedHashMap<>();

        // Scoring algorithm: Prefer full name matches
        for (Map.Entry<String, List<CutmCourse>> entry : facultyCoursesMap.entrySet()) {
            String facName = entry.getKey();
            String facLower = facName.toLowerCase().replaceAll("[^a-z0-9\\s]", " ");
            List<String> facTokens = Arrays.stream(facLower.split("\\s+"))
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
        sb.append("### 🏛️ Centurion University (C.U.T.M.) Verified Faculty Intelligence\n\n");

        for (Map.Entry<String, List<CutmCourse>> entry : matchedFaculty.entrySet()) {
            String facName = entry.getKey();
            List<CutmCourse> courses = entry.getValue();
            CutmCourse first = courses.get(0);

            sb.append("**Faculty:** ").append(facName).append("\n");
            sb.append("**School / Department:** ").append(first.getDepartment() != null ? first.getDepartment() : "Centurion University").append("\n");
            Set<String> cats = courses.stream().map(CutmCourse::getCourseCategory).filter(Objects::nonNull).collect(Collectors.toSet());
            sb.append("**Specializations & Tracks:** ").append(String.join(", ", cats)).append("\n");
            sb.append("**Courses Taught (").append(courses.size()).append("):**\n");

            for (CutmCourse c : courses) {
                sb.append("• **").append(c.getCourseCode()).append("**: ").append(c.getCourseTitle());
                if (c.getCredits() != null) sb.append(" (").append(c.getCredits()).append(" Credits, LTP: ").append(c.getLtp()).append(")");
                if (c.getCoursewareId() != null) {
                    sb.append(" — [🌐 Courseware #").append(c.getCoursewareId()).append("](https://courseware.cutm.ac.in/course/").append(c.getCoursewareId()).append(")");
                }
                sb.append("\n");
            }
            sb.append("\n");
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
                sb.append("### 📚 C.U.T.M. Courseware Intelligence: ").append(c.getCourseCode()).append(" — ").append(c.getCourseTitle()).append("\n\n");
                sb.append("• **Faculty Instructor:** ").append(fac).append("\n");
                sb.append("• **Academic School:** ").append(c.getDepartment() != null ? c.getDepartment() : "School of Engineering & Technology").append("\n");
                sb.append("• **CBCS Basket:** ").append(c.getBasketName() != null ? c.getBasketName() : "University Basket").append("\n");
                sb.append("• **Category:** ").append(c.getCourseCategory() != null ? c.getCourseCategory() : "Core").append("\n");
                if (c.getCredits() != null) {
                    sb.append("• **Credits & LTP:** ").append(c.getCredits()).append(" Credits (LTP: ").append(c.getLtp()).append(")\n");
                }
                if (c.getCoursewareUrl() != null) {
                    sb.append("• **Official Courseware Portal:** [🌐 View Session Plans & Lessons]( ").append(c.getCoursewareUrl()).append(" )\n");
                }
                if (c.getDescription() != null && !c.getDescription().isEmpty()) {
                    sb.append("• **Description:** ").append(c.getDescription()).append("\n");
                }
                if (c.getPrerequisites() != null && !c.getPrerequisites().isEmpty()) {
                    sb.append("• **Prerequisites:** ").append(c.getPrerequisites()).append("\n");
                }
                return sb.toString().trim();
            }
        }

        return null;
    }
}
