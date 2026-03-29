const express = require('express')
const { engine } = require('express-handlebars')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const crypto = require('crypto')
const business = require('./Business.js')
const persistence = require('./persistence.js')

const app = express()
const port = 3000

const sessions = {}

app.engine('handlebars', engine())
app.set('view engine', 'handlebars')
app.set('views', './views')

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cookieParser())

persistence.initializeDatabase().catch(console.error)

app.use(async (req, res, next) => {
    const entry = {
        timestamp: new Date(),
        username: null,
        url: req.url,
        method: req.method

    }

    const token = req.cookies.sessionToken
    if (token && sessions[token]) {
        entry.username = sessions[token].username
    }


    await persistence.logAccess(entry)
    next()
})

function requireLogin(req, res, next) {
    const token = req.cookies.sessionToken

    if (!token || !sessions[token]) {
        return res.redirect('/login?message=Please+log+in')
    }

    const session = sessions[token]
    const now = Date.now()


    if (now - session.lastActive > 5 * 60 * 1000) {
        delete sessions[token]
        res.clearCookie('sessionToken')
        return res.redirect('/login?message=Session+expired')
    }

    session.lastActive = now
    next()
}

app.get('/login', (req, res) => {
    res.render('login', { message: req.query.message || null })
})



app.post('/login', async (req, res) => {
    let username = req.body.username ? req.body.username.trim() : ''
    let password = req.body.password ? req.body.password.trim() : ''

    const hashed = crypto.createHash('sha256').update(password).digest('hex')
    const user = await persistence.findUser(username)

    if (!user || user.password !== hashed) {
        return res.redirect('/login?message=Invalid+username+or+password')
    }

    const token = crypto.randomBytes(32).toString('hex')
    sessions[token] = { username: username, lastActive: Date.now() }

    res.cookie('sessionToken', token, { httpOnly: true })
    res.redirect('/')
})


app.get('/logout', (req, res) => {
    const token = req.cookies.sessionToken
    if (token) {
        delete sessions[token]
    }
    res.clearCookie('sessionToken')
    res.redirect('/login?message=You+have+been+logged+out')
})

app.get('/', requireLogin, async (req, res) => {
    try {
        const employees = await business.getAllEmployees()
        res.render('home', { employees })
    } catch (err) {
        res.status(500).send('Error loading employees')
    }
})


app.get('/employee/:id', requireLogin, async (req, res) => {
    try {
        const employee = await business.findEmployee(req.params.id)

        if (!employee) {
            return res.status(404).send('Employee not found')
        }
        const shifts = await business.getEmployeeSchedule(req.params.id)
        const shiftsWithHighlight = []

        for (let i = 0; i < shifts.length; i++) {
            const shift = shifts[i]
            const hour = parseInt(shift.startTime.split(':')[0])
            shiftsWithHighlight.push({
                date: shift.date,
                startTime: shift.startTime,
                endTime: shift.endTime,
                beforeNoon: hour < 12

            })
        }


        res.render('employee', { employee, shifts: shiftsWithHighlight })
    } 
    catch (err) {
        res.status(500).send('Error loading employee details')
    }
})

app.get('/employee/:id/edit', requireLogin, async (req, res) => {
    try {
        const employee = await business.findEmployee(req.params.id)


        if (!employee) {
            return res.status(404).send('Employee not found')
        }


        res.render('edit-employee', { employee })
    } 
    catch (err) {
        res.status(500).send('Error loading edit form')
    }
})

app.post('/employee/:id/edit', requireLogin, async (req, res) => {
    try {
        let name = req.body.name ? req.body.name.trim() : ''
        let phone = req.body.phone ? req.body.phone.trim() : ''

        if (name === '') {
            return res.send('Name cannot be empty')
        }

        const phoneRegex = /^\d{4}-\d{4}$/
        if (!phoneRegex.test(phone)) {
            return res.send('Phone number must be in format: 1234-5678')
        }

        const updated = await persistence.updateEmployee(req.params.id, name, phone)

        if (updated) {
            res.redirect('/')
        } else {
            res.send('Failed to update employee')
            
        }

    } catch (err) {
        res.status(500).send('Error updating employee')

    }
})

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)

})