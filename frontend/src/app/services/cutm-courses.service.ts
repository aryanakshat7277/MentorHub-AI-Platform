import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface CutmModule {
  moduleNumber: number;
  moduleTitle: string;
  topics: string;
  practicalLabWork: string;
  vivaQuestions: string;
}

export interface CutmCourse {
  id: number;
  courseCode: string;
  courseTitle: string;
  basketCategory: 'BASKET_I' | 'BASKET_II' | 'BASKET_III' | 'BASKET_IV' | 'BASKET_V';
  basketName: string;
  courseCategory?: string; // Core, Domain, Skill, Certificate, Advanced Certificate, Diploma
  coursewareId?: number;
  coursewareUrl?: string;
  faculty?: string;
  credits: number;
  ltp: string;
  department: string;
  semester: string;
  description: string;
  prerequisites: string;
  modulesJson: string;
  modules?: CutmModule[];
  isBookmarked?: boolean;
  completedModules?: number[];
}

export interface CoursewareCategorySummary {
  category: string;
  name: string;
  shortLabel: string;
  icon: string;
  color: string;
  badgeBg: string;
  courseCount: number;
  description: string;
}

export interface BasketSummary {
  category: string;
  name: string;
  shortLabel: string;
  code: string;
  icon: string;
  color: string;
  courseCount: number;
  totalCredits: number;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class CutmCoursesService {
  private apiUrl = 'http://localhost:8080/api/cutm-courses';

  private coursesSubject = new BehaviorSubject<CutmCourse[]>([]);
  public courses$ = this.coursesSubject.asObservable();

  public isCloudSynced$ = new BehaviorSubject<boolean>(false);

  // Complete In-Browser Dataset for 100% Offline / GitHub Pages Availability
  private defaultCourses: CutmCourse[] = [
    // BASKET I: FOUNDATION COURSES
    {
      id: 1,
      courseCode: 'CUTM1001',
      courseTitle: 'Applied Mathematics & Engineering Statistics',
      basketCategory: 'BASKET_I',
      basketName: 'Basket I: Foundation Courses (AECC)',
      credits: 4,
      ltp: '3-1-0',
      department: 'School of Engineering & Technology - Applied Sciences',
      semester: 'Semester I',
      description: 'Rigorous mathematical foundations for computational engineering: linear algebra, multivariable calculus, differential equations, Fourier transforms, and Bayesian statistical distributions.',
      prerequisites: 'Higher Secondary Mathematics (Calculus & Vectors)',
      modulesJson: '',
      modules: [
        {
          moduleNumber: 1,
          moduleTitle: 'Linear Algebra & Matrix Decompositions',
          topics: 'Vector spaces, linear independence, basis and dimension, eigenvalues and eigenvectors, Diagonalization, Singular Value Decomposition (SVD), Principal Component Analysis (PCA) foundations.',
          practicalLabWork: 'MATLAB/Python numerical matrix factorizations, eigen-spectrum analysis.',
          vivaQuestions: 'Explain the geometric intuition of Eigenvalues and why SVD is used in data dimensionality reduction.'
        },
        {
          moduleNumber: 2,
          moduleTitle: 'Differential Calculus & Vector Fields',
          topics: 'Partial derivatives, Jacobian and Hessian matrices, Taylor series for multivariable functions, Lagrange multipliers for constrained optimization, Gradient vector fields, divergence and curl.',
          practicalLabWork: 'Numerical gradient descent simulation and contour surface plotting in Python.',
          vivaQuestions: 'How does the Hessian matrix determine local saddle points in non-convex optimization functions?'
        },
        {
          moduleNumber: 3,
          moduleTitle: 'Ordinary & Partial Differential Equations',
          topics: 'First and second order ODEs with constant coefficients, Euler-Cauchy equations, Laplace transforms and applications to circuit analysis, Heat equation, Wave equation, Laplace equation solutions.',
          practicalLabWork: 'Numerical ODE solving with Runge-Kutta 4th order algorithms.',
          vivaQuestions: 'Derive the Laplace transform of a unit step function and explain its utility in system transfer functions.'
        },
        {
          moduleNumber: 4,
          moduleTitle: 'Probability Distributions & Random Variables',
          topics: 'Axioms of probability, Conditional probability and Bayes theorem, Discrete (Binomial, Poisson) and Continuous (Gaussian Normal, Exponential) distributions, Central Limit Theorem, Joint probability density.',
          practicalLabWork: 'Monte Carlo simulation of Poisson arrival rates and Central Limit convergence.',
          vivaQuestions: 'State the Central Limit Theorem and prove why real-world noise defaults to a Gaussian distribution.'
        },
        {
          moduleNumber: 5,
          moduleTitle: 'Statistical Inference & Hypothesis Testing',
          topics: 'Point and interval estimation, Maximum Likelihood Estimation (MLE), Hypothesis testing: Null vs Alternative hypothesis, p-values, z-test, t-test, Chi-square test for independence, ANOVA.',
          practicalLabWork: 'A/B test statistical significance calculator in Python using SciPy.',
          vivaQuestions: 'What is the relationship between Type I error (alpha) and Type II error (beta) in statistical hypothesis testing?'
        }
      ]
    },
    {
      id: 2,
      courseCode: 'CUTM1002',
      courseTitle: 'Quantum & Semiconductor Physics for Computing',
      basketCategory: 'BASKET_I',
      basketName: 'Basket I: Foundation Courses (AECC)',
      credits: 4,
      ltp: '3-0-2',
      department: 'School of Engineering & Technology - Applied Sciences',
      semester: 'Semester I',
      description: 'Physical principles underlying modern microelectronics and quantum computing: wave-particle duality, Schrodinger equation, energy band theory, p-n junction physics, and qubit superposition.',
      prerequisites: 'Basic Physics (Electromagnetism & Modern Physics)',
      modulesJson: '',
      modules: [
        {
          moduleNumber: 1,
          moduleTitle: 'Wave Mechanics & Quantum Postulates',
          topics: 'De Broglie hypothesis, Heisenberg uncertainty principle, wave packet, Time-dependent and time-independent Schrodinger equation, Particle in a 1D potential well, Quantum tunneling.',
          practicalLabWork: 'Simulation of quantum wave packets tunneling through finite potential barriers.',
          vivaQuestions: 'Explain the physical mechanism of quantum tunneling and its impact on sub-3nm transistor leakage.'
        },
        {
          moduleNumber: 2,
          moduleTitle: 'Semiconductor Band Theory & Fermi Energy',
          topics: 'Kronig-Penney model, Brillouin zones, Direct vs Indirect bandgap semiconductors, Intrinsic and extrinsic carrier concentrations, Fermi-Dirac statistics, Fermi energy level temperature dependence.',
          practicalLabWork: 'Hall effect measurement to determine semiconductor carrier type and mobility.',
          vivaQuestions: 'Why do direct bandgap semiconductors emit light efficiently whereas indirect bandgap semiconductors require phonon assistance?'
        },
        {
          moduleNumber: 3,
          moduleTitle: 'Junction Physics & Optoelectronics',
          topics: 'p-n junction under equilibrium and bias, Depletion region width, Built-in potential, I-V characteristics, Zener and avalanche breakdown, Photodiodes, Solar cells, LEDs and semiconductor lasers.',
          practicalLabWork: 'V-I characterization of silicon diode, Zener diode, and laser diode threshold currents.',
          vivaQuestions: 'Differentiate between Zener breakdown and Avalanche breakdown in heavily doped junctions.'
        },
        {
          moduleNumber: 4,
          moduleTitle: 'Nanomaterials & Quantum Wells',
          topics: 'Quantum confinement, Quantum wells, Quantum wires, Quantum dots, 2D materials (Graphene, MoS2), Carbon nanotubes, Density of states in low-dimensional systems.',
          practicalLabWork: 'Spectroscopic measurement of quantum dot emission spectra vs nanoparticle size.',
          vivaQuestions: 'How does the density of states function change from bulk 3D material to 0D quantum dots?'
        },
        {
          moduleNumber: 5,
          moduleTitle: 'Foundations of Quantum Information & Qubits',
          topics: 'Bloch sphere representation, Qubit states, Quantum superposition, Quantum entanglement, Bell states, Quantum logic gates (Pauli X, Y, Z, Hadamard, CNOT), No-cloning theorem.',
          practicalLabWork: 'Qiskit quantum circuit simulator: Bell state preparation and entanglement measurement.',
          vivaQuestions: 'State the No-Cloning Theorem and explain why quantum states cannot be copied like classical bits.'
        }
      ]
    },
    {
      id: 3,
      courseCode: 'CUTM1003',
      courseTitle: 'Technical Communication & Executive Socratic Rhetoric',
      basketCategory: 'BASKET_I',
      basketName: 'Basket I: Foundation Courses (AECC)',
      credits: 3,
      ltp: '2-0-2',
      department: 'School of Management & Humanities',
      semester: 'Semester I',
      description: 'Mastery of executive technical communication, academic paper writing, engineering design documentation, Socratic debate, and cross-cultural technical leadership.',
      prerequisites: 'English Language Proficiency',
      modulesJson: '',
      modules: [
        {
          moduleNumber: 1,
          moduleTitle: 'Principles of Engineering Communication',
          topics: 'Clarity, conciseness, precision in technical writing, Audience analysis, Technical memorandum, Engineering change proposals (ECPs), Request for Proposals (RFPs).',
          practicalLabWork: 'Drafting an Enterprise Architecture Decision Record (ADR) for a distributed cloud migration.',
          vivaQuestions: 'What are the indispensable sections of an Architecture Decision Record (ADR)?'
        },
        {
          moduleNumber: 2,
          moduleTitle: 'Technical Documentation & API Specifications',
          topics: 'Writing developer documentation, OpenAPI / Swagger specifications, README engineering best practices, Release notes, Runbooks and post-mortem incident documentation.',
          practicalLabWork: 'Authoring a production-grade OpenAPI 3.0 YAML specification for a REST microservice.',
          vivaQuestions: 'Explain the difference between reference documentation and conceptual user guides in software engineering.'
        },
        {
          moduleNumber: 3,
          moduleTitle: 'Socratic Technical Defense & Oral Presentation',
          topics: 'Structure of oral thesis defense, Handling confrontational reviewer questions, Rhetorical frameworks (Aristotelian ethos, logos, pathos), Elevator pitch for technical investors.',
          practicalLabWork: 'Delivering a 3-minute oral pitch of a software architecture before an AI examiner panel.',
          vivaQuestions: 'How do you address a direct critique during an oral examination when the reviewer\'s premise is incorrect?'
        },
        {
          moduleNumber: 4,
          moduleTitle: 'Research Paper Synthesis & Academic Integrity',
          topics: 'Literature review methodologies, IEEE / ACM paper formatting, Citation standards (BibTeX, APA), Avoiding plagiarism, Intellectual property attribution, Peer review workflows.',
          practicalLabWork: 'Formatting a LaTeX IEEE-style research paper with structured BibTeX references.',
          vivaQuestions: 'Why is self-plagiarism considered an academic integrity violation in peer-reviewed publications?'
        }
      ]
    },
    {
      id: 4,
      courseCode: 'CUTM1004',
      courseTitle: 'Environmental Sustainability & Green Computing',
      basketCategory: 'BASKET_I',
      basketName: 'Basket I: Foundation Courses (AECC)',
      credits: 2,
      ltp: '2-0-0',
      department: 'School of Applied Sciences',
      semester: 'Semester II',
      description: 'Ecological systems, carbon footprint of hyperscale data centers, energy-efficient algorithmic design, e-waste lifecycle management, and sustainable technology governance.',
      prerequisites: 'Basic Environmental Sciences',
      modulesJson: '',
      modules: [
        {
          moduleNumber: 1,
          moduleTitle: 'Ecosystems & Planetary Boundaries',
          topics: 'Biogeochemical cycles, Biodiversity loss, Climate change mechanisms, Greenhouse gas emissions, Carbon accounting scopes (Scope 1, 2, 3), UN Sustainable Development Goals (SDGs).',
          practicalLabWork: 'Calculating personal and departmental carbon equivalent emission indices.',
          vivaQuestions: 'Differentiate between Scope 1, Scope 2, and Scope 3 carbon emissions in technology organizations.'
        },
        {
          moduleNumber: 2,
          moduleTitle: 'Data Center Energetics & Green Cloud',
          topics: 'Power Usage Effectiveness (PUE), Water Usage Effectiveness (WUE), Hyperscale cooling systems, Renewable energy microgrids, Server virtualization efficiency, Carbon-aware workload scheduling.',
          practicalLabWork: 'Simulating carbon-aware workload distribution across geographically distributed cloud data centers.',
          vivaQuestions: 'What is Power Usage Effectiveness (PUE) and how does free-air cooling reduce data center carbon footprint?'
        },
        {
          moduleNumber: 3,
          moduleTitle: 'Energy-Efficient Algorithmic Design',
          topics: 'Algorithmic energy consumption, CPU instruction energy profiles, Memory access power penalties, Tradeoffs between computational precision and power (Approximate computing).',
          practicalLabWork: 'Benchmarking CPU energy consumption across iterative vs recursive algorithms using hardware RAPL meters.',
          vivaQuestions: 'How do memory access operations consume up to 100x more power than register arithmetic operations?'
        },
        {
          moduleNumber: 4,
          moduleTitle: 'E-Waste Lifecycle & Circular Economy',
          topics: 'Electronic waste generation metrics, Hazardous materials in computing hardware (lead, mercury, cadmium), Circular manufacturing, WEEE directives, Responsible recycling protocols.',
          practicalLabWork: 'Designing an e-waste audit checklist for an enterprise software engineering campus.',
          vivaQuestions: 'Explain the core tenets of the Circular Economy model applied to IT hardware depreciation and recycling.'
        }
      ]
    },

    // BASKET II: CORE ENGINEERING COURSES
    {
      id: 5,
      courseCode: 'CUTM1010',
      courseTitle: 'Data Structures & Algorithmic Analysis',
      basketCategory: 'BASKET_II',
      basketName: 'Basket II: Core Engineering (PCC)',
      credits: 4,
      ltp: '3-0-2',
      department: 'School of Engineering & Technology - CSE',
      semester: 'Semester III',
      description: 'Foundational data structures, abstract data types, asymptotic complexity analysis (Big-O, Big-Omega, Big-Theta), balanced search trees, graph algorithms, and dynamic programming.',
      prerequisites: 'Programming for Problem Solving (C / Java)',
      modulesJson: '',
      modules: [
        {
          moduleNumber: 1,
          moduleTitle: 'Asymptotic Complexity, Arrays & Linked Structures',
          topics: 'Asymptotic analysis: Big-O, Omega, Theta, Master Theorem, Amortized complexity, Dynamic arrays, Singly, doubly, and circular linked lists, Skip lists, Two-pointer algorithms.',
          practicalLabWork: 'Implementation of generic dynamic array list and memory-efficient unrolled linked list in Java.',
          vivaQuestions: 'Prove the time complexity of dynamic array resizing using the aggregate method of amortized analysis.'
        },
        {
          moduleNumber: 2,
          moduleTitle: 'Stacks, Queues & Priority Queues',
          topics: 'Stack ADT, Monotonic stack, Infix to postfix conversion, Queue ADT, Circular queue, Deque, Priority Queue ADT, Binary heaps, Heapify in O(N) time, Heapsort.',
          practicalLabWork: 'Implementation of sliding window maximum using Monotonic Deque in O(N) time.',
          vivaQuestions: 'Why does building a binary heap take O(N) time when inserting N elements takes O(N log N)?'
        },
        {
          moduleNumber: 3,
          moduleTitle: 'Trees & Balanced Search Structures',
          topics: 'Binary Tree traversals (Inorder, Preorder, Postorder, Level-order), Binary Search Trees (BST), AVL Trees (Rotations: LL, RR, LR, RL), Red-Black Tree invariants, B-Trees and B+ Trees for database storage.',
          practicalLabWork: 'Implementation of AVL Tree with self-balancing rotation mechanics.',
          vivaQuestions: 'Explain why B+ Trees are preferred over Red-Black Trees for filesystem and database disk indexing.'
        },
        {
          moduleNumber: 4,
          moduleTitle: 'Hashing, Sets & Disjoint-Set Union (DSU)',
          topics: 'Hash tables, Hash functions, Collision resolution: Chaining vs Open Addressing (Linear probing, Quadratic probing, Double hashing), Universal hashing, Bloom filters, Union-Find with path compression.',
          practicalLabWork: 'Building a high-throughput Robin Hood hashing table with linear probing.',
          vivaQuestions: 'How does path compression combined with union by rank reduce Disjoint-Set operations to near-constant inverse Ackermann time?'
        },
        {
          moduleNumber: 5,
          moduleTitle: 'Graph Algorithms & Dynamic Programming',
          topics: 'Graph representations, BFS, DFS, Topological sort (Kahn\'s algorithm), Shortest paths: Dijkstra, Bellman-Ford, Floyd-Warshall, Minimum Spanning Trees: Prim\'s & Kruskal\'s, DP: 0/1 Knapsack, LCS, LIS.',
          practicalLabWork: 'Dijkstra\'s shortest path implementation with Fibonacci heap priority queue.',
          vivaQuestions: 'Explain the conditions under which Dijkstra\'s algorithm fails and Bellman-Ford must be employed.'
        }
      ]
    },
    {
      id: 6,
      courseCode: 'CUTM1011',
      courseTitle: 'Enterprise Java 21 & Object-Oriented Systems',
      basketCategory: 'BASKET_II',
      basketName: 'Basket II: Core Engineering (PCC)',
      credits: 4,
      ltp: '3-0-2',
      department: 'School of Engineering & Technology - CSE',
      semester: 'Semester III',
      description: 'Advanced modern Java 21: Virtual Threads (Project Loom), Pattern Matching, Records, Sealed Classes, Functional Interfaces, Stream API, Concurrency, and JVM Garbage Collection internals.',
      prerequisites: 'Basic Object-Oriented Concepts',
      modulesJson: '',
      modules: [
        {
          moduleNumber: 1,
          moduleTitle: 'Modern Java 21 Language Innovations',
          topics: 'Records, Sealed interfaces, Pattern matching for switch, Record patterns, String templates, Scoped values, Sequenced collections, Modern memory layouts.',
          practicalLabWork: 'Refactoring legacy JavaBean DTO hierarchies into immutable Java 21 Records and Sealed class trees.',
          vivaQuestions: 'Explain how Sealed Classes improve type safety and enable exhaustive pattern matching without default clauses.'
        },
        {
          moduleNumber: 2,
          moduleTitle: 'Functional Programming & Stream API',
          topics: 'Lambda calculus, Functional interfaces (Function, Predicate, Consumer, Supplier), Stream creation, intermediate vs terminal operations, Parallel streams, Custom Collectors, Spliterators.',
          practicalLabWork: 'Building high-throughput data pipelines using custom Stream Collectors and groupingBy operations.',
          vivaQuestions: 'Why should parallel streams be avoided for I/O-bound tasks in standard ForkJoinPool configurations?'
        },
        {
          moduleNumber: 3,
          moduleTitle: 'Virtual Threads & Concurrency (Project Loom)',
          topics: 'Platform threads vs Virtual threads, Continuation-based coroutines, Thread carrier model, Eliminating reactive callback hell, Structured Concurrency, ScopedValue vs ThreadLocal.',
          practicalLabWork: 'Benchmarking 100,000 concurrent HTTP requests using Java 21 VirtualThreadPerTaskExecutor.',
          vivaQuestions: 'How do Virtual Threads decouple thread creation from OS kernel threads without incurring pinning issues?'
        },
        {
          moduleNumber: 4,
          moduleTitle: 'Advanced I/O, NIO.2 & Network Sockets',
          topics: 'Java NIO.2, ByteBuffer, Channels, Selectors, Asynchronous file channels, Non-blocking network sockets, Serialization vs binary protocols (Protobuf, FlatBuffers).',
          practicalLabWork: 'Writing a non-blocking TCP chat server using Java NIO Selectors and ByteBuffers.',
          vivaQuestions: 'Explain the role of the Selector component in Java NIO and how it allows a single thread to manage thousands of open sockets.'
        },
        {
          moduleNumber: 5,
          moduleTitle: 'JVM Architecture, Classloaders & Garbage Collection',
          topics: 'JVM memory layout (Heap, Metaspace, Stack), ClassLoader hierarchy, Garbage collection algorithms (Serial, Parallel, G1, ZGC, Shenandoah), JIT compilation (C1, C2), Bytecode analysis.',
          practicalLabWork: 'Profiling JVM heap dumps, memory leaks, and GC pause times using VisualVM and JConsole.',
          vivaQuestions: 'How does the Z Garbage Collector (ZGC) achieve sub-millisecond maximum pause times regardless of heap size?'
        }
      ]
    },
    {
      id: 7,
      courseCode: 'CUTM1012',
      courseTitle: 'Database Systems, SQL & Transactional Integrity',
      basketCategory: 'BASKET_II',
      basketName: 'Basket II: Core Engineering (PCC)',
      credits: 4,
      ltp: '3-0-2',
      department: 'School of Engineering & Technology - CSE',
      semester: 'Semester IV',
      description: 'Relational data modeling, advanced SQL, relational algebra, functional dependencies, normal forms (1NF to BCNF), ACID transaction concurrency, WAL, and index optimization.',
      prerequisites: 'Data Structures & Algorithms',
      modulesJson: '',
      modules: [
        {
          moduleNumber: 1,
          moduleTitle: 'Relational Algebra & Conceptual Modeling',
          topics: 'Entity-Relationship (ER) model, Extended ER, Relational model concepts, Relational algebra operators: Select, Project, Join (Theta, Equi, Natural, Outer), Set operations, Tuple relational calculus.',
          practicalLabWork: 'Designing normalized ER schemas in dbdiagram.io and translating to DDL schema scripts.',
          vivaQuestions: 'Explain the difference between Tuple Relational Calculus and Relational Algebra in formal database theory.'
        },
        {
          moduleNumber: 2,
          moduleTitle: 'Advanced SQL, Window Functions & Triggers',
          topics: 'Complex joins, Correlated subqueries, Window functions (ROW_NUMBER, RANK, DENSE_RANK, LEAD, LAG), Common Table Expressions (CTEs), Recursive CTEs, Stored procedures, Triggers, Views.',
          practicalLabWork: 'Writing analytical SQL queries using window functions and recursive CTEs for hierarchical tree traversal.',
          vivaQuestions: 'Differentiate between RANK() and DENSE_RANK() window functions when duplicate values occur.'
        },
        {
          moduleNumber: 3,
          moduleTitle: 'Functional Dependencies & Normalization',
          topics: 'Functional dependencies, Armstrong\'s axioms, Closure of attributes, Canonical cover, 1NF, 2NF, 3NF, Boyce-Codd Normal Form (BCNF), Dependency preservation, Lossless-join decomposition.',
          practicalLabWork: 'Algorithmic verification of functional dependency closures and 3NF decomposition in Python.',
          vivaQuestions: 'Prove that any relation with two attributes is always in BCNF.'
        },
        {
          moduleNumber: 4,
          moduleTitle: 'ACID Transactions & Concurrency Control',
          topics: 'ACID properties, Transaction states, Schedule serializability (Conflict vs View serializability), Lock-based protocols (2PL, Strict 2PL), Deadlock prevention and detection, Timestamp ordering, MVCC.',
          practicalLabWork: 'Demonstrating dirty reads, non-repeatable reads, and phantom reads across isolation levels in PostgreSQL.',
          vivaQuestions: 'How does Multi-Version Concurrency Control (MVCC) eliminate read-write locking contention in modern databases?'
        },
        {
          moduleNumber: 5,
          moduleTitle: 'Storage Engine, Indexing & Query Optimization',
          topics: 'File organization, Clustered vs Non-clustered indexing, B+ Tree index structures, Hash indexes, Query processing pipeline, Cost-based query optimization, EXPLAIN plan analysis, Vacuuming.',
          practicalLabWork: 'Analyzing and optimizing slow queries using EXPLAIN ANALYZE, composite indexes, and partial indexes.',
          vivaQuestions: 'Explain the structural mechanics of a B+ Tree index insertion when a leaf node overflows.'
        }
      ]
    },
    {
      id: 8,
      courseCode: 'CUTM1013',
      courseTitle: 'Operating Systems, Kernel Internals & Linux POSIX',
      basketCategory: 'BASKET_II',
      basketName: 'Basket II: Core Engineering (PCC)',
      credits: 4,
      ltp: '3-0-2',
      department: 'School of Engineering & Technology - CSE',
      semester: 'Semester IV',
      description: 'Kernel architecture, process lifecycle, CPU scheduling, synchronization primitives, deadlock avoidance, virtual memory paging, Linux VFS, and POSIX system call programming.',
      prerequisites: 'Computer Organization & C Programming',
      modulesJson: '',
      modules: [
        {
          moduleNumber: 1,
          moduleTitle: 'Operating System Structures & System Calls',
          topics: 'Dual-mode operation (User mode vs Kernel mode), Interrupts, Trap handlers, Context switching, System call interface, Monolithic kernels vs Microkernels, Linux boot sequence.',
          practicalLabWork: 'Writing C programs interfacing with POSIX system calls: fork(), exec(), waitpid(), pipe().',
          vivaQuestions: 'What precise hardware and register operations occur during a context switch between two user processes?'
        },
        {
          moduleNumber: 2,
          moduleTitle: 'Process & Thread Concurrency & Synchronization',
          topics: 'Process Control Block (PCB), Thread models, Critical Section Problem, Peterson\'s solution, Hardware atomic instructions (TestAndSet, CAS), Mutex locks, Semaphores, Monitors, Classical synchronization problems.',
          practicalLabWork: 'Solving the Dining Philosophers and Reader-Writer problems using POSIX pthread mutexes and semaphores.',
          vivaQuestions: 'Explain why Peterson\'s algorithm requires memory barriers on modern out-of-order CPU architectures.'
        },
        {
          moduleNumber: 3,
          moduleTitle: 'CPU Scheduling & Deadlock Dynamics',
          topics: 'Preemptive vs Non-preemptive scheduling: FCFS, SJF, Round Robin, Priority Scheduling, Multi-Level Feedback Queue (MLFQ), Linux CFS scheduler, Deadlock conditions, Banker\'s algorithm, Deadlock detection.',
          practicalLabWork: 'Simulation of Multi-Level Feedback Queue (MLFQ) scheduler with dynamic aging in C.',
          vivaQuestions: 'State the four Coffman conditions necessary for a deadlock to exist in a concurrent operating system.'
        },
        {
          moduleNumber: 4,
          moduleTitle: 'Virtual Memory Management & Paging',
          topics: 'Contiguous memory allocation, Paging, Page tables, Multi-level page tables, Inverted page tables, Translation Lookaside Buffer (TLB), Page replacement algorithms (FIFO, LRU, Clock algorithm), Thrashing.',
          practicalLabWork: 'Implementation of an LRU page replacement cache with TLB hit/miss profiling.',
          vivaQuestions: 'How does Translation Lookaside Buffer (TLB) reach hit rates of 99% and what happens during a TLB shootdown?'
        },
        {
          moduleNumber: 5,
          moduleTitle: 'File Systems & Storage Architecture',
          topics: 'File attributes, Directory structures, Inodes, File allocation methods (Contiguous, Linked, Indexed), Free space management, Linux Virtual File System (VFS), Journaling file systems (ext4), Disk scheduling (SCAN, C-SCAN).',
          practicalLabWork: 'Parsing raw Linux ext4 Inode structures and directory entries using C binary streams.',
          vivaQuestions: 'Explain the internal layout of an ext4 Inode and how direct, indirect, and triple-indirect blocks resolve large files.'
        }
      ]
    },
    {
      id: 9,
      courseCode: 'CUTM1014',
      courseTitle: 'Computer Networks & Distributed Cloud Protocols',
      basketCategory: 'BASKET_II',
      basketName: 'Basket II: Core Engineering (PCC)',
      credits: 4,
      ltp: '3-0-2',
      department: 'School of Engineering & Technology - CSE',
      semester: 'Semester V',
      description: 'Physical to application layer protocols: Ethernet, IPv4/IPv6, CIDR subnetting, BGP/OSPF routing, TCP flow & congestion control, TLS 1.3 handshake, DNS, HTTP/2, HTTP/3, and WebSockets.',
      prerequisites: 'Operating Systems',
      modulesJson: '',
      modules: [
        {
          moduleNumber: 1,
          moduleTitle: 'Layering Models & Data Link Protocols',
          topics: 'OSI 7-layer vs TCP/IP model, Framing, Error detection: CRC checksum, Flow control: Sliding window, Stop-and-wait, HDLC, Ethernet IEEE 802.3, MAC addressing, CSMA/CD, VLANs, ARP.',
          practicalLabWork: 'Packet sniffing and frame header disassembly using Wireshark and raw sockets.',
          vivaQuestions: 'Explain how the Address Resolution Protocol (ARP) resolves IP addresses to MAC addresses and how ARP poisoning occurs.'
        },
        {
          moduleNumber: 2,
          moduleTitle: 'Network Layer, Addressing & Routing',
          topics: 'IPv4 vs IPv6 header structures, CIDR subnetting, NAT, ICMP, Routing algorithms: Distance Vector (RIP), Link State (OSPF), Path Vector (BGP), Software-Defined Networking (SDN) concepts.',
          practicalLabWork: 'Configuring multi-subnet topologies with CIDR routing and NAT masquerading in Cisco Packet Tracer.',
          vivaQuestions: 'How does the Border Gateway Protocol (BGP) prevent routing loops across autonomous systems (AS)?'
        },
        {
          moduleNumber: 3,
          moduleTitle: 'Transport Layer: TCP & UDP Mechanics',
          topics: 'UDP header & use-cases, TCP header, 3-way handshake, 4-way teardown, Flow control (Sliding window), Congestion control algorithms: Tahoe, Reno, BBR, Congestion avoidance, Fast retransmit.',
          practicalLabWork: 'TCP connection profiling: plotting throughput vs window size during simulated network packet loss.',
          vivaQuestions: 'Walk through the TCP 3-way handshake and describe how initial sequence numbers (ISN) prevent replay attacks.'
        },
        {
          moduleNumber: 4,
          moduleTitle: 'Application Layer & Modern Web Protocols',
          topics: 'DNS hierarchy and recursive lookup, HTTP/1.1 vs HTTP/2 (Multiplexing, Header compression HPACK), HTTP/3 over QUIC (UDP), WebSocket bidirectional full-duplex protocol, SMTP, FTP.',
          practicalLabWork: 'Capturing and comparing HTTP/1.1 pipelining vs HTTP/2 multiplexed streams over TLS.',
          vivaQuestions: 'Why does HTTP/3 replace TCP with QUIC over UDP, and how does it solve head-of-line blocking?'
        },
        {
          moduleNumber: 5,
          moduleTitle: 'Network Security, Cryptography & Firewalls',
          topics: 'Symmetric vs Asymmetric cryptography, Diffie-Hellman key exchange, TLS 1.3 cryptographic handshake, Digital certificates (X.509), Stateful packet inspection firewalls, DDoS mitigation.',
          practicalLabWork: 'Configuring an Nginx reverse proxy with TLS 1.3, Let\'s Encrypt certificates, and rate limiting.',
          vivaQuestions: 'Detail the cryptographic steps of the TLS 1.3 handshake and explain how 0-RTT session resumption functions.'
        }
      ]
    },
    {
      id: 10,
      courseCode: 'CUTM1015',
      courseTitle: 'Compiler Design & Formal Automata Theory',
      basketCategory: 'BASKET_II',
      basketName: 'Basket II: Core Engineering (PCC)',
      credits: 4,
      ltp: '3-1-0',
      department: 'School of Engineering & Technology - CSE',
      semester: 'Semester V',
      description: 'Theoretical computer science meets practical compiler construction: Regular expressions, DFA/NFA conversion, Context-Free Grammars, LL/LR parsers, ASTs, intermediate representation, and machine code generation.',
      prerequisites: 'Discrete Mathematics & Data Structures',
      modulesJson: '',
      modules: [
        {
          moduleNumber: 1,
          moduleTitle: 'Regular Languages & Finite State Automata',
          topics: 'Chomsky hierarchy, Regular languages, DFA, NFA, NFA to DFA subset construction, DFA minimization (Myhill-Nerode theorem), Lexical analyzer generators (Lex / Flex).',
          practicalLabWork: 'Writing a lexical analyzer for a subset of C using Lex/Flex to tokenize identifiers, operators, and literals.',
          vivaQuestions: 'State the Myhill-Nerode theorem and explain how it determines the minimum number of states in a DFA.'
        },
        {
          moduleNumber: 2,
          moduleTitle: 'Context-Free Grammars & Top-Down Parsing',
          topics: 'Context-Free Grammars (CFG), Ambiguity elimination, Left recursion removal, Left factoring, FIRST and FOLLOW sets, LL(1) parsing tables, Recursive descent parsers.',
          practicalLabWork: 'Constructing a recursive descent parser with error recovery for mathematical arithmetic expressions.',
          vivaQuestions: 'What grammatical property causes an LL(1) parser conflict, and how does left-factoring resolve it?'
        },
        {
          moduleNumber: 3,
          moduleTitle: 'Bottom-Up Parsing & Parser Generators (Yacc/Bison)',
          topics: 'Shift-reduce parsing, LR(0) items, SLR(1) parsing tables, Canonical LR(1) parsing, LALR(1) parsing tables, Conflict resolution (Shift-Reduce, Reduce-Reduce), Yacc / Bison implementation.',
          practicalLabWork: 'Building a complete compiler frontend using Bison to parse custom domain-specific language statements.',
          vivaQuestions: 'Explain the difference between LR(1) and LALR(1) parsers in terms of state space and conflict emergence.'
        },
        {
          moduleNumber: 4,
          moduleTitle: 'Semantic Analysis & Intermediate Representation (IR)',
          topics: 'Syntax-Directed Definitions (SDD), S-attributed vs L-attributed definitions, Abstract Syntax Trees (AST), Symbol tables, Type checking, Three-Address Code (TAC), Static Single Assignment (SSA) form.',
          practicalLabWork: 'Generating Three-Address Code (TAC) and constructing SSA form from AST expression nodes.',
          vivaQuestions: 'Why is Static Single Assignment (SSA) form universally utilized in optimizing compilers like LLVM and HotSpot?'
        },
        {
          moduleNumber: 5,
          moduleTitle: 'Code Optimization & Target Code Generation',
          topics: 'Basic blocks, Control Flow Graphs (CFG), Loop optimization: loop unrolling, invariant code motion, Common subexpression elimination, Register allocation (Graph coloring), Instruction selection.',
          practicalLabWork: 'Implementing dead code elimination and constant folding passes on an intermediate representation tree.',
          vivaQuestions: 'Explain Chaitin\'s graph coloring algorithm for register allocation and how register spilling is handled.'
        }
      ]
    },

    // BASKET III: DOMAIN ELECTIVES
    {
      id: 11,
      courseCode: 'CUTM1601',
      courseTitle: 'Cloud Computing & Microservices Architecture',
      basketCategory: 'BASKET_III',
      basketName: 'Basket III: Domain Specializations (PEC)',
      credits: 4,
      ltp: '3-0-2',
      department: 'School of Engineering & Technology - Cloud Track',
      semester: 'Semester VI',
      description: 'Enterprise distributed systems: 12-factor apps, Spring Boot 3 microservices, Docker containerization, Kubernetes orchestration, Service Mesh (Istio), API Gateway, Distributed Tracing, and Kafka event streaming.',
      prerequisites: 'Enterprise Java & Computer Networks',
      modulesJson: '',
      modules: [
        {
          moduleNumber: 1,
          moduleTitle: 'Microservices Principles & Domain-Driven Design (DDD)',
          topics: 'Monolith to microservices decomposition, 12-factor application methodology, Domain-Driven Design (Bounded contexts, Aggregates, Ubiquitous language), Synchronous REST vs Asynchronous event streams.',
          practicalLabWork: 'Decomposing an e-commerce monolithic application into Spring Boot 3 decoupled microservices.',
          vivaQuestions: 'Explain how Bounded Contexts in Domain-Driven Design prevent shared-database anti-patterns in microservices.'
        },
        {
          moduleNumber: 2,
          moduleTitle: 'Docker Containerization & Multi-Stage Builds',
          topics: 'Linux namespaces, cgroups, Union file systems, Docker engine architecture, Writing production Dockerfiles, Multi-stage builds, Distroless images, Container security scanning.',
          practicalLabWork: 'Building an optimized multi-stage Distroless Docker image for a Spring Boot 3 Java 21 microservice.',
          vivaQuestions: 'How do Linux cgroups and namespaces provide isolation without running a separate operating system kernel?'
        },
        {
          moduleNumber: 3,
          moduleTitle: 'Kubernetes Cluster Orchestration & Helm',
          topics: 'Kubernetes architecture (Control Plane, Worker Nodes), Pods, Deployments, ReplicaSets, Services (ClusterIP, NodePort, LoadBalancer), Ingress controllers, ConfigMaps, Secrets, Helm chart packaging.',
          practicalLabWork: 'Deploying a highly available 3-node microservice cluster on Minikube with Helm charts and zero-downtime rolling updates.',
          vivaQuestions: 'Walk through how Kubernetes kube-proxy manages iptables / IPVS rules to route service traffic to live pods.'
        },
        {
          moduleNumber: 4,
          moduleTitle: 'Resilience, Circuit Breakers & Service Mesh',
          topics: 'Resilience4j circuit breakers, Retry, Rate limiter, Bulkhead patterns, Service discovery (Consul / Eureka), Service Mesh architecture (Istio Envoy sidecar), Mutual TLS (mTLS), Traffic splitting canary releases.',
          practicalLabWork: 'Implementing Resilience4j circuit breakers and canary routing with Istio Envoy sidecars.',
          vivaQuestions: 'Explain the state transitions of a Circuit Breaker (Closed, Open, Half-Open) during downstream failure.'
        },
        {
          moduleNumber: 5,
          moduleTitle: 'Observability, Distributed Tracing & Chaos Engineering',
          topics: 'Three pillars of observability: Metrics (Prometheus), Logs (ELK / Loki), Traces (OpenTelemetry, Zipkin, Jaeger), Grafana dashboards, Chaos engineering principles (Chaos Mesh / Litmus).',
          practicalLabWork: 'Instrumenting Spring Boot microservices with OpenTelemetry distributed trace headers across HTTP calls.',
          vivaQuestions: 'How do W3C Trace Context headers (traceparent, tracestate) propagate correlation IDs through microservice hops?'
        }
      ]
    },
    {
      id: 12,
      courseCode: 'CUTM1602',
      courseTitle: 'Artificial Intelligence, Machine Learning & Deep Learning',
      basketCategory: 'BASKET_III',
      basketName: 'Basket III: Domain Specializations (PEC)',
      credits: 4,
      ltp: '3-0-2',
      department: 'School of Engineering & Technology - AI Track',
      semester: 'Semester VI',
      description: 'Modern AI/ML engineering: Supervised & unsupervised learning, gradient descent mathematics, PyTorch deep neural networks, CNNs, Transformers, and Retrieval-Augmented Generation (RAG) with LLMs.',
      prerequisites: 'Applied Mathematics & Python Programming',
      modulesJson: '',
      modules: [
        {
          moduleNumber: 1,
          moduleTitle: 'Foundations of Machine Learning & Optimization',
          topics: 'Supervised vs Unsupervised learning, Linear regression, Logistic regression, Cost functions, Gradient Descent (Batch, Mini-batch, Stochastic, Adam), Regularization (L1 Lasso, L2 Ridge), Bias-Variance tradeoff.',
          practicalLabWork: 'Implementing Gradient Descent optimization from scratch in NumPy with vectorization.',
          vivaQuestions: 'Derive the weight update rule for Logistic Regression using cross-entropy loss and gradient descent.'
        },
        {
          moduleNumber: 2,
          moduleTitle: 'Ensemble Learning & Feature Engineering',
          topics: 'Decision trees, Information gain, Gini impurity, Bagging vs Boosting, Random Forests, Gradient Boosted Decision Trees (XGBoost, LightGBM), Feature scaling, Imputation, Dimensionality reduction (PCA, t-SNE).',
          practicalLabWork: 'Building and hyperparameter-tuning an XGBoost model with cross-validation pipelines in Scikit-Learn.',
          vivaQuestions: 'Why are ensemble algorithms like Random Forest inherently resistant to overfitting compared to single decision trees?'
        },
        {
          moduleNumber: 3,
          moduleTitle: 'Deep Neural Networks & Backpropagation (PyTorch)',
          topics: 'Biological vs Artificial neurons, Perceptrons, Multi-Layer Perceptrons (MLP), Activation functions (ReLU, Leaky ReLU, GELU, Sigmoid), Backpropagation calculus, PyTorch autograd engine, Dropout, Batch Normalization.',
          practicalLabWork: 'Building a deep neural network in PyTorch with custom training loops, validation loss checkpoints, and early stopping.',
          vivaQuestions: 'Mathematically demonstrate why the Vanishing Gradient problem occurs when using Sigmoid activations in deep networks.'
        },
        {
          moduleNumber: 4,
          moduleTitle: 'Convolutional Neural Networks (CNNs) & Computer Vision',
          topics: 'Convolution operations, Stride, Padding, Pooling, Receptive field, Classic architectures: ResNet (Residual connections), MobileNet, Object detection (YOLO concepts), Image segmentation.',
          practicalLabWork: 'Training a PyTorch ResNet-18 model with transfer learning for automated medical image classification.',
          vivaQuestions: 'Why do residual skip connections in ResNet enable the training of networks with over 150 layers without gradient degradation?'
        },
        {
          moduleNumber: 5,
          moduleTitle: 'Transformers, Attention & Retrieval-Augmented Generation (RAG)',
          topics: 'Sequence-to-sequence limitations, Scaled Dot-Product Attention, Multi-Head Self-Attention, Transformer architecture (Encoder-Decoder), BERT vs GPT, Vector embeddings, Vector databases (ChromaDB, Pinecone), RAG pipelines.',
          practicalLabWork: 'Constructing an enterprise RAG pipeline using LangChain, HuggingFace embeddings, and ChromaDB.',
          vivaQuestions: 'Derive the Scaled Dot-Product Attention formula and explain the purpose of the square-root-of-d_k scaling factor.'
        }
      ]
    },
    {
      id: 13,
      courseCode: 'CUTM1603',
      courseTitle: 'Big Data Analytics & Distributed Event Streaming with Kafka',
      basketCategory: 'BASKET_III',
      basketName: 'Basket III: Domain Specializations (PEC)',
      credits: 4,
      ltp: '3-0-2',
      department: 'School of Engineering & Technology - Data Track',
      semester: 'Semester VI',
      description: 'Hyperscale data engineering: Hadoop ecosystem, HDFS, Apache Spark distributed compute engine, Apache Kafka event streaming, schema registries, and modern Iceberg Lakehouse architecture.',
      prerequisites: 'Database Systems & Java',
      modulesJson: '',
      modules: [
        {
          moduleNumber: 1,
          moduleTitle: 'Big Data Paradigm & Hadoop Ecosystem',
          topics: 'Characteristics of Big Data (5 V\'s), Hadoop Distributed File System (HDFS) architecture, NameNode, DataNode, Block replication, Secondary NameNode, MapReduce computational paradigm.',
          practicalLabWork: 'Configuring a multi-node pseudo-distributed Hadoop HDFS cluster and executing MapReduce wordcount.',
          vivaQuestions: 'How does HDFS ensure data integrity and automatic recovery when a DataNode experiences hardware failure?'
        },
        {
          moduleNumber: 2,
          moduleTitle: 'Apache Spark Core & RDD Architecture',
          topics: 'Spark vs MapReduce in-memory advantages, Spark driver, executors, Resilient Distributed Datasets (RDDs), Narrow vs Wide transformations, Lineage graph, Lazy evaluation, Spark DAG scheduler.',
          practicalLabWork: 'Writing PySpark RDD transformations and analyzing execution stages on the Spark Web UI.',
          vivaQuestions: 'Explain the difference between narrow and wide transformations in Apache Spark and their impact on network shuffles.'
        },
        {
          moduleNumber: 3,
          moduleTitle: 'Spark SQL & Distributed DataFrames',
          topics: 'Catalyst query optimizer, Tungsten execution engine, Spark DataFrames and Datasets, Structured streaming, Joins (Broadcast hash join vs Shuffle hash join), Partitioning and bucketing.',
          practicalLabWork: 'Optimizing a distributed Spark SQL join between a 100GB dataset and a 20MB lookup table using broadcast joins.',
          vivaQuestions: 'How does the Catalyst optimizer in Spark execute logical plan optimization and code generation?'
        },
        {
          moduleNumber: 4,
          moduleTitle: 'Apache Kafka Architecture & Event Streaming',
          topics: 'Publish-Subscribe messaging, Kafka cluster architecture, Brokers, Topics, Partitions, Consumer groups, Offset management, Exactly-once semantics (EOS), Kafka Streams API, Schema Registry (Avro).',
          practicalLabWork: 'Building an end-to-end Kafka producer/consumer pipeline with Avro serialization and Confluent Schema Registry.',
          vivaQuestions: 'How does Kafka achieve horizontal scaling and partition ordering guarantees across a distributed consumer group?'
        },
        {
          moduleNumber: 5,
          moduleTitle: 'Modern Lakehouse & Iceberg Architecture',
          topics: 'Data Warehouse vs Data Lake vs Data Lakehouse, Apache Iceberg table format, ACID transactions on object storage, Time travel queries, Schema evolution, Partition evolution, Parquet columnar format.',
          practicalLabWork: 'Executing ACID time travel queries on Apache Iceberg tables backed by MinIO S3 object storage.',
          vivaQuestions: 'What structural metadata files in Apache Iceberg enable atomic commits and instantaneous time travel snapshots?'
        }
      ]
    },
    {
      id: 14,
      courseCode: 'CUTM1604',
      courseTitle: 'Applied Cryptography, Ethical Hacking & Zero-Trust Security',
      basketCategory: 'BASKET_III',
      basketName: 'Basket III: Domain Specializations (PEC)',
      credits: 4,
      ltp: '3-0-2',
      department: 'School of Engineering & Technology - Cyber Track',
      semester: 'Semester VI',
      description: 'Offensive and defensive cybersecurity: Applied cryptography, RSA/AES, web vulnerability exploitation (OWASP Top 10), penetration testing with Kali Linux, reverse engineering, and Zero-Trust architecture.',
      prerequisites: 'Computer Networks & Operating Systems',
      modulesJson: '',
      modules: [
        {
          moduleNumber: 1,
          moduleTitle: 'Classical & Modern Cryptography',
          topics: 'Substitution and transposition ciphers, Symmetric encryption: DES, AES (GCM mode), Asymmetric encryption: RSA, Elliptic Curve Cryptography (ECC), Hash functions: SHA-256, HMAC, Digital signatures.',
          practicalLabWork: 'Implementing RSA key generation, encryption, and digital signature verification in Python cryptography.',
          vivaQuestions: 'Why does Elliptic Curve Cryptography (ECC) provide equivalent security to RSA with significantly smaller key sizes?'
        },
        {
          moduleNumber: 2,
          moduleTitle: 'Web Application Security & OWASP Top 10',
          topics: 'SQL Injection (SQLi), Cross-Site Scripting (Stored, Reflected, DOM-based XSS), Cross-Site Request Forgery (CSRF), Server-Side Request Forgery (SSRF), Broken Object Level Authorization (BOLA), Insecure deserialization.',
          practicalLabWork: 'Executing and mitigating SQL injection and stored XSS vulnerabilities in OWASP Juice Shop.',
          vivaQuestions: 'Explain how SameSite cookie attributes and anti-CSRF synchronizer tokens prevent CSRF attacks.'
        },
        {
          moduleNumber: 3,
          moduleTitle: 'Network Penetration Testing & Reconnaissance',
          topics: 'Passive and active reconnaissance (OSINT, Nmap port scanning), Metasploit framework, Vulnerability scanners (Nessus), Wireless security (WPA2/WPA3 4-way handshake cracks), Man-in-the-Middle (MitM) attacks.',
          practicalLabWork: 'Conducting an automated vulnerability scan and targeted service exploitation in an isolated Kali Linux lab.',
          vivaQuestions: 'How does an Nmap SYN Stealth scan (half-open scan) detect open ports without establishing full TCP connections?'
        },
        {
          moduleNumber: 4,
          moduleTitle: 'Binary Exploitation & Reverse Engineering',
          topics: 'x86/x64 assembly basics, Stack layout, Buffer overflow vulnerabilities, Shellcode injection, Return-Oriented Programming (ROP), ASLR, DEP/NX bit mitigation, Ghidra decompilation.',
          practicalLabWork: 'Disassembling an insecure C binary in Ghidra and constructing a buffer overflow payload to overwrite EIP.',
          vivaQuestions: 'Explain the mechanics of a Return-Oriented Programming (ROP) attack designed to bypass Non-Executable (NX/DEP) memory protections.'
        },
        {
          moduleNumber: 5,
          moduleTitle: 'Zero-Trust Architecture & Identity Governance',
          topics: 'BeyondCorp model, Never Trust Always Verify, Identity as the primary perimeter, Multi-Factor Authentication (MFA, WebAuthn/FIDO2), OAuth 2.0 and OpenID Connect (OIDC), Role-Based Access Control (RBAC) vs ABAC.',
          practicalLabWork: 'Configuring Keycloak IAM server with OAuth 2.0 Authorization Code Flow with PKCE for single sign-on.',
          vivaQuestions: 'Why is Proof Key for Code Exchange (PKCE) mandatory for public mobile and single-page applications using OAuth 2.0?'
        }
      ]
    },
    {
      id: 15,
      courseCode: 'CUTM1605',
      courseTitle: 'Modern Full-Stack Reactive Architecture with Angular 17 & Spring Boot',
      basketCategory: 'BASKET_III',
      basketName: 'Basket III: Domain Specializations (PEC)',
      credits: 4,
      ltp: '3-0-2',
      department: 'School of Engineering & Technology - Full Stack Track',
      semester: 'Semester VII',
      description: 'Enterprise full-stack engineering: Angular 17 standalone components, Signals, RxJS reactive streams, Spring Boot 3 RESTful APIs, Spring Security 6, JWT, WebSockets, and Skeuomorphic / Claymorphic UI engineering.',
      prerequisites: 'Enterprise Java & Web Foundations',
      modulesJson: '',
      modules: [
        {
          moduleNumber: 1,
          moduleTitle: 'Angular 17 Standalone Architecture & Signals',
          topics: 'Standalone components, Control flow syntax (@if, @for, @switch), Angular Signals (signal, computed, effect), RxJS interoperability, Deferrable views (@defer), OnPush change detection.',
          practicalLabWork: 'Building a high-performance reactive dashboard with Angular 17 Signals and OnPush change detection.',
          vivaQuestions: 'How do Angular Signals optimize fine-grained reactivity compared to traditional Zone.js dirty-checking?'
        },
        {
          moduleNumber: 2,
          moduleTitle: 'Reactive State Management & RxJS Mastery',
          topics: 'Observables, Observers, Subjects, BehaviorSubjects, ReplaySubjects, Higher-order mapping operators (switchMap, mergeMap, concatMap, exhaustMap), Error handling pipelines, NgRx / ComponentStore.',
          practicalLabWork: 'Implementing an auto-suggest search bar with debounceTime, distinctUntilChanged, and switchMap.',
          vivaQuestions: 'Explain the behavioral differences between switchMap, mergeMap, concatMap, and exhaustMap in real-time UI streams.'
        },
        {
          moduleNumber: 3,
          moduleTitle: 'Spring Boot 3 REST APIs & Data JPA',
          topics: 'Spring Boot 3 auto-configuration, Controller layer, Service layer, Repository layer, DTO projection patterns, MapStruct object mapping, Bean Validation (JSR-380), Custom exception handler (@RestControllerAdvice).',
          practicalLabWork: 'Constructing a resilient Spring Boot 3 CRUD microservice with global error handling and DTO validation.',
          vivaQuestions: 'What are the architectural advantages of using DTO projections over exposing JPA entity models directly in REST responses?'
        },
        {
          moduleNumber: 4,
          moduleTitle: 'Spring Security 6, JWT & Stateless Auth',
          topics: 'SecurityFilterChain configuration, DelegatingFilterProxy, UsernamePasswordAuthenticationFilter, Stateless session management, JWT generation, validation, refresh token rotation, CORS configuration.',
          practicalLabWork: 'Implementing end-to-end stateless JWT authentication and role-based route guards in Angular and Spring.',
          vivaQuestions: 'How does Refresh Token Rotation mitigate the security impact of stolen Long-Lived JWT tokens?'
        },
        {
          moduleNumber: 5,
          moduleTitle: 'Real-Time WebSockets & 3D Claymorphic Design',
          topics: 'WebSocket protocol, STOMP over SockJS in Spring, Client WebSocket subscriptions in Angular, Claymorphism and Skeuomorphism in modern CSS/SCSS, Canvas graphics integration.',
          practicalLabWork: 'Building a live peer collaboration canvas with real-time Spring WebSocket broadcast and claymorphic styling.',
          vivaQuestions: 'How does STOMP over WebSocket handle heartbeats, topics, and private user destination routing?'
        }
      ]
    },

    // BASKET IV: OPEN ELECTIVES & MANAGEMENT
    {
      id: 16,
      courseCode: 'CUTM2101',
      courseTitle: 'Technology Entrepreneurship & Startup Venture Incubation',
      basketCategory: 'BASKET_IV',
      basketName: 'Basket IV: Open Electives (OE)',
      credits: 3,
      ltp: '3-0-0',
      department: 'School of Management',
      semester: 'Semester VII',
      description: 'From engineering lab to market validation: Lean startup methodology, customer discovery, minimum viable product (MVP), business model canvas, cap table math, seed fundraising, and pitch decks.',
      prerequisites: 'None (Open Elective)',
      modulesJson: '',
      modules: [
        {
          moduleNumber: 1,
          moduleTitle: 'Opportunity Recognition & Ideation',
          topics: 'Identifying market friction, Problem-Solution fit, Value proposition design, Design thinking methodologies, Blue Ocean Strategy, Competitive moat analysis.',
          practicalLabWork: 'Conducting 10 customer discovery interviews and drafting a Value Proposition Canvas for a deep-tech startup.',
          vivaQuestions: 'Explain the difference between Problem-Solution fit and Product-Market fit in early-stage ventures.'
        },
        {
          moduleNumber: 2,
          moduleTitle: 'Lean Startup & Minimum Viable Product (MVP)',
          topics: 'Build-Measure-Learn feedback loop, Types of MVPs (Wizard of Oz, Concierge, Landing page MVP), Pivot strategies (Zoom-in, Customer segment, Technology pivot), Unit economics (CAC, LTV).',
          practicalLabWork: 'Calculating Customer Acquisition Cost (CAC) and Lifetime Value (LTV) for a B2B SaaS subscription model.',
          vivaQuestions: 'Why is an LTV/CAC ratio of greater than 3:1 considered the benchmark for sustainable venture growth?'
        },
        {
          moduleNumber: 3,
          moduleTitle: 'Business Models & Financial Projections',
          topics: 'Business Model Canvas (BMC), Revenue models (SaaS, Marketplace, Usage-based, Licensing), Cost structure, Pro-forma financial statements, Burn rate, Runway calculations.',
          practicalLabWork: 'Constructing a 3-year dynamic financial model and runway calculator in Excel/Google Sheets.',
          vivaQuestions: 'Walk through the components of the Business Model Canvas and explain how cost structure ties into key resources.'
        },
        {
          moduleNumber: 4,
          moduleTitle: 'Fundraising, Term Sheets & Pitching',
          topics: 'Venture capital ecosystem (Angel, Pre-seed, Seed, Series A), SAFE notes vs Convertible notes, Cap table dilution modeling, Term sheet negotiation clauses (Liquidation preference, Anti-dilution), Pitch deck structure.',
          practicalLabWork: 'Simulating a Cap Table dilution model across Seed and Series A financing rounds.',
          vivaQuestions: 'What is the difference between Pre-Money and Post-Money valuation when calculating investor equity percentage?'
        }
      ]
    },
    {
      id: 17,
      courseCode: 'CUTM2102',
      courseTitle: 'Intellectual Property Rights (IPR), Cyber Law & Ethics',
      basketCategory: 'BASKET_IV',
      basketName: 'Basket IV: Open Electives (OE)',
      credits: 3,
      ltp: '3-0-0',
      department: 'School of Law & Governance',
      semester: 'Semester VII',
      description: 'Legal and ethical frameworks for technology engineers: Patent filing process, copyrights in software code, trademarks, trade secrets, Indian IT Act 2000, GDPR privacy compliance, and Ethical AI governance.',
      prerequisites: 'None (Open Elective)',
      modulesJson: '',
      modules: [
        {
          moduleNumber: 1,
          moduleTitle: 'Introduction to Intellectual Property Rights (IPR)',
          topics: 'Nature and scope of IPR, Economic importance of IP, WIPO treaties, TRIPS agreement, Categorization: Patents, Copyrights, Trademarks, Industrial designs, Trade secrets, Geographical Indications.',
          practicalLabWork: 'Conducting a comprehensive prior-art patent search using Google Patents and WIPO PatentScope.',
          vivaQuestions: 'State the three statutory criteria for an invention to be patentable under international IP law.'
        },
        {
          moduleNumber: 2,
          moduleTitle: 'Patents & Software Copyright Law',
          topics: 'Patent specification drafting (Claims, Abstract, Prior art), Patent infringement (Direct vs Doctrine of equivalents), Software copyright protections, Open-source licenses (MIT, GPLv3, Apache 2.0), Contributory infringement.',
          practicalLabWork: 'Drafting formal patent claims for an innovative computer-implemented algorithm.',
          vivaQuestions: 'Why is source code protected under Copyright law while novel algorithmic processes are protected under Patent law?'
        },
        {
          moduleNumber: 3,
          moduleTitle: 'Cyber Law & Digital Evidence (IT Act 2000)',
          topics: 'Information Technology Act 2000 & 2008 amendments, Electronic contracts, Digital and electronic signatures, Cyber crimes (Hacking, Identity theft, Cyber terrorism), Intermediary liability (Section 79), Admissibility of digital evidence (Section 65B).',
          practicalLabWork: 'Case study analysis of intermediary liability and safe-harbor protections for tech platforms.',
          vivaQuestions: 'Explain the significance of Section 65B of the Indian Evidence Act regarding the admissibility of electronic records.'
        },
        {
          moduleNumber: 4,
          moduleTitle: 'Data Privacy, GDPR & AI Ethics',
          topics: 'Right to privacy, GDPR core principles (Lawfulness, Data minimization, Right to be forgotten), Digital Personal Data Protection Act (DPDPA 2023), Algorithmic bias, Autonomous weapon ethics, Responsible AI frameworks.',
          practicalLabWork: 'Performing a Data Protection Impact Assessment (DPIA) for an AI-powered face analytics system.',
          vivaQuestions: 'Explain the \'Right to Explanation\' under GDPR concerning automated machine learning decision-making.'
        }
      ]
    },

    // BASKET V: SKILLS & CAPSTONE DEFENSE
    {
      id: 18,
      courseCode: 'CUTM3001',
      courseTitle: 'Centurion Action Learning & Production Skill Certification',
      basketCategory: 'BASKET_V',
      basketName: 'Basket V: Skill & Capstone Projects (SEC)',
      credits: 4,
      ltp: '0-0-8',
      department: 'Centurion Center for Action Learning (CCAL)',
      semester: 'Semester VII',
      description: 'Hands-on industry action learning: Real-world micro-factory production tasks, Sector Skill Council (SSC) industry certification, live client deliverables, and peer code quality benchmarking.',
      prerequisites: 'Basket II & Basket III Completion',
      modulesJson: '',
      modules: [
        {
          moduleNumber: 1,
          moduleTitle: 'Action Learning Methodology & Problem Framing',
          topics: 'Centurion Action Learning framework, Industrial problem statement identification, Root cause analysis, Technical feasibility study, Project charter generation, Client stakeholder alignment.',
          practicalLabWork: 'Formulating a production-grade problem charter with measurable SLA deliverables for an enterprise sponsor.',
          vivaQuestions: 'How does the Action Learning methodology differ from traditional simulated classroom projects?'
        },
        {
          moduleNumber: 2,
          moduleTitle: 'Production-Grade Implementation & Quality Assurance',
          topics: 'Clean Code standards, Static code analysis (SonarQube), Automated unit testing (>80% coverage), Integration testing, Continuous Integration (CI) pipeline automation with GitHub Actions.',
          practicalLabWork: 'Setting up an automated GitHub Actions CI pipeline enforcing SonarQube quality gates.',
          vivaQuestions: 'What metrics define a production Quality Gate in automated CI/CD pipelines?'
        },
        {
          moduleNumber: 3,
          moduleTitle: 'Industry Standard Skill Certification (SSC / ASDC)',
          topics: 'National Occupational Standards (NOS), Qualification Packs (QP), Theoretical and practical skill competency evaluation under Sector Skill Councils, Compliance audits, Performance demonstrations.',
          practicalLabWork: 'Undergoing formal National Occupational Standards practical assessment for Full-Stack / Cloud competency.',
          vivaQuestions: 'Explain how Qualification Packs (QP) map to industry-certified employability skills.'
        },
        {
          moduleNumber: 4,
          moduleTitle: 'Client Delivery & Technical Retrospective',
          topics: 'User Acceptance Testing (UAT), Technical handoff documentation, Production deployment verification, Post-delivery sprint retrospective, Blameless incident review.',
          practicalLabWork: 'Executing User Acceptance Testing (UAT) signoff with structured acceptance criteria matrix.',
          vivaQuestions: 'What is the primary objective of a Sprint Retrospective in agile production engineering?'
        }
      ]
    },
    {
      id: 19,
      courseCode: 'CUTM3002',
      courseTitle: 'Capstone Project & Socratic Oral Technical Defense',
      basketCategory: 'BASKET_V',
      basketName: 'Basket V: Skill & Capstone Projects (SEC)',
      credits: 6,
      ltp: '0-0-12',
      department: 'School of Engineering & Technology',
      semester: 'Semester VIII',
      description: 'The ultimate culmination of the engineering degree: End-to-end distributed system architecture design, production deployment, comprehensive thesis submission, and rigorous Socratic oral examination defense before an academic jury.',
      prerequisites: 'All Core & Elective Baskets',
      modulesJson: '',
      modules: [
        {
          moduleNumber: 1,
          moduleTitle: 'System Architecture Specification & Modeling',
          topics: 'Comprehensive architecture design, C4 model diagrams (Context, Container, Component, Code), Security threat modeling (STRIDE), High-level & low-level design document generation.',
          practicalLabWork: 'Creating interactive C4 architecture diagrams and STRIDE threat matrix for the capstone system.',
          vivaQuestions: 'Walk through the four levels of the C4 architecture model and explain their respective stakeholder audiences.'
        },
        {
          moduleNumber: 2,
          moduleTitle: 'End-to-End Enterprise Implementation',
          topics: 'Full-stack deployment, Database schema migration management (Liquibase/Flyway), Cloud infrastructure provisioning (Terraform), Secure API gateway routing, Production load testing.',
          practicalLabWork: 'Executing automated distributed load tests generating 50,000 QPS using k6 / JMeter.',
          vivaQuestions: 'How do database migration tools like Flyway guarantee zero-downtime schema evolution across distributed nodes?'
        },
        {
          moduleNumber: 3,
          moduleTitle: 'Comprehensive Engineering Thesis Authoring',
          topics: 'Academic thesis structure, Experimental methodology, Empirical benchmark evaluation, Comparative baseline analysis, Reproducibility guidelines, Formatting to University academic standards.',
          practicalLabWork: 'Writing a 50-page formal engineering capstone thesis in LaTeX with comprehensive benchmarks and charts.',
          vivaQuestions: 'How do you ensure empirical benchmark results are statistically significant and free from caching biases?'
        },
        {
          moduleNumber: 4,
          moduleTitle: 'Grand Academic Jury Socratic Defense',
          topics: 'Oral technical presentation before external academic examiners, Real-time code execution audit, Defending architectural trade-offs, Socratic cross-examination under scrutiny.',
          practicalLabWork: 'Conducting a 30-minute oral defense presentation and live demonstration before an external review jury.',
          vivaQuestions: 'If an external examiner identifies a critical scalability bottleneck in your capstone design, how do you mathematically defend or adapt your architecture?'
        }
      ]
    }
  ];

  constructor(private http: HttpClient) {
    this.initCourses();
  }

  private initCourses(): void {
    const savedBookmarks = this.loadBookmarks();
    const savedProgress = this.loadProgress();

    // 1. Initial hydration from default seed courses
    const hydrated = this.defaultCourses.map(c => ({
      ...c,
      isBookmarked: savedBookmarks.includes(c.id),
      completedModules: savedProgress[c.id] || []
    }));
    this.coursesSubject.next(hydrated);

    // 2. Load complete 385 Courseware catalog from static assets (100% offline & GitHub Pages support)
    this.http.get<any[]>('assets/cutm_courses.json').pipe(
      tap((localCatalog) => {
        if (localCatalog && localCatalog.length > 0) {
          const parsed = localCatalog.map(lc => {
            let modules: CutmModule[] = lc.modules || [];
            if ((!modules || modules.length === 0) && lc.modulesJson) {
              try { modules = JSON.parse(lc.modulesJson); } catch {}
            }
            return {
              ...lc,
              modules,
              isBookmarked: savedBookmarks.includes(lc.id),
              completedModules: savedProgress[lc.id] || []
            };
          });
          this.coursesSubject.next(parsed);
          console.log(`📦 Loaded ${parsed.length} CUTM Courseware & CBCS courses from local catalog.`);
        }
      }),
      catchError(() => of([]))
    ).subscribe();

    // 3. Attempt live fetch from Spring Boot Cloud Database backend
    this.http.get<any[]>(this.apiUrl).pipe(
      tap((backendCourses) => {
        if (backendCourses && backendCourses.length > 0) {
          const parsed = backendCourses.map(bc => {
            let modules: CutmModule[] = [];
            if (bc.modulesJson) {
              try {
                modules = JSON.parse(bc.modulesJson);
              } catch {}
            }
            // If backend modules contain legacy placeholder titles, prefer local authentic modules
            const localCourse = this.coursesSubject.value.find(d => d.courseCode === bc.courseCode);
            const isPlaceholder = modules.some(m => m.moduleTitle && m.moduleTitle.includes('Foundations & Principles of'));
            const finalModules = (!isPlaceholder && modules.length > 0)
              ? modules
              : (localCourse?.modules && localCourse.modules.length > 0 ? localCourse.modules : modules);

            return {
              ...bc,
              modules: finalModules,
              isBookmarked: savedBookmarks.includes(bc.id),
              completedModules: savedProgress[bc.id] || []
            };
          });
          this.coursesSubject.next(parsed);
          this.isCloudSynced$.next(true);
          console.log(`🏛️ CUTM Cloud Database Connected: ${parsed.length} courses loaded from backend.`);
        }
      }),
      catchError((err) => {
        console.warn('ℹ️ Backend cloud database offline or in static hosting mode. Running full CUTM catalog locally.', err);
        this.isCloudSynced$.next(false);
        return of([]);
      })
    ).subscribe();
  }

  public getCourses(): Observable<CutmCourse[]> {
    return this.courses$;
  }

  public getCourseByCode(code: string): Observable<CutmCourse | undefined> {
    const found = this.coursesSubject.value.find(c => c.courseCode.toUpperCase() === code.toUpperCase());
    return of(found);
  }

  public getCoursewareCategories(): CoursewareCategorySummary[] {
    const all = this.coursesSubject.value;
    return [
      {
        category: 'ALL',
        name: 'All Categories',
        shortLabel: 'All Courses',
        icon: '🏛️',
        color: '#D4AF37',
        badgeBg: 'rgba(212, 175, 55, 0.15)',
        courseCount: all.length,
        description: 'Complete University repository across all Courseware classifications and CBCS disciplines.'
      },
      {
        category: 'Core',
        name: 'Core Courses',
        shortLabel: 'Core',
        icon: '📘',
        color: '#1D4ED8',
        badgeBg: 'rgba(29, 78, 216, 0.15)',
        courseCount: all.filter(c => c.courseCategory === 'Core').length,
        description: 'Compulsory foundational and core engineering curriculum across university departments.'
      },
      {
        category: 'Domain',
        name: 'Domain Courses',
        shortLabel: 'Domain',
        icon: '🚀',
        color: '#15803D',
        badgeBg: 'rgba(21, 128, 61, 0.15)',
        courseCount: all.filter(c => c.courseCategory === 'Domain').length,
        description: 'Advanced specialized industry domain concentrations and engineering tracks.'
      },
      {
        category: 'Skill',
        name: 'Skill Courses',
        shortLabel: 'Skill',
        icon: '🛠️',
        color: '#C2410C',
        badgeBg: 'rgba(194, 65, 12, 0.15)',
        courseCount: all.filter(c => c.courseCategory === 'Skill').length,
        description: 'Hands-on practical industry action learning and Sector Skill Council certifications.'
      },
      {
        category: 'Certificate',
        name: 'Certificate Courses',
        shortLabel: 'Certificate',
        icon: '📜',
        color: '#6D28D9',
        badgeBg: 'rgba(109, 40, 217, 0.15)',
        courseCount: all.filter(c => c.courseCategory === 'Certificate').length,
        description: 'Competency-based professional credentials and interdisciplinary management electives.'
      },
      {
        category: 'Advanced Certificate',
        name: 'Advanced Certificate',
        shortLabel: 'Adv. Cert',
        icon: '🏅',
        color: '#0D9488',
        badgeBg: 'rgba(13, 148, 136, 0.15)',
        courseCount: all.filter(c => c.courseCategory === 'Advanced Certificate').length,
        description: 'Deep specialized vocational master classes and postgraduate professional qualifications.'
      },
      {
        category: 'Diploma',
        name: 'Diploma Courses',
        shortLabel: 'Diploma',
        icon: '🎓',
        color: '#BE185D',
        badgeBg: 'rgba(190, 24, 93, 0.15)',
        courseCount: all.filter(c => c.courseCategory === 'Diploma').length,
        description: 'Comprehensive polytechnic and vocational diploma programs for applied technologists.'
      }
    ];
  }

  public toggleBookmark(courseId: number): boolean {
    const list = this.coursesSubject.value;
    const target = list.find(c => c.id === courseId);
    if (!target) return false;

    target.isBookmarked = !target.isBookmarked;
    this.coursesSubject.next([...list]);

    const bookmarks = list.filter(c => c.isBookmarked).map(c => c.id);
    this.saveBookmarks(bookmarks);
    return target.isBookmarked;
  }

  public toggleModuleComplete(courseId: number, moduleNum: number): boolean {
    const list = this.coursesSubject.value;
    const target = list.find(c => c.id === courseId);
    if (!target) return false;

    const completed = target.completedModules || [];
    const index = completed.indexOf(moduleNum);
    if (index > -1) {
      completed.splice(index, 1);
    } else {
      completed.push(moduleNum);
    }
    target.completedModules = [...completed];
    this.coursesSubject.next([...list]);

    const progress = this.loadProgress();
    progress[courseId] = target.completedModules;
    this.saveProgress(progress);

    return index === -1;
  }

  public getBasketSummaries(): BasketSummary[] {
    const all = this.coursesSubject.value;
    return [
      {
        category: 'ALL',
        name: 'All CBCS Baskets',
        shortLabel: 'All Courses',
        code: 'ALL',
        icon: '🏛️',
        color: '#D4AF37',
        courseCount: all.length,
        totalCredits: all.reduce((acc, c) => acc + c.credits, 0),
        description: 'Complete University Curriculum spanning Science, Core Engineering, Specializations, Management & Skills.'
      },
      {
        category: 'BASKET_I',
        name: 'Basket I: Foundation Courses',
        shortLabel: 'Foundation',
        code: 'AECC',
        icon: '📐',
        color: '#3B82F6',
        courseCount: all.filter(c => c.basketCategory === 'BASKET_I').length,
        totalCredits: all.filter(c => c.basketCategory === 'BASKET_I').reduce((acc, c) => acc + c.credits, 0),
        description: 'Applied Mathematics, Quantum Physics, Environmental Sustainability, and Executive Rhetoric.'
      },
      {
        category: 'BASKET_II',
        name: 'Basket II: Core Engineering',
        shortLabel: 'Program Core',
        code: 'PCC',
        icon: '⚙️',
        color: '#10B981',
        courseCount: all.filter(c => c.basketCategory === 'BASKET_II').length,
        totalCredits: all.filter(c => c.basketCategory === 'BASKET_II').reduce((acc, c) => acc + c.credits, 0),
        description: 'Data Structures, Java 21, Database Systems, Operating Systems, Computer Networks & Compilers.'
      },
      {
        category: 'BASKET_III',
        name: 'Basket III: Domain Specializations',
        shortLabel: 'Domain Electives',
        code: 'PEC',
        icon: '🚀',
        color: '#F59E0B',
        courseCount: all.filter(c => c.basketCategory === 'BASKET_III').length,
        totalCredits: all.filter(c => c.basketCategory === 'BASKET_III').reduce((acc, c) => acc + c.credits, 0),
        description: 'Cloud Native, Artificial Intelligence & Deep Learning, Big Data Kafka, Cyber Security & Full Stack.'
      },
      {
        category: 'BASKET_IV',
        name: 'Basket IV: Open Electives & Management',
        shortLabel: 'Open Electives',
        code: 'OE',
        icon: '💡',
        color: '#8B5CF6',
        courseCount: all.filter(c => c.basketCategory === 'BASKET_IV').length,
        totalCredits: all.filter(c => c.basketCategory === 'BASKET_IV').reduce((acc, c) => acc + c.credits, 0),
        description: 'Technology Entrepreneurship, Venture Incubation, IPR & Cyber Law, FinTech Economics.'
      },
      {
        category: 'BASKET_V',
        name: 'Basket V: Skill & Capstone Projects',
        shortLabel: 'Skill & Capstone',
        code: 'SEC',
        icon: '🎓',
        color: '#EC4899',
        courseCount: all.filter(c => c.basketCategory === 'BASKET_V').length,
        totalCredits: all.filter(c => c.basketCategory === 'BASKET_V').reduce((acc, c) => acc + c.credits, 0),
        description: 'Centurion Action Learning, Production Certification, Capstone System Defense & Academic Thesis.'
      }
    ];
  }

  private loadBookmarks(): number[] {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('cutm_bookmarked_courses');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return [];
  }

  private saveBookmarks(bookmarks: number[]): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cutm_bookmarked_courses', JSON.stringify(bookmarks));
    }
  }

  private loadProgress(): Record<number, number[]> {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('cutm_modules_progress');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return {};
  }

  private saveProgress(progress: Record<number, number[]>): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cutm_modules_progress', JSON.stringify(progress));
    }
  }
}
