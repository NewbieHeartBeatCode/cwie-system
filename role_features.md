# โครงสร้างเมนูและฟีเจอร์ของระบบ (System Flow & Features)

เอกสารนี้แสดงภาพรวมการทำงานของระบบในบทบาท (Role) ที่มีเมนูและหมวดหมู่การใช้งานมากที่สุด เพื่อให้เห็นภาพรวมของเว็บไซต์ได้ชัดเจนที่สุดเมื่อนำไปพรีเซนต์

## 1. บทบาท: กองสหกิจศึกษา (Office) และ ผู้ดูแลระบบ (Admin)
บทบาทนี้เป็นศูนย์กลางในการควบคุมระบบทั้งหมด มีเมนูให้ใช้งานเยอะที่สุดเพื่อจัดการข้อมูลของทุกๆ ฝ่าย

```mermaid
graph TD
    %% กำหนดสไตล์ของกล่อง
    classDef mainRole fill:#e11d48,stroke:#9f1239,stroke-width:2px,color:#fff,font-weight:bold;
    classDef menuNode fill:#f8fafc,stroke:#cbd5e1,stroke-width:1px,color:#334155;
    classDef descNode fill:#f1f5f9,stroke:none,color:#64748b,font-size:12px;

    %% โหนดหลัก
    Role["👑 กองสหกิจศึกษา / Admin<br/>(หน้าหลักระบบ)"]:::mainRole

    %% เมนูต่างๆ
    Menu1("📊 แดชบอร์ด"):::menuNode
    Menu2("🤝 การจับคู่และออกฝึก"):::menuNode
    Menu3("📄 ตรวจสอบเอกสาร"):::menuNode
    Menu4("🏢 สถานประกอบการ"):::menuNode
    Menu5("👥 จัดการผู้ใช้งาน"):::menuNode
    Menu6("📈 รายงานและสถิติ"):::menuNode

    %% คำอธิบายสั้นๆ (เส้นโยง)
    Desc1["ดูภาพรวมสถิติ จำนวนนักศึกษาที่ออกฝึก และสถานะเอกสาร"]:::descNode
    Desc2["จับคู่นักศึกษากับบริษัท อนุมัติการออกฝึก และแต่งตั้งอาจารย์นิเทศ"]:::descNode
    Desc3["ตรวจรับเอกสาร CWIE ทั้งหมด อนุมัติหรือตีกลับให้แก้ไข"]:::descNode
    Desc4["ดูข้อมูลประวัติบริษัท MOU และจัดการสถานะ Blacklist"]:::descNode
    Desc5["เพิ่ม/ลบ/แก้ไข รายชื่อนักศึกษา อาจารย์ และพนักงานบริษัท"]:::descNode
    Desc6["ดูรายงานสรุปประจำปีและกราฟประเมินผลการฝึกงาน"]:::descNode

    %% การเชื่อมโยง
    Role ==> Menu1 -.-> Desc1
    Role ==> Menu2 -.-> Desc2
    Role ==> Menu3 -.-> Desc3
    Role ==> Menu4 -.-> Desc4
    Role ==> Menu5 -.-> Desc5
    Role ==> Menu6 -.-> Desc6
```

---

## 2. บทบาท: นักศึกษา (Student)
หน้าจอของนักศึกษาจะเน้นไปที่การทำตาม Flow การออกฝึกงาน ตั้งแต่เริ่มจนจบ

```mermaid
graph TD
    classDef studentRole fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff,font-weight:bold;
    classDef menuNode fill:#f8fafc,stroke:#cbd5e1,stroke-width:1px,color:#334155;
    classDef descNode fill:#eff6ff,stroke:none,color:#475569,font-size:12px;

    Role["🎓 นักศึกษา (Student)"]:::studentRole

    Menu1("📊 แดชบอร์ด"):::menuNode
    Menu2("💼 การฝึก CWIE ของฉัน"):::menuNode
    Menu3("📄 เอกสารของฉัน"):::menuNode
    Menu4("🏢 หาที่ฝึกงาน"):::menuNode

    Desc1["ดู Timeline สถานะปัจจุบันของตัวเองว่าถึงขั้นตอนไหนแล้ว"]:::descNode
    Desc2["บันทึกประจำวัน (Logbook) และดูผลการประเมินจากอาจารย์"]:::descNode
    Desc3["อัปโหลดไฟล์เอกสาร CWIE01-CWIE10 ตามลำดับขั้นตอน"]:::descNode
    Desc4["ค้นหารายชื่อสถานประกอบการที่เปิดรับ และมี MOU"]:::descNode

    Role ==> Menu1 -.-> Desc1
    Role ==> Menu2 -.-> Desc2
    Role ==> Menu3 -.-> Desc3
    Role ==> Menu4 -.-> Desc4
```

> [!TIP]
> **เทคนิคการพรีเซนต์:** คุณสามารถเปิดไฟล์นี้ใน Visual Studio Code (หรือ GitHub) เพื่อให้โปรแกรมสร้างกราฟ (Diagram) สวยๆ ออกมาให้กรรมการดูได้ทันที ซึ่งแสดงให้เห็นถึงการออกแบบ User Experience (UX) ที่เป็นระบบและเข้าใจง่าย
