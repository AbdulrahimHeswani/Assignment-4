const { MongoClient, ObjectId } = require('mongodb')

const url = 'mongodb+srv://60301034:12class34@cluster0.csf7k39.mongodb.net/?appName=Cluster0'
const dbName = 'infs3201_winter2026'
let db = null



async function connect() {
    if (db) return db
    const client = new MongoClient(url)
    await client.connect()
    db = client.db(dbName)
    return db
}

async function getAllEmployees() {
    const db = await connect()
    const cursor = db.collection('employees').find({})
    return await cursor.toArray()
}

async function findEmployee(id) {
    const db = await connect()
    return await db.collection('employees').findOne({ _id: new ObjectId(id) })
}

async function updateEmployee(id, name, phone) {
    const db = await connect()
    const result = await db.collection('employees').updateOne(
        { _id: new ObjectId(id) },
        { $set: { name: name, phone: phone } }
    )
    return result.modifiedCount > 0


}


async function addEmployee(employee) {
    const db = await connect()
    const result = await db.collection('employees').insertOne(employee)
    return result.acknowledged
}


async function getShiftsByEmployee(employeeObjectId) {
    const db = await connect()
    const cursor = db.collection('shifts').find({ employees: employeeObjectId })
    return await cursor.toArray()
}

async function findUser(username) {
    const db = await connect()
    return await db.collection('users').findOne({ username: username })
}



async function logAccess(entry) {
    const db = await connect()
    await db.collection('security_log').insertOne(entry)
}

async function initializeDatabase() {
    const db = await connect()
    console.log('Connected to database')

}

module.exports = {
    connect,
    getAllEmployees,
    findEmployee,
    updateEmployee,
    addEmployee,
    getShiftsByEmployee,
    findUser,
    logAccess,
    initializeDatabase
}