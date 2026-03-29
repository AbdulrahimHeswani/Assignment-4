const express = require('express')
const { engine } = require('express-handlebars')
const bodyParser = require('body-parser')
const business = require('./Business.js')
const persistence = require('./persistence.js')

const app = express();
const port = 3000;


app.engine('handlebars', engine())
app.set('view engine', 'handlebars')
app.set('views', './views')

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());

persistence.initializeDatabase().catch(console.error)

app.get('/', async (req, res) => {
    try {
        const employees = await business.getAllEmployees()
        res.render('home', { employees })
    } catch (err) {
        res.status(500).send('Error loading employees')
    }
})

app.get('/employee/:id', async (req, res) => {
    try {
        const employeeId = req.params.id
        const employee = await business.findEmployee(employeeId)
        
        if (!employee) {
            return res.status(404).send('Employee not found')
        }
        
        const shifts = await business.getEmployeeSchedule(employeeId)
        
        const shiftsWithHighlight = shifts.map(shift => {
            const hour = parseInt(shift.startTime.split(':')[0]);
            return {
                ...shift,
                beforeNoon: hour < 12
            }
        })
        
        res.render('employee', { 
            employee, 
            shifts: shiftsWithHighlight 
        });

    } 
    catch (err) {
        res.status(500).send('Error loading employee details');
    }
})


app.get('/employee/:id/edit', async (req, res) => {

    try {
        const employeeId = req.params.id;
        const employee = await business.findEmployee(employeeId);
        
        if (!employee) {
            return res.status(404).send('Employee not found');
        }
        

        res.render('edit-employee', { employee })
    } 
    catch (err) {
        res.status(500).send('Error loading edit form')
    }
})




app.post('/employee/:id/edit', async (req, res) => {
    try {
        const employeeId = req.params.id
        let { name, phone } = req.body
        
        name = name ? name.trim() : ''
        phone = phone ? phone.trim() : ''
        
        if (name === '') {
            return res.send('Name cannot be empty')
        }
        
        const phoneRegex = /^\d{4}-\d{4}$/
        if (!phoneRegex.test(phone)) {
            return res.send('Phone number must be in format: 1234-5678')
        }
        
        const updated = await persistence.updateEmployee(employeeId, name, phone);
        
        if (updated) {
            res.redirect('/')
        } else {
            res.send('Failed to update employee')

        }
    } 
    catch (err) {
        res.status(500).send('Error updating employee')

    }
})

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)

})