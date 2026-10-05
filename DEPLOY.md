# การนำระบบขึ้นโฮสต์จริง (Deployment) บน Render & MongoDB Atlas

ระบบนี้ถูกออกแบบให้สามารถทำงานได้บนโฮสต์ฟรี เช่น **Render.com** (เป็น Backend + Frontend) และเก็บฐานข้อมูลบน **MongoDB Atlas** แบบฟรีตลอดชีพ

## ขั้นตอนที่ 1: เตรียม MongoDB Atlas
1. สมัครใช้งานและล็อกอินเข้า [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. สร้าง Cluster ใหม่ (เลือกแบบ Free Tier) 
3. ไปที่ `Database Access` สร้าง Database User ใหม่ จำ Username และ Password ไว้
4. ไปที่ `Network Access` กด Add IP Address แล้วเลือก `Allow Access From Anywhere` (0.0.0.0/0)
5. ไปที่ `Databases` กด `Connect` -> `Connect your application` ก๊อปปี้ `Connection String` มาเตรียมไว้ (อย่าลืมเปลี่ยน `<password>` เป็นรหัสผ่านที่ตั้งไว้)

## ขั้นตอนที่ 2: เตรียมโค้ด
เพื่อความสะดวกในการ Deploy ด้วย Render ให้รันสคริปต์รวมโค้ด:
เปิด Command Prompt ในโฟลเดอร์หลักแล้วรัน:
```cmd
npm run build:prod
```
ระบบจะสร้างโฟลเดอร์สำหรับ Deploy ขึ้นมา (ใน Render สามารถใช้จาก Github Repository ได้โดยตรง)

## ขั้นตอนที่ 3: นำข้อมูลเดิมขึ้น MongoDB
ถ้าคุณมีข้อมูลทดสอบหรือไฟล์เอกสารอยู่แล้ว และอยากย้ายขึ้นไปใช้งานจริงบนโฮสต์
1. ไปที่โฟลเดอร์ `backend` ของคุณ
2. สร้างไฟล์ `.env` ถ้ายังไม่มี แล้วใส่ค่าต่อไปนี้:
   ```env
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster0...mongodb.net/cwiedb?retryWrites=true&w=majority
   ```
3. รันคำสั่งย้ายข้อมูล:
   ```cmd
   npm run push-db
   ```
   ระบบจะอัปโหลด JSON ทั้งหมดและไฟล์เอกสารจากโฟลเดอร์ `uploads` เข้าสู่ MongoDB อัตโนมัติ

## ขั้นตอนที่ 4: เชื่อมต่อ Render.com
1. สมัครและล็อกอินเข้า [Render.com](https://render.com)
2. นำ Source Code ทั้งหมดขึ้น GitHub Repository ของคุณ
3. ใน Render กด **New -> Blueprint**
4. เชื่อมต่อกับ GitHub ของคุณและเลือก Repository ที่เก็บโค้ดนี้ไว้
5. Render จะอ่านไฟล์ `render.yaml` ที่อยู่ในโปรเจกต์โดยอัตโนมัติ
6. ระบบจะถามค่า `MONGODB_URI` ในหน้าเว็บ ให้เอา Connection String ของ MongoDB จากขั้นตอนที่ 1 มาใส่
7. กด Approve และปล่อยให้ Render ทำการ Deploy จนเสร็จสิ้น

## สิ่งที่ควรทราบ
- การ Deploy บน Render Free Tier ระบบอาจจะ "หลับ" (Sleep) ถ้าไม่มีคนเข้านานกว่า 15 นาที ซึ่งครั้งต่อไปที่มีคนเข้าใช้งาน การโหลดหน้าแรกอาจจะใช้เวลาประมาณ 30-50 วินาทีเพื่อปลุกระบบ
- โค้ดมีการปรับให้ Cache ข้อมูลลง Memory ไว้แล้ว ดังนั้นเมื่อตื่นขึ้นมาระบบจะทำงานได้เร็วเหมือนปกติ
- ไฟล์ที่อัปโหลดจะถูกเก็บลง MongoDB แบบ GridFS ทำให้ไฟล์ไม่หายไปเมื่อ Render รีสตาร์ทตัวเอง
