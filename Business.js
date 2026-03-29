
const persistence = require('./persistence.js')
const { ObjectId } = require('mongodb')


async function getAllEmployees() {
    return await persistence.getAllEmployees()
}



async function findEmployee(id) {
    return await persistence.findEmployee(id)
}

async function getEmployeeSchedule(id) {
    const employeeObjectId = new ObjectId(id)
    const shifts = await persistence.getShiftsByEmployee(employeeObjectId)

    for (let i = 0; i < shifts.length - 1; i++) {
        for (let j = 0; j < shifts.length - i - 1; j++) {
            if (shifts[j].date > shifts[j + 1].date ||
                (shifts[j].date === shifts[j + 1].date &&
                shifts[j].startTime > shifts[j + 1].startTime)) {
                let temp = shifts[j]
                shifts[j] = shifts[j + 1]
                shifts[j + 1] = temp

            }
        }
    }

    return shifts
}

module.exports = {
    getAllEmployees,
    findEmployee,
    getEmployeeSchedule
}