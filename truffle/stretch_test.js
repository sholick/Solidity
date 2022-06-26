var utils = require('ethereumjs-util');

const AdmSystem = artifacts.require("AdmSystem");

function resolveAfter2Seconds() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('resolved');
    }, 2000);
  });
}

contract("StretchTest", async accounts => {

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


  it("Stretch: Assigning Lecturer", async () => {
    const instance = await AdmSystem.deployed();

    // assigning
    tx = await instance.LecturerCourses(Lecturer_1, "COMP4212", {from: Admin});
    tx = await instance.LecturerCourses(Lecturer_2, "COMP3441", {from: Admin});

    tx = await instance.addStudentCompleteRecord(stu_B, "COMP3441", {from: Admin});
    tx = await instance.addStudentCompleteRecord(stu_E, "COMP3441", {from: Admin});

    tx = await instance.addPreReq("COMP4212", "COMP3441", {from: Admin});
    //Test
    result = await instance.isLecturer(Lecturer_1, {from: Admin});
    assert.equal(result, true);

    result = await instance.isLecturer(Lecturer_2, {from: Admin});
    assert.equal(result, true);

  });

  it("Stretch: Student A bid rejected", async () => {
    
    const instance = await AdmSystem.deployed();

    //  Call only to check outcome
    tx_A = await instance.bidCourse.call("COMP4212", 600, {from: stu_A});

    result = tx_A.toNumber();
    assert.equal(result, -1); // -1 indicates rejected


  });

  it("Stretch: Student B,E bid accepted", async () => {
    
    const instance = await AdmSystem.deployed();

    //  Call only to check outcome
    tx_B = await instance.bidCourse.call("COMP4212", 800, {from: stu_B});
    result = tx_B.toNumber(); // tx_B returns 0 as he was the first in line
    assert.equal(result, 0);

    // B commits
    tx_B = await instance.bidCourse("COMP4212", 800, {from: stu_B});


    tx_E = await instance.bidCourse.call("COMP4212", 1000, {from: stu_E});
    result = tx_E.toNumber(); // tx_E also returns 0 as he has overtaken B;
    assert.equal(result, 0);

    // E commits
    tx_E = await instance.bidCourse("COMP4212", 1000, {from: stu_E});

  });

  it("Stretch: A submits signature: accepted", async () => {
    
    const instance = await AdmSystem.deployed();


    // Lecturer signs
    const h = web3.utils.soliditySha3("COMP4212", stu_A);
    signature = await web3.eth.sign(h, Lecturer_1);

    // Slice the signature into two halves
    var r = signature.slice(0, 66);
    var s = "0x" + signature.slice(66, 130);
    var v = "0x" + signature.slice(130, 132);
    v = web3.utils.toDecimal(v);

    // Get the last bit
    v = v + 27;

    // call
    tx_A = await instance.bidCourseWithSign.call("COMP4212", 600, h, v, r, s, {from: stu_A});
    result = tx_A.toNumber();
    assert.equal(result, 2); // accepted bid to 2nd place in queue

    // A commits
    tx_A = await instance.bidCourseWithSign("COMP4212", 600, h, v, r, s, {from: stu_A});

  });


  it("Stretch: C produces fake signature: rejected", async () => {
    
    const instance = await AdmSystem.deployed();

    const h = web3.utils.soliditySha3("COMP4212", stu_C);

    // Signed by himself
    signature = await web3.eth.sign(h, stu_C);

    // Slice the signature into two halves
    var r = signature.slice(0, 66);
    var s = "0x" + signature.slice(66, 130);
    var v = "0x" + signature.slice(130, 132);
    v = web3.utils.toDecimal(v);

    // Get the last bit
    v = v + 27;

    // call
    tx_C = await instance.bidCourseWithSign.call("COMP4212", 800, h, v, r, s, {from: stu_C});
    result = tx_C.toNumber();
    assert.equal(result, -1); // rejected

  });

  it("Stretch: Round closes with A, B and E enrolled", async () => {
    
    const instance = await AdmSystem.deployed();

    tx = await instance.roundCloses({from: Admin});

    // call
    tx_A = await instance.isAdmitted("COMP4212", stu_A);
    tx_B = await instance.isAdmitted("COMP4212", stu_B);
    tx_E = await instance.isAdmitted("COMP4212", stu_E);

    assert.equal(tx_A, true);
    assert.equal(tx_B, true);
    assert.equal(tx_E, true);

  });

  it("Stretch: Final Token Balance", async () => {
    
    const instance = await AdmSystem.deployed();

    // call
    tx_A = await instance.balanceOf.call(stu_A);
    bal_A = tx_A.toNumber();
    assert.equal(bal_A, 1200);


    tx_B = await instance.balanceOf.call(stu_B);
    tx_C = await instance.balanceOf.call(stu_C);
    tx_D = await instance.balanceOf.call(stu_D);
    tx_E = await instance.balanceOf.call(stu_E);

    
    bal_B = tx_B.toNumber();
    bal_C = tx_C.toNumber();
    bal_D = tx_D.toNumber();
    bal_E = tx_E.toNumber();

    
    assert.equal(bal_B, 1000);
    assert.equal(bal_C, 1800);
    assert.equal(bal_D, 1800);
    assert.equal(bal_E, 800);

  });

});