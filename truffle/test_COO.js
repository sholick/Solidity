// test functions that only COO can execute

var utils = require('ethereumjs-util');

const AdmSystem = artifacts.require("AdmSystem");

contract("COOTest", async accounts => {

  const COO = accounts[0];
  const Admin = accounts[1];
  const Price_UOC = 1000;

  const stu_A = accounts[2];
  STUDENTS = [stu_A];

  const CS_1 = ["COMP6451", 6, 2];

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

  it("INIT: Add 1 new student", async () => {
    const instance = await AdmSystem.deployed();
    tx = await instance.newStudent(stu_A, {from: Admin});

    //check 1
    val2 = await instance.isStudent.call(stu_A, {from: Admin});
    assert.equal(val2, true);
  });

  it("INIT: Add 1 new courses", async () => {
    const instance = await AdmSystem.deployed();
    tx = await instance.newCourse( ...CS_1, {from: Admin});

    // Random check 1
    val2 = await instance.isCourse.call( CS_1[0], {from: Admin});
    assert.equal(val2, true);
  });

  it("INIT: Student A pay 18 UOC", async () => {
    const instance = await AdmSystem.deployed();
    tx = await instance.buyToken({value: 18 * Price_UOC, from: stu_A});

  });

  it("Revoke Admin", async () => {
    const instance = await AdmSystem.deployed();
    res = await instance.revokeAdmin(Admin, {from: COO});
    val = await instance.isAdmin.call(Admin);
    assert.equal(val, false);
  });

  it("COO cash out", async () => {
    const instance = await AdmSystem.deployed();
    res = await instance.cashOut(500, {from: COO});
    let balance = await web3.eth.getBalance(instance.address);
    assert.equal(balance, 18000 - 500);
  });

});