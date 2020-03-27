const express = require('express')
const mysql = require('mysql')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
var session = require('express-session');

const app = express()
const port = 3000;
const secretKey = 'thisisverysecretkey'
const db = mysql.createConnection({
    host: '127.0.0.1',
    port: '3306',
    user: 'root',
    password: '',
    database: "data_pasien"
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

//LOGIN UNTUK ADMIN
app.post('/auth', function(request, response) {
    let data = request.body
	var email = data.email;
	var password = data.password;
	if (email && password) {
		db.query('SELECT * FROM admin WHERE email = ? AND password = ?', [email, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.email = data.email;
				response.redirect('/home');
			} else {
				response.send('Username dan/atau Password salah!');
			}			
			response.end();
		});
	} else {
		response.send('Masukkan Username and Password!');
		response.end();
	}
});

app.get('/home', function(request, result ) {
	if (request.session.loggedin) {
        let data = request.body
        let token = jwt.sign(data.email + '|' + data.password, secretKey)

        result.json({
            success: true,
            message: 'Selamat Datang, ' + request.session.email + '!',
            token: token
        })

    } else {
		result.json({
            success: false,
            message: 'Mohon Login Terlebih Dahulu !'
        })
	}
	result.end();
});

// REGISTER UNTUK ADMIN
app.post('/admin', (req, res) => {
    let data = req.body

    let sql = `
        insert into admin (nama, email, password, telepon, gender)
        values ('`+data.nama+`', '`+data.email+`', '`+data.password+`', '`+data.telepon+`', '`+data.gender+`')
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Data Berhasil Ditambahkan",
            data: result
        })
    })
})

//CEK TOKEN
const isAuthorized = (request, result, next) => {
    // cek apakah user sudah mengirim header 'x-api-key'
    if (typeof(request.headers['x-api-key']) == 'undefined') {
        return result.status(403).json({
            success: false,
            message: 'Unauthorized. Token is not provided'
        })
    }

    // get token dari header
    let token = request.headers['x-api-key']

    // melakukan verifikasi token yang dikirim user
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return result.status(401).json({
                success: false,
                message: 'Unauthorized. Token is invalid'
            })
        }
    })

    // lanjut ke next request
    next()
}

// CRUD UNTUK Data Pasien Yang Meninggal
app.get('/data', (req, res) => {
    let sql = `
    select nama, umur, asal, tanggal from pasien 
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Sukses Menampilkan Semua Data",
            data: result
        })
    })
})

app.post('/data', (req, res) => {
    let data = req.body

    let sql = `
        insert into pasien (nama, umur, asal, tanggal)
        values ('`+data.nama+`', '`+data.umur+`', '`+data.asal+`', '`+data.tanggal+`')
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Data Berhasil Ditambahkan",
            data: result
        })
    })
})

app.get('/data/:id_pasien', (req, res) => {
    let sql = `
        select * from pasien
        where id_pasien = `+req.params.id_pasien+`
        limit 1
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Sukses Menampilkan Detail Pasien",
            data: result[0]
        })
    })
})

app.put('/data/:id_pasien',(req, res) => {
    let data = req.body

    let sql = `
        update pasien
        set nama = '`+data.nama+`', umur = '`+data.umur+`', asal = '`+data.asal+`', tanggal = '`+data.tanggal+`'
        where id_pasien = '`+req.params.id_pasien+`'
    `
    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Data Berhasil di Ubah",
            data: result
        })
    })
})

app.delete('/data/:id_pasien',(req, res) => {
    let sql = `
        delete from pasien
        where id_pasien = '`+req.params.id_pasien+`'
        `
    
        db.query(sql, (err, result) => {
            if (err) throw err
            
            res.json({
                message: "Data Berhasil Dihapus",
                data: result
            })
        })
    })

// CRUD UNTUK KAMAR
app.get('/kamar', (req, res) => {
    let sql = `
    select nama_kamar, jml_bed from kamar
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Sukses Menampilkan Semua Data",
            data: result
        })
    })
})

app.post('/kamar', (req, res) => {
    let data = req.body

    let sql = `
        insert into kamar (nama_kamar, jml_bed)
        values ('`+data.nama_kamar+`', '`+data.jml_bed+`')
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Data Berhasil Ditambahkan",
            data: result
        })
    })
})

app.put('/kamar/:id_kamar',(req, res) => {
    let data = req.body

    let sql = `
        update kamar
        set nama_kamar = '`+data.nama_kamar+`', jml_bed = '`+data.jml_bed+`'
        where id_kamar = '`+req.params.id_kamar+`'
    `
    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Data Berhasil di Ubah",
            data: result
        })
    })
})

app.delete('/kamar/:id_kamar',(req, res) => {
    let sql = `
        delete from kamar
        where id_kamar = '`+req.params.id_kamar+`'
        `
    
        db.query(sql, (err, result) => {
            if (err) throw err
            
            res.json({
                message: "Data Berhasil Dihapus",
                data: result
            })
        })
    })

//TRANSAKSI 
app.post('/take',(req, res) => {
    let data = req.body

    db.query(`
        insert into kamar_pasien (id_admin, id_pasien, id_kamar)
        values ('`+data.id_admin+`', '`+data.id_pasien+`', '`+data.id_kamar+`')
    `, (err, result) => {
        if (err) throw err
    })

    //Pengurangan jumlah bed di tabel kamar karena jumlah pasien meninggal bertambah
    db.query(`
        update kamar
        set jml_bed = jml_bed - 1
        where id_kamar = '`+data.id_kamar+`'
    `, (err, result) => {
        if (err) throw err
    })

    res.json({
        message: "Success menambahkan data"
    })
})

//Menampilkan data 
app.get('/pasien/:id_pasien/kamar', (req, res) => {
    db.query(`
        select kamar.nama_kamar from pasien
        right join kamar_pasien on pasien.id_pasien = kamar_pasien.id_pasien
        right join kamar on kamar_pasien.id_kamar = kamar.id_kamar
        where pasien.id_pasien = '`+req.params.id_pasien+`'
    `, (err, result) => {
        if (err) throw err

        res.json({
            message: "success mendapatkan detail kamar pasien",
            data: result
        })
    })
})

app.delete('/take/:id/:id_kamar', (req, res) => {
    let data = req.body
    
    db.query(`delete from kamar_pasien where id = '`+req.params.id+`'
    `
    ,(err, result) => {
        if (err) throw err
    })

//Penambahan jumlah bed di tabel kamar karena jumlah pasien berkurang
    db.query(`
        update kamar
        set jml_bed = jml_bed + 1
        where id_kamar = '`+req.params.id_kamar+`' 
    ` 
    ,(err, result) => {
        if (err) throw err
    
            res.json({
                message: "data has been deleted",
                data: result
            })
        })
    })
    
app.listen(port, () => {
    console.log('App running on port ' + port)
})
    