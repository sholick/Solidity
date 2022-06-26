var utils = require('ethereumjs-util');

const AdmSystem = artifacts.require("AdmSystem");

function resolveAfter2Seconds() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('resolved');
    }, 2000);
  });
}

contract("Prereq", async accounts => {

  const COO = accounts[0];
  const Admin = accounts[1];
  const Price_UOC = 1000;

  const stu_A = accounts[2];
  const stu_B = accounts[3];
  const stu_C = accounts[4];
  const stu_D = accounts[5];
  const stu_E = accounts[6];
  STUDENTS = [stu_A, stu_B, stu_C, stu_D, stu_E];

  // Lecturer
  const Lecturer_1 = accounts[7];
  const Lecturer_2 = accounts[8];

  const CS_1 = ["COMP6451", 6, 2];
  const CS_2 = ["COMP4212", 6, 3];
  const CS_3 = ["COMP3441", 6, 2];

  it("INIT: Add new Admin", async () => {
    const instance = await AdmSystem.deployed();
    res = await instance.newAdmin(Admin, {from: COO});
    val = await instance.isAdmin.call(Admin);
    assert.equal(val, true);
  });

  it("INIT: Sets Fee: 1000", async () => {
    const instance = await AdmSystem.deployed();
    val = await instance.setFee(Price_UOC, {from: COO});

    price = await instance.getPrice.call();
    assert.equal(price, 1000);
  });

  it("INIT: Add 5 new student", async () => {
    const instance = await AdmSystem.deployed();
    tx = await instance.newStudent(stu_A, {from: Admin});
    tx = await instance.newStudent(stu_B, {from: Admin});
    tx = await instance.newStudent(stu_C, {from: Admin});
    tx = await instance.newStudent(stu_D, {from: Admin});
    tx = await instance.newStudent(stu_E, {from: Admin});

    //check 1
    val2 = await instance.isStudent.call(stu_C, {from: Admin});
    assert.equal(val2, true);
  });

  it("INIT: Add 3 new courses", async () => {
    const instance = await AdmSystem.deployed();
    tx = await instance.newCourse( ...CS_1, {from: Admin});
    tx = await instance.newCourse( ...CS_2, {from: Admin});
    tx = await instance.newCourse( ...CS_3, {from: Admin});

    // Random check 1
    val2 = await instance.isCourse.call( CS_1[0], {from: Admin});
    assert.equal(val2, true);
  });

  it("INIT: Each student pay 18 UOC", async () => {
    const instance = await AdmSystem.deployed();
    tx = await instance.buyToken({value: 18 * Price_UOC, from: stu_A});
    tx = await instance.buyToken({value: 18 * Price_UOC, from: stu_B});
    tx = await instance.buyToken({value: 18 * Price_UOC, from: stu_C});
    tx = await instance.buyToken({value: 18 * Price_UOC, from: stu_D});
    tx = await instance.buyToken({value: 18 * Price_UOC, from: stu_E});

  });


  it("Prerequisites", async () => {
    const instance = await AdmSystem.deployed();

    // assigning
    tx = await instance.LecturerCourses(Lecturer_1, "COMP4212", {from: Admin});
    tx = await instance.LecturerCourses(Lecturer_2, "COMP3441", {from: Admin});

    tx = await instance.addStudentCompleteRecord(stu_B, "COMP3441", {from: Admin});
    tx = await instance.addStudentCompleteRecord(stu_E, "COMP3441", {from: Admin});
    tx = await instance.addStudentCompleteRecord(stu_B, "COMP6451", {from: Admin});
    tx = await instance.addStudentCompleteRecord(stu_E, "COMP6451", {from: Admin});
    tx = await instance.addStudentCompleteRecord(stu_A, "COMP6451", {from: Admin});
    tx = await instance.addStudentCompleteRecord(stu_C, "COMP6451", {from: Admin});

    tx = await instance.addPreReq("COMP4212", "COMP3441", {from: Admin});
    tx = await instance.addPreReq("COMP3441", "COMP6451", {from: Admin});
    
    // Student A try to bid course COMP4212

    tx = await instance.bidCourse.call("COMP4212", 50, {from: stu_A});
    res = tx.toNumber();
    assert.equal(tx, -1); // -1 indicates rejections

  });

  it("Student A completed prerequisites", async () => {
    
    const instance = await AdmSystem.deployed();

    //  call for result
    tx = await instance.addStudentCompleteRecord.call(stu_A, "COMP3441", {from: Admin});
    assert.equal(tx, true);

    //commit
    tx = await instance.addStudentCompleteRecord(stu_A, "COMP3441", {from: Admin});
  });

  it("Student A bid accepted", async () => {
    
    const instance = await AdmSystem.deployed();
    tx = await instance.bidCourse("COMP3441", 20, {from: stu_A});
    await instance.roundCloses({from: Admin});

    tx = await instance.isAdmitted("COMP3441", stu_A);

  });

  it("Multiple prerequisites", async () => {
    
    const instance = await AdmSystem.deployed();

    const CS_4 = ["COMP5555", 6, 2];
    tx = await instance.newCourse( ...CS_4, {from: Admin});

    tx = await instance.addPreReq("COMP5555", "COMP3441", {from: Admin});
    tx = await instance.addPreReq("COMP5555", "COMP4212", {from: Admin});

    tx = await instance.addStudentCompleteRecord(stu_D, "COMP3441", {from: Admin});
    tx = await instance.addStudentCompleteRecord(stu_D, "COMP4212", {from: Admin});

    //  call for result
    tx = await instance.bidCourse.call("COMP5555", 100, {from: stu_D});
    res = tx.toNumber();
    assert.equal(res, 0);

  });


});