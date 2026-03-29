const { MongoClient, ObjectId } = require('mongodb')

const url = 'mongodb+srv://60301034:12class34@cluster0.csf7k39.mongodb.net/?appName=Cluster0'
const dbName = 'infs3201_winter2026'

async function connect() {
    const client = new MongoClient(url)
    await client.connect()
    return client.db(dbName)
}

async function addEmptyEmployeesArray(db) {
    await db.collection('shifts').updateMany({}, { $set: { employees: [] } })
    console.log('Step 1 done: added empty employees array to all shifts')
}

async function embedEmployeesInShifts(db) {
    const assignments = await db.collection('assignments').find({}).toArray()

    for (let i = 0; i < assignments.length; i++) {
        const a = assignments[i]

        const employee = await db.collection('employees').findOne({ employeeId: a.employeeId })
        const shift = await db.collection('shifts').findOne({ shiftId: a.shiftId })

        if (employee && shift) {
            await db.collection('shifts').updateOne(
                { _id: shift._id },
                { $push: { employees: employee._id } }
            )
        }
    }
    console.log('Step 2 done: embedded employee ObjectIds into shifts')
}

async function removeUnnecessaryFields(db) {
    await db.collection('employees').updateMany({}, { $unset: { employeeId: '' } })
    await db.collection('shifts').updateMany({}, { $unset: { shiftId: '' } })
    await db.collection('assignments').drop()
    console.log('Step 3 done: removed old fields and dropped assignments collection')
}

async function run() {
    const db = await connect()
    await addEmptyEmployeesArray(db)
    await embedEmployeesInShifts(db)
    await removeUnnecessaryFields(db)
    console.log('Migration complete')
    process.exit(0)
}

run().catch(err => {
    console.error(err)
    process.exit(1)
})