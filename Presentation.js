const prompt = require('prompt-sync')({ sigint: true });
const business = require('./Business.js');

/**
 * Display all employees in formatted table
 */

async function showAllEmployees() {
    const employees = await business.getAllEmployees()
    
    if (employees.length === 0) {
        console.log("No employees found")
        return;
    }
    

    let longestName = 0;
    for (let emp of employees) {
        if (emp.name.length > longestName) {
            longestName = emp.name.length;
        }
    }
    
    if (longestName < 20) {
        longestName = 20;
    }
    console.log("Employee ID  Name".padEnd(longestName + 15) + "Phone")
    console.log("---------  " + "-".repeat(longestName) + " ----------")
    
    for (let emp of employees) {
        let spaces = longestName - emp.name.length
        console.log(
            emp.employeeId +
            "          " +
            emp.name +
            " ".repeat(spaces) +
            " " +
            emp.phone

        )
    }
}



/**
 * Add new employee
 */
async function addNewEmployee() {
    let name = prompt("Enter employee name: ").trim()
    let phone = prompt("Enter phone number: ").trim()
    
    const result = await business.addNewEmployee(name, phone)
    
    if (result.success) {
        console.log("Employee added....")
    } else {
        console.log(result.message || "Failed to add employee")
    }
}




/**
 * View employee schedule in CSV format
 */
async function viewEmployeeSchedule() {
    let employeeId = prompt("Enter employee Id: ").trim().toUpperCase()
    
    const empExists = await business.employeeExists(employeeId)
    console.log("date,startTime,endTime")
    if (!empExists) {
        return;
    }


    const shifts = await business.getEmployeeSchedule(employeeId)
    for (let shift of shifts) {
        console.log(
            shift.date + "," +
            shift.startTime + "," +
            shift.endTime
        )
    }
}

/**
 * Main menu
 */
async function showMenu() {
    while (true) {
        console.log("\nOptions:")
        console.log("1. Show all employees")
        console.log("2. Add new employee")
        console.log("3. Assign employee to shift")
        console.log("4. View employee schedule")
        console.log("5. Exit")
        

        let selection = Number(prompt("Enter option: "))
        
        if (selection == 1) {
            await showAllEmployees()
        } 
        else if (selection == 2) {
            await addNewEmployee();
        } 
        else if (selection == 3) {
            await assignEmployeeToShift()
        } 
        else if (selection == 4) {
            await viewEmployeeSchedule()
        } 
        else if (selection == 5) {
            console.log("Goodbye!")
            break;
        } 
        else {
            console.log("ERROR!!! Pick a number between 1 and 5")
        }
    }
}
showMenu()






