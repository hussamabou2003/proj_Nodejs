const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const { check, validationResult } = require('express-validator');

// إعداد التطبيق
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/static', express.static('public'));
app.set('views', './views')
app.set('view engine', 'pug')

// إعداد قاعدة البيانات
let db = new sqlite3.Database(__dirname + '/studentsdb.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the students database.');
});

// // إنشاء الجداول إذا لم تكن موجودة
// db.serialize(() => {
//     db.run(`CREATE TABLE IF NOT EXISTS students (
//         id INTEGER PRIMARY KEY,
//         name TEXT NOT NULL,
//         age INTEGER NOT NULL
//     )`);
//     db.run(`CREATE TABLE IF NOT EXISTS subjects (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         name TEXT NOT NULL UNIQUE
//     )`);
//     db.run(`CREATE TABLE IF NOT EXISTS grades (
//         student_id INTEGER,
//         subject_id INTEGER,
//         grade INTEGER,
//         FOREIGN KEY (student_id) REFERENCES students(id),
//         FOREIGN KEY (subject_id) REFERENCES subjects(id)
//     )`);
//     const subjects = ["Math", "Science", "History", "Art"];
//     subjects.forEach(subject => {
//         db.run(`INSERT INTO subjects (name) VALUES (?)`, [subject], function(err) {
//             if (err && err.message.includes('UNIQUE constraint failed')) {
//                 // تجاهل الخطأ إذا كانت المادة موجودة مسبقًا
//             } else if (err) {
//                 console.error(err.message);
//             }
//         });
//     });
// });

// الرابط لإضافة طالب جديد
app.post('/add', [
    check('name').isLength({ min: 1 }),
    check('age').isNumeric(),
    check('id').isNumeric(),
    check('grades').isArray()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    let data = [req.body.name, req.body.age, req.body.id];
    let sql = `INSERT INTO students (name, age, id) VALUES(?, ?, ?)`;
    db.run(sql, data, function(err) {
        if (err) {
            return res.status(500).send(err.message);
        }
        let studentId = req.body.id;
        let grades = req.body.grades;
        grades.forEach((grade, index) => {
            db.run(`INSERT INTO grades (student_id, subject_id, grade) VALUES (?, ?, ?)`, [studentId, index + 1, grade], function(err) {
                if (err) {
                    console.error(err.message);
                }
            });
        });
        res.send(`A row has been inserted with rowid ${studentId}`);
    });
});

// الرابط لتعديل معلومات الطالب
app.post('/edit', [
    check('name').isLength({ min: 1 }),
    check('age').isNumeric(),
    check('id').isNumeric(),
    check('grades').isArray()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    let data = [req.body.name, req.body.age, req.body.id];
    let sql = `UPDATE students SET name = ?, age = ? WHERE id = ?`;
    db.run(sql, data, function(err) {
        if (err) {
            return res.status(500).send(err.message);
        }
        let studentId = req.body.id;
        let grades = req.body.grades;
        grades.forEach((grade, index) => {
            db.run(`UPDATE grades SET grade = ? WHERE student_id = ? AND subject_id = ?`, [grade, studentId, index + 1], function(err) {
                if (err) {
                    console.error(err.message);
                }
            });
        });
        res.redirect('/students/' + studentId);
    });
});

// الرابط لحذف طالب
app.post('/delete', [
    check('id').isNumeric()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    let id = req.body.id;
    let sql = `DELETE FROM students WHERE id = ?`;
    db.run(sql, id, function(err) {
        if (err) {
            return res.status(500).send(err.message);
        }
        res.send(`Row(s) deleted ${this.changes}`);
    });
});

// الرابط لعرض معلومات الطالب
app.get('/view', [
    check('id').isNumeric()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    let id = req.query.id;
    let sql = `SELECT * FROM students WHERE id = ?`;
    db.get(sql, id, (err, row) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        if (row == undefined) {
            res.status(404).send("Student not found");
        } else {
            res.json(row);
        }
    });
});

app.get('/students/:id', (req, res) => {
    let id = req.params.id;
    let sqlStudent = `SELECT * FROM students WHERE id = ?`;
    let sqlGrades = `SELECT subjects.name as subject, grades.grade as grade FROM grades JOIN subjects ON grades.subject_id = subjects.id WHERE grades.student_id = ?`;

    db.get(sqlStudent, id, (err, student) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        if (student == undefined) {
            res.status(404).send("Student not found with id " + id);
        } else {
            db.all(sqlGrades, id, (err, grades) => {
                if (err) {
                    return res.status(500).send(err.message);
                }
                res.render('student', { student: student, grades: grades });
            });
        }
    });
});

// الرابط لتعديل معلومات الطالب من صفحة الطالب
app.post('/students/:id/edit', [
    check('name').isLength({ min: 1 }),
    check('age').isNumeric(),
    check('id').isNumeric(),
    check('grades').isArray()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    let data = [req.body.name, req.body.age, req.body.id];
    let sql = `UPDATE students SET name = ?, age = ? WHERE id = ?`;
    db.run(sql, data, function(err) {
        if (err) {
            return res.status(500).send(err.message);
        }
        let studentId = req.body.id;
        let grades = req.body.grades;
        grades.forEach((grade, index) => {
            db.run(`UPDATE grades SET grade = ? WHERE student_id = ? AND subject_id = ?`, [grade, studentId, index + 1], function(err) {
                if (err) {
                    console.error(err.message);
                }
            });
        });
        res.redirect('/students/' + studentId);
    });
});

// الرابط لحذف طالب من صفحة الطالب
app.post('/students/:id/delete', [
    check('id').isNumeric()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    let id = req.body.id;
    let sql = `DELETE FROM students WHERE id = ?`;
    db.run(sql, id, function(err) {
        if (err) {
            return res.status(500).send(err.message);
        }
        res.redirect('/');
    });
});

// الرابط لصفحة الويب الرئيسية
app.get('/', (req, res) => {
    let sql = `SELECT * FROM students`;
    db.all(sql, (err, students) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        let sqlGrades = `SELECT student_id, subject_id, grade FROM grades`;
        db.all(sqlGrades, (err, grades) => {
            if (err) {
                return res.status(500).send(err.message);
            }
            students.forEach(student => {
                student.grades = grades.filter(grade => grade.student_id === student.id).map(grade => grade.grade);
            });
            res.render('students', { students: students });
        });
    });
});

// بدء التطبيق
app.listen(3000, () => {
    console.log('App is running on port 3000');
});