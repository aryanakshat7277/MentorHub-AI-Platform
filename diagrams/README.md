# 📐 MentorHub Architecture & Engineering Diagrams

This directory contains high-resolution, vector-rendered system architecture diagrams conforming to IEEE / ISO software engineering standards with Times New Roman typography and cybernetic aesthetic styling.

---

## 📑 Diagram Manifest

| Diagram | Format | Generator Script | Description |
| :--- | :--- | :--- | :--- |
| **Data Flow Diagram (Level-1 DFD)** | [MentorHub_Data_Flow_Diagram.pdf](./MentorHub_Data_Flow_Diagram.pdf) | [generate_dfd_pdf.py](./generate_dfd_pdf.py) | Full data lifecycle: Auth, Matching Engine, Live WebRTC Sessions, SOS Rescue Queue, and Persistent Data Stores. |
| **Entity-Relationship Diagram (ERD)** | [MentorHub_ER_Diagram.pdf](./MentorHub_ER_Diagram.pdf) | [generate_er_diagram_pdf.py](./generate_er_diagram_pdf.py) | Normalized relational schema: Users, Mentoring Sessions, Goals, Feedback, SOS Bug Requests, Knowledge Impact, and Certificates. |
| **Use Case Diagram (UML)** | [MentorHub_Use_Case_Diagram.pdf](./MentorHub_Use_Case_Diagram.pdf) | [generate_use_case_pdf.py](./generate_use_case_pdf.py) | Actor-boundary interactions: Mentee, Mentor, System Admin, and AI Assistant subsystem flows. |

---

## 🛠️ Re-generating the Diagrams

All diagrams are programmatically generated using Python and ReportLab:

```bash
python diagrams/generate_dfd_pdf.py
python diagrams/generate_er_diagram_pdf.py
python diagrams/generate_use_case_pdf.py
```
