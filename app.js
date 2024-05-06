const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const { check, validationResult } = require('express-validator');

// إعداد التطبيق
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', './views')
app.set('view engine', 'pug')

// إعداد قاعدة البيانات
let db = new sqlite3.Database(__dirname + '\\studentsdb.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the students database.');
});

// الرابط لإضافة طالب جديد
app.post('/add', [
    check('name').isLength({ min: 1 }),
    check('age').isNumeric(),
    check('id').isNumeric(),
    check('score').isNumeric()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    let data = [req.body.name, req.body.age, req.body.id, req.body.score];
    let sql = `INSERT INTO students (name, age, id, score) VALUES(?, ?, ?, ?)`;
    db.run(sql, data, function(err) {
        if (err) {
            return res.status(500).send(err.message);
        }
        res.send(`A row has been inserted with rowid ${this.lastID}`);
    });
});

// الرابط لتعديل معلومات الطالب
app.post('/edit', [
    check('name').isLength({ min: 1 }),
    check('age').isNumeric(),
    check('id').isNumeric(),
    check('score').isNumeric()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    let data = [req.body.name, req.body.age, req.body.score, req.body.id];
    let sql = `UPDATE students SET name = ?, age = ?, score = ? WHERE id = ?`;
    db.run(sql, data, function(err) {
        if (err) {
            return res.status(500).send(err.message);
        }
        res.send(`Row(s) updated: ${this.changes}`);
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

// الرابط لصفحة الويب الرئيسية
app.get('/', (req, res) => {
    let sql = `SELECT * FROM students`;
    db.all(sql, (err, row) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        res.render('profile', { students: row });
    });
});

// بدء التطبيق
app.listen(3000, () => {
    console.log('App is running on port 3000');
});